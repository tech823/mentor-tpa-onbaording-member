import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, FileText, Download, Eye } from "lucide-react";
import { SUBMISSION_STATUS } from "@mentor/shared";
import { useSubmissions } from "@/features/submissions/submissions.hooks";
import { submissionsApi, type ListSubmissionsParams } from "@/features/submissions/submissions.api";
import { useCorporates } from "@/features/corporates/corporates.hooks";
import { useAuth } from "@/features/auth/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export function SubmissionsPage() {
  const { hasRole } = useAuth();
  const canExport = hasRole("SUPER_ADMIN", "ADMIN");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [corporateId, setCorporateId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data: corporatesRes } = useCorporates({ page: 1, pageSize: 100 });
  const corporates = corporatesRes?.data ?? [];

  const filters: ListSubmissionsParams = {
    page,
    pageSize,
    search: search || undefined,
    status: (status || undefined) as never,
    corporateId: corporateId || undefined,
  };
  const { data, isLoading, isFetching } = useSubmissions(filters);
  const rows = data?.data ?? [];
  const meta = data?.meta as { total?: number; totalPages?: number } | undefined;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <PageHeader
        title="Submissions"
        subtitle="Member onboarding submissions across your programmes"
        actions={
          canExport && (
            <Button asChild variant="outline">
              <a href={submissionsApi.exportUrl({ ...filters, page: undefined, pageSize: undefined })}>
                <Download className="h-4 w-4" /> Export Excel
              </a>
            </Button>
          )
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name / CNIC / email"
              className="ps-9"
            />
          </div>
          <select
            value={corporateId}
            onChange={(e) => {
              setCorporateId(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">All corporates</option>
            {corporates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">All statuses</option>
            {SUBMISSION_STATUS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead>Corporate / Programme</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-end">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No submissions yet
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <Link to={`/submissions/${s.id}`} className="hover:text-primary hover:underline">
                    {s.memberName || "—"}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{s.cnic || "—"}</TableCell>
                <TableCell>
                  <div>{s.corporateName}</div>
                  <div className="text-xs text-muted-foreground">{s.programmeName}</div>
                </TableCell>
                <TableCell>{s.familyCount}</TableCell>
                <TableCell>
                  <div className="flex gap-1 text-xs">
                    {s.documents.verified > 0 && <Badge variant="success">{s.documents.verified}✓</Badge>}
                    {s.documents.pending > 0 && <Badge variant="warning">{s.documents.pending}</Badge>}
                    {s.documents.rejected > 0 && <Badge variant="destructive">{s.documents.rejected}✗</Badge>}
                    {s.documents.total === 0 && <span className="text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <SubmissionStatusBadge status={s.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(s.submittedAt)}</TableCell>
                <TableCell className="text-end">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/submissions/${s.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {meta?.total ?? 0} total {isFetching && <Loader2 className="ms-1 inline h-3 w-3 animate-spin" />}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
