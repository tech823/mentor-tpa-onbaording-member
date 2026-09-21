import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, FolderKanban, Settings2, Link2 } from "lucide-react";
import { PROGRAMME_STATUS } from "@mentor/shared";
import { useProgrammes } from "@/features/programmes/programmes.hooks";
import { useAuth } from "@/features/auth/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { BadgeProps } from "@/components/ui/badge";
import type { ProgrammeStatus } from "@mentor/shared";

const statusVariant: Record<ProgrammeStatus, BadgeProps["variant"]> = {
  DRAFT: "secondary",
  ACTIVE: "success",
  PAUSED: "warning",
  CLOSED: "destructive",
};

export function ProgrammesPage() {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isFetching } = useProgrammes({
    page,
    pageSize,
    search: search || undefined,
    status: (status || undefined) as never,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta as { total?: number; totalPages?: number } | undefined;
  const totalPages = meta?.totalPages ?? 1;
  const canManage = hasRole("SUPER_ADMIN", "ADMIN");

  return (
    <div>
      <PageHeader
        title="Programmes"
        subtitle="Onboarding programmes and their configurable forms"
        actions={
          canManage && (
            <Button asChild>
              <Link to="/programmes/new">
                <Plus className="h-4 w-4" />
                New Programme
              </Link>
            </Button>
          )
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search programmes"
              className="ps-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">All statuses</option>
            {PROGRAMME_STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Programme</TableHead>
              <TableHead>Corporate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <FolderKanban className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No programmes yet
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => {
              const activeLink = p.links?.find((l) => l.isActive);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link to={`/programmes/${p.id}/builder`} className="hover:text-primary hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.corporate?.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {activeLink ? (
                      <Badge variant="success" className="gap-1">
                        <Link2 className="h-3 w-3" /> Live
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/programmes/${p.id}/builder`}>
                        <Settings2 className="h-4 w-4" />
                        Configure
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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
