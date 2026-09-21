import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Loader2, ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditLog {
  id: string;
  userEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => api.get<AuditLog[]>("/audit-logs", { page, pageSize }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta as { total?: number; totalPages?: number } | undefined;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Record of administrative actions" />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <ScrollText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No audit entries
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">{r.userEmail ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.action.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.entityType ?? "—"}
                  {r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ""}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.ipAddress ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
        {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
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
  );
}
