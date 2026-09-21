import { ApiError } from "../../utils/ApiError";
import { getProgrammeForUser } from "../programmes/programmes.service";
import * as repo from "./forms.repository";
import type {
  AuthUser,
  CreateSectionInput,
  UpdateSectionInput,
  CreateFieldInput,
  UpdateFieldInput,
  CreateProgrammeDocumentInput,
  UpdateProgrammeDocumentInput,
} from "@mentor/shared";

// ---------- config ----------
export async function getFormConfig(user: AuthUser, programmeId: string) {
  const programme = await getProgrammeForUser(user, programmeId);
  const config = await repo.getFormConfig(programmeId);
  return { programme, ...config };
}

export function listDocumentTypes() {
  return repo.listDocumentTypes();
}

// ---------- sections ----------
export async function createSection(user: AuthUser, programmeId: string, input: CreateSectionInput) {
  await getProgrammeForUser(user, programmeId);
  return repo.createSection(programmeId, input);
}

export async function updateSection(user: AuthUser, sectionId: string, input: UpdateSectionInput) {
  const section = await repo.findSectionById(sectionId);
  if (!section) throw ApiError.notFound("Section not found");
  await getProgrammeForUser(user, section.programmeId);
  return repo.updateSection(sectionId, input);
}

export async function deleteSection(user: AuthUser, sectionId: string) {
  const section = await repo.findSectionById(sectionId);
  if (!section) throw ApiError.notFound("Section not found");
  await getProgrammeForUser(user, section.programmeId);
  await repo.deleteSection(sectionId);
}

// ---------- fields ----------
export async function createField(user: AuthUser, programmeId: string, input: CreateFieldInput) {
  await getProgrammeForUser(user, programmeId);
  if (await repo.fieldKeyExists(programmeId, input.fieldKey)) {
    throw ApiError.conflict(`Field key "${input.fieldKey}" already exists in this programme`);
  }
  const displayOrder = input.displayOrder || (await repo.nextFieldOrder(programmeId));
  const { options, ...fieldData } = input;
  return repo.createField(
    {
      programmeId,
      sectionId: fieldData.sectionId ?? null,
      fieldKey: fieldData.fieldKey,
      label: fieldData.label,
      labelI18n: fieldData.labelI18n,
      fieldType: fieldData.fieldType,
      subjectType: fieldData.subjectType,
      valueKind: fieldData.valueKind,
      isRequired: fieldData.isRequired,
      placeholder: fieldData.placeholder,
      placeholderI18n: fieldData.placeholderI18n,
      helpText: fieldData.helpText,
      helpTextI18n: fieldData.helpTextI18n,
      validation: fieldData.validation,
      displayOrder,
      isActive: fieldData.isActive,
    },
    options.map((o, i) => ({
      fieldId: "", // set in repo transaction
      value: o.value,
      label: o.label,
      labelI18n: o.labelI18n,
      displayOrder: o.displayOrder || i,
      isActive: o.isActive,
    }))
  );
}

export async function updateField(user: AuthUser, fieldId: string, input: UpdateFieldInput) {
  const field = await repo.findFieldById(fieldId);
  if (!field) throw ApiError.notFound("Field not found");
  await getProgrammeForUser(user, field.programmeId);

  const { options, ...rest } = input;
  const optionRows =
    options?.map((o, i) => ({
      fieldId,
      value: o.value,
      label: o.label,
      labelI18n: o.labelI18n,
      displayOrder: o.displayOrder || i,
      isActive: o.isActive,
    })) ?? undefined;

  return repo.updateField(fieldId, { ...rest, sectionId: rest.sectionId ?? undefined }, optionRows);
}

export async function deleteField(user: AuthUser, fieldId: string) {
  const field = await repo.findFieldById(fieldId);
  if (!field) throw ApiError.notFound("Field not found");
  await getProgrammeForUser(user, field.programmeId);
  await repo.deleteField(fieldId);
}

export async function reorderFields(user: AuthUser, programmeId: string, ids: string[]) {
  await getProgrammeForUser(user, programmeId);
  await repo.reorderFields(programmeId, ids);
  return repo.getFormConfig(programmeId);
}

// ---------- programme documents ----------
export async function createDocConfig(
  user: AuthUser,
  programmeId: string,
  input: CreateProgrammeDocumentInput
) {
  await getProgrammeForUser(user, programmeId);
  if (!(await repo.documentTypeExists(input.documentTypeId))) {
    throw ApiError.badRequest("Unknown document type");
  }
  return repo.createDocConfig(programmeId, input);
}

export async function updateDocConfig(
  user: AuthUser,
  id: string,
  input: UpdateProgrammeDocumentInput
) {
  const cfg = await repo.findDocConfigById(id);
  if (!cfg) throw ApiError.notFound("Document requirement not found");
  await getProgrammeForUser(user, cfg.programmeId);
  return repo.updateDocConfig(id, input);
}

export async function deleteDocConfig(user: AuthUser, id: string) {
  const cfg = await repo.findDocConfigById(id);
  if (!cfg) throw ApiError.notFound("Document requirement not found");
  await getProgrammeForUser(user, cfg.programmeId);
  await repo.deleteDocConfig(id);
}
