import { z } from "zod";
import { LANGUAGES } from "../enums";

/** A single submitted field value (string, or array for checkbox groups). */
export const fieldValueInputSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.union([z.string().max(5000), z.array(z.string().max(500))]),
});
export type FieldValueInput = z.infer<typeof fieldValueInputSchema>;

export const startOnboardingSchema = z.object({
  language: z.enum(LANGUAGES).default("en"),
});
export type StartOnboardingInput = z.infer<typeof startOnboardingSchema>;

export const saveMemberSchema = z.object({
  language: z.enum(LANGUAGES).optional(),
  values: z.array(fieldValueInputSchema).default([]),
});
export type SaveMemberInput = z.infer<typeof saveMemberSchema>;

export const saveFamilyMemberSchema = z.object({
  values: z.array(fieldValueInputSchema).default([]),
});
export type SaveFamilyMemberInput = z.infer<typeof saveFamilyMemberSchema>;

export const submitOnboardingSchema = z.object({
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required to submit" }) }),
});
export type SubmitOnboardingInput = z.infer<typeof submitOnboardingSchema>;
