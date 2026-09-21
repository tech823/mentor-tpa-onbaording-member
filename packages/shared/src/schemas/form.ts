import { z } from "zod";
import { FIELD_TYPES, SUBJECT_TYPE, VALUE_KIND, LANGUAGES } from "../enums";

/** Partial per-language text map, e.g. { en: "CNIC", ur: "شناختی کارڈ" }. */
export const i18nTextSchema = z.record(z.enum(LANGUAGES), z.string().max(500)).optional();

export const fieldValidationSchema = z
  .object({
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().max(300).optional(),
    patternKey: z.enum(["CNIC", "PAK_MOBILE", "EMAIL"]).optional(),
  })
  .optional();

// --- Sections ---
export const createSectionSchema = z.object({
  title: z.string().trim().min(1).max(150),
  titleI18n: i18nTextSchema,
  subjectType: z.enum(SUBJECT_TYPE).default("MEMBER"),
  displayOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export const updateSectionSchema = createSectionSchema.partial();
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// --- Field options (embedded in field payload) ---
export const fieldOptionSchema = z.object({
  id: z.string().uuid().optional(), // present when editing an existing option
  value: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(200),
  labelI18n: i18nTextSchema,
  displayOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});
export type FieldOptionInput = z.infer<typeof fieldOptionSchema>;

// --- Fields ---
const OPTION_FIELD_TYPES = ["DROPDOWN", "RADIO", "CHECKBOX"] as const;

export const createFieldSchema = z
  .object({
    sectionId: z.string().uuid().nullable().optional(),
    fieldKey: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z][a-z0-9_]*$/, "Use snake_case starting with a letter"),
    label: z.string().trim().min(1).max(200),
    labelI18n: i18nTextSchema,
    fieldType: z.enum(FIELD_TYPES),
    subjectType: z.enum(SUBJECT_TYPE).default("MEMBER"),
    valueKind: z.enum(VALUE_KIND).default("FREE_TEXT"),
    isRequired: z.boolean().default(false),
    placeholder: z.string().trim().max(200).optional(),
    placeholderI18n: i18nTextSchema,
    helpText: z.string().trim().max(500).optional(),
    helpTextI18n: i18nTextSchema,
    validation: fieldValidationSchema,
    displayOrder: z.number().int().nonnegative().default(0),
    isActive: z.boolean().default(true),
    options: z.array(fieldOptionSchema).default([]),
  })
  .refine(
    (v) => !OPTION_FIELD_TYPES.includes(v.fieldType as (typeof OPTION_FIELD_TYPES)[number]) || v.options.length > 0,
    { message: "Dropdown/Radio/Checkbox fields need at least one option", path: ["options"] }
  );
export type CreateFieldInput = z.infer<typeof createFieldSchema>;

export const updateFieldSchema = z
  .object({
    sectionId: z.string().uuid().nullable().optional(),
    label: z.string().trim().min(1).max(200).optional(),
    labelI18n: i18nTextSchema,
    fieldType: z.enum(FIELD_TYPES).optional(),
    subjectType: z.enum(SUBJECT_TYPE).optional(),
    valueKind: z.enum(VALUE_KIND).optional(),
    isRequired: z.boolean().optional(),
    placeholder: z.string().trim().max(200).optional(),
    placeholderI18n: i18nTextSchema,
    helpText: z.string().trim().max(500).optional(),
    helpTextI18n: i18nTextSchema,
    validation: fieldValidationSchema,
    isActive: z.boolean().optional(),
    options: z.array(fieldOptionSchema).optional(),
  });
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

/** Reorder payload: ordered list of ids -> new displayOrder = array index. */
export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

// --- Programme documents (required-document config) ---
export const ALLOWED_FILE_TYPES = ["jpg", "jpeg", "png", "pdf"] as const;

export const createProgrammeDocumentSchema = z.object({
  documentTypeId: z.string().uuid(),
  subjectType: z.enum(SUBJECT_TYPE).default("MEMBER"),
  isRequired: z.boolean().default(true),
  allowedFileTypes: z.array(z.enum(ALLOWED_FILE_TYPES)).min(1).default(["jpg", "jpeg", "png", "pdf"]),
  maxFileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024)
    .default(10 * 1024 * 1024),
  displayOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});
export type CreateProgrammeDocumentInput = z.infer<typeof createProgrammeDocumentSchema>;
export const updateProgrammeDocumentSchema = createProgrammeDocumentSchema.partial().omit({
  documentTypeId: true,
});
export type UpdateProgrammeDocumentInput = z.infer<typeof updateProgrammeDocumentSchema>;
