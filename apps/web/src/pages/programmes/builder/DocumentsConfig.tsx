import { useState } from "react";
import { Plus, Trash2, FileCheck2, Loader2 } from "lucide-react";
import { SUBJECT_TYPE, type SubjectType } from "@mentor/shared";
import type { FormConfig } from "@/features/forms/forms.api";
import { useDocumentTypes, useCreateDocument, useDeleteDocument } from "@/features/forms/forms.hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DocumentsConfig({ config, canManage }: { config: FormConfig; canManage: boolean }) {
  const programmeId = config.programme.id;
  const { data: typesRes } = useDocumentTypes();
  const createDoc = useCreateDocument(programmeId);
  const deleteDoc = useDeleteDocument(programmeId);
  const docTypes = typesRes?.data ?? [];

  const [documentTypeId, setDocumentTypeId] = useState("");
  const [subjectType, setSubjectType] = useState<SubjectType>("MEMBER");
  const [isRequired, setIsRequired] = useState(true);

  const add = () => {
    if (!documentTypeId) return;
    createDoc.mutate(
      {
        documentTypeId,
        subjectType,
        isRequired,
        allowedFileTypes: ["jpg", "jpeg", "png", "pdf"],
        maxFileSizeBytes: 10 * 1024 * 1024,
        displayOrder: config.documents.length,
        isActive: true,
      },
      { onSuccess: () => setDocumentTypeId("") }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck2 className="h-4 w-4" /> Required Documents
        </CardTitle>
        <CardDescription>Configure which documents members must upload (CNIC, B-Form, FRC…).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {config.documents.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents required yet.</p>
          )}
          {config.documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-md border border-border p-3">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{d.documentType.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.subjectType === "MEMBER" ? "Primary member" : "Family member"} ·{" "}
                  {d.allowedFileTypes.join(", ").toUpperCase()} · max {Math.round(d.maxFileSizeBytes / 1024 / 1024)}MB
                </div>
              </div>
              <Badge variant={d.isRequired ? "default" : "secondary"}>
                {d.isRequired ? "Required" : "Optional"}
              </Badge>
              {canManage && (
                <Button variant="ghost" size="icon" onClick={() => deleteDoc.mutate(d.id)} disabled={deleteDoc.isPending}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium">Document</label>
              <select
                value={documentTypeId}
                onChange={(e) => setDocumentTypeId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Select…</option>
                {docTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Applies to</label>
              <select
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value as SubjectType)}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm"
              >
                {SUBJECT_TYPE.map((s) => (
                  <option key={s} value={s}>
                    {s === "MEMBER" ? "Member" : "Family"}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
              Required
            </label>
            <Button onClick={add} disabled={!documentTypeId || createDoc.isPending}>
              {createDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
