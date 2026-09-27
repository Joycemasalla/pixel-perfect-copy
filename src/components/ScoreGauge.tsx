type ScoreGaugeProps = {
  score: number;
};

function toneFor(score: number) {
  if (score >= 70) return { stroke: "var(--success)", label: "Boa compatibilidade" };
  if (score >= 45) return { stroke: "var(--warning)", label: "Compatibilidade parcial" };
  return { stroke: "var(--destructive)", label: "Compatibilidade baixa" };
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const tone = toneFor(score);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative size-40 sm:size-44"
        role="img"
        aria-label={`Compatibilidade estimada de ${score} por cento`}
      >
        <svg viewBox="0 0 160 160" className="size-full -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={tone.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums sm:text-5xl">{score}%</span>
          <span className="mt-1 text-xs font-medium text-muted-foreground">Compatibilidade</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">{tone.label} com a vaga</p>
    </div>
  );
}
