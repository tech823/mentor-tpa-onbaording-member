import { z } from "zod";
import { CORPORATE_STATUS } from "../enums";
import { pakMobileRegex } from "./common";

export const createCorporateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  /** Short code, e.g. "KUJ". Uppercased, alphanumeric + dashes. */
  shortCode: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Only letters, numbers and dashes")
    .transform((v) => v.toUpperCase()),
  contactPerson: z.string().trim().max(150).optional(),
  contactEmail: z.string().trim().toLowerCase().email().optional(),
  contactPhone: z
    .string()
    .trim()
    .regex(pakMobileRegex, "Invalid Pakistani mobile number")
    .optional(),
  address: z.string().trim().max(500).optional(),
  status: z.enum(CORPORATE_STATUS).default("ACTIVE"),
  logoUrl: z.string().url().max(500).optional(),
});
export type CreateCorporateInput = z.infer<typeof createCorporateSchema>;

export const updateCorporateSchema = createCorporateSchema.partial();
export type UpdateCorporateInput = z.infer<typeof updateCorporateSchema>;
