import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { fieldTypeEnum, subjectTypeEnum, valueKindEnum } from "./enums";
import { programmes } from "./programmes";
import type { Language } from "@mentor/shared";

/** Map of language code -> translated string (spec sections 16/24). */
export type I18nText = Partial<Record<Language, string>>;

/** Validation rule config held as JSON (spec section 22: JSON only for config). */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternKey?: "CNIC" | "PAK_MOBILE" | "EMAIL";
}

/** form_sections — logical grouping of fields within a programme's form. */
export const formSections = pgTable(
  "form_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    titleI18n: jsonb("title_i18n").$type<I18nText>(),
    subjectType: subjectTypeEnum("subject_type").notNull().default("MEMBER"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    programmeIdx: index("form_sections_programme_idx").on(t.programmeId),
  })
);

/** form_fields — a single configurable field (spec section 7). */
export const formFields = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => formSections.id, { onDelete: "set null" }),
    /** Stable machine key, e.g. "cnic". Unique per programme. */
    fieldKey: varchar("field_key", { length: 80 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    labelI18n: jsonb("label_i18n").$type<I18nText>(),
    fieldType: fieldTypeEnum("field_type").notNull(),
    subjectType: subjectTypeEnum("subject_type").notNull().default("MEMBER"),
    /** STRUCTURED values map to canonical English codes; FREE_TEXT preserved as-is. */
    valueKind: valueKindEnum("value_kind").notNull().default("FREE_TEXT"),
    isRequired: boolean("is_required").notNull().default(false),
    placeholder: varchar("placeholder", { length: 200 }),
    placeholderI18n: jsonb("placeholder_i18n").$type<I18nText>(),
    helpText: varchar("help_text", { length: 500 }),
    helpTextI18n: jsonb("help_text_i18n").$type<I18nText>(),
    validation: jsonb("validation").$type<FieldValidation>(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    /** True for the standard built-in member fields (spec section 8). */
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    programmeIdx: index("form_fields_programme_idx").on(t.programmeId),
    uniqueKey: unique("form_fields_programme_key_uq").on(t.programmeId, t.fieldKey),
  })
);

/** form_field_options — choices for DROPDOWN/RADIO/CHECKBOX fields. */
export const formFieldOptions = pgTable(
  "form_field_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFields.id, { onDelete: "cascade" }),
    /** Canonical English code stored on submission (e.g. FEMALE). */
    value: varchar("value", { length: 100 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    labelI18n: jsonb("label_i18n").$type<I18nText>(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => ({
    fieldIdx: index("form_field_options_field_idx").on(t.fieldId),
  })
);

/** document_types — reusable catalogue of document kinds (spec section 10). */
export const documentTypes = pgTable(
  "document_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 40 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    nameI18n: jsonb("name_i18n").$type<I18nText>(),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

/** programme_documents — which documents a programme requires, and rules. */
export const programmeDocuments = pgTable(
  "programme_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    documentTypeId: uuid("document_type_id")
      .notNull()
      .references(() => documentTypes.id, { onDelete: "restrict" }),
    subjectType: subjectTypeEnum("subject_type").notNull().default("MEMBER"),
    isRequired: boolean("is_required").notNull().default(true),
    /** Allowed extensions e.g. ["jpg","jpeg","png","pdf"]. */
    allowedFileTypes: jsonb("allowed_file_types").$type<string[]>().notNull(),
    maxFileSizeBytes: integer("max_file_size_bytes").notNull().default(10 * 1024 * 1024),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => ({
    programmeIdx: index("programme_documents_programme_idx").on(t.programmeId),
    uq: unique("programme_documents_uq").on(t.programmeId, t.documentTypeId, t.subjectType),
  })
);

export const formSectionsRelations = relations(formSections, ({ one, many }) => ({
  programme: one(programmes, {
    fields: [formSections.programmeId],
    references: [programmes.id],
  }),
  fields: many(formFields),
}));

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
  programme: one(programmes, {
    fields: [formFields.programmeId],
    references: [programmes.id],
  }),
  section: one(formSections, {
    fields: [formFields.sectionId],
    references: [formSections.id],
  }),
  options: many(formFieldOptions),
}));

export const formFieldOptionsRelations = relations(formFieldOptions, ({ one }) => ({
  field: one(formFields, {
    fields: [formFieldOptions.fieldId],
    references: [formFields.id],
  }),
}));

export const programmeDocumentsRelations = relations(programmeDocuments, ({ one }) => ({
  programme: one(programmes, {
    fields: [programmeDocuments.programmeId],
    references: [programmes.id],
  }),
  documentType: one(documentTypes, {
    fields: [programmeDocuments.documentTypeId],
    references: [documentTypes.id],
  }),
}));
