import { Router } from "express";
import { and, desc, eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index";
import { submissions, programmes, corporates } from "../../db/schema/index";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { requireAuth } from "../../middleware/auth";
import { SUBMISSION_STATUS } from "@mentor/shared";

const router = Router();
router.use(requireAuth);

/** Aggregated dashboard metrics + chart series (tenant-scoped). */
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const allowed = user.role === "SUPER_ADMIN" ? undefined : user.corporateIds;
    const scope: SQL | undefined = allowed ? inArray(programmes.corporateId, allowed) : undefined;

    if (allowed && allowed.length === 0) {
      return ok(res, emptyStats());
    }

    // Status breakdown
    const statusRows = await db
      .select({ status: submissions.status, count: sql<number>`count(*)::int` })
      .from(submissions)
      .innerJoin(programmes, eq(submissions.programmeId, programmes.id))
      .where(scope)
      .groupBy(submissions.status);
    const byStatus: Record<string, number> = {};
    for (const s of SUBMISSION_STATUS) byStatus[s] = 0;
    for (const r of statusRows) byStatus[r.status] = r.count;
    const totalSubmissions = statusRows.reduce((a, r) => a + r.count, 0);

    // Submissions per day (last 14 days)
    const since = new Date(Date.now() - 13 * 86_400_000);
    const perDayRows = await db
      .select({ day: sql<string>`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`, count: sql<number>`count(*)::int` })
      .from(submissions)
      .innerJoin(programmes, eq(submissions.programmeId, programmes.id))
      .where(scope ? and(scope, gte(submissions.createdAt, since)) : gte(submissions.createdAt, since))
      .groupBy(sql`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`);
    const perDayMap = new Map(perDayRows.map((r) => [r.day, r.count]));
    const perDay: { date: string; count: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10);
      perDay.push({ date: d, count: perDayMap.get(d) ?? 0 });
    }

    // By corporate (top 6)
    const byCorporate = await db
      .select({ name: corporates.name, count: sql<number>`count(*)::int` })
      .from(submissions)
      .innerJoin(programmes, eq(submissions.programmeId, programmes.id))
      .innerJoin(corporates, eq(programmes.corporateId, corporates.id))
      .where(scope)
      .groupBy(corporates.name)
      .orderBy(desc(sql`count(*)`))
      .limit(6);

    // Totals
    const corpCount = allowed
      ? allowed.length
      : (await db.select({ c: sql<number>`count(*)::int` }).from(corporates))[0]?.c ?? 0;
    const activeProgRows = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(programmes)
      .where(scope ? and(scope, eq(programmes.status, "ACTIVE")) : eq(programmes.status, "ACTIVE"));

    return ok(res, {
      totals: {
        corporates: corpCount,
        activeProgrammes: activeProgRows[0]?.c ?? 0,
        totalSubmissions,
        pending: byStatus.SUBMITTED! + byStatus.UNDER_REVIEW! + byStatus.IN_PROGRESS!,
        verified: byStatus.VERIFIED! + byStatus.COMPLETED!,
        rejected: byStatus.REJECTED!,
      },
      byStatus,
      perDay,
      byCorporate,
    });
  })
);

function emptyStats() {
  const byStatus: Record<string, number> = {};
  for (const s of SUBMISSION_STATUS) byStatus[s] = 0;
  const since = new Date(Date.now() - 13 * 86_400_000);
  const perDay = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10),
    count: 0,
  }));
  return {
    totals: { corporates: 0, activeProgrammes: 0, totalSubmissions: 0, pending: 0, verified: 0, rejected: 0 },
    byStatus,
    perDay,
    byCorporate: [] as { name: string; count: number }[],
  };
}

export default router;
