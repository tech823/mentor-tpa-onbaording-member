import { ApiError } from "../../utils/ApiError";
import { assertCorporateAccess } from "../../middleware/auth";
import * as repo from "./submissions.repository";
import type { AuthUser, SubmissionStatus } from "@mentor/shared";

export async function listSubmissions(user: AuthUser, params: Omit<repo.ListParams, "allowedCorporateIds">) {
  const allowedCorporateIds = user.role === "SUPER_ADMIN" ? undefined : user.corporateIds;
  return repo.list({ ...params, allowedCorporateIds });
}

export async function getSubmission(user: AuthUser, id: string) {
  const detail = await repo.findDetail(id);
  if (!detail) throw ApiError.notFound("Submission not found");
  assertCorporateAccess(user, detail.programme.corporateId);
  return detail;
}

export async function updateStatus(
  user: AuthUser,
  id: string,
  status: SubmissionStatus,
  reviewNotes?: string
) {
  const meta = await repo.findMeta(id);
  if (!meta) throw ApiError.notFound("Submission not found");
  assertCorporateAccess(user, meta.programme.corporateId);
  await repo.updateStatus(id, status, user.id, reviewNotes);
  return repo.findDetail(id);
}
