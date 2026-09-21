import { pgTable, uuid, varchar, text, timestamp, boolean, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { programmeStatusEnum } from "./enums";
import { corporates } from "./corporates";

/** programmes — an onboarding programme under a corporate (spec section 6). */
export const programmes = pgTable(
  "programmes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    corporateId: uuid("corporate_id")
      .notNull()
      .references(() => corporates.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    status: programmeStatusEnum("status").notNull().default("DRAFT"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    corporateIdx: index("programmes_corporate_idx").on(t.corporateId),
    statusIdx: index("programmes_status_idx").on(t.status),
  })
);

/**
 * onboarding_links — one active secure link per programme (spec section 6 / 19).
 * `slug` is human-readable (kuj-employee-health-2026); `token` is the
 * non-guessable secret embedded in the public URL.
 */
export const onboardingLinks = pgTable(
  "onboarding_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    programmeIdx: index("onboarding_links_programme_idx").on(t.programmeId),
    tokenIdx: index("onboarding_links_token_idx").on(t.token),
  })
);

export const programmesRelations = relations(programmes, ({ one, many }) => ({
  corporate: one(corporates, {
    fields: [programmes.corporateId],
    references: [corporates.id],
  }),
  links: many(onboardingLinks),
}));

export const onboardingLinksRelations = relations(onboardingLinks, ({ one }) => ({
  programme: one(programmes, {
    fields: [onboardingLinks.programmeId],
    references: [programmes.id],
  }),
}));
