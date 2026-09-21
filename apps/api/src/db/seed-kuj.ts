import { eq, and } from "drizzle-orm";
import { db, pool } from "./index";
import {
  corporates,
  programmes,
  formSections,
  formFields,
  formFieldOptions,
  documentTypes,
  programmeDocuments,
  onboardingLinks,
} from "./schema/index";
import { generateSecureToken } from "../utils/security";
import { logger } from "../config/logger";
import type { FieldType, SubjectType } from "@mentor/shared";
import type { I18nText, FieldValidation } from "./schema/forms";

/**
 * Seeds the real KUJ "Health Coverage Enrollment" programme, mirroring the
 * client's Google Form 1:1 — trilingual labels (English/Urdu/Sindhi), the exact
 * member + document fields, and a single DYNAMIC family section (replacing the
 * form's fixed spouse + 5-children layout). Idempotent: skips if it already exists.
 *
 * Run: pnpm db:seed:kuj
 */

interface OptionDef {
  value: string;
  en: string;
  ur?: string;
  sd?: string;
}
interface FieldDef {
  key: string;
  en: string;
  ur?: string;
  sd?: string;
  type: FieldType;
  required?: boolean;
  structured?: boolean;
  patternKey?: FieldValidation["patternKey"];
  options?: OptionDef[];
}

const i18n = (en: string, ur?: string, sd?: string): I18nText => {
  const o: I18nText = {};
  if (ur) o.ur = ur;
  if (sd) o.sd = sd;
  return o;
};

const GENDER_OPTS: OptionDef[] = [
  { value: "FEMALE", en: "Female", ur: "عورت", sd: "عورت" },
  { value: "MALE", en: "Male", ur: "مرد", sd: "مرد" },
];

const RELATION_OPTS: OptionDef[] = [
  { value: "HUSBAND", en: "Husband", ur: "شوہر", sd: "مڙس" },
  { value: "WIFE", en: "Wife", ur: "بیوی", sd: "زال" },
  { value: "SON", en: "Son", ur: "بیٹا", sd: "پٽ" },
  { value: "DAUGHTER", en: "Daughter", ur: "بیٹی", sd: "ڌيءَ" },
  { value: "OTHER", en: "Other", ur: "دیگر", sd: "ٻيو" },
];

// Member fields — order and labels match the Google Form.
const MEMBER_FIELDS: FieldDef[] = [
  { key: "full_name", en: "Member's Name", ur: "رکن کا نام", sd: "ميمبر جو نالو", type: "TEXT", required: true },
  { key: "father_husband_name", en: "Father's Name (for singles)", ur: "والد کا نام (غیر شادی شدہ افراد کے لیے)", sd: "بيءُ جو نالو (غير شادي شده لاءِ)", type: "TEXT" },
  { key: "media_organisation", en: "Name of media organisation / Freelance", ur: "میڈیا ادارے کا نام / فری لانس", sd: "ميڊيا اداري جو نالو / فري لانس", type: "TEXT", required: true },
  { key: "gender", en: "Gender", ur: "جنس", sd: "جنس", type: "DROPDOWN", required: true, structured: true, options: GENDER_OPTS },
  { key: "cnic", en: "CNIC Number", ur: "قومی شناختی کارڈ نمبر", sd: "قومي سڃاڻپ ڪارڊ نمبر", type: "TEXT", required: true, patternKey: "CNIC" },
  { key: "date_of_birth", en: "Date of Birth", ur: "تاریخ پیدائش", sd: "ڄمڻ جي تاريخ", type: "DATE", required: true },
  { key: "frc_bform_number", en: "B-Form / FRC number", ur: "بی فارم / خاندانی رجسٹریشن سرٹیفکیٹ (FRC) نمبر", sd: "ب فارم / خانداني رجسٽريشن سرٽيفڪيٽ (FRC) نمبر", type: "TEXT" },
  { key: "address", en: "Postal (Home) address", ur: "ڈاک کا (گھر کا) پتہ", sd: "ٽپال جو (گھر جو) پتو", type: "TEXTAREA", required: true },
  { key: "email", en: "Email", ur: "ای میل", sd: "اي ميل", type: "EMAIL", required: true, patternKey: "EMAIL" },
  { key: "mobile_number", en: "Mobile Number", ur: "موبائل نمبر", sd: "موبائل نمبر", type: "PHONE", required: true, patternKey: "PAK_MOBILE" },
];

// One dynamic family section replaces the form's fixed spouse + 5 children.
const FAMILY_FIELDS: FieldDef[] = [
  { key: "fam_full_name", en: "Full Name", ur: "نام", sd: "نالو", type: "TEXT", required: true },
  { key: "fam_relationship", en: "Relationship with Member", ur: "رکن کے ساتھ رشتہ", sd: "ميمبر سان رشتو", type: "DROPDOWN", required: true, structured: true, options: RELATION_OPTS },
  { key: "fam_date_of_birth", en: "Date of Birth", ur: "تاریخ پیدائش", sd: "ڄمڻ جي تاريخ", type: "DATE", required: true },
  { key: "fam_cnic_bform", en: "CNIC / B-Form Number", ur: "شناختی کارڈ / ب فارم نمبر", sd: "سڃاڻپ ڪارڊ / ب فارم نمبر", type: "TEXT" },
];

const DOC_TYPES: { code: string; name: string; nameI18n: I18nText }[] = [
  { code: "CNIC_FRONT", name: "CNIC Picture (Front)", nameI18n: i18n("CNIC Picture (Front)", "قومی شناختی کارڈ کے سامنے والی رخ کی تصویر", "قومي سڃاڻپ ڪارڊ جي سامهون واري پاسي جي تصوير") },
  { code: "CNIC_BACK", name: "CNIC Picture (Back)", nameI18n: i18n("CNIC Picture (Back)", "قومی شناختی کارڈ کے پچھلے رخ کی تصویر", "قومي سڃاڻپ ڪارڊ جي پوئين پاسي جي تصوير") },
  { code: "MEMBER_PHOTO", name: "Current Picture of Member", nameI18n: i18n("Current Picture of Member", "رکن کی حالیہ تصویر", "ميمبر جي تازي تصوير") },
];

const ALLOWED = ["jpg", "jpeg", "png", "pdf"];
const MAX_BYTES = 15 * 1024 * 1024;

async function insertFields(programmeId: string, sectionId: string, subjectType: SubjectType, defs: FieldDef[]) {
  let order = 0;
  for (const d of defs) {
    const [field] = await db
      .insert(formFields)
      .values({
        programmeId,
        sectionId,
        fieldKey: d.key,
        label: d.en,
        labelI18n: i18n(d.en, d.ur, d.sd),
        fieldType: d.type,
        subjectType,
        valueKind: d.structured ? "STRUCTURED" : "FREE_TEXT",
        isRequired: !!d.required,
        validation: d.patternKey ? { patternKey: d.patternKey } : undefined,
        displayOrder: order++,
        isSystem: true,
      })
      .returning();
    if (d.options?.length && field) {
      await db.insert(formFieldOptions).values(
        d.options.map((o, i) => ({
          fieldId: field.id,
          value: o.value,
          label: o.en,
          labelI18n: i18n(o.en, o.ur, o.sd),
          displayOrder: i,
        }))
      );
    }
  }
}

async function main() {
  logger.info("Seeding KUJ Health Coverage programme...");

  const kuj = await db.query.corporates.findFirst({ where: eq(corporates.shortCode, "KUJ") });
  if (!kuj) {
    throw new Error("KUJ corporate not found — run `pnpm db:seed` first.");
  }

  const PROGRAMME_NAME = "KUJ Health Coverage Enrollment 2026";
  const existing = await db.query.programmes.findFirst({
    where: and(eq(programmes.corporateId, kuj.id), eq(programmes.name, PROGRAMME_NAME)),
  });
  if (existing) {
    logger.info("✔ KUJ programme already exists (%s) — skipping. Delete it to re-seed.", existing.id);
    await pool.end();
    return;
  }

  // 1. Document types
  const docTypeIds: Record<string, string> = {};
  for (const dt of DOC_TYPES) {
    let row = await db.query.documentTypes.findFirst({ where: eq(documentTypes.code, dt.code) });
    if (!row) {
      [row] = await db.insert(documentTypes).values({ code: dt.code, name: dt.name, nameI18n: dt.nameI18n, isSystem: true }).returning();
    }
    docTypeIds[dt.code] = row!.id;
  }
  for (const code of ["FRC", "B_FORM"]) {
    const row = await db.query.documentTypes.findFirst({ where: eq(documentTypes.code, code) });
    if (row) docTypeIds[code] = row.id;
  }

  // 2. Programme
  const [programme] = await db
    .insert(programmes)
    .values({
      corporateId: kuj.id,
      name: PROGRAMME_NAME,
      description: "Official enrollment for health coverage for KUJ members, media personnel and their eligible dependents.",
      status: "ACTIVE",
    })
    .returning();

  // 3. Sections + fields
  const [memberSection] = await db
    .insert(formSections)
    .values({ programmeId: programme!.id, title: "Member Information", titleI18n: i18n("Member Information", "رکن کی معلومات", "ميمبر جي ڄاڻ"), subjectType: "MEMBER", displayOrder: 0 })
    .returning();
  const [familySection] = await db
    .insert(formSections)
    .values({ programmeId: programme!.id, title: "Family Members / Dependents", titleI18n: i18n("Family Members / Dependents", "اہل خانہ / زیر کفالت", "خاندان جا ڀاتي"), subjectType: "FAMILY_MEMBER", displayOrder: 1 })
    .returning();

  await insertFields(programme!.id, memberSection!.id, "MEMBER", MEMBER_FIELDS);
  await insertFields(programme!.id, familySection!.id, "FAMILY_MEMBER", FAMILY_FIELDS);

  // 4. Required documents
  const docConfig: { code: string; subject: SubjectType; required: boolean }[] = [
    { code: "CNIC_FRONT", subject: "MEMBER", required: true },
    { code: "CNIC_BACK", subject: "MEMBER", required: true },
    { code: "MEMBER_PHOTO", subject: "MEMBER", required: true },
    { code: "FRC", subject: "MEMBER", required: false },
    { code: "B_FORM", subject: "FAMILY_MEMBER", required: false },
  ];
  let docOrder = 0;
  for (const dc of docConfig) {
    if (!docTypeIds[dc.code]) continue;
    await db.insert(programmeDocuments).values({
      programmeId: programme!.id,
      documentTypeId: docTypeIds[dc.code]!,
      subjectType: dc.subject,
      isRequired: dc.required,
      allowedFileTypes: ALLOWED,
      maxFileSizeBytes: MAX_BYTES,
      displayOrder: docOrder++,
    });
  }

  // 5. Onboarding link (active)
  const token = generateSecureToken();
  const [link] = await db
    .insert(onboardingLinks)
    .values({ programmeId: programme!.id, slug: "kuj-health-coverage-2026", token, isActive: true })
    .returning();

  logger.info("\n✅ KUJ programme seeded.");
  logger.info("   Programme: %s (%s)", PROGRAMME_NAME, programme!.id);
  logger.info("   Member fields: %d · Family fields: %d · Documents: %d", MEMBER_FIELDS.length, FAMILY_FIELDS.length, docConfig.length);
  logger.info("   Onboarding link slug: /%s", link!.slug);
  logger.info("   Public URL: <PUBLIC_APP_URL>/onboarding/%s", token);

  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, "❌ KUJ seed failed");
  await pool.end();
  process.exit(1);
});
