import { and, desc, asc, eq, ilike, or, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index";
import { corporates } from "../../db/schema/index";
import type { CreateCorporateInput, UpdateCorporateInput, CorporateStatus } from "@mentor/shared";

export interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: CorporateStatus;
  sortBy?: string;
  sortDir: "asc" | "desc";
  /** Restrict to these corporate IDs; undefined = no restriction (SUPER_ADMIN). */
  allowedIds?: string[];
}

const SORTABLE = {
  name: corporates.name,
  shortCode: corporates.shortCode,
  status: corporates.status,
  createdAt: corporates.createdAt,
} as const;

export async function list(params: ListParams) {
  const conditions: SQL[] = [];

  if (params.allowedIds) {
    if (params.allowedIds.length === 0) return { rows: [], total: 0 };
    conditions.push(inArray(corporates.id, params.allowedIds));
  }
  if (params.status) conditions.push(eq(corporates.status, params.status));
  if (params.search) {
    const like = `%${params.search}%`;
    conditions.push(
      or(ilike(corporates.name, like), ilike(corporates.shortCode, like)) as SQL
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const sortCol = SORTABLE[(params.sortBy as keyof typeof SORTABLE) ?? "createdAt"] ?? corporates.createdAt;
  const orderBy = params.sortDir === "asc" ? asc(sortCol) : desc(sortCol);

  const rows = await db
    .select()
    .from(corporates)
    .where(where)
    .orderBy(orderBy)
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(corporates)
    .where(where);

  return { rows, total: countResult[0]?.count ?? 0 };
}

export function findById(id: string) {
  return db.query.corporates.findFirst({ where: eq(corporates.id, id) });
}

export function findByShortCode(shortCode: string) {
  return db.query.corporates.findFirst({ where: eq(corporates.shortCode, shortCode) });
}

export async function create(input: CreateCorporateInput) {
  const [row] = await db.insert(corporates).values(input).returning();
  return row;
}

export async function update(id: string, input: UpdateCorporateInput) {
  const [row] = await db
    .update(corporates)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(corporates.id, id))
    .returning();
  return row;
}
