import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardStats {
  totals: {
    corporates: number;
    activeProgrammes: number;
    totalSubmissions: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  byStatus: Record<string, number>;
  perDay: { date: string; count: number }[];
  byCorporate: { name: string; count: number }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get<DashboardStats>("/dashboard/stats"),
    staleTime: 60_000,
  });
}
