import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formsApi } from "./forms.api";
import type {
  CreateFieldInput,
  UpdateFieldInput,
  CreateSectionInput,
  CreateProgrammeDocumentInput,
} from "@mentor/shared";

const configKey = (programmeId: string) => ["form-config", programmeId];

export function useFormConfig(programmeId: string | undefined) {
  return useQuery({
    queryKey: configKey(programmeId ?? ""),
    queryFn: () => formsApi.getConfig(programmeId!),
    enabled: !!programmeId,
  });
}

export function useDocumentTypes() {
  return useQuery({ queryKey: ["document-types"], queryFn: () => formsApi.documentTypes() });
}

/** Generic invalidation of a programme's form config after any builder mutation. */
function useConfigMutation<TVars>(fn: (v: TVars) => Promise<unknown>, programmeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: configKey(programmeId) }),
  });
}

export function useCreateField(programmeId: string) {
  return useConfigMutation((input: CreateFieldInput) => formsApi.createField(programmeId, input), programmeId);
}
export function useUpdateField(programmeId: string) {
  return useConfigMutation(
    ({ id, input }: { id: string; input: UpdateFieldInput }) => formsApi.updateField(id, input),
    programmeId
  );
}
export function useDeleteField(programmeId: string) {
  return useConfigMutation((id: string) => formsApi.deleteField(id), programmeId);
}
export function useReorderFields(programmeId: string) {
  return useConfigMutation((ids: string[]) => formsApi.reorderFields(programmeId, ids), programmeId);
}
export function useCreateSection(programmeId: string) {
  return useConfigMutation((input: CreateSectionInput) => formsApi.createSection(programmeId, input), programmeId);
}
export function useDeleteSection(programmeId: string) {
  return useConfigMutation((id: string) => formsApi.deleteSection(id), programmeId);
}
export function useCreateDocument(programmeId: string) {
  return useConfigMutation(
    (input: CreateProgrammeDocumentInput) => formsApi.createDocument(programmeId, input),
    programmeId
  );
}
export function useDeleteDocument(programmeId: string) {
  return useConfigMutation((id: string) => formsApi.deleteDocument(id), programmeId);
}
