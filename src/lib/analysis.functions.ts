import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnalysisResult } from "./analysis-types";
import { MIN_CONTENT_LENGTH } from "./analysis-types";

const inputSchema = z.object({
  jobDescription: z.string().min(MIN_CONTENT_LENGTH),
  resume: z.string().min(MIN_CONTENT_LENGTH),
});

/** Models sometimes label the keyword field `keyword`/`name`, or return a bare string. */
function keywordEntry(detailKeys: string[]) {
  return z.preprocess(
    (value) => {
      if (typeof value === "string") return { term: value, detail: "" };
      if (value && typeof value === "object") {
        const raw = value as Record<string, unknown>;
        const term = raw["term"] ?? raw["keyword"] ?? raw["name"] ?? raw["palavra"] ?? "";
        let detail: unknown = "";
        for (const key of [...detailKeys, "detail", "description", "explicacao", "nota"]) {
          if (typeof raw[key] === "string" && raw[key]) {
            detail = raw[key];
            break;
          }
        }
        return { term: String(term), detail: typeof detail === "string" ? detail : "" };
      }
      return { term: "", detail: "" };
    },
    z.object({ term: z.string(), detail: z.string().default("") }),
  );
}

const stringList = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value.map((item) =>
          typeof item === "string"
            ? item
            : String(
                (item as Record<string, unknown>)?.["name"] ??
                  (item as Record<string, unknown>)?.["term"] ??
                  (item as Record<string, unknown>)?.["skill"] ??
                  "",
              ),
        )
      : [],
  z.array(z.string()).transform((items) => items.filter(Boolean)),
);

const resultSchema = z.object({
  matchScore: z.coerce.number().min(0).max(100),
  jobTitle: z.string().default(""),
  summary: z.string().default(""),
  keywordsFound: z.array(keywordEntry(["evidence", "evidencia"])).default([]),
  keywordsPartial: z.array(keywordEntry(["note", "observacao"])).default([]),
  keywordsMissing: z.array(keywordEntry(["explanation", "reason"])).default([]),
  technicalSkills: stringList.default([]),
  softSkills: stringList.default([]),
  strengths: stringList.default([]),
  improvements: stringList.default([]),
  optimizedResume: z.string(),
});

const SYSTEM_PROMPT = `Você é um especialista em recrutamento técnico e em sistemas ATS (Applicant Tracking Systems).
Sua tarefa é comparar uma DESCRIÇÃO DE VAGA com o CURRÍCULO de um candidato e devolver uma análise em português do Brasil.

REGRA ABSOLUTA E INVIOLÁVEL:
Você NUNCA pode inventar experiências, cargos, empresas, projetos, tecnologias, ferramentas, certificações, formações, resultados, números, datas ou competências que não estejam explicitamente presentes no currículo fornecido.
- Não aumente tempo de experiência nem altere datas.
- Não insira palavras-chave ausentes no currículo otimizado como se fossem competências do candidato.
- Você PODE reorganizar, reescrever com linguagem mais profissional, destacar o que já existe e usar termos da vaga somente quando houver correspondência real com o conteúdo original.
- Se algo exigido pela vaga não existir no currículo, isso vai apenas para "keywordsMissing" e "improvements", jamais para o currículo otimizado.

Classifique cada palavra-chave relevante da vaga como:
- keywordsFound: presente ou claramente representada no currículo (cite a evidência do currículo em "evidence").
- keywordsPartial: algo relacionado/semelhante aparece, mas não é exatamente o requisito (explique em "note").
- keywordsMissing: requisito relevante da vaga que não aparece no currículo (explique em "explanation").
Não trate palavras apenas parecidas como correspondência perfeita: considere o contexto.

matchScore: inteiro de 0 a 100 estimando a compatibilidade textual entre requisitos/competências/palavras-chave da vaga e o currículo.

optimizedResume: texto puro, uma única coluna, ATS-friendly, sem tabelas, sem colunas, sem gráficos, sem barras de habilidades e sem ícones.
Use seções em MAIÚSCULAS somente quando a informação existir no currículo original, na ordem:
NOME (primeira linha, sem rótulo), CONTATO, RESUMO PROFISSIONAL, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO ACADÊMICA, COMPETÊNCIAS, CERTIFICAÇÕES, PROJETOS.
Use marcadores com "- " nas listas. Preserve todos os fatos do currículo original.

Responda SOMENTE com um objeto JSON válido, sem markdown e sem comentários, com exatamente estas chaves:
matchScore, jobTitle, summary, keywordsFound, keywordsPartial, keywordsMissing, technicalSkills, softSkills, strengths, improvements, optimizedResume.
"technicalSkills" e "softSkills" são arrays de strings identificadas nos textos fornecidos. "strengths" e "improvements" são arrays de frases curtas baseadas exclusivamente no conteúdo fornecido.`;

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("Resposta sem JSON válido");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI_UNAVAILABLE");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `### DESCRIÇÃO DA VAGA\n${data.jobDescription.slice(0, 20000)}\n\n### CURRÍCULO DO CANDIDATO\n${data.resume.slice(0, 20000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("AI gateway error", response.status, detail.slice(0, 500));
      throw new Error(response.status === 429 ? "AI_RATE_LIMIT" : "AI_ERROR");
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI_EMPTY");

    const validation = resultSchema.safeParse(extractJson(content));
    if (!validation.success) {
      console.error("AI result validation failed", JSON.stringify(validation.error.issues).slice(0, 800));
      console.error("AI raw content", content.slice(0, 1500));
      throw new Error("AI_SHAPE");
    }
    const parsed = validation.data;
    return {
      matchScore: Math.max(0, Math.min(100, Math.round(parsed.matchScore))),
      jobTitle: parsed.jobTitle,
      summary: parsed.summary,
      keywordsFound: parsed.keywordsFound
        .filter((item) => item.term)
        .map((item) => ({ term: item.term, evidence: item.detail })),
      keywordsPartial: parsed.keywordsPartial
        .filter((item) => item.term)
        .map((item) => ({ term: item.term, note: item.detail })),
      keywordsMissing: parsed.keywordsMissing
        .filter((item) => item.term)
        .map((item) => ({ term: item.term, explanation: item.detail })),
      technicalSkills: parsed.technicalSkills,
      softSkills: parsed.softSkills,
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      optimizedResume: parsed.optimizedResume,
    };
  });
