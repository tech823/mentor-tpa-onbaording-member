import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "../../db/index";
import {
  formSections,
  formFields,
  formFieldOptions,
  programmeDocuments,
  documentTypes,
} from "../../db/schema/index";

// ---------- aggregate form config ----------
export async function getFormConfig(programmeId: string) {
  const sections = await db.query.formSections.findMany({
    where: eq(formSections.programmeId, programmeId),
    orderBy: asc(formSections.displayOrder),
  });
  const fields = await db.query.formFields.findMany({
    where: eq(formFields.programmeId, programmeId),
    orderBy: asc(formFields.displayOrder),
    with: { options: { orderBy: asc(formFieldOptions.displayOrder) } },
  });
  const documents = await db.query.programmeDocuments.findMany({
    where: eq(programmeDocuments.programmeId, programmeId),
    orderBy: asc(programmeDocuments.displayOrder),
    with: { documentType: true },
  });
  return { sections, fields, documents };
}

// ---------- sections ----------
export function findSectionById(id: string) {
  return db.query.formSections.findFirst({ where: eq(formSections.id, id) });
}

export async function createSection(
  programmeId: string,
  data: Omit<typeof formSections.$inferInsert, "programmeId">
) {
  const [row] = await db.insert(formSections).values({ ...data, programmeId }).returning();
  return row;
}

export async function updateSection(id: string, data: Partial<typeof formSections.$inferInsert>) {
  const [row] = await db
    .update(formSections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(formSections.id, id))
    .returning();
  return row;
}

export async function deleteSection(id: string) {
  await db.delete(formSections).where(eq(formSections.id, id));
}

// ---------- fields ----------
export function findFieldById(id: string) {
  return db.query.formFields.findFirst({
    where: eq(formFields.id, id),
    with: { options: true },
  });
}

export async function fieldKeyExists(programmeId: string, fieldKey: string, exceptId?: string) {
  const conds = [eq(formFields.programmeId, programmeId), eq(formFields.fieldKey, fieldKey)];
  if (exceptId) conds.push(ne(formFields.id, exceptId));
  const row = await db.query.formFields.findFirst({ where: and(...conds) });
  return !!row;
}

export async function nextFieldOrder(programmeId: string) {
  const [r] = await db
    .select({ max: sql<number>`coalesce(max(${formFields.displayOrder}), -1)::int` })
    .from(formFields)
    .where(eq(formFields.programmeId, programmeId));
  return (r?.max ?? -1) + 1;
}

export async function createField(
  data: typeof formFields.$inferInsert,
  options: (typeof formFieldOptions.$inferInsert)[]
) {
  return db.transaction(async (tx) => {
    const [field] = await tx.insert(formFields).values(data).returning();
    if (options.length && field) {
      await tx.insert(formFieldOptions).values(options.map((o) => ({ ...o, fieldId: field.id })));
    }
    return field;
  });
}

export async function updateField(
  id: string,
  data: Partial<typeof formFields.$inferInsert>,
  options?: (typeof formFieldOptions.$inferInsert)[]
) {
  return db.transaction(async (tx) => {
    const [field] = await tx
      .update(formFields)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(formFields.id, id))
      .returning();
    if (options) {
      // Replace-all strategy keeps the options endpoint simple for the builder UI.
      await tx.delete(formFieldOptions).where(eq(formFieldOptions.fieldId, id));
      if (options.length) {
        await tx.insert(formFieldOptions).values(options.map((o) => ({ ...o, fieldId: id })));
      }
    }
    return field;
  });
}

export async function deleteField(id: string) {
  await db.delete(formFields).where(eq(formFields.id, id));
}

export async function reorderFields(programmeId: string, ids: string[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(formFields)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(and(eq(formFields.id, ids[i]!), eq(formFields.programmeId, programmeId)));
    }
  });
}

// ---------- programme documents ----------
export function findDocConfigById(id: string) {
  return db.query.programmeDocuments.findFirst({ where: eq(programmeDocuments.id, id) });
}

export function documentTypeExists(id: string) {
  return db.query.documentTypes.findFirst({ where: eq(documentTypes.id, id) });
}

export async function createDocConfig(
  programmeId: string,
  data: Omit<typeof programmeDocuments.$inferInsert, "programmeId">
) {
  const [row] = await db.insert(programmeDocuments).values({ ...data, programmeId }).returning();
  return row;
}

export async function updateDocConfig(id: string, data: Partial<typeof programmeDocuments.$inferInsert>) {
  const [row] = await db.update(programmeDocuments).set(data).where(eq(programmeDocuments.id, id)).returning();
  return row;
}

export async function deleteDocConfig(id: string) {
  await db.delete(programmeDocuments).where(eq(programmeDocuments.id, id));
}

export function listDocumentTypes() {
  return db.query.documentTypes.findMany({ orderBy: asc(documentTypes.name) });
}
