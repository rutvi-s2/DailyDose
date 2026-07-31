import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { requireUserId } from "@/lib/session";
import { auth } from "@/lib/auth";

describe("requireUserId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the user id when signed in", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1" } });
    expect(await requireUserId()).toBe("u1");
  });

  it("returns null when signed out", async () => {
    (auth as any).mockResolvedValue(null);
    expect(await requireUserId()).toBeNull();
  });

  it("returns null when session has no user id", async () => {
    (auth as any).mockResolvedValue({ user: {} });
    expect(await requireUserId()).toBeNull();
  });
});
