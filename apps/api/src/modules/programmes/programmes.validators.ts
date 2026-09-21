import { z } from "zod";
import { paginationQuerySchema, PROGRAMME_STATUS } from "@mentor/shared";

export const listProgrammesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PROGRAMME_STATUS).optional(),
  corporateId: z.string().uuid().optional(),
});
export type ListProgrammesQuery = z.infer<typeof listProgrammesQuerySchema>;
