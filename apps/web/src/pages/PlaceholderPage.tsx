import { Construction } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            This module is planned for <span className="font-medium text-foreground">{phase}</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
