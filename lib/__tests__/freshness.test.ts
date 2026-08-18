import { describe, it, expect } from "vitest";
import { isFresh, FRESH_WINDOW_MS } from "@/lib/freshness";

describe("isFresh", () => {
  const now = new Date("2026-07-31T12:00:00Z");

  describe("24h window", () => {
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

  describe("calendar-day rule (with timezone)", () => {
    const tz = "America/New_York"; // UTC-4 in summer (EDT)

    it("is stale after midnight even when under 24h old", () => {
      // Generated 2026-07-30 23:00 EDT (03:00Z on the 31st).
      // "Now" is 2026-07-31 08:00 EDT (12:00Z) — a different calendar day,
      // only 9h later.
      const generatedAt = new Date("2026-07-31T03:00:00Z");
      const nowLocal = new Date("2026-07-31T12:00:00Z");
      expect(isFresh(generatedAt, nowLocal, tz)).toBe(false);
    });

    it("stays fresh within the same calendar day and under 24h", () => {
      // Generated 2026-07-31 08:00 EDT (12:00Z), now 2026-07-31 18:00 EDT (22:00Z).
      const generatedAt = new Date("2026-07-31T12:00:00Z");
      const nowLocal = new Date("2026-07-31T22:00:00Z");
      expect(isFresh(generatedAt, nowLocal, tz)).toBe(true);
    });

    it("is stale when over 24h old even on the same wall-clock day", () => {
      // Generated 2026-07-29 12:00Z, now 2026-07-31 12:00Z (48h) — different day anyway,
      // but confirms the 24h rule still fires.
      const generatedAt = new Date("2026-07-29T12:00:00Z");
      const nowLocal = new Date("2026-07-31T12:00:00Z");
      expect(isFresh(generatedAt, nowLocal, tz)).toBe(false);
    });

    it("uses the given timezone, not UTC, for the day boundary", () => {
      // Generated 2026-07-31 22:00 EDT == 2026-08-01 02:00Z.
      // Now 2026-07-31 23:00 EDT == 2026-08-01 03:00Z.
      // Same calendar day in New York (Jul 31), so it stays fresh —
      // even though it's already Aug 1 in UTC.
      const generatedAt = new Date("2026-08-01T02:00:00Z");
      const nowLocal = new Date("2026-08-01T03:00:00Z");
      expect(isFresh(generatedAt, nowLocal, tz)).toBe(true);
    });
  });

  describe("no timezone (server fallback)", () => {
    it("falls back to the 24h rule only", () => {
      const generatedAt = new Date("2026-07-31T03:00:00Z");
      const nowLocal = new Date("2026-07-31T12:00:00Z"); // different UTC day but < 24h
      expect(isFresh(generatedAt, nowLocal)).toBe(true);
    });
  });
});
