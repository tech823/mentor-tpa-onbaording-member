import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import {
  formSections,
  formFields,
  formFieldOptions,
  documentTypes,
  programmeDocuments,
} from "../../db/schema/index";
import type { FieldType, SubjectType, ValueKind } from "@mentor/shared";
import type { FieldValidation, I18nText } from "../../db/schema/forms";

interface DefaultOption {
  value: string;
  label: string;
  labelI18n?: I18nText;
}
interface DefaultField {
  fieldKey: string;
  label: string;
  labelI18n?: I18nText;
  fieldType: FieldType;
  valueKind?: ValueKind;
  isRequired?: boolean;
  validation?: FieldValidation;
  options?: DefaultOption[];
}

const GENDER_OPTIONS: DefaultOption[] = [
  { value: "MALE", label: "Male", labelI18n: { ur: "مرد" } },
  { value: "FEMALE", label: "Female", labelI18n: { ur: "خاتون" } },
  { value: "OTHER", label: "Other", labelI18n: { ur: "دیگر" } },
];

const RELATIONSHIP_OPTIONS: DefaultOption[] = [
  { value: "SPOUSE", label: "Spouse", labelI18n: { ur: "شریک حیات" } },
  { value: "SON", label: "Son", labelI18n: { ur: "بیٹا" } },
  { value: "DAUGHTER", label: "Daughter", labelI18n: { ur: "بیٹی" } },
  { value: "FATHER", label: "Father", labelI18n: { ur: "والد" } },
  { value: "MOTHER", label: "Mother", labelI18n: { ur: "والدہ" } },
  { value: "OTHER", label: "Other", labelI18n: { ur: "دیگر" } },
];

/** Standard member fields (spec section 8) — configurable, seeded as a starting point. */
const MEMBER_FIELDS: DefaultField[] = [
  { fieldKey: "full_name", label: "Full Name", labelI18n: { ur: "پورا نام" }, fieldType: "TEXT", isRequired: true },
  { fieldKey: "father_husband_name", label: "Father / Husband Name", labelI18n: { ur: "والد / شوہر کا نام" }, fieldType: "TEXT", isRequired: true },
  { fieldKey: "cnic", label: "CNIC", labelI18n: { ur: "شناختی کارڈ نمبر" }, fieldType: "TEXT", isRequired: true, validation: { patternKey: "CNIC" } },
  { fieldKey: "date_of_birth", label: "Date of Birth", labelI18n: { ur: "تاریخ پیدائش" }, fieldType: "DATE", isRequired: true },
  { fieldKey: "gender", label: "Gender", labelI18n: { ur: "جنس" }, fieldType: "DROPDOWN", valueKind: "STRUCTURED", isRequired: true, options: GENDER_OPTIONS },
  { fieldKey: "mobile_number", label: "Mobile Number", labelI18n: { ur: "موبائل نمبر" }, fieldType: "PHONE", isRequired: true, validation: { patternKey: "PAK_MOBILE" } },
  { fieldKey: "email", label: "Email", labelI18n: { ur: "ای میل" }, fieldType: "EMAIL", validation: { patternKey: "EMAIL" } },
  { fieldKey: "address", label: "Address", labelI18n: { ur: "پتہ" }, fieldType: "TEXTAREA" },
  { fieldKey: "city", label: "City", labelI18n: { ur: "شہر" }, fieldType: "TEXT" },
  { fieldKey: "province", label: "Province", labelI18n: { ur: "صوبہ" }, fieldType: "TEXT" },
  { fieldKey: "member_id", label: "Employee / Member ID", labelI18n: { ur: "ملازم / ممبر آئی ڈی" }, fieldType: "TEXT" },
];

/** Standard family-member fields (spec section 9). */
const FAMILY_FIELDS: DefaultField[] = [
  { fieldKey: "fam_full_name", label: "Full Name", labelI18n: { ur: "پورا نام" }, fieldType: "TEXT", isRequired: true },
  { fieldKey: "fam_relationship", label: "Relationship", labelI18n: { ur: "رشتہ" }, fieldType: "DROPDOWN", valueKind: "STRUCTURED", isRequired: true, options: RELATIONSHIP_OPTIONS },
  { fieldKey: "fam_cnic_bform", label: "CNIC / B-Form", labelI18n: { ur: "شناختی کارڈ / ب فارم" }, fieldType: "TEXT", isRequired: true },
  { fieldKey: "fam_date_of_birth", label: "Date of Birth", labelI18n: { ur: "تاریخ پیدائش" }, fieldType: "DATE", isRequired: true },
  { fieldKey: "fam_gender", label: "Gender", labelI18n: { ur: "جنس" }, fieldType: "DROPDOWN", valueKind: "STRUCTURED", isRequired: true, options: GENDER_OPTIONS },
];

const DEFAULT_DOCS = [
  { code: "CNIC", subjectType: "MEMBER" as SubjectType, required: true },
  { code: "CNIC", subjectType: "FAMILY_MEMBER" as SubjectType, required: false },
  { code: "B_FORM", subjectType: "FAMILY_MEMBER" as SubjectType, required: false },
  { code: "FRC", subjectType: "MEMBER" as SubjectType, required: true },
];

async function seedFields(programmeId: string, sectionId: string, subjectType: SubjectType, fields: DefaultField[]) {
  let order = 0;
  for (const f of fields) {
    const [field] = await db
      .insert(formFields)
      .values({
        programmeId,
        sectionId,
        fieldKey: f.fieldKey,
        label: f.label,
        labelI18n: f.labelI18n,
        fieldType: f.fieldType,
        subjectType,
        valueKind: f.valueKind ?? "FREE_TEXT",
        isRequired: f.isRequired ?? false,
        validation: f.validation,
        displayOrder: order++,
        isSystem: true,
      })
      .returning();
    if (f.options?.length && field) {
      await db.insert(formFieldOptions).values(
        f.options.map((o, i) => ({
          fieldId: field.id,
          value: o.value,
          label: o.label,
          labelI18n: o.labelI18n,
          displayOrder: i,
        }))
      );
    }
  }
}

/**
 * Seeds a programme with the standard member + family sections/fields and the
 * default required documents. Runs in one transaction-like sequence.
 */
export async function seedProgrammeDefaults(programmeId: string) {
  const [memberSection] = await db
    .insert(formSections)
    .values({ programmeId, title: "Personal Information", titleI18n: { ur: "ذاتی معلومات" }, subjectType: "MEMBER", displayOrder: 0 })
    .returning();
  const [familySection] = await db
    .insert(formSections)
    .values({ programmeId, title: "Family Member", titleI18n: { ur: "خاندانی رکن" }, subjectType: "FAMILY_MEMBER", displayOrder: 1 })
    .returning();

  if (memberSection) await seedFields(programmeId, memberSection.id, "MEMBER", MEMBER_FIELDS);
  if (familySection) await seedFields(programmeId, familySection.id, "FAMILY_MEMBER", FAMILY_FIELDS);

  // Default documents (resolve document type codes to ids).
  let docOrder = 0;
  for (const d of DEFAULT_DOCS) {
    const dt = await db.query.documentTypes.findFirst({ where: eq(documentTypes.code, d.code) });
    if (!dt) continue;
    await db.insert(programmeDocuments).values({
      programmeId,
      documentTypeId: dt.id,
      subjectType: d.subjectType,
      isRequired: d.required,
      allowedFileTypes: ["jpg", "jpeg", "png", "pdf"],
      displayOrder: docOrder++,
    });
  }
}
