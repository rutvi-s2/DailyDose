import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { topic: { create: vi.fn(), findMany: vi.fn() } },
}));

import { GET, POST } from "@/app/api/topics/route";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";

function post(body: unknown) {
  return new Request("http://localhost/api/topics", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/topics collection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401s POST when signed out", async () => {
    (requireUserId as any).mockResolvedValue(null);
    const res = await POST(post({ title: "NBA" }));
    expect(res.status).toBe(401);
  });

  it("creates a topic scoped to the user", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    (prisma.topic.create as any).mockResolvedValue({
      id: "t1", title: "NBA", description: null, createdAt: new Date("2026-01-01"),
    });
    const res = await POST(post({ title: "NBA" }));
    expect(res.status).toBe(201);
    expect((prisma.topic.create as any).mock.calls[0][0].data.userId).toBe("u1");
  });

  it("400s POST with an empty title", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    const res = await POST(post({ title: "" }));
    expect(res.status).toBe(400);
  });

  it("lists only this user's topics newest-first", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    (prisma.topic.findMany as any).mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const args = (prisma.topic.findMany as any).mock.calls[0][0];
    expect(args.where).toEqual({ userId: "u1" });
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });
});
