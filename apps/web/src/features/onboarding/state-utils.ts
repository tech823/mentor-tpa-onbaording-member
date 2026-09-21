import type { FieldValueInput } from "@mentor/shared";
import type { FormField } from "@/features/forms/forms.api";
import type { SubmissionFieldValue } from "./onboarding.api";
import type { FieldValue } from "./validation";

/** Rebuilds editable form values from saved field values (for resume/edit). */
export function hydrateValues(
  fields: FormField[],
  saved: SubmissionFieldValue[]
): Record<string, FieldValue> {
  const byField = new Map(saved.map((v) => [v.fieldId, v]));
  const out: Record<string, FieldValue> = {};
  for (const f of fields) {
    const v = byField.get(f.id);
    if (!v) continue;
    // Structured fields prefill from the stored code; multi-select splits on ", ".
    const source = f.valueKind === "STRUCTURED" ? v.standardizedValue : v.originalValue;
    if (source == null) continue;
    out[f.id] = f.fieldType === "CHECKBOX" ? source.split(", ").filter(Boolean) : source;
  }
  return out;
}

/** Converts the editable values map into the API payload shape. */
export function toValuePayload(values: Record<string, FieldValue | undefined>): FieldValueInput[] {
  return Object.entries(values)
    .filter(([, v]) => v !== undefined)
    .map(([fieldId, value]) => ({ fieldId, value: value as FieldValue }));
}
