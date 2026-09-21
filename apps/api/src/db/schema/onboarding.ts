import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  submissionStatusEnum,
  docVerificationEnum,
  subjectTypeEnum,
  valueKindEnum,
  languageEnum,
} from "./enums";
import { programmes, onboardingLinks } from "./programmes";
import { formFields, documentTypes } from "./forms";

/**
 * onboarding_sessions — a public, tokenized draft session (spec sections 11/12).
 * No member account required; access is via the non-guessable `sessionToken`.
 */
export const onboardingSessions = pgTable(
  "onboarding_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    onboardingLinkId: uuid("onboarding_link_id")
      .notNull()
      .references(() => onboardingLinks.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 64 }).notNull().unique(),
    language: languageEnum("language").notNull().default("en"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: index("onboarding_sessions_token_idx").on(t.sessionToken),
    programmeIdx: index("onboarding_sessions_programme_idx").on(t.programmeId),
  })
);

/** submissions — one member submission per session (spec section 13). */
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => onboardingSessions.id, { onDelete: "cascade" }),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    /** Denormalized for fast list/search (indexed). Sourced from field values. */
    memberName: varchar("member_name", { length: 200 }),
    cnic: varchar("cnic", { length: 20 }),
    email: varchar("email", { length: 255 }),
    status: submissionStatusEnum("status").notNull().default("DRAFT"),
    language: languageEnum("language").notNull().default("en"),
    consentAcceptedAt: timestamp("consent_accepted_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedByUserId: uuid("reviewed_by_user_id"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    programmeIdx: index("submissions_programme_idx").on(t.programmeId),
    statusIdx: index("submissions_status_idx").on(t.status),
    cnicIdx: index("submissions_cnic_idx").on(t.cnic),
    emailIdx: index("submissions_email_idx").on(t.email),
    createdAtIdx: index("submissions_created_at_idx").on(t.createdAt),
  })
);

/**
 * submission_field_values — one row per member field (spec section 22:
 * relational, not a JSON blob, so it stays filterable/exportable).
 * Standardization columns per spec section 17.
 */
export const submissionFieldValues = pgTable(
  "submission_field_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFields.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 80 }).notNull(),
    valueKind: valueKindEnum("value_kind").notNull().default("FREE_TEXT"),
    /** Exactly what the user typed, in their language — never overwritten. */
    originalValue: text("original_value"),
    /** Canonical English code (structured) or transliteration (free-text). */
    standardizedValue: text("standardized_value"),
    language: languageEnum("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    submissionIdx: index("submission_field_values_submission_idx").on(t.submissionId),
    fieldKeyIdx: index("submission_field_values_field_key_idx").on(t.fieldKey),
  })
);

/** family_members — dynamic list per submission (spec section 9). */
export const familyMembers = pgTable(
  "family_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 200 }),
    /** Canonical relationship code (SPOUSE, SON, ...). */
    relationship: varchar("relationship", { length: 40 }),
    cnic: varchar("cnic", { length: 20 }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    submissionIdx: index("family_members_submission_idx").on(t.submissionId),
  })
);

/** family_field_values — dynamic field values per family member. */
export const familyFieldValues = pgTable(
  "family_field_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyMemberId: uuid("family_member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFields.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 80 }).notNull(),
    valueKind: valueKindEnum("value_kind").notNull().default("FREE_TEXT"),
    originalValue: text("original_value"),
    standardizedValue: text("standardized_value"),
    language: languageEnum("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    familyIdx: index("family_field_values_family_idx").on(t.familyMemberId),
  })
);

/**
 * uploaded_documents — metadata only; the binary lives in object storage
 * (local disk for MVP) referenced by `storageKey` (spec section 10/19).
 */
export const uploadedDocuments = pgTable(
  "uploaded_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    /** Null when the document belongs to the primary member. */
    familyMemberId: uuid("family_member_id").references(() => familyMembers.id, {
      onDelete: "cascade",
    }),
    documentTypeId: uuid("document_type_id")
      .notNull()
      .references(() => documentTypes.id, { onDelete: "restrict" }),
    subjectType: subjectTypeEnum("subject_type").notNull().default("MEMBER"),
    originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    verificationStatus: docVerificationEnum("verification_status").notNull().default("PENDING"),
    verificationNotes: text("verification_notes"),
    verifiedByUserId: uuid("verified_by_user_id"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    submissionIdx: index("uploaded_documents_submission_idx").on(t.submissionId),
    statusIdx: index("uploaded_documents_status_idx").on(t.verificationStatus),
  })
);

// --- relations ---
export const onboardingSessionsRelations = relations(onboardingSessions, ({ one, many }) => ({
  programme: one(programmes, {
    fields: [onboardingSessions.programmeId],
    references: [programmes.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  session: one(onboardingSessions, {
    fields: [submissions.sessionId],
    references: [onboardingSessions.id],
  }),
  programme: one(programmes, {
    fields: [submissions.programmeId],
    references: [programmes.id],
  }),
  fieldValues: many(submissionFieldValues),
  familyMembers: many(familyMembers),
  documents: many(uploadedDocuments),
}));

export const submissionFieldValuesRelations = relations(submissionFieldValues, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionFieldValues.submissionId],
    references: [submissions.id],
  }),
  field: one(formFields, {
    fields: [submissionFieldValues.fieldId],
    references: [formFields.id],
  }),
}));

export const familyMembersRelations = relations(familyMembers, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [familyMembers.submissionId],
    references: [submissions.id],
  }),
  fieldValues: many(familyFieldValues),
  documents: many(uploadedDocuments),
}));

export const familyFieldValuesRelations = relations(familyFieldValues, ({ one }) => ({
  familyMember: one(familyMembers, {
    fields: [familyFieldValues.familyMemberId],
    references: [familyMembers.id],
  }),
  field: one(formFields, {
    fields: [familyFieldValues.fieldId],
    references: [formFields.id],
  }),
}));

export const uploadedDocumentsRelations = relations(uploadedDocuments, ({ one }) => ({
  submission: one(submissions, {
    fields: [uploadedDocuments.submissionId],
    references: [submissions.id],
  }),
  familyMember: one(familyMembers, {
    fields: [uploadedDocuments.familyMemberId],
    references: [familyMembers.id],
  }),
  documentType: one(documentTypes, {
    fields: [uploadedDocuments.documentTypeId],
    references: [documentTypes.id],
  }),
}));
