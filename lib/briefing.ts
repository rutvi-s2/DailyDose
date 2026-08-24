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

  return { content: joinTextBlocks(textParts), sources };
}

// The web_search tool makes Claude emit MANY small text blocks — often one per
// cited sentence, plus tiny connectors like "." or " and". These are pieces of
// continuous prose, so they must be joined with a space, not a blank line, or
// the briefing shatters into one-fragment-per-line. The exception: a block that
// begins a new markdown construct (heading, list item, blockquote, hr) needs a
// blank line before it so it renders as a block instead of being glued onto the
// previous sentence (e.g. "...One Night Only## Streaming").
function joinTextBlocks(parts: string[]): string {
  // Does a fragment begin (after any leading whitespace) a new markdown block?
  const startsMarkdownBlock = (s: string) =>
    /^\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>|\|)/.test(s);
  // Does the fragment's meaningful content start with trailing punctuation that
  // belongs to the PREVIOUS sentence (e.g. a lone "." or ".\n\nNext...")?
  const startsWithClosingPunct = (s: string) => /^\s*[.,;:!?)]/.test(s);

  let out = "";
  let prev = "";
  for (const raw of parts) {
    if (!out) {
      out = raw;
      prev = raw;
      continue;
    }

    // A trailing "." (etc.) — possibly wrapped in newlines like "\n\n." — is the
    // end of the previous sentence. Glue it directly, no space, no line break.
    if (startsWithClosingPunct(raw)) {
      out += raw.trimStart();
      prev = raw;
      continue;
    }

    // A blank line only around real block-level constructs (a heading needs one
    // before AND after). Everything else is continuous prose → single space.
    const needsBreak = startsMarkdownBlock(raw) || startsMarkdownBlock(prev);
    out += (needsBreak ? "\n\n" : " ") + raw.trim();
    prev = raw;
  }
  return out;
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
