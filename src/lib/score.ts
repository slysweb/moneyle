export const MORELESS_MAX = 25;
export const GUESSR_ROUNDS = 5;
export const GUESSR_ROUND_MAX = 2;
export const GUESSR_MAX = GUESSR_ROUNDS * GUESSR_ROUND_MAX;
export const GUESSR_NEAR_PCT = 20;
export const MONEYLE_MAX = 10;
export const MONEYLE_POINTS = [10, 8, 6, 4, 2, 1] as const;
export const CONNECTIONS_GROUPS = 4;
export const CONNECTIONS_PER_GROUP = 2;
export const CONNECTIONS_MAX = CONNECTIONS_GROUPS * CONNECTIONS_PER_GROUP;

export function morelessScore(correctCount: number, total = MORELESS_MAX): { score: number; max: number } {
  return { score: correctCount, max: total };
}

/** Exact (or a hair off) is 2. Within 20% of the real total is 1. */
export function guessrRoundPoints(pct: number, guessCents?: number, actualCents?: number): number {
  if (guessCents != null && actualCents != null && guessCents === actualCents) return GUESSR_ROUND_MAX;
  const abs = Math.abs(pct);
  if (abs < 0.05) return GUESSR_ROUND_MAX;
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

export function moneyleScore(won: boolean, guesses: number): { score: number; max: number } {
  if (!won || guesses < 1) return { score: 0, max: MONEYLE_MAX };
  const index = Math.min(guesses, MONEYLE_POINTS.length) - 1;
  return { score: MONEYLE_POINTS[index] ?? 0, max: MONEYLE_MAX };
}

export function connectionsScore(solvedGroups: number): { score: number; max: number } {
  return { score: Math.min(solvedGroups, CONNECTIONS_GROUPS) * CONNECTIONS_PER_GROUP, max: CONNECTIONS_MAX };
}

export function formatScore(score: number, max: number): string {
  return `${score}/${max}`;
}
