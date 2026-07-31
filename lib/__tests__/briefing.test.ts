import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create },
  })),
}));

import { buildPrompt, parseResponse, generateBriefing } from "@/lib/briefing";

describe("buildPrompt", () => {
  it("includes the title", () => {
    expect(buildPrompt("NBA")).toContain("NBA");
  });
  it("includes the description when provided", () => {
    expect(buildPrompt("NBA", "focus on the Warriors")).toContain("focus on the Warriors");
  });
});

describe("parseResponse", () => {
  it("concatenates text blocks and maps citations to deduped sources", () => {
    const content = [
      { type: "server_tool_use", id: "s1", name: "web_search", input: { query: "nba" } },
      { type: "web_search_tool_result", tool_use_id: "s1", content: [] },
      { type: "text", text: "Big trade today. " },
      {
        type: "text",
        text: "The Warriors made a move.",
        citations: [
          { type: "web_search_result_location", url: "https://espn.com/x", title: "ESPN", cited_text: "..." },
          { type: "web_search_result_location", url: "https://espn.com/x", title: "ESPN", cited_text: "dupe" },
          { type: "web_search_result_location", url: "https://theathletic.com/y", title: "The Athletic", cited_text: "..." },
        ],
      },
    ];
    const out = parseResponse(content);
    expect(out.content).toBe("Big trade today. The Warriors made a move.");
    expect(out.sources).toEqual([
      { title: "ESPN", url: "https://espn.com/x" },
      { title: "The Athletic", url: "https://theathletic.com/y" },
    ]);
  });

  it("returns empty content and no sources when there are no text blocks", () => {
    expect(parseResponse([{ type: "server_tool_use", id: "s1", name: "web_search", input: {} }])).toEqual({
      content: "",
      sources: [],
    });
  });

  it("returns empty for malformed input", () => {
    expect(parseResponse(null)).toEqual({ content: "", sources: [] });
  });
});

describe("generateBriefing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns content and sources from the model response", async () => {
    create.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "Here is what's new about the NBA.",
          citations: [
            { type: "web_search_result_location", url: "https://espn.com/x", title: "ESPN", cited_text: "..." },
          ],
        },
      ],
    });
    const out = await generateBriefing("NBA");
    expect(out.content).toContain("NBA");
    expect(out.sources).toEqual([{ title: "ESPN", url: "https://espn.com/x" }]);
  });

  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(generateBriefing("NBA")).rejects.toThrow("ANTHROPIC_API_KEY is not set");
  });

  it("propagates API errors to the caller", async () => {
    create.mockRejectedValue(new Error("rate limited"));
    await expect(generateBriefing("NBA")).rejects.toThrow("rate limited");
  });

  it("throws when the model returns empty content", async () => {
    create.mockResolvedValue({
      content: [{ type: "text", text: "   \n\t  " }],
    });
    await expect(generateBriefing("NBA")).rejects.toThrow("Claude returned empty content");
  });
});
