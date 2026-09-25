import { and, asc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";
import { db } from "../../db/index";
import { submissions, programmes, formFields } from "../../db/schema/index";
import type { SubmissionStatus } from "@mentor/shared";

export interface ExportFilters {
  status?: SubmissionStatus;
  statuses?: SubmissionStatus[];
  corporateId?: string;
  programmeId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  allowedCorporateIds?: string[];
}

const MAX_ROWS = 5000;

export async function fetchSubmissionIds(f: ExportFilters): Promise<string[]> {
  const c: SQL[] = [];
  if (f.allowedCorporateIds) {
    if (f.allowedCorporateIds.length === 0) return [];
    c.push(inArray(programmes.corporateId, f.allowedCorporateIds));
  }
  if (f.corporateId) c.push(eq(programmes.corporateId, f.corporateId));
  if (f.programmeId) c.push(eq(submissions.programmeId, f.programmeId));
  if (f.status) c.push(eq(submissions.status, f.status));
  if (f.statuses?.length) c.push(inArray(submissions.status, f.statuses));
  if (f.dateFrom) c.push(gte(submissions.createdAt, new Date(f.dateFrom)));
  if (f.dateTo) c.push(lte(submissions.createdAt, new Date(f.dateTo + "T23:59:59")));
  if (f.search) {
    const like = `%${f.search}%`;
    c.push(or(ilike(submissions.memberName, like), ilike(submissions.cnic, like)) as SQL);
  }
  const where = c.length ? and(...c) : undefined;

  const rows = await db
    .select({ id: submissions.id })
    .from(submissions)
    .innerJoin(programmes, eq(submissions.programmeId, programmes.id))
    .where(where)
    .orderBy(asc(submissions.createdAt))
    .limit(MAX_ROWS);
  return rows.map((r) => r.id);
}

export function fetchSubmissionsByIds(ids: string[]) {
  return db.query.submissions.findMany({
    where: inArray(submissions.id, ids),
    with: {
      programme: { with: { corporate: { columns: { name: true, shortCode: true } } } },
      fieldValues: true,
      familyMembers: { with: { fieldValues: true }, orderBy: (fm, { asc: a }) => a(fm.displayOrder) },
    },
  });
}

/** Active fields for the given programmes, to build dynamic export columns. */
export function fetchFieldsForProgrammes(programmeIds: string[]) {
  return db.query.formFields.findMany({
    where: and(inArray(formFields.programmeId, programmeIds), eq(formFields.isActive, true)),
    orderBy: asc(formFields.displayOrder),
  });
}
