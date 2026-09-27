import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardPaste, FileCheck2, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobMatch ATS — Adapte seu currículo para a vaga" },
      {
        name: "description",
        content:
          "Compare seu currículo com uma descrição de vaga, veja palavras-chave encontradas e ausentes e gere uma versão ATS-friendly sem inventar informações.",
      },
      { property: "og:title", content: "JobMatch ATS — Adapte seu currículo para a vaga" },
      {
        property: "og:description",
        content:
          "Descubra o que falta no seu currículo para uma vaga específica e gere uma versão mais preparada para sistemas de triagem.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    icon: ClipboardPaste,
    title: "1. Cole a vaga",
    text: "Insira a descrição da oportunidade que deseja analisar.",
  },
  {
    icon: Target,
    title: "2. Analise seu currículo",
    text: "Compare seu currículo com os requisitos da vaga.",
  },
  {
    icon: FileCheck2,
    title: "3. Otimize seu currículo",
    text: "Receba uma versão mais organizada e alinhada à vaga, sem inventar informações.",
  },
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
              <Sparkles className="size-3.5" aria-hidden />
              Análise de compatibilidade currículo × vaga
            </span>
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.1]">
              Seu currículo está preparado para passar pelo ATS?
            </h1>
            <p className="mt-5 text-base text-muted-foreground sm:text-lg">
              Compare seu currículo com uma vaga, descubra o que está faltando e gere uma versão mais
              preparada para sistemas de triagem.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/analisar">Começar análise</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/" hash="como-funciona">
                  Como funciona
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-border bg-card scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Como funciona</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Três passos simples, sem login e sem cadastro.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-border bg-background p-6 shadow-[var(--shadow-card)]"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-2xl border border-primary/25 bg-primary-soft p-6 sm:p-10">
            <span className="flex size-10 items-center justify-center rounded-lg bg-card text-primary">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-primary-dark sm:text-2xl">
              Seu currículo continua sendo seu.
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-foreground sm:text-base">
              O JobMatch ATS não inventa experiências ou competências. A ferramenta apenas melhora a forma
              como as informações existentes no seu currículo são apresentadas.
            </p>
            <Button asChild className="mt-6">
              <Link to="/analisar">Analisar meu currículo</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
