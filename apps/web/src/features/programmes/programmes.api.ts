import { api } from "@/lib/api";
import type {
  ApiResponse,
  ProgrammeStatus,
  CreateProgrammeInput,
  UpdateProgrammeInput,
  CreateOnboardingLinkInput,
} from "@mentor/shared";

export interface OnboardingLink {
  id: string;
  programmeId: string;
  slug: string;
  token: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface Programme {
  id: string;
  corporateId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProgrammeStatus;
  createdAt: string;
  updatedAt: string;
  corporate: { id: string; name: string; shortCode: string };
  links: OnboardingLink[];
}

export interface ListProgrammesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProgrammeStatus;
  corporateId?: string;
}

export const programmesApi = {
  list: (params: ListProgrammesParams): Promise<ApiResponse<Programme[]>> =>
    api.get<Programme[]>("/programmes", { ...params }),
  get: (id: string) => api.get<Programme>(`/programmes/${id}`),
  create: (input: CreateProgrammeInput) => api.post<Programme>("/programmes", input),
  update: (id: string, input: UpdateProgrammeInput) => api.put<Programme>(`/programmes/${id}`, input),
  createLink: (id: string, input: CreateOnboardingLinkInput) =>
    api.post<{ link: OnboardingLink; url: string }>(`/programmes/${id}/onboarding-link`, input),
  toggleLink: (linkId: string, isActive: boolean) =>
    api.put<{ link: OnboardingLink; url: string }>(`/onboarding-links/${linkId}`, { isActive }),
};
