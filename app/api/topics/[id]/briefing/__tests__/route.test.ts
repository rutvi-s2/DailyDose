import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    topic: { findFirst: vi.fn() },
    briefing: { findFirst: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/briefing", () => ({ generateBriefing: vi.fn() }));
vi.mock("@/lib/cap", () => ({ isUnderCap: vi.fn() }));

import { GET } from "@/app/api/topics/[id]/briefing/route";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generateBriefing } from "@/lib/briefing";
import { isUnderCap } from "@/lib/cap";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const reqUrl = (refresh = false) =>
  new Request(`http://localhost/api/topics/t1/briefing${refresh ? "?refresh=true" : ""}`);

const freshDate = () => new Date(Date.now() - 1000);
const staleDate = () => new Date(Date.now() - 25 * 60 * 60 * 1000);

beforeEach(() => {
  vi.clearAllMocks();
  (requireUserId as any).mockResolvedValue("u1");
  (prisma.topic.findFirst as any).mockResolvedValue({ id: "t1", title: "NBA", description: null });
  (isUnderCap as any).mockResolvedValue(true);
});

describe("GET /api/topics/[id]/briefing", () => {
  it("401s when signed out", async () => {
    (requireUserId as any).mockResolvedValue(null);
    const res = await GET(reqUrl(), ctx("t1"));
    expect(res.status).toBe(401);
  });

  it("404s when the topic is not the user's", async () => {
    (prisma.topic.findFirst as any).mockResolvedValue(null);
    const res = await GET(reqUrl(), ctx("t1"));
    expect(res.status).toBe(404);
  });

  it("serves a fresh cached briefing without generating", async () => {
    (prisma.briefing.findFirst as any).mockResolvedValue({
      content: "cached", sources: [], generatedAt: freshDate(),
    });
    const res = await GET(reqUrl(), ctx("t1"));
    const json = await res.json();
    expect(json.cached).toBe(true);
    expect(json.content).toBe("cached");
    expect(generateBriefing).not.toHaveBeenCalled();
  });

  it("regenerates when the cached briefing is stale", async () => {
    (prisma.briefing.findFirst as any).mockResolvedValue({
      content: "old", sources: [], generatedAt: staleDate(),
    });
    (generateBriefing as any).mockResolvedValue({ content: "new", sources: [] });
    (prisma.briefing.create as any).mockResolvedValue({
      content: "new", sources: [], generatedAt: new Date(),
    });
    const res = await GET(reqUrl(), ctx("t1"));
    const json = await res.json();
    expect(json.cached).toBe(false);
    expect(json.content).toBe("new");
    expect(generateBriefing).toHaveBeenCalledOnce();
  });

  it("regenerates on refresh even when fresh", async () => {
    (prisma.briefing.findFirst as any).mockResolvedValue({
      content: "cached", sources: [], generatedAt: freshDate(),
    });
    (generateBriefing as any).mockResolvedValue({ content: "new", sources: [] });
    (prisma.briefing.create as any).mockResolvedValue({
      content: "new", sources: [], generatedAt: new Date(),
    });
    const res = await GET(reqUrl(true), ctx("t1"));
    expect((await res.json()).content).toBe("new");
    expect(generateBriefing).toHaveBeenCalledOnce();
  });

  it("serves cached with limitReached when the cap is hit", async () => {
    (isUnderCap as any).mockResolvedValue(false);
    (prisma.briefing.findFirst as any).mockResolvedValue({
      content: "old", sources: [], generatedAt: staleDate(),
    });
    const res = await GET(reqUrl(true), ctx("t1"));
    const json = await res.json();
    expect(json.limitReached).toBe(true);
    expect(json.content).toBe("old");
    expect(generateBriefing).not.toHaveBeenCalled();
  });

  it("502s and caches nothing when generation throws", async () => {
    (prisma.briefing.findFirst as any).mockResolvedValue(null);
    (generateBriefing as any).mockRejectedValue(new Error("api down"));
    const res = await GET(reqUrl(), ctx("t1"));
    expect(res.status).toBe(502);
    expect(prisma.briefing.create).not.toHaveBeenCalled();
  });
});
