import { z } from "zod";
import { paginationQuerySchema, SUBMISSION_STATUS } from "@mentor/shared";

export const listSubmissionsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(SUBMISSION_STATUS).optional(),
  corporateId: z.string().uuid().optional(),
  programmeId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
