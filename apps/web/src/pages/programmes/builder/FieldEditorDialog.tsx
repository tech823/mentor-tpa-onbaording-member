import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { FIELD_TYPES, SUBJECT_TYPE, type FieldType, type SubjectType } from "@mentor/shared";
import type { FormField } from "@/features/forms/forms.api";
import { useCreateField, useUpdateField } from "@/features/forms/forms.hooks";
import { FIELD_TYPE_LABELS, OPTION_TYPES, toFieldKey } from "@/features/forms/field-utils";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  programmeId: string;
  field: FormField | null; // null = create
  defaultSubjectType?: SubjectType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OptionRow {
  value: string;
  label: string;
}

export function FieldEditorDialog({ programmeId, field, defaultSubjectType, open, onOpenChange }: Props) {
  const isEdit = !!field;
  const createMutation = useCreateField(programmeId);
  const updateMutation = useUpdateField(programmeId);

  const [label, setLabel] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [fieldType, setFieldType] = useState<FieldType>("TEXT");
  const [subjectType, setSubjectType] = useState<SubjectType>(defaultSubjectType ?? "MEMBER");
  const [isRequired, setIsRequired] = useState(false);
  const [standardize, setStandardize] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (field) {
      setLabel(field.label);
      setFieldKey(field.fieldKey);
      setFieldType(field.fieldType);
      setSubjectType(field.subjectType);
      setIsRequired(field.isRequired);
      setStandardize(field.valueKind === "STRUCTURED");
      setPlaceholder(field.placeholder ?? "");
      setHelpText(field.helpText ?? "");
      setOptions(field.options.map((o) => ({ value: o.value, label: o.label })));
      setKeyEdited(true);
    } else {
      setLabel("");
      setFieldKey("");
      setKeyEdited(false);
      setFieldType("TEXT");
      setSubjectType(defaultSubjectType ?? "MEMBER");
      setIsRequired(false);
      setStandardize(false);
      setPlaceholder("");
      setHelpText("");
      setOptions([]);
    }
    setError(null);
  }, [field, open, defaultSubjectType]);

  const needsOptions = OPTION_TYPES.includes(fieldType);

  const handleLabelChange = (v: string) => {
    setLabel(v);
    if (!isEdit && !keyEdited) setFieldKey(toFieldKey(v));
  };

  const addOption = () => setOptions((o) => [...o, { value: "", label: "" }]);
  const updateOption = (i: number, patch: Partial<OptionRow>) =>
    setOptions((o) => o.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeOption = (i: number) => setOptions((o) => o.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError(null);
    const cleanOptions = options
      .map((o) => ({ value: o.value.trim(), label: o.label.trim() }))
      .filter((o) => o.value && o.label);

    if (needsOptions && cleanOptions.length === 0) {
      setError("Add at least one option for this field type.");
      return;
    }

    const base = {
      label: label.trim(),
      fieldType,
      subjectType,
      valueKind: standardize ? ("STRUCTURED" as const) : ("FREE_TEXT" as const),
      isRequired,
      placeholder: placeholder.trim() || undefined,
      helpText: helpText.trim() || undefined,
      displayOrder: 0,
      // Preserve the field's shown/hidden state when editing; new fields default to shown.
      isActive: isEdit ? field!.isActive : true,
      options: cleanOptions.map((o, i) => ({ ...o, displayOrder: i, isActive: true })),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: field!.id, input: base });
      } else {
        await createMutation.mutateAsync({ ...base, fieldKey: fieldKey.trim() });
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.details ? Object.values(err.details).flat().join(", ") : err.message);
      } else setError("Something went wrong");
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit field" : "Add field"}</DialogTitle>
          <DialogDescription>
            Configure how this field appears and is validated on the onboarding form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => handleLabelChange(e.target.value)} placeholder="e.g. CNIC Number" />
            </div>
            <div className="space-y-1.5">
              <Label>Field key</Label>
              <Input
                value={fieldKey}
                onChange={(e) => {
                  setKeyEdited(true);
                  setFieldKey(e.target.value);
                }}
                disabled={isEdit}
                className="font-mono text-xs"
                placeholder="cnic_number"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as FieldType)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Applies to</Label>
              <select
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value as SubjectType)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {SUBJECT_TYPE.map((s) => (
                  <option key={s} value={s}>
                    {s === "MEMBER" ? "Primary member" : "Family member"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {needsOptions && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {options.length === 0 && <p className="text-xs text-muted-foreground">No options yet.</p>}
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={o.label}
                    onChange={(e) => updateOption(i, { label: e.target.value })}
                    placeholder="Label (shown)"
                  />
                  <Input
                    value={o.value}
                    onChange={(e) => updateOption(i, { value: e.target.value })}
                    placeholder="CODE (stored)"
                    className="font-mono text-xs"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                The CODE (e.g. FEMALE) is what gets stored &amp; exported — same across all languages.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Placeholder</Label>
              <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Help text</Label>
              <Input value={helpText} onChange={(e) => setHelpText(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-3">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Required</span>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Standardize to codes
                <span className="block text-xs font-normal text-muted-foreground">
                  Store a fixed English code regardless of entry language (for filtering/export).
                </span>
              </span>
              <Switch checked={standardize} onCheckedChange={setStandardize} />
            </label>
          </div>

          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !label.trim() || (!isEdit && !fieldKey.trim())}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save field" : "Add field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
