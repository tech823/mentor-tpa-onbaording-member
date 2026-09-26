import { api, ApiRequestError } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import type { Language, FieldValueInput } from "@mentor/shared";
import type { FormField, ProgrammeDocument } from "@/features/forms/forms.api";

export interface OnboardingConfig {
  programme: {
    id: string;
    name: string;
    description: string | null;
    corporate: { name: string; shortCode: string };
  };
  fields: FormField[];
  documents: ProgrammeDocument[];
}

export interface SubmissionFieldValue {
  id: string;
  fieldId: string;
  fieldKey: string;
  originalValue: string | null;
  standardizedValue: string | null;
  language: Language;
}

export interface UploadedDocument {
  id: string;
  documentTypeId: string;
  familyMemberId: string | null;
  subjectType: "MEMBER" | "FAMILY_MEMBER";
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface FamilyMemberState {
  id: string;
  fullName: string | null;
  relationship: string | null;
  cnic: string | null;
  displayOrder: number;
  fieldValues: SubmissionFieldValue[];
}

export interface SubmissionState {
  id: string;
  status: string;
  memberName: string | null;
  cnic: string | null;
  email: string | null;
  language: Language;
  submittedAt: string | null;
  fieldValues: SubmissionFieldValue[];
  familyMembers: FamilyMemberState[];
  documents: UploadedDocument[];
}

export interface ResumeResponse {
  session: { language: Language };
  submission: SubmissionState;
  fields: FormField[];
  documents: ProgrammeDocument[];
}

/** Uploads a document via multipart. Not JSON, so it bypasses the api helper. */
async function uploadDocument(
  sessionToken: string,
  form: FormData
): Promise<UploadedDocument> {
  const res = await fetch(`${API_BASE}/onboarding/session/${sessionToken}/documents`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  // A reverse proxy (nginx/Apache) may reject an oversized upload with 413 and a
  // non-JSON body — surface a clear "too large" message instead of a JSON parse error.
  if (res.status === 413) {
    throw new ApiRequestError(413, {
      code: "FILE_TOO_LARGE",
      message: "This file is too large to upload. Please upload a smaller file.",
    });
  }
  let json: { success?: boolean; data?: UploadedDocument; error?: { code: string; message: string } };
  try {
    json = await res.json();
  } catch {
    throw new ApiRequestError(res.status, {
      code: "UPLOAD_FAILED",
      message: res.status >= 500 ? "Server error while uploading. Please try again." : "Upload failed. Please try again.",
    });
  }
  if (!res.ok || !json.success) {
    throw new ApiRequestError(res.status, json.error ?? { code: "UPLOAD_FAILED", message: "Upload failed" });
  }
  return json.data as UploadedDocument;
}

export const onboardingApi = {
  getConfig: (token: string) => api.get<OnboardingConfig>(`/onboarding/link/${token}/config`),
  start: (token: string, language: Language) =>
    api.post<{ sessionToken: string; submissionId: string; expiresAt: string }>(
      `/onboarding/link/${token}/start`,
      { language }
    ),
  resume: (sessionToken: string) => api.get<ResumeResponse>(`/onboarding/session/${sessionToken}`),
  saveMember: (sessionToken: string, values: FieldValueInput[], language: Language) =>
    api.put<SubmissionState>(`/onboarding/session/${sessionToken}/member`, { values, language }),
  addFamily: (sessionToken: string, values: FieldValueInput[]) =>
    api.post<SubmissionState>(`/onboarding/session/${sessionToken}/family`, { values }),
  updateFamily: (sessionToken: string, familyId: string, values: FieldValueInput[]) =>
    api.put<SubmissionState>(`/onboarding/session/${sessionToken}/family/${familyId}`, { values }),
  removeFamily: (sessionToken: string, familyId: string) =>
    api.del<SubmissionState>(`/onboarding/session/${sessionToken}/family/${familyId}`),
  uploadDocument,
  removeDocument: (sessionToken: string, docId: string) =>
    api.del(`/onboarding/session/${sessionToken}/documents/${docId}`),
  submit: (sessionToken: string) =>
    api.post<{ id: string; status: string; submittedAt: string }>(
      `/onboarding/session/${sessionToken}/submit`,
      { consent: true }
    ),
};
