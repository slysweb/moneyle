export const API_ORIGIN = "https://moneyle.app";
export const SITE_EPOCH = "2026-08-12";
export const PUZZLE_TZ = "America/Denver";

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("//")) return `https:${path}`;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function denverDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PUZZLE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function dailyPuzzleNumber(isoDate: string, epoch = SITE_EPOCH): number {
  const start = Date.parse(`${epoch}T12:00:00Z`);
  const day = Date.parse(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(day)) return 1;
  return Math.max(1, Math.round((day - start) / 86_400_000) + 1);
}

export function resultSquares(correct: boolean[]): string {
  return correct.map((ok) => (ok ? "🟩" : "🟥")).join("");
}

export function sharePlayLine(path: string, date?: string | null, today = denverDate()): string {
  const href = !date || date === today ? path : `${path}?date=${date}`;
  const url = `${API_ORIGIN}${href}`;
  if (date && date !== today) return `Play this puzzle: ${url}`;
  return `Play Today's Game: ${url}`;
}

export function formatScore(score: number, max: number): string {
  return `${score}/${max}`;
}

export function errorSquare(pct: number): string {
  const abs = Math.abs(pct);
  if (abs <= 5) return "🟩";
  if (abs <= 15) return "🟨";
  return "🟥";
}

export function closenessSquare(closeness: number, correct: boolean): string {
  if (correct) return "🟩";
  if (closeness >= 50) return "🟨";
  return "🟥";
}

const CONNECTION_SQUARES: Record<string, string> = {
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
  purple: "🟪",
};

export function connectionRow(color: string): string {
  return (CONNECTION_SQUARES[color] ?? "⬜").repeat(4);
}

export const GUESSR_ROUNDS = 5;
export const GUESSR_ROUND_MAX = 2;
export const GUESSR_MAX = GUESSR_ROUNDS * GUESSR_ROUND_MAX;
export const GUESSR_EXACT_PCT = 0.1;
export const GUESSR_CLOSE_PCT = 10;
export const GUESSR_NEAR_PCT = 20;
export const MONEYLE_NOTE_MAX = 10;
export const MONEYLE_POINTS = [10, 8, 6, 4, 2, 1] as const;
export const MONEYLE_MAX_GUESSES = 6;
export const CONNECTIONS_GROUPS = 4;
export const CONNECTIONS_PER_GROUP = 2;
export const CONNECTIONS_MAX = CONNECTIONS_GROUPS * CONNECTIONS_PER_GROUP;

export function guessrRoundPoints(pct: number, guessCents?: number, actualCents?: number): number {
  if (guessCents != null && actualCents != null && guessCents === actualCents) return GUESSR_ROUND_MAX;
  const abs = Math.abs(pct);
  if (abs < GUESSR_EXACT_PCT) return GUESSR_ROUND_MAX;
  if (abs <= GUESSR_CLOSE_PCT) return 1.5;
  if (abs <= GUESSR_NEAR_PCT) return 1;
  return 0;
}

export function guessrScore(
  results: { pct: number; guessCents?: number; actualCents?: number }[]
): { score: number; max: number } {
  const score = results.reduce(
    (sum, row) => sum + guessrRoundPoints(row.pct, row.guessCents, row.actualCents),
    0
  );
  return { score, max: GUESSR_MAX };
}

export function moneyleNoteScore(won: boolean, guesses: number): number {
  if (!won || guesses < 1) return 0;
  const index = Math.min(guesses, MONEYLE_POINTS.length) - 1;
  return MONEYLE_POINTS[index] ?? 0;
}

export function moneyleScore(
  won: boolean,
  guesses: number,
  bonusCorrect = 0,
  bonusMax = 0
): { score: number; max: number; note: number; bonus: number } {
  const note = moneyleNoteScore(won, guesses);
  const extra = Math.max(0, bonusMax);
  const bonus = extra > 0 ? Math.min(Math.max(0, bonusCorrect), extra) : 0;
  return { score: note + bonus, max: MONEYLE_NOTE_MAX + extra, note, bonus };
}

export function connectionsScore(solvedGroups: number): { score: number; max: number } {
  return {
    score: Math.min(solvedGroups, CONNECTIONS_GROUPS) * CONNECTIONS_PER_GROUP,
    max: CONNECTIONS_MAX,
  };
}
