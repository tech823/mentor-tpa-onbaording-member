import { z } from "zod";
import { PROGRAMME_STATUS } from "../enums";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .optional();

export const createProgrammeSchema = z.object({
  corporateId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  startDate: dateStr,
  endDate: dateStr,
  status: z.enum(PROGRAMME_STATUS).default("DRAFT"),
  /** When true, seed the standard member fields + default documents (spec §8/10). */
  seedDefaults: z.boolean().default(true),
});
export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;

export const updateProgrammeSchema = createProgrammeSchema
  .omit({ corporateId: true, seedDefaults: true })
  .partial();
export type UpdateProgrammeInput = z.infer<typeof updateProgrammeSchema>;

export const createOnboardingLinkSchema = z.object({
  /** Optional custom slug; auto-generated from programme name if omitted. */
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only")
    .optional(),
  expiresAt: z.string().datetime().optional(),
});
export type CreateOnboardingLinkInput = z.infer<typeof createOnboardingLinkSchema>;

export const toggleOnboardingLinkSchema = z.object({ isActive: z.boolean() });
export type ToggleOnboardingLinkInput = z.infer<typeof toggleOnboardingLinkSchema>;
