import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Lock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisResults } from "@/components/AnalysisResults";
import { analyzeResume } from "@/lib/analysis.functions";
import { MIN_CONTENT_LENGTH, type AnalysisResult } from "@/lib/analysis-types";

export const Route = createFileRoute("/analisar")({
  head: () => ({
    meta: [
      { title: "Analisar currículo — JobMatch ATS" },
      {
        name: "description",
        content:
          "Cole a descrição da vaga e o seu currículo para ver o percentual de compatibilidade, palavras-chave e uma versão ATS-friendly.",
      },
      { property: "og:title", content: "Analisar currículo — JobMatch ATS" },
      {
        property: "og:description",
        content: "Compare vaga e currículo e gere uma versão ATS-friendly sem inventar informações.",
      },
    ],
  }),
  component: AnalyzePage,
});

type FieldErrors = {
  jobDescription?: string;
  resume?: string;
};

function AnalyzePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useServerFn(analyzeResume);

  const mutation = useMutation({
    mutationFn: (payload: { jobDescription: string; resume: string }) =>
      analyze({ data: payload }) as Promise<AnalysisResult>,
    onSuccess: (data) => setResult(data),
  });

  const validate = () => {
    const next: FieldErrors = {};
    if (!jobDescription.trim()) next.jobDescription = "Cole a descrição da vaga para continuar.";
    else if (jobDescription.trim().length < MIN_CONTENT_LENGTH)
      next.jobDescription = "A descrição da vaga está muito curta. Inclua os requisitos completos.";

    if (!resume.trim()) next.resume = "Cole o conteúdo do seu currículo para continuar.";
    else if (resume.trim().length < MIN_CONTENT_LENGTH)
      next.resume = "Seu currículo está muito curto. Inclua experiências, formação e competências.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate({ jobDescription: jobDescription.trim(), resume: resume.trim() });
  };

  const handleRestart = () => {
    setResult(null);
    mutation.reset();
    setJobDescription("");
    setResume("");
    setAccepted(false);
    setErrors({});
    window.scrollTo({ top: 0 });
  };

  const canSubmit =
    accepted &&
    jobDescription.trim().length >= MIN_CONTENT_LENGTH &&
    resume.trim().length >= MIN_CONTENT_LENGTH;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {result ? (
          <AnalysisResults result={result} onRestart={handleRestart} />
        ) : mutation.isPending ? (
          <AnalysisProgress />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analisar currículo</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Cole a vaga e o seu currículo. A análise acontece na hora, sem login e sem armazenamento.
            </p>

            <p className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-primary-soft p-3 text-xs text-primary-dark">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Seus dados são utilizados para realizar esta análise. Não compartilhe informações que você
              não deseja processar.
            </p>

            {mutation.isError ? (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-destructive/30 bg-destructive-soft p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertCircle className="size-4" aria-hidden />
                  Não foi possível concluir a análise
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Algo deu errado ao processar os dados. Tente novamente.
                </p>
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                <Label htmlFor="job-description" className="text-sm font-semibold">
                  Descrição da vaga
                </Label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Cole aqui a descrição completa da vaga..."
                  rows={14}
                  aria-invalid={Boolean(errors.jobDescription)}
                  aria-describedby="job-description-help"
                  className="mt-3 min-h-56 resize-y text-sm"
                />
                <p id="job-description-help" className="mt-2 text-xs text-muted-foreground">
                  {jobDescription.length} caracteres
                </p>
                {errors.jobDescription ? (
                  <p className="mt-1 text-xs font-medium text-destructive">{errors.jobDescription}</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                <Label htmlFor="resume" className="text-sm font-semibold">
                  Seu currículo
                </Label>
                <Textarea
                  id="resume"
                  value={resume}
                  onChange={(event) => setResume(event.target.value)}
                  placeholder="Cole aqui o conteúdo atual do seu currículo..."
                  rows={14}
                  aria-invalid={Boolean(errors.resume)}
                  aria-describedby="resume-help"
                  className="mt-3 min-h-56 resize-y text-sm"
                />
                <p id="resume-help" className="mt-2 text-xs text-muted-foreground">
                  {resume.length} caracteres
                </p>
                {errors.resume ? (
                  <p className="mt-1 text-xs font-medium text-destructive">{errors.resume}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Checkbox
                id="accept"
                checked={accepted}
                onCheckedChange={(value) => setAccepted(value === true)}
                className="mt-0.5"
              />
              <Label htmlFor="accept" className="text-sm leading-relaxed font-normal">
                Entendi que a ferramenta não deve inventar informações sobre minha experiência.
              </Label>
            </div>

            <Button type="submit" size="lg" disabled={!canSubmit} className="mt-6 w-full sm:w-auto">
              <Search className="size-4" aria-hidden />
              Analisar compatibilidade
            </Button>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
