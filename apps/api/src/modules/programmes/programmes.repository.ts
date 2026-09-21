import { and, asc, desc, eq, ilike, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index";
import { programmes, onboardingLinks } from "../../db/schema/index";
import type { ProgrammeStatus } from "@mentor/shared";

export interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProgrammeStatus;
  corporateId?: string;
  sortBy?: string;
  sortDir: "asc" | "desc";
  allowedCorporateIds?: string[];
}

const SORTABLE = {
  name: programmes.name,
  status: programmes.status,
  startDate: programmes.startDate,
  createdAt: programmes.createdAt,
} as const;

export async function list(params: ListParams) {
  const conditions: SQL[] = [];

  if (params.allowedCorporateIds) {
    if (params.allowedCorporateIds.length === 0) return { rows: [], total: 0 };
    conditions.push(inArray(programmes.corporateId, params.allowedCorporateIds));
  }
  if (params.corporateId) conditions.push(eq(programmes.corporateId, params.corporateId));
  if (params.status) conditions.push(eq(programmes.status, params.status));
  if (params.search) conditions.push(ilike(programmes.name, `%${params.search}%`));

  const where = conditions.length ? and(...conditions) : undefined;
  const sortCol = SORTABLE[(params.sortBy as keyof typeof SORTABLE) ?? "createdAt"] ?? programmes.createdAt;
  const orderBy = params.sortDir === "asc" ? asc(sortCol) : desc(sortCol);

  const rows = await db.query.programmes.findMany({
    where,
    orderBy,
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
    with: {
      corporate: { columns: { id: true, name: true, shortCode: true } },
      links: { columns: { id: true, slug: true, token: true, isActive: true } },
    },
  });

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(programmes)
    .where(where);

  return { rows, total: countResult[0]?.count ?? 0 };
}

export function findById(id: string) {
  return db.query.programmes.findFirst({
    where: eq(programmes.id, id),
    with: {
      corporate: { columns: { id: true, name: true, shortCode: true } },
      links: true,
    },
  });
}

export async function create(input: {
  corporateId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: ProgrammeStatus;
}) {
  const [row] = await db.insert(programmes).values(input).returning();
  return row;
}

export async function update(
  id: string,
  input: Partial<{ name: string; description: string; startDate: string; endDate: string; status: ProgrammeStatus }>
) {
  const [row] = await db
    .update(programmes)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(programmes.id, id))
    .returning();
  return row;
}

// --- onboarding links ---
export function findLinkBySlug(slug: string) {
  return db.query.onboardingLinks.findFirst({ where: eq(onboardingLinks.slug, slug) });
}

export function findActiveLinkForProgramme(programmeId: string) {
  return db.query.onboardingLinks.findFirst({
    where: and(eq(onboardingLinks.programmeId, programmeId), eq(onboardingLinks.isActive, true)),
  });
}

export async function createLink(input: {
  programmeId: string;
  slug: string;
  token: string;
  expiresAt?: Date | null;
}) {
  const [row] = await db.insert(onboardingLinks).values(input).returning();
  return row;
}

export async function setLinkActive(id: string, isActive: boolean) {
  const [row] = await db
    .update(onboardingLinks)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(onboardingLinks.id, id))
    .returning();
  return row;
}

export function findLinkById(id: string) {
  return db.query.onboardingLinks.findFirst({ where: eq(onboardingLinks.id, id) });
}
