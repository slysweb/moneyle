export const PUZZLE_TZ = "America/Denver";

export const GAME_EPOCHS = {
  moreless: "2026-08-12",
  guessr: "2026-08-17",
  banknotele: "2026-08-17",
  connections: "2026-08-19",
} as const;

export type GameId = keyof typeof GAME_EPOCHS;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date in America/Denver, YYYY-MM-DD. */
export function denverDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PUZZLE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function isValidIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

export function resolvePuzzleDate(
  raw: string | null,
  game: GameId
): { ok: true; date: string } | { ok: false; error: string } {
  const today = denverDate();
  if (!raw) return { ok: true, date: today };
  if (!isValidIsoDate(raw)) return { ok: false, error: "Invalid date" };
  if (raw > today) return { ok: false, error: "Puzzle not available yet" };
  if (raw < GAME_EPOCHS[game]) return { ok: false, error: "No puzzle for that date" };
  return { ok: true, date: raw };
}
