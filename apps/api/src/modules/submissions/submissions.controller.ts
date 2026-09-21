import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, paginated, buildPaginationMeta } from "../../utils/apiResponse";
import { recordAudit } from "../audit/audit.service";
import * as service from "./submissions.service";
import type { UpdateSubmissionStatusInput } from "@mentor/shared";
import type { ListSubmissionsQuery } from "./submissions.validators";

export const listController = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListSubmissionsQuery;
  const { rows, total } = await service.listSubmissions(req.user!, {
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    status: q.status,
    corporateId: q.corporateId,
    programmeId: q.programmeId,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    sortBy: q.sortBy,
    sortDir: q.sortDir,
  });
  return paginated(res, rows, buildPaginationMeta(q.page, q.pageSize, total));
});

export const getController = asyncHandler(async (req: Request, res: Response) => {
  const detail = await service.getSubmission(req.user!, req.params.id!);
  await recordAudit(req, req.user, { action: "SUBMISSION_VIEWED", entityType: "submission", entityId: req.params.id });
  return ok(res, detail);
});

export const updateStatusController = asyncHandler(async (req: Request, res: Response) => {
  const { status, reviewNotes } = req.body as UpdateSubmissionStatusInput;
  const detail = await service.updateStatus(req.user!, req.params.id!, status, reviewNotes);
  await recordAudit(req, req.user, {
    action: "SUBMISSION_STATUS_CHANGED",
    entityType: "submission",
    entityId: req.params.id,
    metadata: { status },
  });
  return ok(res, detail);
});
