import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, paginated, buildPaginationMeta } from "../../utils/apiResponse";
import { recordAudit } from "../audit/audit.service";
import * as service from "./programmes.service";
import type { ListProgrammesQuery } from "./programmes.validators";
import type {
  CreateProgrammeInput,
  UpdateProgrammeInput,
  CreateOnboardingLinkInput,
  ToggleOnboardingLinkInput,
} from "@mentor/shared";

export const listController = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListProgrammesQuery;
  const { rows, total } = await service.listProgrammes(req.user!, {
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    status: q.status,
    corporateId: q.corporateId,
    sortBy: q.sortBy,
    sortDir: q.sortDir,
  });
  return paginated(res, rows, buildPaginationMeta(q.page, q.pageSize, total));
});

export const getController = asyncHandler(async (req: Request, res: Response) => {
  const programme = await service.getProgrammeForUser(req.user!, req.params.id!);
  return ok(res, programme);
});

export const createController = asyncHandler(async (req: Request, res: Response) => {
  const programme = await service.createProgramme(req.user!, req.body as CreateProgrammeInput);
  await recordAudit(req, req.user, {
    action: "PROGRAMME_CREATED",
    entityType: "programme",
    entityId: programme?.id,
    metadata: { name: programme?.name },
  });
  return created(res, programme);
});

export const updateController = asyncHandler(async (req: Request, res: Response) => {
  const programme = await service.updateProgramme(req.user!, req.params.id!, req.body as UpdateProgrammeInput);
  await recordAudit(req, req.user, {
    action: "PROGRAMME_UPDATED",
    entityType: "programme",
    entityId: req.params.id,
  });
  return ok(res, programme);
});

export const createLinkController = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.createOnboardingLink(
    req.user!,
    req.params.id!,
    req.body as CreateOnboardingLinkInput
  );
  await recordAudit(req, req.user, {
    action: "ONBOARDING_LINK_CHANGED",
    entityType: "programme",
    entityId: req.params.id,
    metadata: { action: "created", slug: result.link?.slug },
  });
  return created(res, result);
});

export const toggleLinkController = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as ToggleOnboardingLinkInput;
  const result = await service.toggleOnboardingLink(req.user!, req.params.linkId!, isActive);
  await recordAudit(req, req.user, {
    action: "ONBOARDING_LINK_CHANGED",
    entityType: "onboarding_link",
    entityId: req.params.linkId,
    metadata: { isActive },
  });
  return ok(res, result);
});
