import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, HeartPulse, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Language, FieldValueInput } from "@mentor/shared";
import { onboardingApi, type OnboardingConfig, type SubmissionState } from "@/features/onboarding/onboarding.api";
import type { FormField, ProgrammeDocument } from "@/features/forms/forms.api";
import { hydrateValues } from "@/features/onboarding/state-utils";
import { compressImageFile } from "@/lib/image";
import { getStoredLanguage } from "@/i18n";
import { ApiRequestError } from "@/lib/api";
import { OnboardingLayout, type Step } from "./OnboardingLayout";
import { PersonalStep } from "./steps/PersonalStep";
import { FamilyStep } from "./steps/FamilyStep";
import { DocumentsStep } from "./steps/DocumentsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEPS: Step[] = [
  { key: "personal", label: "Personal Information" },
  { key: "family", label: "Family Members" },
  { key: "documents", label: "Documents" },
  { key: "review", label: "Review & Submit" },
];

type Phase = "loading" | "error" | "welcome" | "form" | "done";

export function OnboardingPage() {
  const { token = "" } = useParams();
  const storageKey = `mo_ob_session_${token}`;

  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [state, setState] = useState<SubmissionState | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [documents, setDocuments] = useState<ProgrammeDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [closed, setClosed] = useState(false);

  // The wizard step lives in the URL (?step=) so the browser/phone Back button
  // moves ONE step back instead of dropping the member to the first page.
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();
  const clampStep = (i: number) => Math.min(Math.max(Number.isFinite(i) ? i : 0, 0), STEPS.length - 1);
  const stepIndex = clampStep(Number(new URLSearchParams(location.search).get("step") ?? 0));
  const goStep = (i: number, replace = false) => {
    const next = new URLSearchParams(window.location.search);
    next.set("step", String(clampStep(i)));
    setSearchParams(next, { replace });
  };
  const [submitErrors, setSubmitErrors] = useState<Record<string, string[]> | undefined>();

  const configQuery = useQuery({
    queryKey: ["onboarding-config", token],
    queryFn: () => onboardingApi.getConfig(token),
    retry: false,
  });

  const config: OnboardingConfig | undefined = configQuery.data?.data ?? undefined;

  // Try to resume an existing session on load.
  useEffect(() => {
    if (!config) return;
    setFields(config.fields);
    setDocuments(config.documents);
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      setPhase("welcome");
      return;
    }
    onboardingApi
      .resume(stored)
      .then((res) => {
        setSessionToken(stored);
        setState(res.data!.submission);
        setFields(res.data!.fields);
        setDocuments(res.data!.documents);
        setLang(res.data!.session.language);
        setPhase("form");
      })
      .catch(() => {
        localStorage.removeItem(storageKey);
        setPhase("welcome");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (configQuery.isError) setPhase("error");
  }, [configQuery.isError]);

  const start = async () => {
    setSaving(true);
    try {
      const res = await onboardingApi.start(token, lang);
      const st = res.data!.sessionToken;
      localStorage.setItem(storageKey, st);
      setSessionToken(st);
      const resumed = await onboardingApi.resume(st);
      setState(resumed.data!.submission);
      setFields(resumed.data!.fields);
      setDocuments(resumed.data!.documents);
      goStep(0, true); // start at step 0, replacing the welcome entry
      setPhase("form");
    } finally {
      setSaving(false);
    }
  };

  const memberInitial = useMemo(
    () => (state ? hydrateValues(fields.filter((f) => f.subjectType === "MEMBER"), state.fieldValues) : {}),
    [state, fields]
  );

  const savePersonal = async (values: FieldValueInput[]) => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      const res = await onboardingApi.saveMember(sessionToken, values, lang);
      setState(res.data!);
      goStep(1);
    } finally {
      setSaving(false);
    }
  };

  const addFamily = async (values: FieldValueInput[]) => {
    const res = await onboardingApi.addFamily(sessionToken!, values);
    setState(res.data!);
  };
  const updateFamily = async (familyId: string, values: FieldValueInput[]) => {
    const res = await onboardingApi.updateFamily(sessionToken!, familyId, values);
    setState(res.data!);
  };
  const removeFamily = async (familyId: string) => {
    const res = await onboardingApi.removeFamily(sessionToken!, familyId);
    setState(res.data!);
  };

  const uploadDoc = async (programmeDocumentId: string, familyMemberId: string | undefined, file: File) => {
    // Shrink large photos in-browser so uploads pass server limits and save disk.
    const toSend = await compressImageFile(file);
    const form = new FormData();
    form.append("file", toSend);
    form.append("programmeDocumentId", programmeDocumentId);
    if (familyMemberId) form.append("familyMemberId", familyMemberId);
    const doc = await onboardingApi.uploadDocument(sessionToken!, form);
    setState((s) => (s ? { ...s, documents: [...s.documents, doc] } : s));
  };
  const removeDoc = async (docId: string) => {
    await onboardingApi.removeDocument(sessionToken!, docId);
    setState((s) => (s ? { ...s, documents: s.documents.filter((d) => d.id !== docId) } : s));
  };

  const submit = async () => {
    if (!sessionToken) return;
    setSaving(true);
    setSubmitErrors(undefined);
    try {
      await onboardingApi.submit(sessionToken);
      localStorage.removeItem(storageKey);
      setPhase("done");
    } catch (err) {
      if (err instanceof ApiRequestError) setSubmitErrors(err.details ?? { _: [err.message] });
    } finally {
      setSaving(false);
    }
  };

  // ---------- render ----------
  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === "error") {
    const msg = configQuery.error instanceof ApiRequestError ? configQuery.error.message : "This link is not available.";
    return (
      <OnboardingLayout lang={lang} onLangChange={setLang}>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h2 className="text-lg font-semibold">Link unavailable</h2>
            <p className="text-muted-foreground">{msg}</p>
          </CardContent>
        </Card>
      </OnboardingLayout>
    );
  }

  if (phase === "done") {
    // Browsers only allow window.close() on script-opened tabs. Try it, and if the
    // tab stays open, switch to a clean "you may close now" screen for clear feedback.
    const handleClose = () => {
      window.open("", "_self");
      window.close();
      setClosed(true);
    };

    if (closed) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
          <CheckCircle2 className="h-14 w-14 text-success" />
          <h2 className="text-xl font-semibold">Thank you!</h2>
          <p className="text-muted-foreground">Your submission is complete. You can now close this tab.</p>
        </div>
      );
    }

    return (
      <OnboardingLayout lang={lang} onLangChange={setLang} corporateName={config?.programme.corporate.name}>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="h-14 w-14 text-success" />
            <h2 className="text-xl font-semibold">Submission complete</h2>
            <p className="text-muted-foreground">
              Thank you. Your information for <strong>{config?.programme.name}</strong> has been submitted successfully.
              Our team will review it shortly.
            </p>
            <Button size="lg" className="mt-2 w-full max-w-xs" onClick={handleClose}>
              Close
            </Button>
          </CardContent>
        </Card>
      </OnboardingLayout>
    );
  }

  if (phase === "welcome") {
    return (
      <OnboardingLayout lang={lang} onLangChange={setLang} corporateName={config?.programme.corporate.name}>
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <HeartPulse className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{config?.programme.name}</h1>
            {config?.programme.description && (
              <p className="text-muted-foreground">{config.programme.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              You'll enter your details, add family members, and upload documents. You can pick your
              preferred language at the top-right at any time.
            </p>
            <Button size="lg" className="w-full" onClick={start} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Get started
            </Button>
          </CardContent>
        </Card>
      </OnboardingLayout>
    );
  }

  // phase === "form"
  return (
    <OnboardingLayout
      lang={lang}
      onLangChange={setLang}
      corporateName={config?.programme.corporate.name}
      steps={STEPS}
      currentStep={stepIndex}
    >
      {stepIndex === 0 && (
        <PersonalStep fields={fields} lang={lang} initialValues={memberInitial} saving={saving} onNext={savePersonal} />
      )}
      {stepIndex === 1 && state && (
        <FamilyStep
          fields={fields}
          lang={lang}
          familyMembers={state.familyMembers}
          onAdd={addFamily}
          onUpdate={updateFamily}
          onRemove={removeFamily}
          onNext={() => goStep(2)}
          onBack={() => window.history.back()}
        />
      )}
      {stepIndex === 2 && state && (
        <DocumentsStep
          documents={documents}
          familyMembers={state.familyMembers}
          uploaded={state.documents}
          onUpload={uploadDoc}
          onRemove={removeDoc}
          onNext={() => goStep(3)}
          onBack={() => window.history.back()}
        />
      )}
      {stepIndex === 3 && state && (
        <ReviewStep
          fields={fields}
          lang={lang}
          state={state}
          submitting={saving}
          submitErrors={submitErrors}
          onSubmit={submit}
          onBack={() => window.history.back()}
        />
      )}
    </OnboardingLayout>
  );
}
