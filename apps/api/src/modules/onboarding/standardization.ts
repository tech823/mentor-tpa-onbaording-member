import type { Language } from "@mentor/shared";
import type { formFields, formFieldOptions } from "../../db/schema/index";

type Field = typeof formFields.$inferSelect & { options: (typeof formFieldOptions.$inferSelect)[] };

export interface StandardizedValue {
  originalValue: string | null;
  standardizedValue: string | null;
}

/**
 * Transliteration stub (spec section 17). Free-text names/addresses entered in
 * Urdu/Sindhi/Pashto should eventually be transliterated to an English form for
 * reporting. This is intentionally a pluggable seam — wire a real transliteration
 * API here later. For now English passes through; non-English returns null so we
 * never fabricate an inaccurate "standardized" value.
 */
export function transliterate(value: string, language: Language): string | null {
  if (language === "en") return value;
  return null; // TODO: integrate transliteration provider
}

/** Normalizes a raw submitted value into { original, standardized } per spec §17. */
export function standardizeValue(
  field: Field,
  raw: string | string[],
  language: Language
): StandardizedValue {
  const isArray = Array.isArray(raw);
  const values = isArray ? raw : [raw];

  // Structured values map to canonical English codes (the option `value`).
  if (field.valueKind === "STRUCTURED" && field.options.length > 0) {
    const codes: string[] = [];
    const labels: string[] = [];
    for (const v of values) {
      const opt = field.options.find((o) => o.value === v || o.label === v);
      const code = opt?.value ?? v; // frontend sends the code; fall back defensively
      codes.push(code);
      // Preserve what the user saw, in their language.
      const label = opt ? localizedOptionLabel(opt, language) : v;
      labels.push(label);
    }
    return {
      standardizedValue: codes.join(", "),
      originalValue: labels.join(", "),
    };
  }

  // Free-text: preserve the original, best-effort transliteration for reporting.
  const joined = values.join(", ").trim();
  if (!joined) return { originalValue: null, standardizedValue: null };
  return {
    originalValue: joined,
    standardizedValue: transliterate(joined, language),
  };
}

function localizedOptionLabel(opt: typeof formFieldOptions.$inferSelect, language: Language): string {
  if (language === "en") return opt.label;
  const i18n = opt.labelI18n as Partial<Record<Language, string>> | null;
  return i18n?.[language] || opt.label;
}
