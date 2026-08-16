import { randomInt, sample, type Rng } from "./rng";

export interface DenomRow {
  id: number;
  slug: string;
  kind: "bill" | "coin";
  name: string;
  value_cents: number;
  image_url: string;
}

export interface GuessrPiece {
  denominationId: number;
  slug: string;
  kind: "bill" | "coin";
  name: string;
  valueCents: number;
  imageUrl: string;
}

export interface GuessrPuzzle {
  pieces: GuessrPiece[];
}

export interface GuessrCurrency {
  slug: string;
  name: string;
  code: string;
  symbol: string;
  minorDigits: number;
}

function makePiece(denom: DenomRow): GuessrPiece {
  return {
    denominationId: denom.id,
    slug: denom.slug,
    kind: denom.kind === "coin" ? "coin" : "bill",
    name: denom.name,
    valueCents: denom.value_cents,
    imageUrl: denom.image_url,
  };
}

function addCounts(rand: Rng, chosen: DenomRow[], totalCount: number, pieces: GuessrPiece[]): void {
  if (chosen.length === 0 || totalCount <= 0) return;
  let remaining = totalCount;
  chosen.forEach((denom, i) => {
    const leftTypes = chosen.length - i;
    const count =
      i === chosen.length - 1
        ? remaining
        : randomInt(rand, 1, Math.max(1, remaining - (leftTypes - 1)));
    remaining -= count;
    for (let k = 0; k < count; k++) {
      pieces.push(makePiece(denom));
    }
  });
}

/** Five puzzles, easy → hard. Uses this currency's own denomination ladder. */
export function generatePuzzles(denoms: DenomRow[], rand: Rng, count = 5): GuessrPuzzle[] {
  const bills = [...denoms.filter((d) => d.kind === "bill")].sort(
    (a, b) => a.value_cents - b.value_cents
  );
  const coins = denoms.filter((d) => d.kind === "coin");

  const puzzles: GuessrPuzzle[] = [];
  for (let d = 0; d < count; d++) {
    const cut = [0.4, 0.55, 0.7, 0.9, 1][d] ?? 1;
    const allowedBills = bills.slice(0, Math.max(1, Math.ceil(bills.length * cut)));
    const billBudget = [3, 4, 6, 7, 8][d] ?? 8;
    const coinBudget = coins.length === 0 ? 0 : ([0, 3, 6, 8, 11][d] ?? 10);
    const nBillTypes = Math.min(allowedBills.length, [1, 2, 2, 3, 3][d] ?? 3);
    const nCoinTypes = Math.min(coins.length, [0, 2, 3, 3, 4][d] ?? 4);

    const pieces: GuessrPiece[] = [];
    addCounts(rand, sample(allowedBills, nBillTypes, rand), billBudget, pieces);
    if (coinBudget > 0) {
      addCounts(rand, sample(coins, nCoinTypes, rand), coinBudget, pieces);
    }

    puzzles.push({ pieces });
  }
  return puzzles;
}
