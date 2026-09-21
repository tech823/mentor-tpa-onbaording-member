import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/apiResponse";
import { ApiError } from "../../utils/ApiError";
import * as service from "./onboarding.service";
import type {
  StartOnboardingInput,
  SaveMemberInput,
  SaveFamilyMemberInput,
} from "@mentor/shared";

// --- public link ---
export const configController = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await service.getPublicConfig(req.params.token!));
});

export const startController = asyncHandler(async (req: Request, res: Response) => {
  const { language } = req.body as StartOnboardingInput;
  return created(res, await service.startSession(req.params.token!, language));
});

// --- session ---
export const resumeController = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await service.resume(req.params.sessionToken!));
});

export const saveMemberController = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await service.saveMember(req.params.sessionToken!, req.body as SaveMemberInput));
});

export const addFamilyController = asyncHandler(async (req: Request, res: Response) => {
  return created(res, await service.addFamilyMember(req.params.sessionToken!, req.body as SaveFamilyMemberInput));
});

export const updateFamilyController = asyncHandler(async (req: Request, res: Response) => {
  return ok(
    res,
    await service.updateFamilyMember(req.params.sessionToken!, req.params.familyId!, req.body as SaveFamilyMemberInput)
  );
});

export const deleteFamilyController = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await service.removeFamilyMember(req.params.sessionToken!, req.params.familyId!));
});

export const uploadDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest("No file uploaded");
  const { programmeDocumentId, familyMemberId } = req.body as {
    programmeDocumentId?: string;
    familyMemberId?: string;
  };
  if (!programmeDocumentId) throw ApiError.badRequest("programmeDocumentId is required");
  const doc = await service.uploadDocument(req.params.sessionToken!, programmeDocumentId, familyMemberId, file);
  return created(res, doc);
});

export const deleteDocumentController = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await service.removeDocument(req.params.sessionToken!, req.params.docId!));
});

export const submitController = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await service.submit(req.params.sessionToken!));
});
