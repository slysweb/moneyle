import { ARCHIVE_GAMES, addIsoDays, type ArchiveGameId } from "./dates";
import {
  CONNECTIONS_MAX,
  GUESSR_MAX,
  MONEYLE_NOTE_MAX,
  MORELESS_MAX,
  connectionsScore,
  guessrScore,
  moneyleNoteScore,
} from "./score";

export interface RunSummary {
  game: ArchiveGameId;
  date: string;
  score: number;
  max: number;
  won: boolean | null;
  perfect: boolean;
  guesses?: number;
}

export interface GameStatCard {
  id: ArchiveGameId;
  name: string;
  path: string;
  played: number;
  highScore: number;
  maxScore: number;
  average: number | null;
  wins: number | null;
  winRate: number | null;
  currentStreak: number;
  maxStreak: number;
  perfects: number;
  avgGuesses: number | null;
}

const GAMES = new Set<string>(ARCHIVE_GAMES.map((game) => game.id));
const WIN_GAMES = new Set<ArchiveGameId>(["banknotele", "connections"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function isStatsGame(value: string): value is ArchiveGameId {
  return GAMES.has(value);
}

export function summarizeRun(game: string, date: string, state: unknown): RunSummary | null {
  if (!isStatsGame(game)) return null;
  const rec = asRecord(state);
  if (!rec) return null;

  switch (game) {
    case "moreless": {
      if (!Array.isArray(rec.answers) || rec.answers.length < MORELESS_MAX) return null;
      const score = rec.answers.filter((row) => asRecord(row)?.correct === true).length;
      return { game, date, score, max: MORELESS_MAX, won: null, perfect: score >= MORELESS_MAX };
    }
    case "guessr": {
      if (!Array.isArray(rec.results) || rec.results.length < 5) return null;
      const results = rec.results.map((row) => {
        const item = asRecord(row);
        return {
          pct: typeof item?.pct === "number" ? item.pct : 0,
          guessCents: typeof item?.guessCents === "number" ? item.guessCents : undefined,
          actualCents: typeof item?.actualCents === "number" ? item.actualCents : undefined,
        };
      });
      const run = guessrScore(results);
      return { game, date, score: run.score, max: GUESSR_MAX, won: null, perfect: run.score >= GUESSR_MAX };
    }
    case "banknotele": {
      if (!Array.isArray(rec.history) || rec.history.length === 0) return null;
      const won = rec.history.some((row) => asRecord(row)?.correct === true);
      if (!won && rec.history.length < 6) return null;
      const guesses = rec.history.length;
      const score = moneyleNoteScore(won, guesses);
      return { game, date, score, max: MONEYLE_NOTE_MAX, won, perfect: won && guesses === 1, guesses };
    }
    case "connections": {
      if (rec.finished !== true) return null;
      const solved = Array.isArray(rec.solvedIds) ? rec.solvedIds.length : 0;
      const run = connectionsScore(solved);
      const won = rec.won === true;
      const mistakes = typeof rec.mistakes === "number" ? rec.mistakes : 0;
      return { game, date, score: run.score, max: CONNECTIONS_MAX, won, perfect: won && mistakes === 0 };
    }
  }
}

export function mergeRuns(local: RunSummary[], remote: RunSummary[]): RunSummary[] {
  const map = new Map<string, RunSummary>();
  for (const row of [...remote, ...local]) {
    const key = `${row.game}:${row.date}`;
    const prev = map.get(key);
    if (!prev || row.score > prev.score || (row.score === prev.score && (row.won ? 1 : 0) > (prev.won ? 1 : 0))) {
      map.set(key, row);
    }
  }
  return [...map.values()];
}

function streakCounts(dates: string[], today: string): { current: number; max: number } {
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) return { current: 0, max: 0 };

  let max = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    if (unique[i] === addIsoDays(unique[i - 1], 1)) {
      run += 1;
      if (run > max) max = run;
    } else {
      run = 1;
    }
  }

  const set = new Set(unique);
  const end = set.has(today) ? today : addIsoDays(today, -1);
  let current = 0;
  let cursor = end;
  while (set.has(cursor)) {
    current += 1;
    cursor = addIsoDays(cursor, -1);
  }
  return { current, max };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function aggregateGameStats(runs: RunSummary[], today: string): GameStatCard[] {
  return ARCHIVE_GAMES.map((game) => {
    const rows = runs.filter((row) => row.game === game.id);
    const scores = rows.map((row) => row.score);
    const wins = WIN_GAMES.has(game.id) ? rows.filter((row) => row.won === true) : null;
    const streakDates = wins ? wins.map((row) => row.date) : rows.map((row) => row.date);
    const streaks = streakCounts(streakDates, today);
    const guessValues = rows
      .filter((row) => row.won === true && row.guesses != null)
      .map((row) => row.guesses as number);

    return {
      id: game.id,
      name: game.name,
      path: game.path,
      played: rows.length,
      highScore: scores.length ? Math.max(...scores) : 0,
      maxScore: game.id === "moreless" ? MORELESS_MAX : game.id === "guessr" ? GUESSR_MAX : game.id === "banknotele" ? MONEYLE_NOTE_MAX : CONNECTIONS_MAX,
      average: mean(scores),
      wins: wins ? wins.length : null,
      winRate: wins && rows.length ? (wins.length / rows.length) * 100 : null,
      currentStreak: streaks.current,
      maxStreak: streaks.max,
      perfects: rows.filter((row) => row.perfect).length,
      avgGuesses: mean(guessValues),
    };
  });
}

export function formatAverage(value: number | null): string {
  if (value == null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatWinRate(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value)}%`;
}
