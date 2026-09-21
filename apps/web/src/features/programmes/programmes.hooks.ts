import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { programmesApi, type ListProgrammesParams } from "./programmes.api";
import type {
  CreateProgrammeInput,
  UpdateProgrammeInput,
  CreateOnboardingLinkInput,
} from "@mentor/shared";

const KEY = "programmes";

export function useProgrammes(params: ListProgrammesParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => programmesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProgramme(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => programmesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateProgramme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProgrammeInput) => programmesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateProgramme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProgrammeInput }) =>
      programmesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateOnboardingLinkInput }) =>
      programmesApi.createLink(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useToggleLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId, isActive }: { linkId: string; isActive: boolean }) =>
      programmesApi.toggleLink(linkId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
