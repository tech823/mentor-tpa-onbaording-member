import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Language } from "@mentor/shared";
import type { FormField } from "@/features/forms/forms.api";
import { validateFields, type FieldValue } from "@/features/onboarding/validation";
import { toValuePayload } from "@/features/onboarding/state-utils";
import type { FieldValueInput } from "@mentor/shared";
import { DynamicField } from "../DynamicField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  fields: FormField[];
  lang: Language;
  initialValues: Record<string, FieldValue>;
  saving: boolean;
  onNext: (values: FieldValueInput[]) => Promise<void>;
}

export function PersonalStep({ fields, lang, initialValues, saving, onNext }: Props) {
  const memberFields = fields.filter((f) => f.subjectType === "MEMBER");
  const [values, setValues] = useState<Record<string, FieldValue>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = (fieldId: string, value: FieldValue) => {
    setValues((v) => ({ ...v, [fieldId]: value }));
    setErrors((e) => ({ ...e, [fieldId]: "" }));
  };

  const handleNext = async () => {
    const errs = validateFields(memberFields, values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      document.querySelector("[data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    await onNext(toValuePayload(values));
  };

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {memberFields.map((f) => (
          <div key={f.id} data-error={!!errors[f.id]}>
            <DynamicField field={f} lang={lang} value={values[f.id]} error={errors[f.id]} onChange={(v) => setValue(f.id, v)} />
          </div>
        ))}
        <Button className="w-full" size="lg" onClick={handleNext} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
