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
    name: "Money Connections",
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

export function formatJoinedOn(iso: string | null | undefined): string | null {
  if (!iso || iso.length < 10) return null;
  return `Joined on ${formatPuzzleDate(iso.slice(0, 10))}`;
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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function addIsoDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function denverParts(at: Date): Record<string, string> {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: PUZZLE_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(at)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

/** UTC instant for a wall-clock time in America/Denver. */
export function denverWallToUtc(isoDate: string, hour = 0, minute = 0, second = 0): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  let utc = Date.UTC(year, month - 1, day, hour + 7, minute, second);
  for (let i = 0; i < 4; i += 1) {
    const parts = denverParts(new Date(utc));
    const got = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second)
    );
    const want = Date.UTC(year, month - 1, day, hour, minute, second);
    utc += want - got;
  }
  return new Date(utc);
}

/** Next America/Denver midnight after `at`. */
export function nextDenverMidnight(at: Date = new Date()): Date {
  return denverWallToUtc(addIsoDays(denverDate(at), 1), 0, 0, 0);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}
