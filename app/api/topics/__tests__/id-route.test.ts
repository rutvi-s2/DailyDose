import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { topic: { deleteMany: vi.fn() } },
}));

import { DELETE } from "@/app/api/topics/[id]/route";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const del = () => new Request("http://localhost/api/topics/t1", { method: "DELETE" });

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
