import ExcelJS from "exceljs";
import * as repo from "./exports.repository";
import type { AuthUser } from "@mentor/shared";

interface Col {
  key: string;
  header: string;
}

const englishValue = (fv?: { standardizedValue: string | null; originalValue: string | null }) =>
  fv ? fv.standardizedValue ?? fv.originalValue ?? "" : "";

/**
 * Builds an Excel workbook of submissions with DYNAMIC columns (spec section 15):
 * static columns + one column per member field + family fields, flattened to one
 * row per family member. Values are English-standardized for bulk upload.
 */
export async function buildSubmissionsWorkbook(user: AuthUser, filters: Omit<repo.ExportFilters, "allowedCorporateIds">) {
  const allowedCorporateIds = user.role === "SUPER_ADMIN" ? undefined : user.corporateIds;
  const ids = await repo.fetchSubmissionIds({ ...filters, allowedCorporateIds });
  const subs = ids.length ? await repo.fetchSubmissionsByIds(ids) : [];

  const programmeIds = [...new Set(subs.map((s) => s.programmeId))];
  const fields = programmeIds.length ? await repo.fetchFieldsForProgrammes(programmeIds) : [];

  // Build ordered, de-duplicated dynamic columns.
  const memberCols: Col[] = [];
  const familyCols: Col[] = [];
  const seenMember = new Set<string>();
  const seenFamily = new Set<string>();
  for (const f of fields) {
    if (f.subjectType === "MEMBER") {
      if (seenMember.has(f.fieldKey)) continue;
      seenMember.add(f.fieldKey);
      memberCols.push({ key: `m_${f.fieldKey}`, header: f.label });
    } else {
      if (seenFamily.has(f.fieldKey)) continue;
      seenFamily.add(f.fieldKey);
      familyCols.push({ key: `f_${f.fieldKey}`, header: `Family: ${f.label}` });
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Mentor TPA";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Submissions");

  ws.columns = [
    { key: "corporate", header: "Corporate", width: 24 },
    { key: "programme", header: "Programme", width: 26 },
    { key: "status", header: "Submission Status", width: 16 },
    { key: "submittedAt", header: "Submitted Date", width: 18 },
    ...memberCols.map((c) => ({ key: c.key, header: c.header, width: 20 })),
    { key: "relationship", header: "Relationship", width: 16 },
    ...familyCols.map((c) => ({ key: c.key, header: c.header, width: 20 })),
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };

  for (const s of subs) {
    // 1) The primary member (e.g. father) gets his OWN row — his details appear
    //    exactly once (relationship = SELF), family columns left blank.
    const memberMap = new Map(s.fieldValues.map((v) => [v.fieldKey, v]));
    const memberRow: Record<string, string> = {
      corporate: s.programme.corporate.name,
      programme: s.programme.name,
      status: s.status,
      submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString().slice(0, 10) : "",
      relationship: "SELF",
    };
    for (const c of memberCols) memberRow[c.key] = englishValue(memberMap.get(c.key.slice(2)));
    ws.addRow(memberRow);

    // 2) Each family member is a separate row; the member/context columns stay
    //    blank so the father's name is never repeated.
    for (const fam of s.familyMembers) {
      const famMap = new Map(fam.fieldValues.map((v) => [v.fieldKey, v]));
      const row: Record<string, string> = { relationship: fam.relationship ?? "" };
      for (const c of familyCols) row[c.key] = englishValue(famMap.get(c.key.slice(2)));
      ws.addRow(row);
    }
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const filename = `submissions-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return { buffer, filename, count: subs.length };
}
