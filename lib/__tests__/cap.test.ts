import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { briefing: { count: vi.fn() } },
}));

import { countGenerationsToday, isUnderCap, DAILY_CAP } from "@/lib/cap";
import { prisma } from "@/lib/db";

describe("daily cap", () => {
  const now = new Date("2026-07-31T12:00:00Z");
  beforeEach(() => vi.clearAllMocks());

  it("counts this user's briefings generated since local midnight", async () => {
    (prisma.briefing.count as any).mockResolvedValue(3);
    const n = await countGenerationsToday("u1", now);
    expect(n).toBe(3);
    const where = (prisma.briefing.count as any).mock.calls[0][0].where;
    expect(where.topic.userId).toBe("u1");
    expect(where.generatedAt.gte).toBeInstanceOf(Date);
  });

  it("is under cap below the limit", async () => {
    (prisma.briefing.count as any).mockResolvedValue(DAILY_CAP - 1);
    expect(await isUnderCap("u1", now)).toBe(true);
  });

  it("is at cap at the limit", async () => {
    (prisma.briefing.count as any).mockResolvedValue(DAILY_CAP);
    expect(await isUnderCap("u1", now)).toBe(false);
  });
});
