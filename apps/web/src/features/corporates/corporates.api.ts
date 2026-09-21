import { api } from "@/lib/api";
import type {
  ApiResponse,
  CorporateStatus,
  CreateCorporateInput,
  UpdateCorporateInput,
} from "@mentor/shared";

export interface Corporate {
  id: string;
  name: string;
  shortCode: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  logoUrl: string | null;
  status: CorporateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListCorporatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CorporateStatus;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const corporatesApi = {
  list: (params: ListCorporatesParams): Promise<ApiResponse<Corporate[]>> =>
    api.get<Corporate[]>("/corporates", {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    }),
  get: (id: string) => api.get<Corporate>(`/corporates/${id}`),
  create: (input: CreateCorporateInput) => api.post<Corporate>("/corporates", input),
  update: (id: string, input: UpdateCorporateInput) => api.put<Corporate>(`/corporates/${id}`, input),
};
