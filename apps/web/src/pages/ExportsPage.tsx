import { useState } from "react";
import { Download } from "lucide-react";
import { SUBMISSION_STATUS } from "@mentor/shared";
import { submissionsApi } from "@/features/submissions/submissions.api";
import { useCorporates } from "@/features/corporates/corporates.hooks";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function ExportsPage() {
  const { data: corporatesRes } = useCorporates({ page: 1, pageSize: 100 });
  const corporates = corporatesRes?.data ?? [];
  const [corporateId, setCorporateId] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const url = submissionsApi.exportUrl({
    corporateId: corporateId || undefined,
    status: (status || undefined) as never,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Exports" subtitle="Download submissions as Excel with English-standardized values" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submissions export</CardTitle>
          <CardDescription>
            Structured values (gender, relationship…) export as English codes; custom programme fields
            appear as their own columns. One row per family member.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Corporate</Label>
              <select value={corporateId} onChange={(e) => setCorporateId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option value="">All</option>
                {corporates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option value="">All</option>
                {SUBMISSION_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>From date</Label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>To date</Label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" />
            </div>
          </div>
          <Button asChild size="lg" className="w-full">
            <a href={url}>
              <Download className="h-4 w-4" /> Download Excel
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
