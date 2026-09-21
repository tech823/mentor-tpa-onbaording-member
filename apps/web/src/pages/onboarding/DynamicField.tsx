import type { Language } from "@mentor/shared";
import type { FormField } from "@/features/forms/forms.api";
import { localized } from "@/features/forms/field-utils";
import type { FieldValue } from "@/features/onboarding/validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  field: FormField;
  lang: Language;
  value: FieldValue | undefined;
  error?: string;
  onChange: (value: FieldValue) => void;
}

export function DynamicField({ field, lang, value, error, onChange }: Props) {
  const label = localized(field.label, field.labelI18n, lang);
  const placeholder = field.placeholder ?? "";
  const id = `f-${field.id}`;
  const str = typeof value === "string" ? value : "";
  const arr = Array.isArray(value) ? value : [];

  const control = () => {
    switch (field.fieldType) {
      case "TEXTAREA":
        return <Textarea id={id} value={str} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
      case "DROPDOWN":
        return (
          <select
            id={id}
            value={str}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-base"
          >
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o.id} value={o.value}>
                {localized(o.label, o.labelI18n, lang)}
              </option>
            ))}
          </select>
        );
      case "RADIO":
        return (
          <div className="space-y-2">
            {field.options.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-base">
                <input type="radio" name={id} checked={str === o.value} onChange={() => onChange(o.value)} />
                {localized(o.label, o.labelI18n, lang)}
              </label>
            ))}
          </div>
        );
      case "CHECKBOX":
        return (
          <div className="space-y-2">
            {field.options.map((o) => {
              const checked = arr.includes(o.value);
              return (
                <label key={o.id} className="flex items-center gap-2 text-base">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onChange(e.target.checked ? [...arr, o.value] : arr.filter((v) => v !== o.value))
                    }
                  />
                  {localized(o.label, o.labelI18n, lang)}
                </label>
              );
            })}
          </div>
        );
      case "DATE":
        return <Input id={id} type="date" value={str} onChange={(e) => onChange(e.target.value)} className="h-11 text-base" />;
      case "NUMBER":
        return <Input id={id} type="number" value={str} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-11 text-base" />;
      default:
        return (
          <Input
            id={id}
            type={field.fieldType === "EMAIL" ? "email" : "text"}
            inputMode={field.fieldType === "PHONE" ? "tel" : undefined}
            value={str}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 text-base"
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-base">
        {label} {field.isRequired && <span className="text-destructive">*</span>}
      </Label>
      {control()}
      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
