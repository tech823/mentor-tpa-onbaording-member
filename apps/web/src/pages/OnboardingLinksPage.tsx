import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link2, Copy, Check, Power, Loader2, Settings2, ExternalLink } from "lucide-react";
import { useProgrammes, useToggleLink, useCreateLink } from "@/features/programmes/programmes.hooks";
import { useAuth } from "@/features/auth/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function OnboardingLinksPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("SUPER_ADMIN", "ADMIN");
  const { data, isLoading } = useProgrammes({ page: 1, pageSize: 100 });
  const toggleLink = useToggleLink();
  const createLink = useCreateLink();
  const [copied, setCopied] = useState<string | null>(null);

  const programmes = data?.data ?? [];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const copy = async (token: string, id: string) => {
    await navigator.clipboard.writeText(`${origin}/onboarding/${token}`);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  return (
    <div>
      <PageHeader
        title="Onboarding Links"
        subtitle="Secure member-facing links for each programme — share via WhatsApp, SMS or email"
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Programme</TableHead>
              <TableHead>Corporate</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
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
            {!isLoading && programmes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Link2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No programmes yet — create one to generate a link.
                </TableCell>
              </TableRow>
            )}
            {programmes.map((p) => {
              const link = p.links?.find((l) => l.isActive) ?? p.links?.[0];
              const url = link ? `${origin}/onboarding/${link.token}` : null;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.corporate?.name}</TableCell>
                  <TableCell className="max-w-[320px]">
                    {url ? (
                      <code className="block truncate rounded-md bg-muted px-2 py-1 text-xs">/onboarding/{link!.slug}</code>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not generated</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {link ? (
                      <Badge variant={link.isActive ? "success" : "secondary"}>
                        {link.isActive ? "Active" : "Inactive"}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {url && (
                        <>
                          <Button variant="ghost" size="icon" title="Copy link" onClick={() => copy(link!.token, p.id)}>
                            {copied === p.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <a href={url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon" title="Open form">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </>
                      )}
                      {canManage && link && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={link.isActive ? "Deactivate" : "Activate"}
                          disabled={toggleLink.isPending}
                          onClick={() => toggleLink.mutate({ linkId: link.id, isActive: !link.isActive })}
                        >
                          <Power className={`h-4 w-4 ${link.isActive ? "text-success" : "text-muted-foreground"}`} />
                        </Button>
                      )}
                      {canManage && !link && (
                        <Button variant="outline" size="sm" disabled={createLink.isPending} onClick={() => createLink.mutate({ id: p.id, input: {} })}>
                          {createLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                          Generate
                        </Button>
                      )}
                      <RouterLink to={`/programmes/${p.id}/builder`}>
                        <Button variant="ghost" size="icon" title="Configure">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </RouterLink>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
