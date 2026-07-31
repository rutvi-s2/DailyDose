import { GoogleGenAI } from "@google/genai";

export type Source = { title: string; url: string };
export type GeneratedBriefing = { content: string; sources: Source[] };

const MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION =
  "You write concise, current daily briefings. Lead with what is new or notable. " +
  "Be factual, cite via the provided search grounding, and keep it under ~400 words. " +
  "Use short markdown sections. If little is new, say so plainly.";

export function buildPrompt(title: string, description?: string | null): string {
  const lines = [`Write today's briefing about: ${title}.`];
  if (description && description.trim()) {
    lines.push(`The reader specifically wants to know: ${description.trim()}.`);
  }
  lines.push("Summarize the most recent, relevant developments.");
  return lines.join("\n");
}

export function parseGrounding(candidate: unknown): Source[] {
  const chunks = (candidate as any)?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const sources: Source[] = [];
  for (const chunk of chunks) {
    const web = chunk?.web;
    if (web?.uri) {
      sources.push({ title: web.title ?? web.uri, url: web.uri });
    }
  }
  return sources;
}

export async function generateBriefing(
  title: string,
  description?: string | null,
): Promise<GeneratedBriefing> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(title, description),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      // gemini-2.5-flash requires the current `googleSearch` grounding tool
      // (the `googleSearchRetrieval` key is for the deprecated 1.5-era API).
      tools: [{ googleSearch: {} }],
    },
  });

  const content = result.text ?? "";
  const sources = parseGrounding(result.candidates?.[0]);
  return { content, sources };
}
