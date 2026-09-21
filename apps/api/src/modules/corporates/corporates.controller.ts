import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, paginated, buildPaginationMeta } from "../../utils/apiResponse";
import { ApiError } from "../../utils/ApiError";
import { recordAudit } from "../audit/audit.service";
import * as service from "./corporates.service";
import type { ListCorporatesQuery } from "./corporates.validators";
import type { CreateCorporateInput, UpdateCorporateInput } from "@mentor/shared";

export const listController = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListCorporatesQuery;
  const { rows, total } = await service.listCorporates(req.user!, {
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    status: q.status,
    sortBy: q.sortBy,
    sortDir: q.sortDir,
  });
  return paginated(res, rows, buildPaginationMeta(q.page, q.pageSize, total));
});

export const getController = asyncHandler(async (req: Request, res: Response) => {
  const corporate = await service.getCorporate(req.user!, req.params.id!);
  return ok(res, corporate);
});

export const createController = asyncHandler(async (req: Request, res: Response) => {
  const corporate = await service.createCorporate(req.body as CreateCorporateInput);
  if (!corporate) throw ApiError.internal("Failed to create corporate client");
  await recordAudit(req, req.user, {
    action: "CORPORATE_CREATED",
    entityType: "corporate",
    entityId: corporate.id,
    metadata: { name: corporate.name, shortCode: corporate.shortCode },
  });
  return created(res, corporate);
});

export const updateController = asyncHandler(async (req: Request, res: Response) => {
  const corporate = await service.updateCorporate(
    req.user!,
    req.params.id!,
    req.body as UpdateCorporateInput
  );
  await recordAudit(req, req.user, {
    action: "CORPORATE_UPDATED",
    entityType: "corporate",
    entityId: req.params.id,
  });
  return ok(res, corporate);
});
