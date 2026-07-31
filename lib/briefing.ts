import { GoogleGenerativeAI } from "@google/generative-ai";

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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    // Installed @google/generative-ai@0.21.0 types the Google Search grounding
    // tool as `googleSearchRetrieval` (not `googleSearch` as in newer SDKs).
    tools: [{ googleSearchRetrieval: {} } as any],
  });

  const result = await model.generateContent(buildPrompt(title, description));
  const content = result.response.text();
  const sources = parseGrounding(result.response.candidates?.[0]);
  return { content, sources };
}
