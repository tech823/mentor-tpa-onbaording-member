import type { FieldType, Language } from "@mentor/shared";
import type { I18nText } from "./forms.api";

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  EMAIL: "Email",
  PHONE: "Phone",
  DATE: "Date",
  DROPDOWN: "Dropdown",
  RADIO: "Radio",
  CHECKBOX: "Checkbox",
  TEXTAREA: "Text area",
  FILE: "File upload",
};

export const OPTION_TYPES: FieldType[] = ["DROPDOWN", "RADIO", "CHECKBOX"];

/** Converts a label into a snake_case field key (e.g. "Full Name" -> "full_name"). */
export function toFieldKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^([0-9])/, "f_$1")
    .slice(0, 80);
}

/** Picks the label for the active language, falling back to the default. */
export function localized(defaultText: string, i18n: I18nText | null | undefined, lang: Language): string {
  if (lang === "en") return defaultText;
  return i18n?.[lang] || defaultText;
}
