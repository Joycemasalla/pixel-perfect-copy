import { Link } from "@tanstack/react-router";
import { FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileSearch className="size-4" aria-hidden />
          </span>
          <span className="text-base font-bold tracking-tight">JobMatch ATS</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navegação principal">
          <Link
            to="/"
            hash="como-funciona"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Como funciona
          </Link>
          <Link
            to="/analisar"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Analisar currículo
          </Link>
          <Button asChild size="sm">
            <Link to="/analisar">Analisar meu currículo</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="font-semibold text-foreground">JobMatch ATS</p>
        <p className="mt-2 max-w-2xl">
          Ferramenta de apoio à organização e à compatibilidade textual do currículo. O resultado não
          garante aprovação em um ATS, entrevista ou contratação.
        </p>
      </div>
    </footer>
  );
}
