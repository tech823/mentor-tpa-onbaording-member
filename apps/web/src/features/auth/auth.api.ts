import { api } from "@/lib/api";
import type { AuthUser, LoginInput } from "@mentor/shared";

export const authApi = {
  me: () => api.get<{ user: AuthUser }>("/auth/me"),
  login: (input: LoginInput) => api.post<{ user: AuthUser }>("/auth/login", input),
  logout: () => api.post<{ message: string }>("/auth/logout"),
};
