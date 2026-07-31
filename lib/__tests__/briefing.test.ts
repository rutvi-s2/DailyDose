import { describe, it, expect, vi, beforeEach } from "vitest";

const generateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent },
  })),
}));

import { buildPrompt, parseGrounding, generateBriefing } from "@/lib/briefing";

describe("buildPrompt", () => {
  it("includes the title", () => {
    expect(buildPrompt("NBA")).toContain("NBA");
  });
  it("includes the description when provided", () => {
    expect(buildPrompt("NBA", "focus on the Warriors")).toContain("focus on the Warriors");
  });
});

describe("parseGrounding", () => {
  it("maps grounding chunks to sources", () => {
    const candidate = {
      groundingMetadata: {
        groundingChunks: [
          { web: { title: "ESPN", uri: "https://espn.com/x" } },
          { web: { title: "The Athletic", uri: "https://theathletic.com/y" } },
        ],
      },
    };
    expect(parseGrounding(candidate)).toEqual([
      { title: "ESPN", url: "https://espn.com/x" },
      { title: "The Athletic", url: "https://theathletic.com/y" },
    ]);
  });
  it("returns [] when grounding metadata is absent", () => {
    expect(parseGrounding({})).toEqual([]);
  });
  it("returns [] for malformed input", () => {
    expect(parseGrounding(null)).toEqual([]);
  });
});

describe("generateBriefing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns content and sources from the model response", async () => {
    generateContent.mockResolvedValue({
      text: "Here is what's new about the NBA.",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [{ web: { title: "ESPN", uri: "https://espn.com/x" } }],
          },
        },
      ],
    });
    const out = await generateBriefing("NBA");
    expect(out.content).toContain("NBA");
    expect(out.sources).toEqual([{ title: "ESPN", url: "https://espn.com/x" }]);
  });

  it("propagates API errors to the caller", async () => {
    generateContent.mockRejectedValue(new Error("rate limited"));
    await expect(generateBriefing("NBA")).rejects.toThrow("rate limited");
  });

  it("throws when model returns empty content", async () => {
    generateContent.mockResolvedValue({
      text: "",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [{ web: { title: "ESPN", uri: "https://espn.com/x" } }],
          },
        },
      ],
    });
    await expect(generateBriefing("NBA")).rejects.toThrow("Gemini returned empty content");
  });

  it("throws when model returns whitespace-only content", async () => {
    generateContent.mockResolvedValue({
      text: "   \n\t  ",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [{ web: { title: "ESPN", uri: "https://espn.com/x" } }],
          },
        },
      ],
    });
    await expect(generateBriefing("NBA")).rejects.toThrow("Gemini returned empty content");
  });
});
