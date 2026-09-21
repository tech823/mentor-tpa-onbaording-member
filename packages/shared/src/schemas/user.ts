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

export const toggleUserActiveSchema = z.object({ isActive: z.boolean() });
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;
