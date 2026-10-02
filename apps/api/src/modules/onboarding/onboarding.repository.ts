import { and, asc, eq, ne, inArray } from "drizzle-orm";
import { db } from "../../db/index";
import {
  onboardingLinks,
  onboardingSessions,
  submissions,
  submissionFieldValues,
  familyMembers,
  familyFieldValues,
  uploadedDocuments,
  formFields,
  formFieldOptions,
  programmeDocuments,
  programmes,
} from "../../db/schema/index";
import type { Language, SubmissionStatus } from "@mentor/shared";

export function findActiveLinkByToken(token: string) {
  return db.query.onboardingLinks.findFirst({
    where: and(eq(onboardingLinks.token, token), eq(onboardingLinks.isActive, true)),
    with: { programme: { with: { corporate: { columns: { name: true, shortCode: true } } } } },
  });
}

export function findSessionByToken(token: string) {
  return db.query.onboardingSessions.findFirst({
    where: eq(onboardingSessions.sessionToken, token),
  });
}

export async function createSession(input: {
  programmeId: string;
  onboardingLinkId: string;
  sessionToken: string;
  language: Language;
  expiresAt: Date;
}) {
  const [session] = await db.insert(onboardingSessions).values(input).returning();
  return session;
}

export async function createDraftSubmission(input: {
  sessionId: string;
  programmeId: string;
  language: Language;
}) {
  const [row] = await db
    .insert(submissions)
    .values({ ...input, status: "IN_PROGRESS" })
    .returning();
  return row;
}

export function findSubmissionBySession(sessionId: string) {
  return db.query.submissions.findFirst({ where: eq(submissions.sessionId, sessionId) });
}

/** True if another already-submitted form in this programme used the same CNIC. */
export async function existsSubmittedCnic(programmeId: string, cnic: string, excludeSubmissionId: string) {
  const row = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.programmeId, programmeId),
      eq(submissions.cnic, cnic),
      ne(submissions.id, excludeSubmissionId),
      inArray(submissions.status, ["SUBMITTED", "UNDER_REVIEW", "VERIFIED", "COMPLETED"])
    ),
    columns: { id: true },
  });
  return !!row;
}

export function getProgrammeInfo(programmeId: string) {
  return db.query.programmes.findFirst({
    where: eq(programmes.id, programmeId),
    columns: { id: true, name: true },
    with: { corporate: { columns: { name: true } } },
  });
}

/** Full draft state for resume / review. */
export async function getSubmissionState(submissionId: string) {
  return db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      fieldValues: true,
      familyMembers: { with: { fieldValues: true }, orderBy: asc(familyMembers.displayOrder) },
      documents: true,
    },
  });
}

// --- form config (active only) ---
export async function getActiveFields(programmeId: string) {
  return db.query.formFields.findMany({
    where: and(eq(formFields.programmeId, programmeId), eq(formFields.isActive, true)),
    orderBy: asc(formFields.displayOrder),
    with: { options: { where: eq(formFieldOptions.isActive, true), orderBy: asc(formFieldOptions.displayOrder) } },
  });
}

export async function getActiveDocuments(programmeId: string) {
  return db.query.programmeDocuments.findMany({
    where: and(eq(programmeDocuments.programmeId, programmeId), eq(programmeDocuments.isActive, true)),
    orderBy: asc(programmeDocuments.displayOrder),
    with: { documentType: true },
  });
}

export function findFieldById(id: string) {
  return db.query.formFields.findFirst({ where: eq(formFields.id, id), with: { options: true } });
}

// --- member field values (upsert-by-field within a submission) ---
export async function replaceMemberValue(
  submissionId: string,
  fieldId: string,
  data: Omit<typeof submissionFieldValues.$inferInsert, "submissionId" | "fieldId">
) {
  await db
    .delete(submissionFieldValues)
    .where(and(eq(submissionFieldValues.submissionId, submissionId), eq(submissionFieldValues.fieldId, fieldId)));
  await db.insert(submissionFieldValues).values({ ...data, submissionId, fieldId });
}

export async function updateSubmissionMeta(
  submissionId: string,
  data: Partial<typeof submissions.$inferInsert>
) {
  const [row] = await db
    .update(submissions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(submissions.id, submissionId))
    .returning();
  return row;
}

// --- family members ---
export async function createFamilyMember(submissionId: string, displayOrder: number) {
  const [row] = await db.insert(familyMembers).values({ submissionId, displayOrder }).returning();
  return row;
}

export function findFamilyMember(id: string) {
  return db.query.familyMembers.findFirst({ where: eq(familyMembers.id, id) });
}

export async function updateFamilyMember(id: string, data: Partial<typeof familyMembers.$inferInsert>) {
  const [row] = await db
    .update(familyMembers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(familyMembers.id, id))
    .returning();
  return row;
}

export async function replaceFamilyValue(
  familyMemberId: string,
  fieldId: string,
  data: Omit<typeof familyFieldValues.$inferInsert, "familyMemberId" | "fieldId">
) {
  await db
    .delete(familyFieldValues)
    .where(and(eq(familyFieldValues.familyMemberId, familyMemberId), eq(familyFieldValues.fieldId, fieldId)));
  await db.insert(familyFieldValues).values({ ...data, familyMemberId, fieldId });
}

export async function deleteFamilyMember(id: string) {
  await db.delete(familyMembers).where(eq(familyMembers.id, id));
}

export function countFamilyMembers(submissionId: string) {
  return db.query.familyMembers.findMany({
    where: eq(familyMembers.submissionId, submissionId),
    columns: { id: true },
  });
}

// --- documents ---
export async function createDocument(data: typeof uploadedDocuments.$inferInsert) {
  const [row] = await db.insert(uploadedDocuments).values(data).returning();
  return row;
}

export function findDocument(id: string) {
  return db.query.uploadedDocuments.findFirst({ where: eq(uploadedDocuments.id, id) });
}

export async function deleteDocument(id: string) {
  await db.delete(uploadedDocuments).where(eq(uploadedDocuments.id, id));
}

export function findProgrammeDocument(id: string) {
  return db.query.programmeDocuments.findFirst({
    where: eq(programmeDocuments.id, id),
    with: { documentType: true },
  });
}

export function setStatus(submissionId: string, status: SubmissionStatus, extra?: Partial<typeof submissions.$inferInsert>) {
  return db
    .update(submissions)
    .set({ status, ...extra, updatedAt: new Date() })
    .where(eq(submissions.id, submissionId))
    .returning();
}
