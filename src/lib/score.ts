export const MORELESS_MAX = 25;
export const GUESSR_ROUNDS = 5;
export const GUESSR_ROUND_MAX = 2;
export const GUESSR_MAX = GUESSR_ROUNDS * GUESSR_ROUND_MAX;
export const GUESSR_EXACT_PCT = 0.1;
export const GUESSR_CLOSE_PCT = 10;
export const GUESSR_NEAR_PCT = 20;
export const MONEYLE_NOTE_MAX = 10;
export const MONEYLE_POINTS = [10, 8, 6, 4, 2, 1] as const;
export const MONEYLE_BONUS_MAX = 4;
export const MONEYLE_MAX = MONEYLE_NOTE_MAX + MONEYLE_BONUS_MAX;
export const CONNECTIONS_GROUPS = 4;
export const CONNECTIONS_PER_GROUP = 2;
export const CONNECTIONS_MAX = CONNECTIONS_GROUPS * CONNECTIONS_PER_GROUP;

export function morelessScore(correctCount: number, total = MORELESS_MAX): { score: number; max: number } {
  return { score: correctCount, max: total };
}

/** Exact (or off by less than 0.1%) is 2. Within 10% is 1.5. Within 20% is 1. */
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
  return { score: Math.min(solvedGroups, CONNECTIONS_GROUPS) * CONNECTIONS_PER_GROUP, max: CONNECTIONS_MAX };
}

export function formatScore(score: number, max: number): string {
  return `${score}/${max}`;
}
