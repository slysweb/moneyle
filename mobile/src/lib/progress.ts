import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProgress, fetchProgressRange, fetchProgressStats, putProgress } from "./api";
import { denverDate } from "./config";
import { gamesForDate, type ArchiveGameId } from "./dates";
import {
  aggregateGameStats,
  isStatsGame,
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function isPuzzleFinished(game: ArchiveGameId, state: unknown): boolean {
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
      const won =
        rec.history &&
        Array.isArray(rec.history) &&
        rec.history.some((row) => asRecord(row)?.correct === true);
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

async function readLocal<T>(game: string, date: string): Promise<{ state: T; updatedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(scopedKey(game, date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored<T> | null;
    if (!parsed || parsed.date !== date) return null;
    return { state: parsed.state, updatedAt: parsed.updatedAt ?? 0 };
  } catch {
    return null;
  }
}

async function writeLocal<T>(game: string, date: string, state: T, updatedAt: number): Promise<void> {
  try {
    await AsyncStorage.setItem(scopedKey(game, date), JSON.stringify({ date, state, updatedAt }));
  } catch {
    // Best-effort, same as the website.
  }
}

export async function loadProgress<T>(game: string, date: string | null): Promise<T | null> {
  if (!date) return null;
  return (await readLocal<T>(game, date))?.state ?? null;
}

export async function loadSyncedProgress<T>(game: string, date: string | null): Promise<T | null> {
  if (!date) return null;
  const local = await readLocal<T>(game, date);
  if (!syncEnabled) return local?.state ?? null;
  try {
    const remote = await fetchProgress<T>(game, date);
    const remoteRow = remote.state == null ? null : { state: remote.state, updatedAt: remote.updatedAt ?? 0 };
    const winner = pickState(game, local, remoteRow);
    if (!winner) return null;
    if (winner.source === "remote") await writeLocal(game, date, winner.state, winner.updatedAt);
    else if (!remoteRow || progressRank(game, winner.state) > progressRank(game, remoteRow.state)) {
      void putProgress(game, date, winner.state, winner.updatedAt);
    }
    return winner.state;
  } catch {
    return local?.state ?? null;
  }
}

export async function saveProgress<T>(game: string, date: string | null, state: T): Promise<void> {
  if (!date) return;
  const updatedAt = Date.now();
  await writeLocal(game, date, state, updatedAt);
  if (!syncEnabled) return;
  try {
    await putProgress(game, date, state, updatedAt);
  } catch {
    // Offline or a dropped session — keep the local write.
  }
}

export async function pushLocalProgress(): Promise<void> {
  if (!syncEnabled) return;
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
  if (keys.length === 0) return;
  const rows = await AsyncStorage.multiGet(keys);
  await Promise.all(
    rows.map(async ([key, raw]) => {
      if (!raw) return;
      const rest = key.slice(PREFIX.length);
      const cut = rest.indexOf(":");
      if (cut < 0) return;
      const game = rest.slice(0, cut);
      const date = rest.slice(cut + 1);
      if (!game || !date) return;
      try {
        const parsed = JSON.parse(raw) as Stored<unknown> | null;
        if (!parsed?.state || parsed.date !== date) return;
        await putProgress(game, date, parsed.state, parsed.updatedAt ?? Date.now());
      } catch {
        // Skip a bad row.
      }
    })
  );
}

async function listLocalRuns(): Promise<RunSummary[]> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
  if (keys.length === 0) return [];
  const rows = await AsyncStorage.multiGet(keys);
  const out: RunSummary[] = [];
  for (const [key, raw] of rows) {
    if (!raw) continue;
    const rest = key.slice(PREFIX.length);
    const cut = rest.indexOf(":");
    if (cut < 0) continue;
    const game = rest.slice(0, cut);
    const date = rest.slice(cut + 1);
    if (!isStatsGame(game) || !date) continue;
    try {
      const parsed = JSON.parse(raw) as Stored<unknown> | null;
      const summary = summarizeRun(game, date, parsed?.state);
      if (summary) out.push(summary);
    } catch {
      // Skip a bad row.
    }
  }
  return out;
}

export function emptyPlayerStats(): GameStatCard[] {
  return aggregateGameStats([], denverDate());
}

export async function loadPlayerStats(): Promise<GameStatCard[]> {
  try {
    const local = await listLocalRuns();
    let remote: RunSummary[] = [];
    if (syncEnabled) {
      try {
        const data = await fetchProgressStats();
        remote = (data.items ?? []).filter((row): row is RunSummary => isStatsGame(row.game));
      } catch {
        // Keep local stats offline.
      }
    }
    return aggregateGameStats(mergeRuns(local, remote), denverDate());
  } catch {
    return emptyPlayerStats();
  }
}

export async function isDateFinished(game: ArchiveGameId, date: string): Promise<boolean> {
  if (isPuzzleFinished(game, await loadProgress(game, date))) return true;
  if (!syncEnabled) return false;
  try {
    const remote = await fetchProgress(game, date);
    return isPuzzleFinished(game, remote.state);
  } catch {
    return false;
  }
}

export async function archiveDayProgress(date: string): Promise<{ done: number; total: number }> {
  const games = gamesForDate(date);
  const rows = await Promise.all(games.map(async (game) => loadProgress<unknown>(game.id, date)));
  const done = games.filter((game, i) => isPuzzleFinished(game.id, rows[i])).length;
  return { done, total: games.length };
}

export async function archiveMonthProgress(
  dates: string[]
): Promise<Map<string, { done: number; total: number }>> {
  const map = new Map<string, { done: number; total: number }>();
  await Promise.all(
    dates.map(async (iso) => {
      map.set(iso, await archiveDayProgress(iso));
    })
  );
  if (!syncEnabled || dates.length === 0) return map;

  const from = dates.reduce((a, b) => (a < b ? a : b));
  const to = dates.reduce((a, b) => (a > b ? a : b));
  try {
    const data = await fetchProgressRange(from, to);
    const remote = new Set(
      (data.items ?? []).filter((row) => row.finished).map((row) => `${row.game}:${row.date}`)
    );
    await Promise.all(
      dates.map(async (iso) => {
        const games = gamesForDate(iso);
        const rows = await Promise.all(games.map((game) => loadProgress<unknown>(game.id, iso)));
        const done = games.filter(
          (game, i) => isPuzzleFinished(game.id, rows[i]) || remote.has(`${game.id}:${iso}`)
        ).length;
        map.set(iso, { done, total: games.length });
      })
    );
  } catch {
    // Keep the local map.
  }
  return map;
}
