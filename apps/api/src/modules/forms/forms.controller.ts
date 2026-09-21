import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/apiResponse";
import { recordAudit } from "../audit/audit.service";
import * as service from "./forms.service";
import type {
  CreateSectionInput,
  UpdateSectionInput,
  CreateFieldInput,
  UpdateFieldInput,
  ReorderInput,
  CreateProgrammeDocumentInput,
  UpdateProgrammeDocumentInput,
} from "@mentor/shared";

const auditField = (req: Request, entityId?: string, meta?: Record<string, unknown>) =>
  recordAudit(req, req.user, { action: "FORM_FIELD_CHANGED", entityType: "form", entityId, metadata: meta });

// config
export const getFormConfigController = asyncHandler(async (req: Request, res: Response) => {
  const config = await service.getFormConfig(req.user!, req.params.id!);
  return ok(res, config);
});

export const listDocumentTypesController = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await service.listDocumentTypes());
});

// sections
export const createSectionController = asyncHandler(async (req: Request, res: Response) => {
  const section = await service.createSection(req.user!, req.params.id!, req.body as CreateSectionInput);
  await auditField(req, section?.id, { kind: "section", op: "create" });
  return created(res, section);
});

export const updateSectionController = asyncHandler(async (req: Request, res: Response) => {
  const section = await service.updateSection(req.user!, req.params.id!, req.body as UpdateSectionInput);
  await auditField(req, req.params.id, { kind: "section", op: "update" });
  return ok(res, section);
});

export const deleteSectionController = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteSection(req.user!, req.params.id!);
  await auditField(req, req.params.id, { kind: "section", op: "delete" });
  return ok(res, { deleted: true });
});

// fields
export const createFieldController = asyncHandler(async (req: Request, res: Response) => {
  const field = await service.createField(req.user!, req.params.id!, req.body as CreateFieldInput);
  await auditField(req, field?.id, { kind: "field", op: "create", fieldKey: field?.fieldKey });
  return created(res, field);
});

export const updateFieldController = asyncHandler(async (req: Request, res: Response) => {
  const field = await service.updateField(req.user!, req.params.id!, req.body as UpdateFieldInput);
  await auditField(req, req.params.id, { kind: "field", op: "update" });
  return ok(res, field);
});

export const deleteFieldController = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteField(req.user!, req.params.id!);
  await auditField(req, req.params.id, { kind: "field", op: "delete" });
  return ok(res, { deleted: true });
});

export const reorderFieldsController = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as ReorderInput;
  const config = await service.reorderFields(req.user!, req.params.id!, ids);
  await auditField(req, req.params.id, { kind: "field", op: "reorder" });
  return ok(res, config);
});

// programme documents
export const createDocConfigController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await service.createDocConfig(req.user!, req.params.id!, req.body as CreateProgrammeDocumentInput);
  await auditField(req, doc?.id, { kind: "document", op: "create" });
  return created(res, doc);
});

export const updateDocConfigController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await service.updateDocConfig(req.user!, req.params.id!, req.body as UpdateProgrammeDocumentInput);
  await auditField(req, req.params.id, { kind: "document", op: "update" });
  return ok(res, doc);
});

export const deleteDocConfigController = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteDocConfig(req.user!, req.params.id!);
  await auditField(req, req.params.id, { kind: "document", op: "delete" });
  return ok(res, { deleted: true });
});
