import { describe, it, expect } from "vitest";
import {
  generateResetToken,
  hashResetToken,
  RESET_WINDOW_MS,
  isResetTokenExpired,
} from "@/lib/reset";

describe("reset tokens", () => {
  it("generates a long, URL-safe random token", () => {
    const t = generateResetToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates a different token each time", () => {
    expect(generateResetToken()).not.toBe(generateResetToken());
  });

  it("hashes deterministically (same input -> same hash)", () => {
    expect(hashResetToken("abc")).toBe(hashResetToken("abc"));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashResetToken("abc")).not.toBe(hashResetToken("xyz"));
  });

  it("does not store the raw token in its hash", () => {
    expect(hashResetToken("secret-token")).not.toContain("secret-token");
  });

  it("treats a token as expired once its expiry has passed", () => {
    const now = new Date("2026-08-18T12:00:00Z");
    const expiresAt = new Date(now.getTime() - 1000); // 1s in the past
    expect(isResetTokenExpired(expiresAt, now)).toBe(true);
  });

  it("treats a token with a future expiry as valid", () => {
    const now = new Date("2026-08-18T12:00:00Z");
    const expiresAt = new Date(now.getTime() + RESET_WINDOW_MS);
    expect(isResetTokenExpired(expiresAt, now)).toBe(false);
  });
});
