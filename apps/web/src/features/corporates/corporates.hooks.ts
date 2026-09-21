import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { corporatesApi, type ListCorporatesParams } from "./corporates.api";
import type { CreateCorporateInput, UpdateCorporateInput } from "@mentor/shared";

const KEY = "corporates";

export function useCorporates(params: ListCorporatesParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => corporatesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCorporate(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => corporatesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateCorporate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCorporateInput) => corporatesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCorporate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCorporateInput }) =>
      corporatesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
