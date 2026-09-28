import { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Download, Info, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { ResumePreview, ResumePrintSheet } from "@/components/ResumePreview";
import type { AnalysisResult } from "@/lib/analysis-types";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "success" | "warning" | "danger" | "neutral" }) {
  const styles = {
    success: "border-success/30 bg-success-soft text-success",
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-destructive/30 bg-destructive-soft text-destructive",
    neutral: "border-border bg-secondary text-secondary-foreground",
  }[tone];
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold break-words ${styles}`}>
      {children}
    </span>
  );
}

export function AnalysisResults({
  result,
  onRestart,
}: {
  result: AnalysisResult;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.optimizedResume);
      setCopied(true);
      toast.success("Currículo copiado para a área de transferência.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar", {
        description: "Selecione o texto do currículo e copie manualmente.",
      });
    }
  };

  const handleExport = () => {
    try {
      window.print();
    } catch {
      toast.error("Não foi possível exportar o PDF", {
        description: "Tente novamente ou use a opção de imprimir do navegador.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Resultado da análise</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Veja como seu currículo está alinhado à vaga e quais pontos podem ser melhorados.
          </p>
        </div>
        <Button variant="outline" onClick={onRestart} className="w-full sm:w-auto">
          <RotateCcw className="size-4" aria-hidden />
          Nova análise
        </Button>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
          <ScoreGauge score={result.matchScore} />
          <div className="flex-1 space-y-3">
            {result.jobTitle ? (
              <p className="text-sm font-semibold text-primary-dark">Vaga analisada: {result.jobTitle}</p>
            ) : null}
            <p className="text-sm text-foreground">{result.summary}</p>
            <p className="rounded-lg border border-border bg-primary-soft p-3 text-xs text-primary-dark">
              Este resultado é uma estimativa baseada no conteúdo informado e não representa a decisão de
              um sistema ATS real ou de um recrutador.
            </p>
          </div>
        </div>
      </section>

      <Section
        title="Palavras-chave da vaga"
        description="Termos relevantes da vaga comparados ao conteúdo do seu currículo."
      >
        <div className="space-y-6">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
              Encontradas ({result.keywordsFound.length})
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.keywordsFound.length ? (
                result.keywordsFound.map((item) => (
                  <Tag key={item.term} tone="success">
                    {item.term}
                  </Tag>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma palavra-chave da vaga foi identificada no currículo.
                </p>
              )}
            </div>
            {result.keywordsFound.some((item) => item.evidence) ? (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {result.keywordsFound
                  .filter((item) => item.evidence)
                  .map((item) => (
                    <li key={`ev-${item.term}`}>
                      <span className="font-semibold text-foreground">{item.term}:</span> {item.evidence}
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>

          {result.keywordsPartial.length ? (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-warning" aria-hidden />
                Parcialmente relacionadas ({result.keywordsPartial.length})
              </h3>
              <ul className="mt-3 space-y-2">
                {result.keywordsPartial.map((item) => (
                  <li key={item.term} className="rounded-lg border border-warning/30 bg-warning-soft p-3">
                    <Tag tone="warning">{item.term}</Tag>
                    {item.note ? <p className="mt-2 text-xs text-foreground">{item.note}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <XCircle className="size-4 text-destructive" aria-hidden />
              Não encontradas ({result.keywordsMissing.length})
            </h3>
            {result.keywordsMissing.length ? (
              <>
                <ul className="mt-3 space-y-2">
                  {result.keywordsMissing.map((item) => (
                    <li
                      key={item.term}
                      className="rounded-lg border border-destructive/30 bg-destructive-soft p-3"
                    >
                      <Tag tone="danger">{item.term}</Tag>
                      {item.explanation ? (
                        <p className="mt-2 text-xs text-foreground">{item.explanation}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Essas competências não foram adicionadas ao currículo otimizado, porque não constam no
                  currículo original.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhuma lacuna relevante foi identificada.
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Competências identificadas" description="Baseadas exclusivamente nos textos informados.">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Competências técnicas</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.technicalSkills.length ? (
                result.technicalSkills.map((skill) => (
                  <Tag key={skill} tone="neutral">
                    {skill}
                  </Tag>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma identificada.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Competências comportamentais</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.softSkills.length ? (
                result.softSkills.map((skill) => (
                  <Tag key={skill} tone="neutral">
                    {skill}
                  </Tag>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma identificada.</p>
              )}
            </div>
          </div>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="O que já está bem alinhado">
          <ul className="space-y-3">
            {result.strengths.length ? (
              result.strengths.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">
                Não identificamos pontos de correspondência claros.
              </li>
            )}
          </ul>
        </Section>

        <Section title="O que pode ser melhorado">
          <ul className="space-y-3">
            {result.improvements.length ? (
              result.improvements.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">Nenhuma sugestão adicional.</li>
            )}
          </ul>
        </Section>
      </div>

      <Section
        title="Seu currículo otimizado"
        description="Mesmas informações do seu currículo, reorganizadas em um formato de leitura simples para ATS."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="size-4" aria-hidden />
            Exportar currículo em PDF
          </Button>
          <Button variant="outline" onClick={handleCopy} className="w-full sm:w-auto">
            <Copy className="size-4" aria-hidden />
            {copied ? "Copiado!" : "Copiar currículo"}
          </Button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Ao exportar, escolha "Salvar como PDF" na janela de impressão do navegador.
        </p>
        <div className="mt-5">
          <ResumePreview content={result.optimizedResume} />
          <ResumePrintSheet content={result.optimizedResume} />
        </div>
      </Section>

      <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Importante:</strong> o JobMatch ATS ajuda a melhorar a
        compatibilidade textual e a organização do currículo. O resultado não garante aprovação em um ATS,
        entrevista ou contratação.
      </p>

      <div className="flex justify-center pb-4">
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw className="size-4" aria-hidden />
          Nova análise
        </Button>
      </div>
    </div>
  );
}
