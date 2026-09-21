import { cnicRegex, pakMobileRegex } from "@mentor/shared";
import type { FormField } from "@/features/forms/forms.api";

export type FieldValue = string | string[];

const PATTERNS: Record<string, { re: RegExp; msg: string }> = {
  CNIC: { re: cnicRegex, msg: "Enter a valid CNIC (e.g. 42101-1234567-1)" },
  PAK_MOBILE: { re: pakMobileRegex, msg: "Enter a valid mobile number (e.g. 03001234567)" },
  EMAIL: { re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: "Enter a valid email address" },
};

export function isEmpty(value: FieldValue | undefined): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.trim() === "";
}

/** Client-side validation mirroring the backend rules. Returns an error or null. */
export function validateField(field: FormField, value: FieldValue | undefined): string | null {
  if (isEmpty(value)) {
    return field.isRequired ? `${field.label} is required` : null;
  }
  const str = Array.isArray(value) ? value.join(",") : (value ?? "");

  // Type-driven patterns
  if (field.fieldType === "EMAIL" && !PATTERNS.EMAIL!.re.test(str)) return PATTERNS.EMAIL!.msg;
  if (field.fieldType === "PHONE" && !PATTERNS.PAK_MOBILE!.re.test(str)) return PATTERNS.PAK_MOBILE!.msg;

  // Config-driven patterns
  const v = (field.validation ?? {}) as { patternKey?: string; pattern?: string; minLength?: number; maxLength?: number };
  if (v.patternKey && PATTERNS[v.patternKey] && !PATTERNS[v.patternKey]!.re.test(str)) {
    return PATTERNS[v.patternKey]!.msg;
  }
  if (v.pattern) {
    try {
      if (!new RegExp(v.pattern).test(str)) return `${field.label} is not in the correct format`;
    } catch {
      /* ignore invalid admin-supplied regex */
    }
  }
  if (v.minLength && str.length < v.minLength) return `${field.label} must be at least ${v.minLength} characters`;
  if (v.maxLength && str.length > v.maxLength) return `${field.label} must be at most ${v.maxLength} characters`;
  return null;
}

export function validateFields(
  fields: FormField[],
  values: Record<string, FieldValue | undefined>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const err = validateField(f, values[f.id]);
    if (err) errors[f.id] = err;
  }
  return errors;
}
