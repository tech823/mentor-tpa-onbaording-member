import { and, asc, eq, sql } from "drizzle-orm";
import { db, pool } from "./index";
import { corporates, programmes, formFields } from "./schema/index";
import { logger } from "../config/logger";

/**
 * One-off: adds the "GMR No" (General Member Registration number) member field
 * to every KUJ programme. Idempotent — safe to run repeatedly.
 * Run: pnpm --filter @mentor/api exec tsx src/db/add-gmr-field.ts
 */
const FIELD_KEY = "gmr_no";

async function main() {
  const kuj = await db.query.corporates.findFirst({ where: eq(corporates.shortCode, "KUJ") });
  if (!kuj) throw new Error("KUJ corporate not found");

  const kujProgrammes = await db.query.programmes.findMany({
    where: eq(programmes.corporateId, kuj.id),
  });
  if (kujProgrammes.length === 0) {
    logger.warn("No programmes found for KUJ — nothing to do.");
    await pool.end();
    return;
  }

  for (const prog of kujProgrammes) {
    const existing = await db.query.formFields.findFirst({
      where: and(eq(formFields.programmeId, prog.id), eq(formFields.fieldKey, FIELD_KEY)),
    });
    if (existing) {
      logger.info('  ✔ "%s" already has GMR No — skipped', prog.name);
      continue;
    }

    const orderRows = await db
      .select({ max: sql<number>`coalesce(max(${formFields.displayOrder}), -1)::int` })
      .from(formFields)
      .where(eq(formFields.programmeId, prog.id));
    const max = orderRows[0]?.max ?? -1;

    await db.insert(formFields).values({
      programmeId: prog.id,
      fieldKey: FIELD_KEY,
      label: "GMR No",
      labelI18n: { en: "GMR No", ur: "جی ایم آر نمبر" },
      fieldType: "TEXT",
      subjectType: "MEMBER",
      valueKind: "FREE_TEXT",
      isRequired: false, // optional so it never blocks a submission
      helpText: "General Member Registration number",
      helpTextI18n: { en: "General Member Registration number" },
      displayOrder: max + 1,
      isActive: true,
      isSystem: false,
    });
    logger.info('  ➕ Added "GMR No" to programme: %s', prog.name);
  }

  // Show the resulting member fields for confirmation.
  for (const prog of kujProgrammes) {
    const fields = await db.query.formFields.findMany({
      where: and(eq(formFields.programmeId, prog.id), eq(formFields.subjectType, "MEMBER")),
      orderBy: asc(formFields.displayOrder),
      columns: { label: true, fieldKey: true, isRequired: true, isActive: true },
    });
    logger.info("Member fields for %s:", prog.name);
    for (const f of fields) {
      logger.info("   - %s (%s)%s%s", f.label, f.fieldKey, f.isRequired ? " *required" : "", f.isActive ? "" : " [hidden]");
    }
  }

  logger.info("\n✅ Done.");
  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, "❌ add-gmr-field failed");
  await pool.end();
  process.exit(1);
});
