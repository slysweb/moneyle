import { sessionUser, type AuthEnv } from "./auth";
import { denverDate, GAME_EPOCHS, isValidIsoDate, type GameId } from "./denver";

const GAMES = new Set<string>(Object.keys(GAME_EPOCHS));
const MAX_STATE_CHARS = 64_000;

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function isProgressFinished(game: GameId, state: unknown): boolean {
  const rec = asRecord(state);
  if (!rec) return false;
  switch (game) {
    case "moreless":
      return Array.isArray(rec.answers) && rec.answers.length >= 25;
    case "guessr":
      return Array.isArray(rec.results) && rec.results.length >= 5;
    case "moneyle": {
      if (!Array.isArray(rec.history)) return false;
      if (rec.history.length >= 6) return true;
      return rec.history.some((row) => asRecord(row)?.correct === true);
    }
    case "connections":
      return rec.finished === true;
  }
}

function parseGame(raw: string | null): GameId | null {
  if (!raw || !GAMES.has(raw)) return null;
  return raw as GameId;
}

function validDate(game: GameId, date: string): boolean {
  if (!isValidIsoDate(date)) return false;
  if (date > denverDate()) return false;
  return date >= GAME_EPOCHS[game];
}

async function ensureTable(env: AuthEnv): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS puzzle_progress (
      user_id     INTEGER NOT NULL,
      game        TEXT NOT NULL,
      puzzle_date TEXT NOT NULL,
      state_json  TEXT NOT NULL,
      updated_at  INTEGER NOT NULL,
      PRIMARY KEY (user_id, game, puzzle_date)
    )`
  ).run();
}

async function handleGetOne(env: AuthEnv, userId: number, game: GameId, date: string): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT state_json AS stateJson, updated_at AS updatedAt
     FROM puzzle_progress
     WHERE user_id = ? AND game = ? AND puzzle_date = ?`
  )
    .bind(userId, game, date)
    .first<{ stateJson: string; updatedAt: number }>();
  if (!row) return json({ state: null, updatedAt: 0 });
  try {
    return json({ state: JSON.parse(row.stateJson), updatedAt: row.updatedAt });
  } catch {
    return json({ state: null, updatedAt: 0 });
  }
}

function guessrPoints(pct: number, guessCents?: number, actualCents?: number): number {
  if (guessCents != null && actualCents != null && guessCents === actualCents) return 2;
  const abs = Math.abs(pct);
  if (abs < 0.05) return 2;
  if (abs <= 20) return 1;
  return 0;
}

function moneyleNoteScore(won: boolean, guesses: number): number {
  if (!won || guesses < 1) return 0;
  return [10, 8, 6, 4, 2, 1][Math.min(guesses, 6) - 1] ?? 0;
}

function summarizeRun(
  game: GameId,
  date: string,
  state: unknown
): {
  game: GameId;
  date: string;
  score: number;
  max: number;
  won: boolean | null;
  perfect: boolean;
  guesses?: number;
} | null {
  if (!isProgressFinished(game, state)) return null;
  const rec = asRecord(state);
  if (!rec) return null;
  switch (game) {
    case "moreless": {
      const score = Array.isArray(rec.answers)
        ? rec.answers.filter((row) => asRecord(row)?.correct === true).length
        : 0;
      return { game, date, score, max: 25, won: null, perfect: score >= 25 };
    }
    case "guessr": {
      const results = Array.isArray(rec.results) ? rec.results : [];
      const score = results.reduce((sum, row) => {
        const item = asRecord(row);
        return (
          sum +
          guessrPoints(
            typeof item?.pct === "number" ? item.pct : 0,
            typeof item?.guessCents === "number" ? item.guessCents : undefined,
            typeof item?.actualCents === "number" ? item.actualCents : undefined
          )
        );
      }, 0);
      return { game, date, score, max: 10, won: null, perfect: score >= 10 };
    }
    case "moneyle": {
      const history = Array.isArray(rec.history) ? rec.history : [];
      const won = history.some((row) => asRecord(row)?.correct === true);
      const guesses = history.length;
      const score = moneyleNoteScore(won, guesses);
      return { game, date, score, max: 10, won, perfect: won && guesses === 1, guesses };
    }
    case "connections": {
      const solved = Array.isArray(rec.solvedIds) ? rec.solvedIds.length : 0;
      const won = rec.won === true;
      const mistakes = typeof rec.mistakes === "number" ? rec.mistakes : 0;
      return { game, date, score: Math.min(solved, 4) * 2, max: 8, won, perfect: won && mistakes === 0 };
    }
  }
}

async function handleGetStats(env: AuthEnv, userId: number): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT game, puzzle_date AS date, state_json AS stateJson
     FROM puzzle_progress
     WHERE user_id = ?`
  )
    .bind(userId)
    .all<{ game: string; date: string; stateJson: string }>();

  const items = [];
  for (const row of results) {
    const game = parseGame(row.game);
    if (!game) continue;
    let state: unknown = null;
    try {
      state = JSON.parse(row.stateJson);
    } catch {
      continue;
    }
    const summary = summarizeRun(game, row.date, state);
    if (summary) items.push(summary);
  }
  return json({ items });
}

async function handleGetRange(env: AuthEnv, userId: number, from: string, to: string): Promise<Response> {
  if (!isValidIsoDate(from) || !isValidIsoDate(to) || from > to) {
    return json({ error: "Invalid date range" }, { status: 400 });
  }
  const { results } = await env.DB.prepare(
    `SELECT game, puzzle_date AS date, state_json AS stateJson
     FROM puzzle_progress
     WHERE user_id = ? AND puzzle_date >= ? AND puzzle_date <= ?`
  )
    .bind(userId, from, to)
    .all<{ game: string; date: string; stateJson: string }>();

  const items: { game: string; date: string; finished: boolean }[] = [];
  for (const row of results) {
    const game = parseGame(row.game);
    if (!game) continue;
    let state: unknown = null;
    try {
      state = JSON.parse(row.stateJson);
    } catch {
      continue;
    }
    items.push({ game, date: row.date, finished: isProgressFinished(game, state) });
  }
  return json({ items });
}

async function handlePut(env: AuthEnv, userId: number, request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    game?: unknown;
    date?: unknown;
    state?: unknown;
    updatedAt?: unknown;
  } | null;
  const game = parseGame(typeof body?.game === "string" ? body.game : null);
  const date = typeof body?.date === "string" ? body.date : "";
  if (!game || !validDate(game, date)) return json({ error: "Invalid game or date" }, { status: 400 });
  if (body?.state == null || typeof body.state !== "object") {
    return json({ error: "Missing state" }, { status: 400 });
  }
  const encoded = JSON.stringify(body.state);
  if (encoded.length > MAX_STATE_CHARS) return json({ error: "State too large" }, { status: 413 });

  const updatedAt =
    typeof body.updatedAt === "number" && Number.isFinite(body.updatedAt) && body.updatedAt > 0
      ? Math.floor(body.updatedAt)
      : Date.now();

  await env.DB.prepare(
    `INSERT INTO puzzle_progress (user_id, game, puzzle_date, state_json, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, game, puzzle_date) DO UPDATE SET
       state_json = excluded.state_json,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at >= puzzle_progress.updated_at`
  )
    .bind(userId, game, date, encoded, updatedAt)
    .run();

  return json({ ok: true, updatedAt });
}

export async function handleProgress(env: AuthEnv, request: Request, url: URL): Promise<Response> {
  const user = await sessionUser(env, request);
  if (!user) return json({ error: "Sign in required" }, { status: 401 });
  await ensureTable(env);

  if (request.method === "PUT") return handlePut(env, user.id, request);
  if (request.method !== "GET") return json({ error: "Method not allowed" }, { status: 405 });

  const game = parseGame(url.searchParams.get("game"));
  const date = url.searchParams.get("date");
  if (game && date) {
    if (!validDate(game, date)) return json({ error: "Invalid game or date" }, { status: 400 });
    return handleGetOne(env, user.id, game, date);
  }

  if (url.searchParams.get("stats") === "1") return handleGetStats(env, user.id);

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from && to) return handleGetRange(env, user.id, from, to);

  return json({ error: "Missing game/date or from/to" }, { status: 400 });
}
