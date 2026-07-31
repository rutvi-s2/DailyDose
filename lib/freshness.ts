export const FRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isFresh(generatedAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - generatedAt.getTime() < FRESH_WINDOW_MS;
}
