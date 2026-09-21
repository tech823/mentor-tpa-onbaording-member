import { api } from "@/lib/api";
import type { ApiResponse, SubmissionStatus, DocumentVerificationStatus, Language } from "@mentor/shared";

export interface SubmissionListRow {
  id: string;
  memberName: string | null;
  cnic: string | null;
  email: string | null;
  status: SubmissionStatus;
  language: Language;
  submittedAt: string | null;
  createdAt: string;
  programmeId: string;
  programmeName: string;
  corporateId: string;
  corporateName: string;
  familyCount: number;
  documents: { total: number; verified: number; rejected: number; pending: number };
}

export interface DetailFieldValue {
  id: string;
  fieldId: string;
  fieldKey: string;
  originalValue: string | null;
  standardizedValue: string | null;
  language: Language;
}
export interface DetailFamily {
  id: string;
  fullName: string | null;
  relationship: string | null;
  cnic: string | null;
  fieldValues: DetailFieldValue[];
}
export interface DetailDocument {
  id: string;
  documentTypeId: string;
  familyMemberId: string | null;
  subjectType: "MEMBER" | "FAMILY_MEMBER";
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  verificationStatus: DocumentVerificationStatus;
  verificationNotes: string | null;
  uploadedAt: string;
  documentType: { id: string; code: string; name: string };
}
export interface SubmissionDetail {
  id: string;
  memberName: string | null;
  cnic: string | null;
  email: string | null;
  status: SubmissionStatus;
  language: Language;
  submittedAt: string | null;
  createdAt: string;
  reviewNotes: string | null;
  programme: { id: string; name: string; corporate: { id: string; name: string; shortCode: string } };
  fieldValues: DetailFieldValue[];
  familyMembers: DetailFamily[];
  documents: DetailDocument[];
}

export interface ListSubmissionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SubmissionStatus;
  corporateId?: string;
  programmeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const submissionsApi = {
  list: (params: ListSubmissionsParams): Promise<ApiResponse<SubmissionListRow[]>> =>
    api.get<SubmissionListRow[]>("/submissions", { ...params }),
  get: (id: string) => api.get<SubmissionDetail>(`/submissions/${id}`),
  updateStatus: (id: string, status: SubmissionStatus, reviewNotes?: string) =>
    api.put<SubmissionDetail>(`/submissions/${id}/status`, { status, reviewNotes }),
  verifyDocument: (docId: string, status: DocumentVerificationStatus, notes?: string) =>
    api.put<DetailDocument>(`/documents/${docId}/verification`, { status, notes }),
  downloadUrl: (docId: string) => `/api/documents/${docId}/download`,
  exportUrl: (params: ListSubmissionsParams) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && qs.set(k, String(v)));
    return `/api/exports/submissions?${qs.toString()}`;
  },
};
