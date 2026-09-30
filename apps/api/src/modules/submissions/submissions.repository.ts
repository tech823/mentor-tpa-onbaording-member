import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index";
import { submissions, programmes, corporates, familyMembers, uploadedDocuments, onboardingSessions } from "../../db/schema/index";
import type { SubmissionStatus } from "@mentor/shared";

export interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: SubmissionStatus;
  statuses?: SubmissionStatus[];
  corporateId?: string;
  programmeId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir: "asc" | "desc";
  allowedCorporateIds?: string[];
}

const SORTABLE = {
  memberName: submissions.memberName,
  status: submissions.status,
  submittedAt: submissions.submittedAt,
  createdAt: submissions.createdAt,
} as const;

function buildWhere(p: ListParams): SQL | undefined {
  const c: SQL[] = [];
  if (p.allowedCorporateIds) {
    if (p.allowedCorporateIds.length === 0) return sql`false`;
    c.push(inArray(programmes.corporateId, p.allowedCorporateIds));
  }
  if (p.corporateId) c.push(eq(programmes.corporateId, p.corporateId));
  if (p.programmeId) c.push(eq(submissions.programmeId, p.programmeId));
  if (p.status) c.push(eq(submissions.status, p.status));
  if (p.statuses?.length) c.push(inArray(submissions.status, p.statuses));
  if (p.dateFrom) c.push(gte(submissions.createdAt, new Date(p.dateFrom)));
  if (p.dateTo) c.push(lte(submissions.createdAt, new Date(p.dateTo + "T23:59:59")));
  if (p.search) {
    const like = `%${p.search}%`;
    c.push(or(ilike(submissions.memberName, like), ilike(submissions.cnic, like), ilike(submissions.email, like)) as SQL);
  }
  return c.length ? and(...c) : undefined;
}

export async function list(p: ListParams) {
  const where = buildWhere(p);
  const sortCol = SORTABLE[(p.sortBy as keyof typeof SORTABLE) ?? "createdAt"] ?? submissions.createdAt;
  const orderBy = p.sortDir === "asc" ? asc(sortCol) : desc(sortCol);

  const rows = await db
    .select({
      id: submissions.id,
      memberName: submissions.memberName,
      cnic: submissions.cnic,
      email: submissions.email,
      status: submissions.status,
      language: submissions.language,
      submittedAt: submissions.submittedAt,
      createdAt: submissions.createdAt,
      programmeId: submissions.programmeId,
      programmeName: programmes.name,
      corporateId: programmes.corporateId,
      corporateName: corporates.name,
    })
    .from(submissions)
    .innerJoin(programmes, eq(submissions.programmeId, programmes.id))
    .innerJoin(corporates, eq(programmes.corporateId, corporates.id))
    .where(where)
    .orderBy(orderBy)
    .limit(p.pageSize)
    .offset((p.page - 1) * p.pageSize);

  const [{ count }] = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)
    .innerJoin(programmes, eq(submissions.programmeId, programmes.id))
    .where(where)) as [{ count: number }];

  // Aggregate family + document counts for this page.
  const ids = rows.map((r) => r.id);
  const famCounts = new Map<string, number>();
  const docCounts = new Map<string, { total: number; verified: number; rejected: number; pending: number }>();
  if (ids.length) {
    const fam = await db
      .select({ submissionId: familyMembers.submissionId, count: sql<number>`count(*)::int` })
      .from(familyMembers)
      .where(inArray(familyMembers.submissionId, ids))
      .groupBy(familyMembers.submissionId);
    for (const f of fam) famCounts.set(f.submissionId, f.count);

    const docs = await db
      .select({
        submissionId: uploadedDocuments.submissionId,
        status: uploadedDocuments.verificationStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(uploadedDocuments)
      .where(inArray(uploadedDocuments.submissionId, ids))
      .groupBy(uploadedDocuments.submissionId, uploadedDocuments.verificationStatus);
    for (const d of docs) {
      const cur = docCounts.get(d.submissionId) ?? { total: 0, verified: 0, rejected: 0, pending: 0 };
      cur.total += d.count;
      if (d.status === "VERIFIED") cur.verified += d.count;
      else if (d.status === "REJECTED") cur.rejected += d.count;
      else cur.pending += d.count;
      docCounts.set(d.submissionId, cur);
    }
  }

  const enriched = rows.map((r) => ({
    ...r,
    familyCount: famCounts.get(r.id) ?? 0,
    documents: docCounts.get(r.id) ?? { total: 0, verified: 0, rejected: 0, pending: 0 },
  }));

  return { rows: enriched, total: count ?? 0 };
}

export function findDetail(id: string) {
  return db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: {
      programme: { with: { corporate: true } },
      fieldValues: true,
      familyMembers: { with: { fieldValues: true } },
      documents: { with: { documentType: true } },
    },
  });
}

export function findMeta(id: string) {
  return db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: { programme: { columns: { corporateId: true } } },
  });
}

/** Storage keys of all files attached to a submission (for file cleanup on delete). */
export async function findStorageKeys(id: string): Promise<string[]> {
  const rows = await db
    .select({ storageKey: uploadedDocuments.storageKey })
    .from(uploadedDocuments)
    .where(eq(uploadedDocuments.submissionId, id));
  return rows.map((r) => r.storageKey);
}

/** Deletes a submission (cascades to field values, family, documents) and its session. */
export async function deleteSubmission(id: string) {
  const sub = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    columns: { sessionId: true },
  });
  await db.delete(submissions).where(eq(submissions.id, id));
  if (sub?.sessionId) await db.delete(onboardingSessions).where(eq(onboardingSessions.id, sub.sessionId));
}

export async function updateStatus(
  id: string,
  status: SubmissionStatus,
  reviewedByUserId: string,
  reviewNotes?: string
) {
  const [row] = await db
    .update(submissions)
    .set({ status, reviewedByUserId, reviewNotes, updatedAt: new Date() })
    .where(eq(submissions.id, id))
    .returning();
  return row;
}
