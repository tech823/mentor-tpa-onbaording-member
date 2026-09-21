import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { corporateStatusEnum } from "./enums";
import { programmes } from "./programmes";
import { userCorporates } from "./auth";

/** corporates — corporate clients such as KUJ (spec section 5). */
export const corporates = pgTable(
  "corporates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
    contactPerson: varchar("contact_person", { length: 150 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 30 }),
    address: text("address"),
    logoUrl: varchar("logo_url", { length: 500 }),
    status: corporateStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    shortCodeIdx: index("corporates_short_code_idx").on(t.shortCode),
    statusIdx: index("corporates_status_idx").on(t.status),
  })
);

export const corporatesRelations = relations(corporates, ({ many }) => ({
  programmes: many(programmes),
  users: many(userCorporates),
}));
