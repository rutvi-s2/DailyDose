export const FRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Calendar date (YYYY-MM-DD) of `date` as seen in the given IANA timezone. */
function localDay(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which is safe to compare as a string.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * A briefing is fresh only if it is BOTH under 24h old AND (when a timezone is
 * given) generated on the current calendar day in that timezone. Passing no
 * timezone applies the 24h rule alone — the server-side fallback.
 */
export function isFresh(
  generatedAt: Date,
  now: Date = new Date(),
  timeZone?: string,
): boolean {
  if (now.getTime() - generatedAt.getTime() >= FRESH_WINDOW_MS) return false;
  if (timeZone && localDay(generatedAt, timeZone) !== localDay(now, timeZone)) {
    return false;
  }
  return true;
}
