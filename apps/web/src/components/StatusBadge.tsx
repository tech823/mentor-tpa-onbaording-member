import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { CorporateStatus, SubmissionStatus, DocumentVerificationStatus } from "@mentor/shared";

const corporateVariant: Record<CorporateStatus, BadgeProps["variant"]> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

export function CorporateStatusBadge({ status }: { status: CorporateStatus }) {
  return <Badge variant={corporateVariant[status]}>{status}</Badge>;
}

const submissionVariant: Record<SubmissionStatus, BadgeProps["variant"]> = {
  DRAFT: "secondary",
  IN_PROGRESS: "secondary",
  SUBMITTED: "default",
  UNDER_REVIEW: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
  COMPLETED: "success",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={submissionVariant[status]}>{status.replace(/_/g, " ")}</Badge>;
}

const docVariant: Record<DocumentVerificationStatus, BadgeProps["variant"]> = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
};

export function DocStatusBadge({ status }: { status: DocumentVerificationStatus }) {
  return <Badge variant={docVariant[status]}>{status}</Badge>;
}
