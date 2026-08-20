export const PUZZLE_TZ = "America/Denver";
export const SITE_EPOCH = "2026-08-12";

export type ArchiveGameId = "moreless" | "guessr" | "moneyle" | "connections";

export interface ArchiveGame {
  id: ArchiveGameId;
  name: string;
  short: string;
  path: string;
  epoch: string;
}

export const ARCHIVE_GAMES: ArchiveGame[] = [
  { id: "moreless", name: "More/Less", short: "More/Less", path: "/moreless", epoch: "2026-08-12" },
  { id: "guessr", name: "Money Guessr", short: "Guessr", path: "/guessr", epoch: "2026-08-17" },
  { id: "moneyle", name: "Moneyle", short: "Moneyle", path: "/moneyle", epoch: "2026-08-17" },
  {
    id: "connections",
    name: "MoneyConnections",
    short: "Connections",
    path: "/connections",
    epoch: "2026-08-19",
  },
];

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

export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

export function parseDateParam(raw: string | null): string | null {
  return isIsoDate(raw) ? raw : null;
}

export function formatPuzzleDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function monthLabel(iso: string): string {
  return new Date(`${monthStart(iso)}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function addCalendarMonths(iso: string, delta: number): string {
  const [year, month] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/** Sunday = 0, matching a US calendar header. */
export function weekdaySundayFirst(iso: string): number {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

export function gamesForDate(iso: string): ArchiveGame[] {
  return ARCHIVE_GAMES.filter((game) => iso >= game.epoch);
}

export function playPath(path: string, date: string | null, today: string): string {
  if (!date || date === today) return path;
  return `${path}?date=${date}`;
}

export function absolutePlayUrl(path: string, date: string | null, today: string): string {
  return `https://moneygames.cc${playPath(path, date, today)}`;
}

export function sharePlayLine(path: string, date: string | null, today: string): string {
  const url = absolutePlayUrl(path, date, today);
  if (date && date !== today) return `Play this puzzle: ${url}`;
  return `Play Today's Game: ${url}`;
}
