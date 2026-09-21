import { useState } from "react";
import { LANGUAGES, LANGUAGE_LABELS, type Language } from "@mentor/shared";
import type { FormConfig, FormField } from "@/features/forms/forms.api";
import { localized, OPTION_TYPES } from "@/features/forms/field-utils";
import { RTL_LANGUAGES } from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function PreviewField({ field, lang }: { field: FormField; lang: Language }) {
  const label = localized(field.label, field.labelI18n, lang);
  const placeholder = field.placeholder ?? "";
  const id = `preview-${field.id}`;

  const control = () => {
    switch (field.fieldType) {
      case "TEXTAREA":
        return <Textarea id={id} placeholder={placeholder} disabled />;
      case "DROPDOWN":
        return (
          <select id={id} disabled className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
            <option>—</option>
            {field.options.map((o) => (
              <option key={o.id}>{localized(o.label, o.labelI18n, lang)}</option>
            ))}
          </select>
        );
      case "RADIO":
      case "CHECKBOX":
        return (
          <div className="space-y-1.5">
            {field.options.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type={field.fieldType === "RADIO" ? "radio" : "checkbox"} disabled />
                {localized(o.label, o.labelI18n, lang)}
              </label>
            ))}
          </div>
        );
      case "FILE":
        return (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-input text-xs text-muted-foreground">
            Upload {label}
          </div>
        );
      case "DATE":
        return <Input id={id} type="date" disabled />;
      default:
        return <Input id={id} type={field.fieldType === "NUMBER" ? "number" : "text"} placeholder={placeholder} disabled />;
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {field.isRequired && <span className="text-destructive">*</span>}
        {field.valueKind === "STRUCTURED" && OPTION_TYPES.includes(field.fieldType) && (
          <Badge variant="outline" className="ms-2 text-[10px]">
            coded
          </Badge>
        )}
      </Label>
      {control()}
      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
    </div>
  );
}

export function FormPreview({ config }: { config: FormConfig }) {
  const [lang, setLang] = useState<Language>("en");
  const dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";

  const activeFields = config.fields.filter((f) => f.isActive);
  const memberFields = activeFields.filter((f) => f.subjectType === "MEMBER");
  const familyFields = activeFields.filter((f) => f.subjectType === "FAMILY_MEMBER");

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Preview in:</span>
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`rounded-md px-2.5 py-1 text-sm ${
              lang === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {LANGUAGE_LABELS[l]}
          </button>
        ))}
      </div>

      <div dir={dir} className="mx-auto max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {memberFields.length === 0 && <p className="text-sm text-muted-foreground">No member fields yet.</p>}
            {memberFields.map((f) => (
              <PreviewField key={f.id} field={f} lang={lang} />
            ))}
          </CardContent>
        </Card>

        {familyFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Family Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyFields.map((f) => (
                <PreviewField key={f.id} field={f} lang={lang} />
              ))}
            </CardContent>
          </Card>
        )}

        {config.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-dashed border-input p-2 text-sm">
                  <span>
                    {d.documentType.name}
                    <span className="ms-1 text-xs text-muted-foreground">
                      ({d.subjectType === "MEMBER" ? "member" : "family"})
                    </span>
                  </span>
                  {d.isRequired && <span className="text-destructive">*</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
