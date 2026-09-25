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

/**
 * Submission statuses are collapsed into four clear, member-facing buckets so
 * admins never see confusing internal states (IN_PROGRESS vs UNDER_REVIEW etc.).
 */
type Bucket = { label: string; dot: string; text: string; bg: string };
const SUBMISSION_BUCKET: Record<SubmissionStatus, Bucket> = {
  DRAFT: { label: "In Process", dot: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50" },
  IN_PROGRESS: { label: "In Process", dot: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50" },
  SUBMITTED: { label: "Under Review", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  UNDER_REVIEW: { label: "Under Review", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  VERIFIED: { label: "Accepted", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  COMPLETED: { label: "Accepted", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  REJECTED: { label: "Rejected", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

/** The user-facing label for a raw submission status (used in text too). */
export function submissionStatusLabel(status: SubmissionStatus) {
  return SUBMISSION_BUCKET[status].label;
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const b = SUBMISSION_BUCKET[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${b.bg} ${b.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
      {b.label}
    </span>
  );
}

const docVariant: Record<DocumentVerificationStatus, BadgeProps["variant"]> = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
};

export function DocStatusBadge({ status }: { status: DocumentVerificationStatus }) {
  return <Badge variant={docVariant[status]}>{status}</Badge>;
}
