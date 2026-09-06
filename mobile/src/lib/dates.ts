import { SITE_EPOCH, denverDate } from "./config";

export { SITE_EPOCH };

export type ArchiveGameId = "moreless" | "guessr" | "moneyle" | "connections";

export interface ArchiveGame {
  id: ArchiveGameId;
  name: string;
  path: string;
  epoch: string;
}

export const ARCHIVE_GAMES: ArchiveGame[] = [
  { id: "moreless", name: "More/Less", path: "/moreless", epoch: "2026-08-12" },
  { id: "guessr", name: "Money Guessr", path: "/guessr", epoch: "2026-08-17" },
  { id: "moneyle", name: "Moneyle", path: "/moneyle", epoch: "2026-08-17" },
  { id: "connections", name: "MoneyConnections", path: "/connections", epoch: "2026-08-19" },
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
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

export function weekdaySundayFirst(iso: string): number {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

export function gamesForDate(iso: string): ArchiveGame[] {
  return ARCHIVE_GAMES.filter((game) => iso >= game.epoch);
}

export function playPath(path: string, date: string | null | undefined, today = denverDate()): string {
  if (!date || date === today) return path;
  return `${path}?date=${date}`;
}

export function isArchiveDate(date: string | null | undefined, today = denverDate()): boolean {
  return Boolean(date && date !== today);
}
