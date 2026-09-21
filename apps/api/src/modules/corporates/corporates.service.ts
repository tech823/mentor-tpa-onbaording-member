import { ApiError } from "../../utils/ApiError";
import { assertCorporateAccess } from "../../middleware/auth";
import * as repo from "./corporates.repository";
import type { AuthUser, CreateCorporateInput, UpdateCorporateInput } from "@mentor/shared";

export async function listCorporates(user: AuthUser, params: Omit<repo.ListParams, "allowedIds">) {
  const allowedIds = user.role === "SUPER_ADMIN" ? undefined : user.corporateIds;
  return repo.list({ ...params, allowedIds });
}

export async function getCorporate(user: AuthUser, id: string) {
  const corporate = await repo.findById(id);
  if (!corporate) throw ApiError.notFound("Corporate client not found");
  assertCorporateAccess(user, corporate.id);
  return corporate;
}

export async function createCorporate(input: CreateCorporateInput) {
  const existing = await repo.findByShortCode(input.shortCode);
  if (existing) throw ApiError.conflict(`Short code "${input.shortCode}" is already in use`);
  return repo.create(input);
}

export async function updateCorporate(user: AuthUser, id: string, input: UpdateCorporateInput) {
  const corporate = await repo.findById(id);
  if (!corporate) throw ApiError.notFound("Corporate client not found");
  assertCorporateAccess(user, corporate.id);

  if (input.shortCode && input.shortCode !== corporate.shortCode) {
    const clash = await repo.findByShortCode(input.shortCode);
    if (clash) throw ApiError.conflict(`Short code "${input.shortCode}" is already in use`);
  }
  return repo.update(id, input);
}
