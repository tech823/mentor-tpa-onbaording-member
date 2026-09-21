import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { LANGUAGES, LANGUAGE_LABELS, type Language } from "@mentor/shared";
import { RTL_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

export interface Step {
  key: string;
  label: string;
}

interface Props {
  corporateName?: string;
  lang: Language;
  onLangChange: (l: Language) => void;
  steps?: Step[];
  currentStep?: number;
  children: ReactNode;
}

export function OnboardingLayout({ corporateName, lang, onLangChange, steps, currentStep = 0, children }: Props) {
  const dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-b from-accent/40 to-background">
      {/* Sticky top: brand + language + progress always visible while scrolling */}
      <div className="sticky top-0 z-40 border-b border-border/70 bg-background/85 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Mentor TPA" className="h-6 w-auto" />
              {corporateName && (
                <span className="border-s border-border ps-2.5 text-sm font-medium text-muted-foreground">
                  {corporateName}
                </span>
              )}
            </div>
            <select
              value={lang}
              onChange={(e) => onLangChange(e.target.value as Language)}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              aria-label="Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </select>
          </div>

          {steps && (
            <div className="pb-3">
              <ol className="flex items-center gap-1">
                {steps.map((s, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <li key={s.key} className="flex flex-1 items-center gap-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                          done && "bg-primary text-primary-foreground",
                          active && "border-2 border-primary text-primary",
                          !done && !active && "bg-muted text-muted-foreground"
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : i + 1}
                      </div>
                      {i < steps.length - 1 && (
                        <div className={cn("h-0.5 flex-1 rounded", done ? "bg-primary" : "bg-muted")} />
                      )}
                    </li>
                  );
                })}
              </ol>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{steps[currentStep]?.label}</p>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
