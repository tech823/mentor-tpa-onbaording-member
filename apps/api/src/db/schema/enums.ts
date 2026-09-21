import { pgEnum } from "drizzle-orm/pg-core";
import {
  ROLES,
  CORPORATE_STATUS,
  PROGRAMME_STATUS,
  SUBMISSION_STATUS,
  DOCUMENT_VERIFICATION_STATUS,
  FIELD_TYPES,
  SUBJECT_TYPE,
  VALUE_KIND,
  LANGUAGES,
} from "@mentor/shared";

/** Postgres native enums generated from the shared canonical code lists. */
export const roleEnum = pgEnum("role", ROLES);
export const corporateStatusEnum = pgEnum("corporate_status", CORPORATE_STATUS);
export const programmeStatusEnum = pgEnum("programme_status", PROGRAMME_STATUS);
export const submissionStatusEnum = pgEnum("submission_status", SUBMISSION_STATUS);
export const docVerificationEnum = pgEnum("doc_verification_status", DOCUMENT_VERIFICATION_STATUS);
export const fieldTypeEnum = pgEnum("field_type", FIELD_TYPES);
export const subjectTypeEnum = pgEnum("subject_type", SUBJECT_TYPE);
export const valueKindEnum = pgEnum("value_kind", VALUE_KIND);
export const languageEnum = pgEnum("language", LANGUAGES);
