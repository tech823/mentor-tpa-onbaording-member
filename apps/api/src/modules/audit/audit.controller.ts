import type { Request, Response } from "express";
import { desc, ilike, and, eq, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index";
import { auditLogs } from "../../db/schema/index";
import { asyncHandler } from "../../utils/asyncHandler";
import { paginated, buildPaginationMeta } from "../../utils/apiResponse";
import type { PaginationQuery } from "@mentor/shared";

export const listAuditController = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as PaginationQuery & { action?: string };
  const conds: SQL[] = [];
  if (q.action) conds.push(eq(auditLogs.action, q.action));
  if (q.search) conds.push(ilike(auditLogs.userEmail, `%${q.search}%`));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(q.pageSize)
    .offset((q.page - 1) * q.pageSize);

  const [{ count }] = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(where)) as [{ count: number }];

  return paginated(res, rows, buildPaginationMeta(q.page, q.pageSize, count ?? 0));
});
