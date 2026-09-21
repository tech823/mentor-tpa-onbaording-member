import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import { logger } from "../config/logger";

/** Applies pending SQL migrations from ./drizzle. Run: pnpm db:migrate */
async function main() {
  logger.info("Running database migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  logger.info("✅ Migrations complete");
  await pool.end();
}

main().catch((err) => {
  logger.error({ err }, "❌ Migration failed");
  process.exit(1);
});
