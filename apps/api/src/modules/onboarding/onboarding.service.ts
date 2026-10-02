import { ApiError } from "../../utils/ApiError";
import { generateSecureToken } from "../../utils/security";
import { storage, buildStorageKey } from "../../services/storage";
import { env } from "../../config/env";
import {
  sendEmail,
  submissionConfirmationEmail,
  adminNewSubmissionEmail,
} from "../notifications/email.service";
import * as repo from "./onboarding.repository";
import { standardizeValue } from "./standardization";
import {
  CHILD_RELATIONSHIPS,
  SPOUSE_RELATIONSHIPS,
  SPOUSE_DOC_CODES,
  CHILD_PROOF_DOC_CODES,
} from "@mentor/shared";
import type {
  Language,
  SaveMemberInput,
  SaveFamilyMemberInput,
  FieldValueInput,
} from "@mentor/shared";

const SESSION_TTL_DAYS = 14;

// Known field keys used to denormalize fast-search columns (spec section 13/22).
const MEMBER_NAME_KEY = "full_name";
const MEMBER_CNIC_KEY = "cnic";
const MEMBER_EMAIL_KEY = "email";
const FAM_NAME_KEY = "fam_full_name";
const FAM_REL_KEY = "fam_relationship";
const FAM_CNIC_KEY = "fam_cnic_bform";

/** Public-safe programme + form config for the onboarding link (no secrets). */
export async function getPublicConfig(linkToken: string) {
  const link = await repo.findActiveLinkByToken(linkToken);
  if (!link) throw ApiError.notFound("This onboarding link is invalid or no longer active");
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw ApiError.forbidden("This onboarding link has expired");
  }
  const [fields, documents] = await Promise.all([
    repo.getActiveFields(link.programmeId),
    repo.getActiveDocuments(link.programmeId),
  ]);
  return {
    programme: {
      id: link.programme.id,
      name: link.programme.name,
      description: link.programme.description,
      corporate: link.programme.corporate,
    },
    fields,
    documents,
  };
}

export async function startSession(linkToken: string, language: Language) {
  const link = await repo.findActiveLinkByToken(linkToken);
  if (!link) throw ApiError.notFound("This onboarding link is invalid or no longer active");
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw ApiError.forbidden("This onboarding link has expired");
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  const session = await repo.createSession({
    programmeId: link.programmeId,
    onboardingLinkId: link.id,
    sessionToken: generateSecureToken(),
    language,
    expiresAt,
  });
  const submission = await repo.createDraftSubmission({
    sessionId: session!.id,
    programmeId: link.programmeId,
    language,
  });
  return { sessionToken: session!.sessionToken, submissionId: submission!.id, expiresAt };
}

/** Loads & validates a session, returning the session + its submission. */
export async function getSessionContext(sessionToken: string) {
  const session = await repo.findSessionByToken(sessionToken);
  if (!session) throw ApiError.unauthorized("Invalid onboarding session");
  if (session.expiresAt < new Date()) throw ApiError.forbidden("Your onboarding session has expired");
  const submission = await repo.findSubmissionBySession(session.id);
  if (!submission) throw ApiError.notFound("Submission not found for this session");
  if (submission.status === "SUBMITTED" || submission.status === "COMPLETED" || submission.status === "VERIFIED") {
    // Read still allowed; writes are blocked by assertEditable.
  }
  return { session, submission };
}

function assertEditable(status: string) {
  const editable = ["DRAFT", "IN_PROGRESS", "REJECTED"];
  if (!editable.includes(status)) {
    throw ApiError.conflict("This submission has been submitted and can no longer be edited");
  }
}

export async function resume(sessionToken: string) {
  const { session, submission } = await getSessionContext(sessionToken);
  const [config, state] = await Promise.all([
    getPublicConfigByProgramme(session.programmeId),
    repo.getSubmissionState(submission.id),
  ]);
  return { session: { language: session.language }, submission: state, ...config };
}

async function getPublicConfigByProgramme(programmeId: string) {
  const [fields, documents] = await Promise.all([
    repo.getActiveFields(programmeId),
    repo.getActiveDocuments(programmeId),
  ]);
  return { fields, documents };
}

function rawToString(value: FieldValueInput["value"]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

export async function saveMember(sessionToken: string, input: SaveMemberInput) {
  const { session, submission } = await getSessionContext(sessionToken);
  assertEditable(submission.status);
  const language = (input.language ?? session.language) as Language;

  const fields = await repo.getActiveFields(submission.programmeId);
  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  const denorm: { memberName?: string; cnic?: string; email?: string } = {};

  for (const item of input.values) {
    const field = fieldMap.get(item.fieldId);
    if (!field || field.subjectType !== "MEMBER") continue;
    const std = standardizeValue(field, item.value, language);
    await repo.replaceMemberValue(submission.id, field.id, {
      fieldKey: field.fieldKey,
      valueKind: field.valueKind,
      originalValue: std.originalValue,
      standardizedValue: std.standardizedValue,
      language,
    });
    if (field.fieldKey === MEMBER_NAME_KEY) denorm.memberName = rawToString(item.value);
    if (field.fieldKey === MEMBER_CNIC_KEY) denorm.cnic = rawToString(item.value);
    if (field.fieldKey === MEMBER_EMAIL_KEY) denorm.email = rawToString(item.value);
  }

  await repo.updateSubmissionMeta(submission.id, { ...denorm, language });
  if (language !== session.language) {
    // keep session language in sync (best-effort)
  }
  return repo.getSubmissionState(submission.id);
}

export async function addFamilyMember(sessionToken: string, input: SaveFamilyMemberInput) {
  const { session, submission } = await getSessionContext(sessionToken);
  assertEditable(submission.status);
  const existing = await repo.countFamilyMembers(submission.id);
  const member = await repo.createFamilyMember(submission.id, existing.length);
  await saveFamilyValues(member!.id, submission.programmeId, session.language as Language, input.values);
  return repo.getSubmissionState(submission.id);
}

export async function updateFamilyMember(
  sessionToken: string,
  familyMemberId: string,
  input: SaveFamilyMemberInput
) {
  const { session, submission } = await getSessionContext(sessionToken);
  assertEditable(submission.status);
  const member = await repo.findFamilyMember(familyMemberId);
  if (!member || member.submissionId !== submission.id) throw ApiError.notFound("Family member not found");
  await saveFamilyValues(familyMemberId, submission.programmeId, session.language as Language, input.values);
  return repo.getSubmissionState(submission.id);
}

async function saveFamilyValues(
  familyMemberId: string,
  programmeId: string,
  language: Language,
  values: FieldValueInput[]
) {
  const fields = await repo.getActiveFields(programmeId);
  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  const denorm: { fullName?: string; relationship?: string; cnic?: string } = {};

  for (const item of values) {
    const field = fieldMap.get(item.fieldId);
    if (!field || field.subjectType !== "FAMILY_MEMBER") continue;
    const std = standardizeValue(field, item.value, language);
    await repo.replaceFamilyValue(familyMemberId, field.id, {
      fieldKey: field.fieldKey,
      valueKind: field.valueKind,
      originalValue: std.originalValue,
      standardizedValue: std.standardizedValue,
      language,
    });
    if (field.fieldKey === FAM_NAME_KEY) denorm.fullName = rawToString(item.value);
    if (field.fieldKey === FAM_REL_KEY) denorm.relationship = std.standardizedValue ?? rawToString(item.value);
    if (field.fieldKey === FAM_CNIC_KEY) denorm.cnic = rawToString(item.value);
  }
  await repo.updateFamilyMember(familyMemberId, denorm);
}

export async function removeFamilyMember(sessionToken: string, familyMemberId: string) {
  const { submission } = await getSessionContext(sessionToken);
  assertEditable(submission.status);
  const member = await repo.findFamilyMember(familyMemberId);
  if (!member || member.submissionId !== submission.id) throw ApiError.notFound("Family member not found");
  await repo.deleteFamilyMember(familyMemberId);
  return repo.getSubmissionState(submission.id);
}

export async function uploadDocument(
  sessionToken: string,
  programmeDocumentId: string,
  familyMemberId: string | undefined,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer }
) {
  const { submission } = await getSessionContext(sessionToken);
  assertEditable(submission.status);

  const cfg = await repo.findProgrammeDocument(programmeDocumentId);
  if (!cfg || cfg.programmeId !== submission.programmeId) throw ApiError.badRequest("Unknown document requirement");

  const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
  if (!cfg.allowedFileTypes.includes(ext)) {
    throw ApiError.badRequest(`Only ${cfg.allowedFileTypes.join(", ").toUpperCase()} files are allowed`);
  }
  if (file.size > cfg.maxFileSizeBytes) {
    throw ApiError.payloadTooLarge(`File exceeds ${Math.round(cfg.maxFileSizeBytes / 1024 / 1024)}MB limit`);
  }
  if (cfg.subjectType === "FAMILY_MEMBER") {
    if (!familyMemberId) throw ApiError.badRequest("familyMemberId is required for family documents");
    const fam = await repo.findFamilyMember(familyMemberId);
    if (!fam || fam.submissionId !== submission.id) throw ApiError.badRequest("Invalid family member");
  }

  const storageKey = buildStorageKey(submission.id, file.originalname);
  await storage.put(storageKey, file.buffer, file.mimetype);

  return repo.createDocument({
    submissionId: submission.id,
    familyMemberId: cfg.subjectType === "FAMILY_MEMBER" ? familyMemberId : null,
    documentTypeId: cfg.documentTypeId,
    subjectType: cfg.subjectType,
    originalFileName: file.originalname,
    storageKey,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
  });
}

export async function removeDocument(sessionToken: string, documentId: string) {
  const { submission } = await getSessionContext(sessionToken);
  assertEditable(submission.status);
  const doc = await repo.findDocument(documentId);
  if (!doc || doc.submissionId !== submission.id) throw ApiError.notFound("Document not found");
  await storage.delete(doc.storageKey).catch(() => undefined);
  await repo.deleteDocument(documentId);
  return { deleted: true };
}

export async function submit(sessionToken: string) {
  const { submission } = await getSessionContext(sessionToken);
  assertEditable(submission.status);

  // Block duplicate submissions for the same CNIC within this programme.
  if (submission.cnic?.trim()) {
    const duplicate = await repo.existsSubmittedCnic(submission.programmeId, submission.cnic.trim(), submission.id);
    if (duplicate) {
      throw ApiError.conflict("A form with this CNIC has already been submitted for this programme.");
    }
  }

  const [fields, documents, state] = await Promise.all([
    repo.getActiveFields(submission.programmeId),
    repo.getActiveDocuments(submission.programmeId),
    repo.getSubmissionState(submission.id),
  ]);
  if (!state) throw ApiError.notFound("Submission not found");

  const errors: Record<string, string[]> = {};

  // Required member fields
  const memberValues = new Map(state.fieldValues.map((v) => [v.fieldId, v]));
  for (const f of fields) {
    if (f.subjectType !== "MEMBER" || !f.isRequired) continue;
    const v = memberValues.get(f.id);
    if (!v?.originalValue?.trim()) (errors[f.fieldKey] ??= []).push(`${f.label} is required`);
  }

  // Required family fields (each family member)
  const requiredFamilyFields = fields.filter((f) => f.subjectType === "FAMILY_MEMBER" && f.isRequired);
  state.familyMembers.forEach((fam, idx) => {
    const famValues = new Map(fam.fieldValues.map((v) => [v.fieldId, v]));
    for (const f of requiredFamilyFields) {
      const v = famValues.get(f.id);
      if (!v?.originalValue?.trim())
        (errors[`family.${idx}.${f.fieldKey}`] ??= []).push(`Family member ${idx + 1}: ${f.label} is required`);
    }
  });

  // --- Required documents (verification flow) ---
  // Member: required member documents (CNIC front/back, photo…).
  for (const d of documents) {
    if (d.subjectType !== "MEMBER" || !d.isRequired) continue;
    const has = state.documents.some((doc) => doc.documentTypeId === d.documentTypeId && doc.subjectType === "MEMBER");
    if (!has) (errors[`doc.${d.documentType.code}`] ??= []).push(`${d.documentType.name} is required`);
  }

  // Family: rules depend on the relationship, and never block a member who has no
  // dependents of that type.
  const familyDocs = documents.filter((d) => d.subjectType === "FAMILY_MEMBER");
  const spouseDocTypeIds = familyDocs
    .filter((d) => (SPOUSE_DOC_CODES as readonly string[]).includes(d.documentType.code))
    .map((d) => d.documentTypeId);
  const childProofDocTypeIds = familyDocs
    .filter((d) => (CHILD_PROOF_DOC_CODES as readonly string[]).includes(d.documentType.code))
    .map((d) => d.documentTypeId);

  state.familyMembers.forEach((fam, idx) => {
    const rel = fam.relationship ?? "";
    const who = fam.fullName || `Family member ${idx + 1}`;
    if ((SPOUSE_RELATIONSHIPS as readonly string[]).includes(rel)) {
      // Spouse → CNIC required.
      for (const dtid of spouseDocTypeIds) {
        const has = state.documents.some((doc) => doc.documentTypeId === dtid && doc.familyMemberId === fam.id);
        if (!has) (errors[`family.${idx}.doc`] ??= []).push(`${who}: CNIC is required`);
      }
    } else if ((CHILD_RELATIONSHIPS as readonly string[]).includes(rel)) {
      // Child → ANY ONE of B-Form / Birth Certificate / FRC.
      if (childProofDocTypeIds.length) {
        const hasAny = state.documents.some(
          (doc) => childProofDocTypeIds.includes(doc.documentTypeId) && doc.familyMemberId === fam.id
        );
        if (!hasAny)
          (errors[`family.${idx}.doc`] ??= []).push(
            `${who}: please upload any one of B-Form, Birth Certificate or FRC`
          );
      }
    }
    // Other relationships → no document required (keeps the flow flexible).
  });

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest("Please complete all required fields and documents", errors);
  }

  const [updated] = await repo.setStatus(submission.id, "SUBMITTED", {
    submittedAt: new Date(),
    consentAcceptedAt: new Date(),
  });

  // Notifications (best-effort, non-blocking) — spec section 21.
  const programme = await repo.getProgrammeInfo(submission.programmeId);
  const memberName = state.memberName ?? "";
  if (submission.email) {
    const tpl = submissionConfirmationEmail(memberName, programme?.name ?? "your programme");
    void sendEmail({ to: submission.email, ...tpl, template: "submission_confirmation", metadata: { submissionId: submission.id } });
  }
  if (env.ADMIN_NOTIFY_EMAIL) {
    const tpl = adminNewSubmissionEmail(memberName, programme?.name ?? "", programme?.corporate.name ?? "");
    void sendEmail({ to: env.ADMIN_NOTIFY_EMAIL, ...tpl, template: "admin_new_submission", metadata: { submissionId: submission.id } });
  }

  return { id: updated!.id, status: updated!.status, submittedAt: updated!.submittedAt };
}
