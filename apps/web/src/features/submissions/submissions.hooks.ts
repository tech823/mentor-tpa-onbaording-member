import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { submissionsApi, type ListSubmissionsParams } from "./submissions.api";
import type { SubmissionStatus, DocumentVerificationStatus } from "@mentor/shared";

const KEY = "submissions";

export function useSubmissions(params: ListSubmissionsParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => submissionsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSubmission(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => submissionsApi.get(id!),
    enabled: !!id,
  });
}

export function useUpdateSubmissionStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, reviewNotes }: { status: SubmissionStatus; reviewNotes?: string }) =>
      submissionsApi.updateStatus(id, status, reviewNotes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "detail", id] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useVerifyDocument(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, status, notes }: { docId: string; status: DocumentVerificationStatus; notes?: string }) =>
      submissionsApi.verifyDocument(docId, status, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, "detail", submissionId] }),
  });
}
