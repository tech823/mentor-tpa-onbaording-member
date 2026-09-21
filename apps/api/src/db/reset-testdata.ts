import { rm } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import {
  onboardingSessions,
  auditLogs,
  emailLogs,
  users,
  userCorporates,
  corporates,
} from "./schema/index";
import { hashPassword } from "../utils/security";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Clears all test/mock DATA (submissions, sessions, uploaded documents, logs) and
 * resets admin accounts to Mentor TPA branding — WITHOUT touching the setup
 * (corporates, programmes, form fields, document config). For a clean manual test.
 *
 * Run: pnpm db:reset
 */
const PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe123!";

async function main() {
  logger.info("Resetting test data...");

  // 1. Delete onboarding sessions → cascades to submissions, field values,
  //    family members, and uploaded_documents rows.
  await db.delete(onboardingSessions);
  logger.info("✔ Cleared submissions / sessions / documents (DB)");

  // 2. Delete uploaded files from disk.
  const storageDir = path.resolve(env.STORAGE_LOCAL_DIR, "submissions");
  await rm(storageDir, { recursive: true, force: true }).catch(() => undefined);
  logger.info("✔ Cleared uploaded files (disk)");

  // 3. Clear logs.
  await db.delete(auditLogs);
  await db.delete(emailLogs);
  logger.info("✔ Cleared audit + email logs");

  // 4. Reset admin users to Mentor TPA branding.
  await db.delete(userCorporates);
  await db.delete(users);
  const passwordHash = await hashPassword(PASSWORD);
  const [superAdmin] = await db
    .insert(users)
    .values({ email: "superadmin@mentortpa.com", fullName: "Mentor TPA Super Admin", role: "SUPER_ADMIN", passwordHash })
    .returning();
  const [admin] = await db
    .insert(users)
    .values({ email: "admin@mentortpa.com", fullName: "Mentor TPA Admin", role: "ADMIN", passwordHash })
    .returning();
  const [corpAdmin] = await db
    .insert(users)
    .values({ email: "kuj.admin@mentortpa.com", fullName: "KUJ Coordinator", role: "CORPORATE_ADMIN", passwordHash })
    .returning();

  // Reassign ADMIN + CORPORATE_ADMIN to the existing KUJ corporate (if present).
  const kuj = await db.query.corporates.findFirst({ where: eq(corporates.shortCode, "KUJ") });
  if (kuj) {
    for (const u of [admin, corpAdmin]) {
      if (u) await db.insert(userCorporates).values({ userId: u.id, corporateId: kuj.id });
    }
  }
  logger.info("✔ Admin accounts reset to Mentor TPA");

  logger.info("\n✅ Reset complete. Clean data. Login accounts (password: %s):", PASSWORD);
  logger.info("   SUPER_ADMIN      → superadmin@mentortpa.com");
  logger.info("   ADMIN            → admin@mentortpa.com");
  logger.info("   CORPORATE_ADMIN  → kuj.admin@mentortpa.com");
  logger.info("   (Corporates, programmes and form config are kept intact.)");

  if (superAdmin) logger.info("   super admin id: %s", superAdmin.id);
  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, "❌ Reset failed");
  await pool.end();
  process.exit(1);
});
