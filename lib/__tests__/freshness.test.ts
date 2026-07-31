import { describe, it, expect } from "vitest";
import { isFresh, FRESH_WINDOW_MS } from "@/lib/freshness";

describe("isFresh", () => {
  const now = new Date("2026-07-31T12:00:00Z");
  it("is fresh just under 24h old", () => {
    expect(isFresh(new Date(now.getTime() - FRESH_WINDOW_MS + 1000), now)).toBe(true);
  });
  it("is stale at exactly 24h old", () => {
    expect(isFresh(new Date(now.getTime() - FRESH_WINDOW_MS), now)).toBe(false);
  });
  it("is stale when older than 24h", () => {
    expect(isFresh(new Date(now.getTime() - 2 * FRESH_WINDOW_MS), now)).toBe(false);
  });
});
