import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, FileText, Check, X, ExternalLink, Users, User } from "lucide-react";
import { type SubmissionStatus } from "@mentor/shared";
import {
  useSubmission,
  useUpdateSubmissionStatus,
  useVerifyDocument,
} from "@/features/submissions/submissions.hooks";
import { submissionsApi, type DetailDocument } from "@/features/submissions/submissions.api";
import { useFormConfig } from "@/features/forms/forms.hooks";
import { useAuth } from "@/features/auth/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { SubmissionStatusBadge, DocStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function SubmissionDetailPage() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const canManage = hasRole("SUPER_ADMIN", "ADMIN");
  const { data, isLoading } = useSubmission(id);
  const sub = data?.data;
  const { data: configRes } = useFormConfig(sub?.programme.id);
  const updateStatus = useUpdateSubmissionStatus(id!);
  const verifyDoc = useVerifyDocument(id!);

  const [notes, setNotes] = useState("");

  const changeStatus = (next: SubmissionStatus) =>
    updateStatus.mutate(
      { status: next, reviewNotes: notes || undefined },
      { onSuccess: () => setNotes("") }
    );

  const labelMap = useMemo(() => {
    const m = new Map<string, string>();
    configRes?.data?.fields.forEach((f) => m.set(f.id, f.label));
    return m;
  }, [configRes]);

  if (isLoading || !sub) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const memberDocs = sub.documents.filter((d) => d.subjectType === "MEMBER");
  const familyDocs = (famId: string) => sub.documents.filter((d) => d.familyMemberId === famId);

  const DocRow = ({ d }: { d: DetailDocument }) => (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{d.documentType.name}</div>
        <div className="truncate text-xs text-muted-foreground">{d.originalFileName}</div>
      </div>
      <DocStatusBadge status={d.verificationStatus} />
      <a href={submissionsApi.downloadUrl(d.id)} target="_blank" rel="noreferrer">
        <Button variant="ghost" size="icon" title="View">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </a>
      {canManage && (
        <>
          <Button
            variant="ghost"
            size="icon"
            title="Verify"
            onClick={() => verifyDoc.mutate({ docId: d.id, status: "VERIFIED" })}
          >
            <Check className="h-4 w-4 text-success" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Reject"
            onClick={() => {
              const reason = prompt("Rejection reason (optional):") ?? undefined;
              verifyDoc.mutate({ docId: d.id, status: "REJECTED", notes: reason });
            }}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div>
      <Link to="/submissions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Submissions
      </Link>
      <PageHeader
        title={sub.memberName || "Submission"}
        subtitle={`${sub.programme.corporate.name} · ${sub.programme.name}`}
        actions={<SubmissionStatusBadge status={sub.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Member info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Member Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sub.fieldValues.map((v) => (
                <InfoRow key={v.id} label={labelMap.get(v.fieldId) ?? v.fieldKey} value={v.originalValue ?? ""} />
              ))}
            </CardContent>
          </Card>

          {/* Family */}
          {sub.familyMembers.map((fam, i) => (
            <Card key={fam.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Family Member {i + 1}
                  {fam.relationship && <span className="text-sm font-normal text-muted-foreground">({fam.relationship})</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fam.fieldValues.map((v) => (
                  <InfoRow key={v.id} label={labelMap.get(v.fieldId) ?? v.fieldKey} value={v.originalValue ?? ""} />
                ))}
                {familyDocs(fam.id).length > 0 && (
                  <div className="mt-3 space-y-2">{familyDocs(fam.id).map((d) => <DocRow key={d.id} d={d} />)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar: status + member documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-sm text-muted-foreground">Current</span>
                <SubmissionStatusBadge status={sub.status} />
              </div>
              <InfoRow label="Submitted" value={formatDate(sub.submittedAt)} />
              <InfoRow label="Language" value={sub.language.toUpperCase()} />
              {sub.reviewNotes && (
                <div className="rounded-md bg-muted/50 p-2 text-xs">
                  <div className="mb-0.5 font-medium text-muted-foreground">Review notes</div>
                  <div className="whitespace-pre-wrap">{sub.reviewNotes}</div>
                </div>
              )}

              {canManage && (
                <div className="space-y-2 pt-1">
                  {/* Decided → show a coloured result panel + a Reopen option. */}
                  {sub.status === "VERIFIED" || sub.status === "COMPLETED" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-emerald-700">
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-semibold">Accepted — enrollment approved</span>
                      </div>
                      <Button variant="outline" className="w-full" disabled={updateStatus.isPending} onClick={() => changeStatus("SUBMITTED")}>
                        {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Reopen (dobara review)
                      </Button>
                    </div>
                  ) : sub.status === "REJECTED" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
                        <X className="h-5 w-5" />
                        <span className="text-sm font-semibold">Rejected</span>
                      </div>
                      <Button variant="outline" className="w-full" disabled={updateStatus.isPending} onClick={() => changeStatus("SUBMITTED")}>
                        {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Reopen (dobara review)
                      </Button>
                    </div>
                  ) : sub.status === "SUBMITTED" || sub.status === "UNDER_REVIEW" ? (
                    /* Member submitted → this is where the admin accepts or rejects. */
                    <>
                      <Textarea
                        placeholder="Review notes (optional — reject karte waqt reason likhein)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={updateStatus.isPending}
                          onClick={() => changeStatus("VERIFIED")}
                        >
                          {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full"
                          disabled={updateStatus.isPending}
                          onClick={() => changeStatus("REJECTED")}
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* In Process (DRAFT / IN_PROGRESS) — member ne abhi submit nahi kiya. */
                    <div className="space-y-2 rounded-md bg-sky-50 p-3">
                      <p className="text-xs text-sky-700">
                        Member abhi form bhar raha hai — submit nahi kiya. Jaise hi member complete kar ke
                        <span className="font-medium"> Submit</span> karega, ye khud
                        <span className="font-medium"> Under Review</span> me aa jayega — phir Accept / Reject aa jayega.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full bg-white"
                        disabled={updateStatus.isPending}
                        onClick={() => changeStatus("UNDER_REVIEW")}
                      >
                        {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Move to review (manually)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {memberDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents.</p>
              ) : (
                memberDocs.map((d) => <DocRow key={d.id} d={d} />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
