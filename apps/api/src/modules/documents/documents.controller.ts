import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { recordAudit } from "../audit/audit.service";
import * as service from "./documents.service";
import type { VerifyDocumentInput } from "@mentor/shared";

export const verifyController = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body as VerifyDocumentInput;
  const doc = await service.verifyDocument(req.user!, req.params.id!, status, notes);
  await recordAudit(req, req.user, {
    action: status === "REJECTED" ? "DOCUMENT_REJECTED" : "DOCUMENT_VERIFIED",
    entityType: "document",
    entityId: req.params.id,
    metadata: { status },
  });
  return ok(res, doc);
});

export const downloadController = asyncHandler(async (req: Request, res: Response) => {
  const { stream, mimeType, fileName } = await service.getForDownload(req.user!, req.params.id!);
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
  stream.on("error", () => {
    if (!res.headersSent) res.status(404).json({ success: false, data: null, error: { code: "NOT_FOUND", message: "File not found" } });
  });
  stream.pipe(res);
});
