import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BriefingView } from "@/components/BriefingView";

function mockBriefing(overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    content: "## NBA\nBig trade today.",
    sources: [{ title: "ESPN", url: "https://espn.com/x" }],
    generatedAt: "2026-07-31T10:00:00Z",
    cached: true,
    limitReached: false,
    ...overrides,
  }), { status: 200 });
}

describe("BriefingView", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders briefing content and sources", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockBriefing()));
    render(<BriefingView topicId="t1" />);
    await waitFor(() => expect(screen.getByText(/Big trade today/)).toBeDefined());
    expect(screen.getByText("ESPN")).toBeDefined();
  });

  it("shows a limit-reached note when limitReached is true", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockBriefing({ limitReached: true })));
    render(<BriefingView topicId="t1" />);
    await waitFor(() => expect(screen.getByText(/daily limit reached/i)).toBeDefined());
  });

  it("refetches with refresh=true when Refresh is clicked", async () => {
    const fetchMock = vi.fn(async () => mockBriefing());
    vi.stubGlobal("fetch", fetchMock);
    render(<BriefingView topicId="t1" />);
    await waitFor(() => expect(screen.getByText(/Big trade today/)).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("refresh=true")),
    );
  });
});
