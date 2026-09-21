import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env, isProd } from "../config/env";
import * as schema from "./schema/index";

const { Pool } = pg;

/**
 * A single pooled Postgres client. Works with Neon's pooled connection string
 * and with a local Postgres for offline dev — swap only DATABASE_URL.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes("neon.tech") || isProd ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

// All columns use explicit snake_case names in the schema definitions.
export const db = drizzle(pool, { schema });

export type Database = typeof db;
export { schema };
