import { useState } from "react";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import type { Language, FieldValueInput } from "@mentor/shared";
import type { FormField } from "@/features/forms/forms.api";
import type { FamilyMemberState } from "@/features/onboarding/onboarding.api";
import { validateFields, type FieldValue } from "@/features/onboarding/validation";
import { hydrateValues, toValuePayload } from "@/features/onboarding/state-utils";
import { DynamicField } from "../DynamicField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
  fields: FormField[];
  lang: Language;
  familyMembers: FamilyMemberState[];
  onAdd: (values: FieldValueInput[]) => Promise<void>;
  onUpdate: (familyId: string, values: FieldValueInput[]) => Promise<void>;
  onRemove: (familyId: string) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

export function FamilyStep({ fields, lang, familyMembers, onAdd, onUpdate, onRemove, onNext, onBack }: Props) {
  const familyFields = fields.filter((f) => f.subjectType === "FAMILY_MEMBER");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMemberState | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setValues({});
    setErrors({});
    setOpen(true);
  };
  const openEdit = (fam: FamilyMemberState) => {
    setEditing(fam);
    setValues(hydrateValues(familyFields, fam.fieldValues));
    setErrors({});
    setOpen(true);
  };

  const save = async () => {
    const errs = validateFields(familyFields, values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const payload = toValuePayload(values);
      if (editing) await onUpdate(editing.id, payload);
      else await onAdd(payload);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-6">
          {familyMembers.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 opacity-40" />
              <p>No family members added yet.</p>
              <p className="text-sm">Add your spouse, children or dependents if applicable.</p>
            </div>
          )}
          {familyMembers.map((fam, i) => (
            <div key={fam.id} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{fam.fullName || `Family member ${i + 1}`}</div>
                {fam.relationship && (
                  <Badge variant="secondary" className="mt-0.5 text-[10px]">
                    {fam.relationship}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(fam)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onRemove(fam.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Family Member
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" size="lg" onClick={onNext}>
          Continue
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit family member" : "Add family member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {familyFields.map((f) => (
              <DynamicField
                key={f.id}
                field={f}
                lang={lang}
                value={values[f.id]}
                error={errors[f.id]}
                onChange={(v) => {
                  setValues((prev) => ({ ...prev, [f.id]: v }));
                  setErrors((e) => ({ ...e, [f.id]: "" }));
                }}
              />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
