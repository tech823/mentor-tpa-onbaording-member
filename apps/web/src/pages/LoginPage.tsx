import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, ShieldCheck, Globe2, FileSpreadsheet } from "lucide-react";
import { loginSchema, type LoginInput } from "@mentor/shared";
import { useAuth } from "@/features/auth/useAuth";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function LoginPage() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await login(values);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) setServerError(err.message);
      else setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -end-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -start-10 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative">
          <img src="/logo-white.png" alt="Mentor TPA" className="h-9 w-auto" />
        </div>
        <div className="relative">
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/75">
            <span className="h-0.5 w-6 rounded bg-white/60" /> Corporate Onboarding, Digitized
          </span>
          <h1 className="text-4xl font-bold leading-tight">
            Member onboarding,{" "}
            <span style={{ color: "hsl(190 100% 78%)" }}>done right.</span>
          </h1>
          <p className="mt-3 max-w-md text-white/75">
            Configurable, secure, multilingual onboarding for your corporate health-coverage programmes.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15"><Globe2 className="h-4 w-4" /></span>
              Multilingual forms (English, اردو, سنڌي, پښتو)
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15"><ShieldCheck className="h-4 w-4" /></span>
              Secure document uploads &amp; verification
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15"><FileSpreadsheet className="h-4 w-4" /></span>
              One-click Excel export, standardized data
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Mentor TPA</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center bg-background p-6">
        <div className="absolute end-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <img src="/logo.png" alt="Mentor TPA" className="h-9 w-auto" />
          </div>
          <h2 className="text-2xl font-bold">{t("auth.signInTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {serverError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {serverError}
              </div>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("auth.signIn")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
