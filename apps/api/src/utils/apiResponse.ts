import type { Response } from "express";
import type { ApiResponse, PaginationMeta } from "@mentor/shared";

/** Sends the standard success envelope (spec section 25). */
export function ok<T>(res: Response, data: T, status = 200, meta?: ApiResponse<T>["meta"]) {
  const body: ApiResponse<T> = { success: true, data, error: null };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

export function paginated<T>(res: Response, data: T[], meta: PaginationMeta) {
  const body: ApiResponse<T[]> = { success: true, data, error: null, meta };
  return res.status(200).json(body);
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
