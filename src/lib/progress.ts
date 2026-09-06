// Per-day progress for each game. Guests stay on this device. Signed-in
// players also write to /api/progress so the same account matches on phone
// and desktop.

import { denverDate, gamesForDate, type ArchiveGameId } from "./dates";
import {
  aggregateGameStats,
  mergeRuns,
  summarizeRun,
  type GameStatCard,
  type RunSummary,
} from "./stats";

const PREFIX = "moneygames:progress:";
const MORELESS_TOTAL_ANSWERS = 25;
const GUESSR_ROUNDS = 5;
const MONEYLE_MAX_GUESSES = 6;

interface Stored<T> {
  date: string;
  state: T;
  updatedAt?: number;
}

let syncEnabled = false;

export function setProgressSync(enabled: boolean): void {
  syncEnabled = enabled;
}

function scopedKey(game: string, date: string): string {
  return `${PREFIX}${game}:${date}`;
}

function legacyKey(game: string): string {
  return PREFIX + game;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function isStateFinished(game: ArchiveGameId, state: unknown): boolean {
  const rec = asRecord(state);
  if (!rec) return false;
  switch (game) {
    case "moreless":
      return Array.isArray(rec.answers) && rec.answers.length >= MORELESS_TOTAL_ANSWERS;
    case "guessr":
      return Array.isArray(rec.results) && rec.results.length >= GUESSR_ROUNDS;
    case "moneyle": {
      if (!Array.isArray(rec.history)) return false;
      if (rec.history.length >= MONEYLE_MAX_GUESSES) return true;
      return rec.history.some((row) => asRecord(row)?.correct === true);
    }
    case "connections":
      return rec.finished === true;
  }
}

function progressRank(game: string, state: unknown): number {
  const rec = asRecord(state);
  if (!rec) return 0;
  switch (game) {
    case "moreless":
      return Array.isArray(rec.answers) ? rec.answers.length : 0;
    case "guessr":
      return Array.isArray(rec.results) ? rec.results.length : 0;
    case "moneyle": {
      const history = Array.isArray(rec.history) ? rec.history.length : 0;
      const bonus = Array.isArray(rec.bonusPicks) ? rec.bonusPicks.length : 0;
      const won = rec.history && Array.isArray(rec.history) && rec.history.some((row) => asRecord(row)?.correct === true);
      return history * 10 + bonus + (won ? 100 : 0);
    }
    case "connections": {
      const solved = Array.isArray(rec.solvedIds) ? rec.solvedIds.length : 0;
      return solved * 10 + (rec.finished === true ? 100 : 0);
    }
    default:
      return 0;
  }
}

function pickState<T>(
  game: string,
  local: { state: T; updatedAt: number } | null,
  remote: { state: T; updatedAt: number } | null
): { state: T; updatedAt: number; source: "local" | "remote" } | null {
  if (!local) return remote ? { ...remote, source: "remote" } : null;
  if (!remote) return { ...local, source: "local" };
  const localRank = progressRank(game, local.state);
  const remoteRank = progressRank(game, remote.state);
  if (remoteRank !== localRank) {
    return remoteRank > localRank ? { ...remote, source: "remote" } : { ...local, source: "local" };
  }
  return remote.updatedAt >= local.updatedAt
    ? { ...remote, source: "remote" }
    : { ...local, source: "local" };
}

function readLocal<T>(game: string, date: string): Stored<T> | null {
  try {
    const scoped = window.localStorage.getItem(scopedKey(game, date));
    if (scoped) {
      const parsed = JSON.parse(scoped) as Stored<T> | null;
      if (parsed && parsed.date === date) return parsed;
    }
    const legacy = window.localStorage.getItem(legacyKey(game));
    if (!legacy) return null;
    const parsed = JSON.parse(legacy) as Stored<T> | null;
    if (!parsed || parsed.date !== date) return null;
    window.localStorage.setItem(scopedKey(game, date), legacy);
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal<T>(game: string, date: string, state: T, updatedAt: number): void {
  try {
    window.localStorage.setItem(scopedKey(game, date), JSON.stringify({ date, state, updatedAt }));
  } catch {
    // Private mode and full quotas both throw here.
  }
}

export function loadProgress<T>(game: string, date: string | null): T | null {
  if (!date) return null;
  return readLocal<T>(game, date)?.state ?? null;
}

async function fetchRemote<T>(
  game: string,
  date: string
): Promise<{ state: T; updatedAt: number } | null> {
  const res = await fetch(`/api/progress?game=${encodeURIComponent(game)}&date=${encodeURIComponent(date)}`, {
    credentials: "same-origin",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { state?: T | null; updatedAt?: number };
  if (data.state == null) return null;
  return { state: data.state, updatedAt: data.updatedAt ?? 0 };
}

async function putRemote<T>(game: string, date: string, state: T, updatedAt: number): Promise<void> {
  await fetch("/api/progress", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ game, date, state, updatedAt }),
  });
}

export async function loadSyncedProgress<T>(game: string, date: string | null): Promise<T | null> {
  if (!date) return null;
  const localRow = readLocal<T>(game, date);
  const local = localRow ? { state: localRow.state, updatedAt: localRow.updatedAt ?? 0 } : null;
  if (!syncEnabled) return local?.state ?? null;
  try {
    const remote = await fetchRemote<T>(game, date);
    const winner = pickState(game, local, remote);
    if (!winner) return null;
    if (winner.source === "remote") writeLocal(game, date, winner.state, winner.updatedAt);
    else if (!remote || progressRank(game, winner.state) > progressRank(game, remote.state)) {
      void putRemote(game, date, winner.state, winner.updatedAt);
    }
    return winner.state;
  } catch {
    return local?.state ?? null;
  }
}

export function saveProgress<T>(game: string, date: string | null, state: T): void {
  if (!date) return;
  const updatedAt = Date.now();
  writeLocal(game, date, state, updatedAt);
  if (!syncEnabled) return;
  void putRemote(game, date, state, updatedAt).catch(() => undefined);
}

export function clearProgress(game: string, date?: string | null): void {
  try {
    if (date) {
      window.localStorage.removeItem(scopedKey(game, date));
      const legacy = window.localStorage.getItem(legacyKey(game));
      if (legacy) {
        const parsed = JSON.parse(legacy) as Stored<unknown> | null;
        if (parsed?.date === date) window.localStorage.removeItem(legacyKey(game));
      }
      return;
    }
    window.localStorage.removeItem(legacyKey(game));
  } catch {
    // Ignore — see saveProgress.
  }
}

export async function pushLocalProgress(): Promise<void> {
  if (!syncEnabled) return;
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const rest = key.slice(PREFIX.length);
    const cut = rest.indexOf(":");
    if (cut < 0) continue;
    const game = rest.slice(0, cut);
    const date = rest.slice(cut + 1);
    if (!game || !date) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "") as Stored<unknown> | null;
      if (!parsed?.state || parsed.date !== date) continue;
      jobs.push(putRemote(game, date, parsed.state, parsed.updatedAt ?? Date.now()));
    } catch {
      // Skip a bad row.
    }
  }
  await Promise.all(jobs);
}

/** True when that day's run is over and opening the game shows the results screen. */
export function isPuzzleFinished(game: ArchiveGameId, date: string): boolean {
  return isStateFinished(game, loadProgress(game, date));
}

export function archiveDayProgress(date: string): { done: number; total: number } {
  const games = gamesForDate(date);
  const done = games.filter((game) => isPuzzleFinished(game.id, date)).length;
  return { done, total: games.length };
}

export async function archiveMonthProgress(
  dates: string[]
): Promise<Map<string, { done: number; total: number }>> {
  const map = new Map<string, { done: number; total: number }>();
  for (const iso of dates) map.set(iso, archiveDayProgress(iso));
  if (!syncEnabled || dates.length === 0) return map;

  const from = dates.reduce((a, b) => (a < b ? a : b));
  const to = dates.reduce((a, b) => (a > b ? a : b));
  try {
    const res = await fetch(
      `/api/progress?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { credentials: "same-origin" }
    );
    if (!res.ok) return map;
    const data = (await res.json()) as { items?: { game: ArchiveGameId; date: string; finished: boolean }[] };
    const remote = new Set(
      (data.items ?? []).filter((row) => row.finished).map((row) => `${row.game}:${row.date}`)
    );
    for (const iso of dates) {
      const games = gamesForDate(iso);
      const done = games.filter(
        (game) => isPuzzleFinished(game.id, iso) || remote.has(`${game.id}:${iso}`)
      ).length;
      map.set(iso, { done, total: games.length });
    }
  } catch {
    // Keep the local map.
  }
  return map;
}

function listLocalRuns(): RunSummary[] {
  const rows: RunSummary[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const rest = key.slice(PREFIX.length);
    const cut = rest.indexOf(":");
    if (cut < 0) continue;
    const game = rest.slice(0, cut);
    const date = rest.slice(cut + 1);
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "") as Stored<unknown> | null;
      const summary = summarizeRun(game, date, parsed?.state);
      if (summary) rows.push(summary);
    } catch {
      // Skip a bad row.
    }
  }
  return rows;
}

export async function loadPlayerStats(): Promise<GameStatCard[]> {
  const local = listLocalRuns();
  let remote: RunSummary[] = [];
  if (syncEnabled) {
    try {
      const res = await fetch("/api/progress?stats=1", { credentials: "same-origin" });
      if (res.ok) {
        const data = (await res.json()) as { items?: RunSummary[] };
        remote = data.items ?? [];
      }
    } catch {
      // Keep local stats offline.
    }
  }
  return aggregateGameStats(mergeRuns(local, remote), denverDate());
}

export async function isDateFinished(game: ArchiveGameId, date: string): Promise<boolean> {
  if (isPuzzleFinished(game, date)) return true;
  if (!syncEnabled) return false;
  try {
    const remote = await fetchRemote(game, date);
    return isStateFinished(game, remote?.state);
  } catch {
    return false;
  }
}
