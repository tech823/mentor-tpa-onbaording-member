import { z } from "zod";
import { ROLES } from "../enums";

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(150),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
    role: z.enum(ROLES),
    /** Corporates this user may access (required for ADMIN / CORPORATE_ADMIN). */
    corporateIds: z.array(z.string().uuid()).default([]),
  })
  .refine((v) => v.role === "SUPER_ADMIN" || v.corporateIds.length > 0, {
    message: "Assign at least one corporate for ADMIN / CORPORATE_ADMIN users",
    path: ["corporateIds"],
  });
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Edit an existing user's name, role and corporate access (no email/password here). */
export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(150),
    role: z.enum(ROLES),
    corporateIds: z.array(z.string().uuid()).default([]),
  })
  .refine((v) => v.role === "SUPER_ADMIN" || v.corporateIds.length > 0, {
    message: "Assign at least one corporate for ADMIN / CORPORATE_ADMIN users",
    path: ["corporateIds"],
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const toggleUserActiveSchema = z.object({ isActive: z.boolean() });
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;

/** Admin-set password reset (no email) — admin types or auto-generates the password. */
export const resetUserPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
