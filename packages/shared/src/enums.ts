/**
 * Central enums shared across API, web and (later) the React Native app.
 *
 * These are the canonical internal English CODES used for data standardization
 * (spec section 17). Structured values entered in any language are normalized to
 * one of these codes; the original user input is preserved separately.
 */

export const ROLES = ["SUPER_ADMIN", "ADMIN", "CORPORATE_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const CORPORATE_STATUS = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export type CorporateStatus = (typeof CORPORATE_STATUS)[number];

export const PROGRAMME_STATUS = ["DRAFT", "ACTIVE", "PAUSED", "CLOSED"] as const;
export type ProgrammeStatus = (typeof PROGRAMME_STATUS)[number];

export const SUBMISSION_STATUS = [
  "DRAFT",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "COMPLETED",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUS)[number];

export const DOCUMENT_VERIFICATION_STATUS = ["PENDING", "VERIFIED", "REJECTED"] as const;
export type DocumentVerificationStatus = (typeof DOCUMENT_VERIFICATION_STATUS)[number];

export const FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "EMAIL",
  "PHONE",
  "DATE",
  "DROPDOWN",
  "RADIO",
  "CHECKBOX",
  "TEXTAREA",
  "FILE",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/** Whether a value/field/document applies to the primary member or a family member. */
export const SUBJECT_TYPE = ["MEMBER", "FAMILY_MEMBER"] as const;
export type SubjectType = (typeof SUBJECT_TYPE)[number];

/** Structured-value classification (spec section 17). */
export const VALUE_KIND = ["STRUCTURED", "FREE_TEXT"] as const;
export type ValueKind = (typeof VALUE_KIND)[number];

export const LANGUAGES = ["en", "ur", "sd", "ps"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  ur: "اردو",
  sd: "سنڌي",
  ps: "پښتو",
};

/** Standardized internal codes for common structured fields. */
export const GENDER = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDER)[number];

export const RELATIONSHIP = [
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "FATHER",
  "MOTHER",
  "OTHER",
] as const;
export type Relationship = (typeof RELATIONSHIP)[number];

export const DEFAULT_DOCUMENT_TYPES = ["CNIC", "B_FORM", "FRC", "PASSPORT", "OTHER"] as const;
export type DefaultDocumentType = (typeof DEFAULT_DOCUMENT_TYPES)[number];

/** Audit log action codes (spec section 20). */
export const AUDIT_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "CORPORATE_CREATED",
  "CORPORATE_UPDATED",
  "PROGRAMME_CREATED",
  "PROGRAMME_UPDATED",
  "FORM_FIELD_CHANGED",
  "ONBOARDING_LINK_CHANGED",
  "SUBMISSION_VIEWED",
  "SUBMISSION_STATUS_CHANGED",
  "DOCUMENT_VERIFIED",
  "DOCUMENT_REJECTED",
  "EXPORT_GENERATED",
  "USER_CREATED",
  "USER_UPDATED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
