import { randomBytes, createHash } from "crypto";

// Reset links are valid for one hour.
export const RESET_WINDOW_MS = 60 * 60 * 1000;

/** A high-entropy, URL-safe token to embed in the reset link. */
export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash a token for storage. We store only the hash so a database leak can't be
 * replayed to reset accounts. SHA-256 is appropriate here (unlike passwords)
 * because the token is already high-entropy and single-use.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isResetTokenExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}
