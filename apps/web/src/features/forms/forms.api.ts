import { api } from "@/lib/api";
import type {
  FieldType,
  SubjectType,
  ValueKind,
  Language,
  CreateFieldInput,
  UpdateFieldInput,
  CreateSectionInput,
  CreateProgrammeDocumentInput,
} from "@mentor/shared";

export type I18nText = Partial<Record<Language, string>>;

export interface FormFieldOption {
  id: string;
  fieldId: string;
  value: string;
  label: string;
  labelI18n: I18nText | null;
  displayOrder: number;
  isActive: boolean;
}

export interface FormField {
  id: string;
  programmeId: string;
  sectionId: string | null;
  fieldKey: string;
  label: string;
  labelI18n: I18nText | null;
  fieldType: FieldType;
  subjectType: SubjectType;
  valueKind: ValueKind;
  isRequired: boolean;
  placeholder: string | null;
  helpText: string | null;
  validation: Record<string, unknown> | null;
  displayOrder: number;
  isActive: boolean;
  isSystem: boolean;
  options: FormFieldOption[];
}

export interface FormSection {
  id: string;
  programmeId: string;
  title: string;
  titleI18n: I18nText | null;
  subjectType: SubjectType;
  displayOrder: number;
  isActive: boolean;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface ProgrammeDocument {
  id: string;
  programmeId: string;
  documentTypeId: string;
  subjectType: SubjectType;
  isRequired: boolean;
  allowedFileTypes: string[];
  maxFileSizeBytes: number;
  displayOrder: number;
  isActive: boolean;
  documentType: DocumentType;
}

export interface FormConfig {
  programme: { id: string; name: string; corporate: { name: string; shortCode: string } };
  sections: FormSection[];
  fields: FormField[];
  documents: ProgrammeDocument[];
}

export const formsApi = {
  getConfig: (programmeId: string) => api.get<FormConfig>(`/programmes/${programmeId}/form`),
  documentTypes: () => api.get<DocumentType[]>("/document-types"),

  createSection: (programmeId: string, input: CreateSectionInput) =>
    api.post<FormSection>(`/programmes/${programmeId}/sections`, input),
  deleteSection: (id: string) => api.del(`/sections/${id}`),

  createField: (programmeId: string, input: CreateFieldInput) =>
    api.post<FormField>(`/programmes/${programmeId}/form-fields`, input),
  updateField: (id: string, input: UpdateFieldInput) => api.put<FormField>(`/form-fields/${id}`, input),
  deleteField: (id: string) => api.del(`/form-fields/${id}`),
  reorderFields: (programmeId: string, ids: string[]) =>
    api.put<FormConfig>(`/programmes/${programmeId}/form-fields/reorder`, { ids }),

  createDocument: (programmeId: string, input: CreateProgrammeDocumentInput) =>
    api.post<ProgrammeDocument>(`/programmes/${programmeId}/documents`, input),
  deleteDocument: (id: string) => api.del(`/programme-documents/${id}`),
};
