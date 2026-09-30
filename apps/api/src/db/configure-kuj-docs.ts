import { and, eq } from "drizzle-orm";
import { db, pool } from "./index";
import { corporates, programmes, documentTypes, programmeDocuments } from "./schema/index";
import { logger } from "../config/logger";
import type { I18nText } from "./schema/forms";

/**
 * Configures KUJ's dependent-document verification flow (client spec):
 *   - Spouse (Husband/Wife) → CNIC (required)
 *   - Child (Son/Daughter)  → ANY ONE of B-Form / Birth Certificate / FRC
 *   - No dependents of a type → nothing asked (flexible, never blocks)
 *
 * The "which document applies to whom / any-one-of" logic lives in the app
 * (by document CODE). This script only ensures the document TYPES and the
 * programme's FAMILY document rows exist. Idempotent — safe to run repeatedly.
 *
 * Run:  pnpm --filter @mentor/api exec tsx src/db/configure-kuj-docs.ts
 */
const FILE_TYPES = ["jpg", "jpeg", "png", "pdf"];
const MAX = 15 * 1024 * 1024;

const i18n = (en: string, ur: string, sd: string): I18nText => ({ en, ur, sd });

async function ensureDocType(code: string, name: string, nameI18n: I18nText) {
  const existing = await db.query.documentTypes.findFirst({ where: eq(documentTypes.code, code) });
  if (existing) return existing;
  const [row] = await db
    .insert(documentTypes)
    .values({ code, name, nameI18n, isSystem: true })
    .returning();
  logger.info("  + document type: %s", code);
  return row!;
}

async function ensureFamilyDoc(
  programmeId: string,
  documentTypeId: string,
  opts: { required: boolean; order: number }
) {
  const existing = await db.query.programmeDocuments.findFirst({
    where: and(
      eq(programmeDocuments.programmeId, programmeId),
      eq(programmeDocuments.documentTypeId, documentTypeId),
      eq(programmeDocuments.subjectType, "FAMILY_MEMBER")
    ),
  });
  if (existing) {
    await db
      .update(programmeDocuments)
      .set({ isRequired: opts.required, isActive: true, displayOrder: opts.order })
      .where(eq(programmeDocuments.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(programmeDocuments)
    .values({
      programmeId,
      documentTypeId,
      subjectType: "FAMILY_MEMBER",
      isRequired: opts.required,
      allowedFileTypes: FILE_TYPES,
      maxFileSizeBytes: MAX,
      displayOrder: opts.order,
      isActive: true,
    })
    .returning();
  return row!.id;
}

async function main() {
  logger.info("Configuring KUJ dependent documents...");

  const kuj = await db.query.corporates.findFirst({ where: eq(corporates.shortCode, "KUJ") });
  if (!kuj) throw new Error("KUJ corporate not found");
  const programme = await db.query.programmes.findFirst({ where: eq(programmes.corporateId, kuj.id) });
  if (!programme) throw new Error("KUJ programme not found");

  // 1) Document types
  const depCnic = await ensureDocType(
    "DEPENDENT_CNIC",
    "CNIC",
    i18n("CNIC", "شناختی کارڈ", "سڃاڻپ ڪارڊ")
  );
  const birthCert = await ensureDocType(
    "BIRTH_CERTIFICATE",
    "Birth Certificate",
    i18n("Birth Certificate", "پیدائش کا سرٹیفکیٹ", "ڄمڻ جو سرٽيفڪيٽ")
  );
  const frc = await db.query.documentTypes.findFirst({ where: eq(documentTypes.code, "FRC") });
  const bForm = await db.query.documentTypes.findFirst({ where: eq(documentTypes.code, "B_FORM") });
  if (!frc || !bForm) throw new Error("FRC / B_FORM document types missing (run seed first)");
  logger.info("✔ Document types ready");

  // 2) Family document rows
  //    Spouse → CNIC (required). Child → B-Form / Birth Cert / FRC (any one; not
  //    individually required — the app enforces "at least one" for children).
  await ensureFamilyDoc(programme.id, depCnic.id, { required: true, order: 10 });
  await ensureFamilyDoc(programme.id, bForm.id, { required: false, order: 11 });
  await ensureFamilyDoc(programme.id, birthCert.id, { required: false, order: 12 });
  await ensureFamilyDoc(programme.id, frc.id, { required: false, order: 13 });
  logger.info("✔ Family documents ready (spouse CNIC; child B-Form/Birth-Cert/FRC)");

  // 3) The member-level FRC is redundant now (member verifies via CNIC) — hide it.
  const memberFrc = await db.query.programmeDocuments.findFirst({
    where: and(
      eq(programmeDocuments.programmeId, programme.id),
      eq(programmeDocuments.documentTypeId, frc.id),
      eq(programmeDocuments.subjectType, "MEMBER")
    ),
  });
  if (memberFrc) {
    await db.update(programmeDocuments).set({ isActive: false }).where(eq(programmeDocuments.id, memberFrc.id));
    logger.info("✔ Member-level FRC hidden");
  }

  logger.info("\n✅ KUJ dependent documents configured.");
  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, "❌ configure-kuj-docs failed");
  await pool.end();
  process.exit(1);
});
