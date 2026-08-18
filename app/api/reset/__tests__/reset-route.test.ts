import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));
const sendResetEmail = vi.fn();
vi.mock("@/lib/email", () => ({ sendResetEmail: (...a: unknown[]) => sendResetEmail(...a) }));

import { POST as requestPOST } from "@/app/api/reset/request/route";
import { POST as confirmPOST } from "@/app/api/reset/confirm/route";
import { prisma } from "@/lib/db";
import { hashResetToken, RESET_WINDOW_MS } from "@/lib/reset";

function req(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/reset/request", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends an email and stores a hashed token for a known user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", email: "a@b.com" });
    const res = await requestPOST(req("/api/reset/request", { email: "a@b.com" }));
    expect(res.status).toBe(200);
    expect(prisma.verificationToken.create).toHaveBeenCalledOnce();
    // The stored token is a hash, not the raw token embedded in the link.
    const stored = (prisma.verificationToken.create as any).mock.calls[0][0].data.token;
    expect(stored).toMatch(/^[a-f0-9]{64}$/);
    expect(sendResetEmail).toHaveBeenCalledOnce();
    const link = sendResetEmail.mock.calls[0][1] as string;
    expect(link).toContain("/reset/confirm?token=");
  });

  it("returns ok WITHOUT sending for an unknown email (anti-enumeration)", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await requestPOST(req("/api/reset/request", { email: "nobody@b.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendResetEmail).not.toHaveBeenCalled();
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
  });

  it("returns ok even on invalid input, without leaking", async () => {
    const res = await requestPOST(req("/api/reset/request", { email: "nope" }));
    expect(res.status).toBe(200);
    expect(sendResetEmail).not.toHaveBeenCalled();
  });
});

describe("POST /api/reset/confirm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the password and consumes the token for a valid token", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      identifier: "a@b.com",
      token: hashResetToken("raw-token"),
      expires: new Date(Date.now() + RESET_WINDOW_MS),
    });
    const res = await confirmPOST(req("/api/reset/confirm", { token: "raw-token", password: "newpass1" }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "a@b.com" } }),
    );
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "a@b.com" },
    });
  });

  it("rejects an unknown token", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue(null);
    const res = await confirmPOST(req("/api/reset/confirm", { token: "bogus", password: "newpass1" }));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      identifier: "a@b.com",
      token: hashResetToken("raw-token"),
      expires: new Date(Date.now() - 1000),
    });
    const res = await confirmPOST(req("/api/reset/confirm", { token: "raw-token", password: "newpass1" }));
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toMatch(/invalid or has expired/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a too-short new password with a reason", async () => {
    const res = await confirmPOST(req("/api/reset/confirm", { token: "raw-token", password: "123" }));
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toMatch(/at least 6 characters/i);
  });
});
