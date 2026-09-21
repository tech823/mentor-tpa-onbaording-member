import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import { users, corporates, userCorporates, documentTypes } from "./schema/index";
import { hashPassword } from "../utils/security";
import { logger } from "../config/logger";
import { DEFAULT_DOCUMENT_TYPES } from "@mentor/shared";

/**
 * Development seed data (spec section 28: realistic seed only, no fake features).
 * Idempotent — safe to run repeatedly.
 */
const DEV_PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe123!";

const DOC_TYPE_NAMES: Record<string, string> = {
  CNIC: "CNIC",
  B_FORM: "B-Form",
  FRC: "Family Registration Certificate (FRC)",
  PASSPORT: "Passport",
  OTHER: "Other Document",
};

async function upsertUser(email: string, fullName: string, role: "SUPER_ADMIN" | "ADMIN" | "CORPORATE_ADMIN") {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing;
  const passwordHash = await hashPassword(DEV_PASSWORD);
  const [row] = await db.insert(users).values({ email, fullName, role, passwordHash }).returning();
  return row!;
}

async function main() {
  logger.info("Seeding database...");

  // 1. Document type catalogue
  for (const code of DEFAULT_DOCUMENT_TYPES) {
    const existing = await db.query.documentTypes.findFirst({ where: eq(documentTypes.code, code) });
    if (!existing) {
      await db.insert(documentTypes).values({
        code,
        name: DOC_TYPE_NAMES[code] ?? code,
        isSystem: true,
      });
    }
  }
  logger.info("✔ Document types ready");

  // 2. Users
  const superAdmin = await upsertUser("superadmin@mentortpa.com", "Super Admin", "SUPER_ADMIN");
  const admin = await upsertUser("admin@mentortpa.com", "Platform Admin", "ADMIN");
  const corporateAdmin = await upsertUser("kuj.admin@mentortpa.com", "KUJ Coordinator", "CORPORATE_ADMIN");
  logger.info("✔ Users ready");

  // 3. Corporate client: Karachi Union of Journalists
  let kuj = await db.query.corporates.findFirst({ where: eq(corporates.shortCode, "KUJ") });
  if (!kuj) {
    [kuj] = await db
      .insert(corporates)
      .values({
        name: "Karachi Union of Journalists",
        shortCode: "KUJ",
        contactPerson: "KUJ Secretariat",
        contactEmail: "contact@kuj.example",
        contactPhone: "03001234567",
        address: "Karachi Press Club, Karachi, Pakistan",
        status: "ACTIVE",
      })
      .returning();
  }
  logger.info("✔ Corporate (KUJ) ready");

  // 4. Assign the ADMIN and CORPORATE_ADMIN to KUJ (tenant scoping)
  for (const u of [admin, corporateAdmin]) {
    const existing = await db.query.userCorporates.findFirst({
      where: (uc, { and }) => and(eq(uc.userId, u.id), eq(uc.corporateId, kuj!.id)),
    });
    if (!existing) {
      await db.insert(userCorporates).values({ userId: u.id, corporateId: kuj!.id });
    }
  }
  logger.info("✔ User-corporate assignments ready");

  logger.info("\n✅ Seed complete. Dev login accounts (password: %s):", DEV_PASSWORD);
  logger.info("   SUPER_ADMIN      → %s", superAdmin.email);
  logger.info("   ADMIN            → %s", admin.email);
  logger.info("   CORPORATE_ADMIN  → %s", corporateAdmin.email);

  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, "❌ Seed failed");
  await pool.end();
  process.exit(1);
});
