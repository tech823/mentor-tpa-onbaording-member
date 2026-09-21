import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";

/** audit_logs — records important admin actions (spec section 20). */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    userEmail: varchar("user_email", { length: 255 }),
    action: varchar("action", { length: 60 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }),
    entityId: varchar("entity_id", { length: 64 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 300 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("audit_logs_user_idx").on(t.userId),
    actionIdx: index("audit_logs_action_idx").on(t.action),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt),
  })
);

/** email_logs — record of transactional emails (spec section 21). */
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    toEmail: varchar("to_email", { length: 255 }).notNull(),
    template: varchar("template", { length: 80 }).notNull(),
    subject: varchar("subject", { length: 255 }),
    providerId: varchar("provider_id", { length: 120 }),
    success: boolean("success").notNull().default(false),
    error: text("error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    toIdx: index("email_logs_to_idx").on(t.toEmail),
    createdAtIdx: index("email_logs_created_at_idx").on(t.createdAt),
  })
);
