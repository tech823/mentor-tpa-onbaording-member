import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { recordAudit } from "../audit/audit.service";
import { buildSubmissionsWorkbook } from "./exports.service";
import type { ListSubmissionsQuery } from "../submissions/submissions.validators";

export const exportSubmissionsController = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListSubmissionsQuery;
  const { buffer, filename, count } = await buildSubmissionsWorkbook(req.user!, {
    status: q.status,
    statuses: q.statuses,
    corporateId: q.corporateId,
    programmeId: q.programmeId,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    search: q.search,
  });
  await recordAudit(req, req.user, { action: "EXPORT_GENERATED", entityType: "submission", metadata: { count } });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});
