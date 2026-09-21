import { z } from "zod";

/** Pakistani CNIC: 13 digits, optionally formatted 00000-0000000-0. */
export const cnicRegex = /^\d{5}-?\d{7}-?\d{1}$/;

/** Pakistani mobile number (e.g. 03001234567 or +923001234567). */
export const pakMobileRegex = /^(\+92|0)?3\d{9}$/;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().trim().max(60).optional(),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const idParamSchema = z.object({ id: z.string().uuid() });
