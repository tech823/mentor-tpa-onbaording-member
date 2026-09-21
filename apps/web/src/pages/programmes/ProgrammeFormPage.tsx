import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createProgrammeSchema, PROGRAMME_STATUS, type CreateProgrammeInput } from "@mentor/shared";
import {
  useProgramme,
  useCreateProgramme,
  useUpdateProgramme,
} from "@/features/programmes/programmes.hooks";
import { useCorporates } from "@/features/corporates/corporates.hooks";
import { ApiRequestError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export function ProgrammeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: corporatesRes } = useCorporates({ page: 1, pageSize: 100 });
  const corporates = corporatesRes?.data ?? [];
  const { data: existing, isLoading } = useProgramme(id);
  const createMutation = useCreateProgramme();
  const updateMutation = useUpdateProgramme();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProgrammeInput>({
    resolver: zodResolver(createProgrammeSchema),
    defaultValues: { status: "DRAFT", seedDefaults: true },
  });

  useEffect(() => {
    if (existing?.data) {
      const p = existing.data;
      reset({
        corporateId: p.corporateId,
        name: p.name,
        description: p.description ?? undefined,
        startDate: p.startDate ?? undefined,
        endDate: p.endDate ?? undefined,
        status: p.status,
        seedDefaults: false,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: CreateProgrammeInput) => {
    setServerError(null);
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as CreateProgrammeInput;
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          input: {
            name: clean.name,
            description: clean.description,
            startDate: clean.startDate,
            endDate: clean.endDate,
            status: clean.status,
          },
        });
        navigate(`/programmes/${id}/builder`);
      } else {
        const res = await createMutation.mutateAsync(clean);
        navigate(`/programmes/${res.data!.id}/builder`);
      }
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/programmes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Programmes
      </Link>
      <PageHeader title={isEdit ? "Edit programme" : "Create programme"} />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="corporateId">
                Corporate Client <span className="text-destructive">*</span>
              </Label>
              <select
                id="corporateId"
                {...register("corporateId")}
                disabled={isEdit}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60"
              >
                <option value="">Select a corporate…</option>
                {corporates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.shortCode})
                  </option>
                ))}
              </select>
              {errors.corporateId && <p className="text-xs text-destructive">{errors.corporateId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Programme Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="e.g. Employee Health Coverage 2026" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {PROGRAMME_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isEdit && (
              <label className="flex items-start gap-2 rounded-md bg-accent/50 p-3 text-sm">
                <input type="checkbox" className="mt-0.5" {...register("seedDefaults")} defaultChecked />
                <span>
                  <span className="font-medium">Start with the standard form.</span> Pre-fills the
                  standard member &amp; family fields (Full Name, CNIC, DOB, Gender…) and default
                  documents (CNIC, B-Form, FRC). You can edit everything afterwards.
                </span>
              </label>
            )}

            {serverError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/programmes")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save" : "Create & configure"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
