import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { Language } from "@mentor/shared";
import type { FormField } from "@/features/forms/forms.api";
import type { SubmissionState } from "@/features/onboarding/onboarding.api";
import { localized } from "@/features/forms/field-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  fields: FormField[];
  lang: Language;
  state: SubmissionState;
  submitting: boolean;
  submitErrors?: Record<string, string[]>;
  onSubmit: () => Promise<void>;
  onBack: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function ReviewStep({ fields, lang, state, submitting, submitErrors, onSubmit, onBack }: Props) {
  const [consent, setConsent] = useState(false);
  const memberFields = fields.filter((f) => f.subjectType === "MEMBER");
  const familyFields = fields.filter((f) => f.subjectType === "FAMILY_MEMBER");
  const memberValues = new Map(state.fieldValues.map((v) => [v.fieldId, v]));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-2 font-semibold">Personal Information</h3>
          {memberFields.map((f) => (
            <Row key={f.id} label={localized(f.label, f.labelI18n, lang)} value={memberValues.get(f.id)?.originalValue ?? ""} />
          ))}
        </CardContent>
      </Card>

      {state.familyMembers.map((fam, i) => {
        const vals = new Map(fam.fieldValues.map((v) => [v.fieldId, v]));
        return (
          <Card key={fam.id}>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold">Family Member {i + 1}</h3>
              {familyFields.map((f) => (
                <Row key={f.id} label={localized(f.label, f.labelI18n, lang)} value={vals.get(f.id)?.originalValue ?? ""} />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-2 font-semibold">Documents</h3>
          {state.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded.</p>
          ) : (
            state.documents.map((d) => (
              <Row key={d.id} label={d.originalFileName} value={d.subjectType === "MEMBER" ? "Member" : "Family"} />
            ))
          )}
        </CardContent>
      </Card>

      {submitErrors && Object.keys(submitErrors).length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <div className="mb-1 flex items-center gap-1 font-medium">
            <AlertCircle className="h-4 w-4" /> Please fix the following:
          </div>
          <ul className="list-inside list-disc space-y-0.5">
            {Object.values(submitErrors).flat().map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex items-start gap-2 rounded-md bg-accent/50 p-3 text-sm">
        <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I confirm the information provided is accurate and I consent to it being processed for this
          health coverage programme.
        </span>
      </label>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" size="lg" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button className="flex-1" size="lg" onClick={onSubmit} disabled={!consent || submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </div>
    </div>
  );
}
