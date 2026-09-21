import { z } from "zod";
import { paginationQuerySchema, CORPORATE_STATUS } from "@mentor/shared";

export const listCorporatesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(CORPORATE_STATUS).optional(),
});
export type ListCorporatesQuery = z.infer<typeof listCorporatesQuerySchema>;
