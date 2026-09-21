import { useState } from "react";
import { Link2, Copy, Check, RefreshCw, Loader2, Power } from "lucide-react";
import type { Programme } from "@/features/programmes/programmes.api";
import { useCreateLink, useToggleLink } from "@/features/programmes/programmes.hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OnboardingLinkCard({ programme }: { programme: Programme }) {
  const createLink = useCreateLink();
  const toggleLink = useToggleLink();
  const [copied, setCopied] = useState(false);

  const activeLink = programme.links?.find((l) => l.isActive);
  const url = activeLink ? `${window.location.origin}/onboarding/${activeLink.token}` : null;

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" /> Onboarding Link
        </CardTitle>
        <CardDescription>
          Share this secure link with members. Anyone with the link can submit — no account needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeLink ? (
          <>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">{url}</code>
              <Button variant="outline" size="icon" onClick={copy} title="Copy">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={activeLink.isActive ? "success" : "secondary"}>
                {activeLink.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-xs text-muted-foreground">/{activeLink.slug}</span>
              <div className="ms-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLink.mutate({ linkId: activeLink.id, isActive: !activeLink.isActive })}
                  disabled={toggleLink.isPending}
                >
                  <Power className="h-3.5 w-3.5" />
                  {activeLink.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createLink.mutate({ id: programme.id, input: {} })}
                  disabled={createLink.isPending}
                >
                  {createLink.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerate
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">No onboarding link yet.</p>
            <Button onClick={() => createLink.mutate({ id: programme.id, input: {} })} disabled={createLink.isPending}>
              {createLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Generate link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
