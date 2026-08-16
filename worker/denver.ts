export const PUZZLE_TZ = "America/Denver";

/** Calendar date in America/Denver, YYYY-MM-DD. */
export function denverDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PUZZLE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}
