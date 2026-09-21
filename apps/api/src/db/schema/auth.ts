import { pgTable, uuid, varchar, boolean, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { roleEnum } from "./enums";
import { corporates } from "./corporates";

/**
 * users — admin-plane accounts (spec section 4).
 * Public onboarding members are NOT users; they use session tokens instead.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    role: roleEnum("role").notNull().default("ADMIN"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  })
);

/**
 * user_corporates — many-to-many assignment of ADMIN / CORPORATE_ADMIN users
 * to the corporate clients they may access (tenant isolation, spec section 4).
 * SUPER_ADMIN needs no rows here (implicit access to all).
 */
export const userCorporates = pgTable(
  "user_corporates",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    corporateId: uuid("corporate_id")
      .notNull()
      .references(() => corporates.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.corporateId] }),
    corporateIdx: index("user_corporates_corporate_idx").on(t.corporateId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  corporates: many(userCorporates),
}));

export const userCorporatesRelations = relations(userCorporates, ({ one }) => ({
  user: one(users, { fields: [userCorporates.userId], references: [users.id] }),
  corporate: one(corporates, {
    fields: [userCorporates.corporateId],
    references: [corporates.id],
  }),
}));
