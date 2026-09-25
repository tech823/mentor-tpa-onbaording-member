import { z } from "zod";
import { paginationQuerySchema, SUBMISSION_STATUS } from "@mentor/shared";

export const listSubmissionsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(SUBMISSION_STATUS).optional(),
  /** Comma-separated statuses (e.g. "SUBMITTED,UNDER_REVIEW") for bucket filters. */
  statuses: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? (v
            .split(",")
            .map((s) => s.trim())
            .filter((s): s is (typeof SUBMISSION_STATUS)[number] => (SUBMISSION_STATUS as readonly string[]).includes(s)))
        : undefined
    ),
  corporateId: z.string().uuid().optional(),
  programmeId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
