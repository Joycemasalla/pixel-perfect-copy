import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnalysisResult } from "./analysis-types";
import { MIN_CONTENT_LENGTH } from "./analysis-types";

const inputSchema = z.object({
  jobDescription: z.string().min(MIN_CONTENT_LENGTH),
  resume: z.string().min(MIN_CONTENT_LENGTH),
});

const resultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  jobTitle: z.string().default(""),
  summary: z.string(),
  keywordsFound: z.array(z.object({ term: z.string(), evidence: z.string().default("") })).default([]),
  keywordsPartial: z.array(z.object({ term: z.string(), note: z.string().default("") })).default([]),
  keywordsMissing: z.array(z.object({ term: z.string(), explanation: z.string().default("") })).default([]),
  technicalSkills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
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
        model: "google/gemini-3.8-flash",
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

    const parsed = resultSchema.parse(extractJson(content));
    return {
      ...parsed,
      matchScore: Math.max(0, Math.min(100, Math.round(parsed.matchScore))),
    };
  });
