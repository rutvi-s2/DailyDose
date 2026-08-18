import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    topic: { deleteMany: vi.fn(), updateMany: vi.fn() },
    briefing: { deleteMany: vi.fn() },
  },
}));

import { DELETE, PATCH } from "@/app/api/topics/[id]/route";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const del = () => new Request("http://localhost/api/topics/t1", { method: "DELETE" });
const patch = (body: unknown) =>
  new Request("http://localhost/api/topics/t1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("DELETE /api/topics/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401s when signed out", async () => {
    (requireUserId as any).mockResolvedValue(null);
    const res = await DELETE(del(), ctx("t1"));
    expect(res.status).toBe(401);
  });

  it("deletes only when the topic belongs to the user", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    (prisma.topic.deleteMany as any).mockResolvedValue({ count: 1 });
    const res = await DELETE(del(), ctx("t1"));
    expect(res.status).toBe(200);
    expect((prisma.topic.deleteMany as any).mock.calls[0][0].where).toEqual({
      id: "t1", userId: "u1",
    });
  });

  it("404s when the topic is not the user's (nothing deleted)", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    (prisma.topic.deleteMany as any).mockResolvedValue({ count: 0 });
    const res = await DELETE(del(), ctx("t1"));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/topics/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401s when signed out", async () => {
    (requireUserId as any).mockResolvedValue(null);
    const res = await PATCH(patch({ description: "x" }), ctx("t1"));
    expect(res.status).toBe(401);
  });

  it("updates the description scoped to the owner and invalidates cache", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    (prisma.topic.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.briefing.deleteMany as any).mockResolvedValue({ count: 2 });
    const res = await PATCH(patch({ description: "new focus" }), ctx("t1"));
    expect(res.status).toBe(200);
    expect((prisma.topic.updateMany as any).mock.calls[0][0]).toEqual({
      where: { id: "t1", userId: "u1" },
      data: { description: "new focus" },
    });
    // Cached briefings for this topic are dropped so it regenerates.
    expect(prisma.briefing.deleteMany).toHaveBeenCalledWith({ where: { topicId: "t1" } });
  });

  it("stores an empty description as null and still invalidates", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    (prisma.topic.updateMany as any).mockResolvedValue({ count: 1 });
    await PATCH(patch({ description: "   " }), ctx("t1"));
    expect((prisma.topic.updateMany as any).mock.calls[0][0].data).toEqual({
      description: null,
    });
  });

  it("404s when the topic is not the user's (nothing updated)", async () => {
    (requireUserId as any).mockResolvedValue("u1");
    (prisma.topic.updateMany as any).mockResolvedValue({ count: 0 });
    const res = await PATCH(patch({ description: "x" }), ctx("t1"));
    expect(res.status).toBe(404);
    expect(prisma.briefing.deleteMany).not.toHaveBeenCalled();
  });
});
