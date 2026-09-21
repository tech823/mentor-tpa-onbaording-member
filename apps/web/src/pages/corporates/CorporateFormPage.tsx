import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createCorporateSchema, CORPORATE_STATUS, type CreateCorporateInput } from "@mentor/shared";
import {
  useCorporate,
  useCreateCorporate,
  useUpdateCorporate,
} from "@/features/corporates/corporates.hooks";
import { ApiRequestError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

/** Removes empty-string optionals so Zod's `.optional()` fields validate cleanly. */
function clean(values: CreateCorporateInput): CreateCorporateInput {
  const out = { ...values } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (out[k] === "" || out[k] === undefined) delete out[k];
  }
  return out as CreateCorporateInput;
}

export function CorporateFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: existing, isLoading: loadingExisting } = useCorporate(id);
  const createMutation = useCreateCorporate();
  const updateMutation = useUpdateCorporate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCorporateInput>({
    resolver: zodResolver(createCorporateSchema),
    defaultValues: { status: "ACTIVE" },
  });

  useEffect(() => {
    if (existing?.data) {
      const c = existing.data;
      reset({
        name: c.name,
        shortCode: c.shortCode,
        contactPerson: c.contactPerson ?? undefined,
        contactEmail: c.contactEmail ?? undefined,
        contactPhone: c.contactPhone ?? undefined,
        address: c.address ?? undefined,
        logoUrl: c.logoUrl ?? undefined,
        status: c.status,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: CreateCorporateInput) => {
    setServerError(null);
    try {
      if (isEdit) await updateMutation.mutateAsync({ id: id!, input: clean(values) });
      else await createMutation.mutateAsync(clean(values));
      navigate("/corporates");
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const fields: { name: keyof CreateCorporateInput; labelKey: string; type?: string; required?: boolean }[] = [
    { name: "name", labelKey: "corporates.name", required: true },
    { name: "shortCode", labelKey: "corporates.shortCode", required: true },
    { name: "contactPerson", labelKey: "corporates.contactPerson" },
    { name: "contactEmail", labelKey: "corporates.contactEmail", type: "email" },
    { name: "contactPhone", labelKey: "corporates.contactPhone" },
    { name: "logoUrl", labelKey: "corporates.logoUrl", type: "url" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/corporates" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("corporates.title")}
      </Link>
      <PageHeader title={t(isEdit ? "corporates.editTitle" : "corporates.createTitle")} />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={f.name}>
                    {t(f.labelKey)} {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Input id={f.name} type={f.type ?? "text"} {...register(f.name)} />
                  {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]?.message}</p>}
                </div>
              ))}
              <div className="space-y-1.5">
                <Label htmlFor="status">{t("common.status")}</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {CORPORATE_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">{t("corporates.address")}</Label>
              <textarea
                id="address"
                {...register("address")}
                rows={3}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/corporates")}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
