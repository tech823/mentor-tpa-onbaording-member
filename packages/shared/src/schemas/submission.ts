import { z } from "zod";
import { SUBMISSION_STATUS, DOCUMENT_VERIFICATION_STATUS } from "../enums";

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(SUBMISSION_STATUS),
  reviewNotes: z.string().trim().max(2000).optional(),
});
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;

export const verifyDocumentSchema = z.object({
  status: z.enum(DOCUMENT_VERIFICATION_STATUS),
  notes: z.string().trim().max(1000).optional(),
});
export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
