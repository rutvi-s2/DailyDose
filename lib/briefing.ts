import Anthropic from "@anthropic-ai/sdk";

export type Source = { title: string; url: string };
export type GeneratedBriefing = { content: string; sources: Source[] };

// Haiku is plenty for summarizing search results into a short briefing and
// keeps per-briefing cost to a fraction of a cent. Bump to a larger model here
// if you want richer output.
const MODEL = "claude-haiku-4-5";

// Cap searches per briefing so a single generation can't rack up many billed
// web searches ($10 / 1000).
const MAX_SEARCHES = 3;

const SYSTEM_INSTRUCTION =
  "You write concise, current daily briefings. Search the web for the latest " +
  "information, then lead with what is new or notable. Be factual, cite your " +
  "sources, and keep it under ~400 words. Use short markdown sections. If little " +
  "is new, say so plainly. Do not use em dashes. Output only the briefing itself: " +
  "no preamble, no meta commentary about searching or what you are about to do, " +
  "and no closing remarks. Start directly with the first markdown heading.";

export function buildPrompt(title: string, description?: string | null): string {
  const lines = [`Write today's briefing about: ${title}.`];
  if (description && description.trim()) {
    lines.push(`The reader specifically wants to know: ${description.trim()}.`);
  }
  lines.push("Summarize the most recent, relevant developments.");
  return lines.join("\n");
}

// Extract the briefing text (all `text` blocks concatenated) and the cited
// sources (from `web_search_result_location` citations on those text blocks),
// deduped by URL, from a Messages API response `content` array.
export function parseResponse(content: unknown): GeneratedBriefing {
  const blocks = Array.isArray(content) ? content : [];
  const textParts: string[] = [];
  const sources: Source[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    if ((block as any)?.type !== "text") continue;
    const text = (block as any).text;
    if (typeof text === "string" && text.trim()) textParts.push(text.trim());

    const citations = (block as any).citations;
    if (!Array.isArray(citations)) continue;
    for (const c of citations) {
      const url = c?.url;
      if (typeof url === "string" && url && !seen.has(url)) {
        seen.add(url);
        sources.push({ title: c.title ?? url, url });
      }
    }
  }

  // Join separate text blocks with a blank line. The web_search tool sometimes
  // makes Claude emit a short lead-in block before the briefing; joining with
  // "" would glue it onto the first heading (e.g. "...for you.## Title") and
  // break the markdown. A blank line keeps blocks as distinct paragraphs.
  return { content: textParts.join("\n\n"), sources };
}

export async function generateBriefing(
  title: string,
  description?: string | null,
): Promise<GeneratedBriefing> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_INSTRUCTION,
    messages: [{ role: "user", content: buildPrompt(title, description) }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES }],
  });

  const { content, sources } = parseResponse(message.content);
  if (content === "") throw new Error("Claude returned empty content");
  return { content, sources };
}
