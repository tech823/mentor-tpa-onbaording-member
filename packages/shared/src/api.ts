/** Consistent API response envelope used by every endpoint (spec section 25). */

export interface ApiError {
  code: string;
  message: string;
  /** Field-level validation issues, keyed by field path. */
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: import("./enums").Role;
  /** Corporate IDs this user is scoped to (empty for SUPER_ADMIN = all). */
  corporateIds: string[];
}
