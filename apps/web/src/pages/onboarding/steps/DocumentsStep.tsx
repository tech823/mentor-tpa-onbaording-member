import { useRef, useState } from "react";
import { Upload, FileCheck2, X, Loader2, AlertCircle } from "lucide-react";
import { CHILD_RELATIONSHIPS, SPOUSE_RELATIONSHIPS, SPOUSE_DOC_CODES, CHILD_PROOF_DOC_CODES } from "@mentor/shared";
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

  const maxMb = Math.max(1, Math.round(cfg.maxFileSizeBytes / 1024 / 1024));
  const isImage = (name: string) => /\.(jpe?g|png|webp)$/i.test(name);

  const handleFile = async (file: File) => {
    setErr(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!cfg.allowedFileTypes.includes(ext)) {
      setErr(`Only ${cfg.allowedFileTypes.join(", ").toUpperCase()} files are allowed.`);
      return;
    }
    // Images are compressed before upload, so only hard-limit non-images (e.g. PDF).
    // A generous cap on images avoids memory issues on very large originals.
    const image = isImage(file.name);
    const overLimit = image ? file.size > 40 * 1024 * 1024 : file.size > cfg.maxFileSizeBytes;
    if (overLimit) {
      const fileMb = (file.size / 1024 / 1024).toFixed(1);
      setErr(
        image
          ? `This photo is very large (${fileMb} MB). Please choose a smaller/normal photo.`
          : `This file is ${fileMb} MB — the maximum allowed is ${maxMb} MB. Please upload a smaller file.`
      );
      return;
    }
    setBusy(true);
    try {
      await onUpload(cfg.id, familyMemberId, file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed. Please try again.");
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
        <>
          <button
            onClick={pick}
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-4 text-sm text-muted-foreground hover:bg-accent/50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload {cfg.allowedFileTypes.join("/").toUpperCase()}
          </button>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            Max {maxMb} MB · {cfg.allowedFileTypes.join(", ").toUpperCase()}
          </p>
        </>
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
  // Verification flow: a spouse provides a CNIC; a child provides ANY ONE of
  // B-Form / Birth Certificate / FRC. Other relationships need nothing.
  const spouseDocs = familyDocs.filter((d) => (SPOUSE_DOC_CODES as readonly string[]).includes(d.documentType.code));
  const childProofDocs = familyDocs.filter((d) => (CHILD_PROOF_DOC_CODES as readonly string[]).includes(d.documentType.code));

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

      {familyMembers.map((fam, i) => {
        const rel = fam.relationship ?? "";
        const isSpouse = (SPOUSE_RELATIONSHIPS as readonly string[]).includes(rel);
        const isChild = (CHILD_RELATIONSHIPS as readonly string[]).includes(rel);
        const docs = isSpouse ? spouseDocs : isChild ? childProofDocs : [];
        if (docs.length === 0) return null; // spouse w/o CNIC doc, or "Other" → nothing to ask
        const groupDone = isChild && childProofDocs.some((d) => findUploaded(d.documentTypeId, fam.id));
        return (
          <Card key={fam.id}>
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-semibold">{fam.fullName || `Family member ${i + 1}`} — Documents</h3>
              {isChild ? (
                <p className="text-xs text-muted-foreground">
                  Upload <strong>any ONE</strong> of the following (B-Form, Birth Certificate, or FRC).
                  {groupDone && <span className="ms-1 font-medium text-success">✓ Provided</span>}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Please upload the spouse's CNIC.</p>
              )}
              {docs.map((d) => (
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
        );
      })}

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
