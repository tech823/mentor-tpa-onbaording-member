import { useRef, useState } from "react";
import { Upload, FileCheck2, X, Loader2, AlertCircle } from "lucide-react";
import type { UploadedDocument, FamilyMemberState } from "@/features/onboarding/onboarding.api";
import type { ProgrammeDocument } from "@/features/forms/forms.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  documents: ProgrammeDocument[];
  familyMembers: FamilyMemberState[];
  uploaded: UploadedDocument[];
  onUpload: (programmeDocumentId: string, familyMemberId: string | undefined, file: File) => Promise<void>;
  onRemove: (docId: string) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

function DocSlot({
  cfg,
  familyMemberId,
  existing,
  onUpload,
  onRemove,
}: {
  cfg: ProgrammeDocument;
  familyMemberId?: string;
  existing?: UploadedDocument;
  onUpload: Props["onUpload"];
  onRemove: Props["onRemove"];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setErr(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!cfg.allowedFileTypes.includes(ext)) {
      setErr(`Only ${cfg.allowedFileTypes.join(", ").toUpperCase()} allowed`);
      return;
    }
    if (file.size > cfg.maxFileSizeBytes) {
      setErr(`Max ${Math.round(cfg.maxFileSizeBytes / 1024 / 1024)}MB`);
      return;
    }
    setBusy(true);
    try {
      await onUpload(cfg.id, familyMemberId, file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{cfg.documentType.name}</span>
          <Badge variant={cfg.isRequired ? "default" : "secondary"} className="text-[10px]">
            {cfg.isRequired ? "Required" : "Optional"}
          </Badge>
        </div>
      </div>

      {existing ? (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          <FileCheck2 className="h-4 w-4" />
          <span className="flex-1 truncate">{existing.originalFileName}</span>
          <button onClick={() => onRemove(existing.id)} className="text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={pick}
          disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-4 text-sm text-muted-foreground hover:bg-accent/50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload {cfg.allowedFileTypes.join("/").toUpperCase()}
        </button>
      )}
      {err && (
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {err}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={cfg.allowedFileTypes.map((t) => `.${t}`).join(",")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function DocumentsStep({ documents, familyMembers, uploaded, onUpload, onRemove, onNext, onBack }: Props) {
  const memberDocs = documents.filter((d) => d.subjectType === "MEMBER");
  const familyDocs = documents.filter((d) => d.subjectType === "FAMILY_MEMBER");

  const findUploaded = (docTypeId: string, familyMemberId?: string) =>
    uploaded.find(
      (u) => u.documentTypeId === docTypeId && (familyMemberId ? u.familyMemberId === familyMemberId : u.subjectType === "MEMBER")
    );

  return (
    <div className="space-y-4">
      {memberDocs.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="font-semibold">Your Documents</h3>
            {memberDocs.map((d) => (
              <DocSlot key={d.id} cfg={d} existing={findUploaded(d.documentTypeId)} onUpload={onUpload} onRemove={onRemove} />
            ))}
          </CardContent>
        </Card>
      )}

      {familyDocs.length > 0 &&
        familyMembers.map((fam, i) => (
          <Card key={fam.id}>
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-semibold">{fam.fullName || `Family member ${i + 1}`} — Documents</h3>
              {familyDocs.map((d) => (
                <DocSlot
                  key={d.id}
                  cfg={d}
                  familyMemberId={fam.id}
                  existing={findUploaded(d.documentTypeId, fam.id)}
                  onUpload={onUpload}
                  onRemove={onRemove}
                />
              ))}
            </CardContent>
          </Card>
        ))}

      {familyDocs.length > 0 && familyMembers.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No family members added — family documents will appear here once you add them.
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" size="lg" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
