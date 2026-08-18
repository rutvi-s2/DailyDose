import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/signup/route";
import { prisma } from "@/lib/db";

function req(body: unknown) {
  return new Request("http://localhost/api/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a new user and returns 201", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: "u1", email: "a@b.com" });
    const res = await POST(req({ email: "a@b.com", password: "hunter2" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("returns 409 with a reason when the email already exists", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", email: "a@b.com" });
    const res = await POST(req({ email: "a@b.com", password: "hunter2" }));
    expect(res.status).toBe(409);
    expect((await res.json()).reason).toMatch(/already registered/i);
  });

  it("returns 400 with a password-length reason on a weak password", async () => {
    const res = await POST(req({ email: "a@b.com", password: "123" }));
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toMatch(/at least 6 characters/i);
  });

  it("returns 400 with an email reason on an invalid email", async () => {
    const res = await POST(req({ email: "not-an-email", password: "hunter2" }));
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toMatch(/valid email/i);
  });
});
