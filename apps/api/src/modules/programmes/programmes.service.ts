import { ApiError } from "../../utils/ApiError";
import { assertCorporateAccess } from "../../middleware/auth";
import { generateSecureToken, slugify } from "../../utils/security";
import { env } from "../../config/env";
import * as repo from "./programmes.repository";
import { seedProgrammeDefaults } from "./defaults";
import type {
  AuthUser,
  CreateProgrammeInput,
  UpdateProgrammeInput,
  CreateOnboardingLinkInput,
} from "@mentor/shared";

export async function listProgrammes(
  user: AuthUser,
  params: Omit<repo.ListParams, "allowedCorporateIds">
) {
  const allowedCorporateIds = user.role === "SUPER_ADMIN" ? undefined : user.corporateIds;
  return repo.list({ ...params, allowedCorporateIds });
}

/** Fetches a programme and enforces tenant access. Reused by the forms module. */
export async function getProgrammeForUser(user: AuthUser, id: string) {
  const programme = await repo.findById(id);
  if (!programme) throw ApiError.notFound("Programme not found");
  assertCorporateAccess(user, programme.corporateId);
  return programme;
}

export async function createProgramme(user: AuthUser, input: CreateProgrammeInput) {
  assertCorporateAccess(user, input.corporateId);
  const programme = await repo.create({
    corporateId: input.corporateId,
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
  });
  if (!programme) throw ApiError.internal("Failed to create programme");
  if (input.seedDefaults) await seedProgrammeDefaults(programme.id);
  return repo.findById(programme.id);
}

export async function updateProgramme(user: AuthUser, id: string, input: UpdateProgrammeInput) {
  await getProgrammeForUser(user, id);
  await repo.update(id, input);
  return repo.findById(id);
}

/** Creates (or regenerates) the secure onboarding link for a programme. */
export async function createOnboardingLink(
  user: AuthUser,
  programmeId: string,
  input: CreateOnboardingLinkInput
) {
  const programme = await getProgrammeForUser(user, programmeId);

  let slug = input.slug ?? `${programme.corporate.shortCode}-${slugify(programme.name)}`.toLowerCase();
  slug = slug.slice(0, 120);

  // Ensure slug uniqueness by suffixing if needed.
  let candidate = slug;
  let n = 1;
  while (await repo.findLinkBySlug(candidate)) {
    candidate = `${slug}-${++n}`;
  }

  // Deactivate any existing active link (one active link per programme).
  const existing = await repo.findActiveLinkForProgramme(programmeId);
  if (existing) await repo.setLinkActive(existing.id, false);

  const link = await repo.createLink({
    programmeId,
    slug: candidate,
    token: generateSecureToken(),
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });

  return { link, url: buildOnboardingUrl(link!.token) };
}

export async function toggleOnboardingLink(user: AuthUser, linkId: string, isActive: boolean) {
  const link = await repo.findLinkById(linkId);
  if (!link) throw ApiError.notFound("Onboarding link not found");
  await getProgrammeForUser(user, link.programmeId); // access check
  const updated = await repo.setLinkActive(linkId, isActive);
  return { link: updated, url: buildOnboardingUrl(updated!.token) };
}

export function buildOnboardingUrl(token: string) {
  return `${env.PUBLIC_APP_URL.replace(/\/$/, "")}/onboarding/${token}`;
}
