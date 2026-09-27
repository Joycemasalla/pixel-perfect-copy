import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Lendo os requisitos da vaga",
  "Identificando palavras-chave",
  "Comparando com seu currículo",
  "Identificando oportunidades de melhoria",
  "Preparando seu currículo ATS-friendly",
];

export function AnalysisProgress() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current < STEPS.length - 1 ? current + 1 : current));
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-live="polite"
      className="mx-auto w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <h2 className="text-xl font-bold tracking-tight">Analisando seu currículo...</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Isso costuma levar alguns segundos. Não feche esta página.
      </p>

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <li
              key={step}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors ${
                current
                  ? "border-primary/40 bg-primary-soft text-foreground"
                  : done
                    ? "border-success/30 bg-success-soft text-foreground"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                {done ? (
                  <Check className="size-4 text-success" aria-hidden />
                ) : current ? (
                  <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
                ) : (
                  <span className="size-2 rounded-full bg-border" aria-hidden />
                )}
              </span>
              <span className={current ? "font-medium" : undefined}>{step}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
