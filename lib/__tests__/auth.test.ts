import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn(),
}));

import { authorizeCredentials } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

describe("authorizeCredentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when input fails validation", async () => {
    const result = await authorizeCredentials({ email: "not-an-email", password: "" });
    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when no user is found for the email", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await authorizeCredentials({ email: "a@b.com", password: "hunter2" });
    expect(result).toBeNull();
  });

  it("returns null when the user exists but passwordHash is null", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      name: "A",
      passwordHash: null,
    });
    const result = await authorizeCredentials({ email: "a@b.com", password: "hunter2" });
    expect(result).toBeNull();
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("returns null when verifyPassword resolves false", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      name: "A",
      passwordHash: "hashed",
    });
    (verifyPassword as any).mockResolvedValue(false);
    const result = await authorizeCredentials({ email: "a@b.com", password: "wrong" });
    expect(result).toBeNull();
  });

  it("returns { id, email, name } when credentials are valid", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      name: "A",
      passwordHash: "hashed",
    });
    (verifyPassword as any).mockResolvedValue(true);
    const result = await authorizeCredentials({ email: "a@b.com", password: "hunter2" });
    expect(result).toEqual({ id: "u1", email: "a@b.com", name: "A" });
  });
});
