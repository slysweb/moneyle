import { shuffle, type Rng } from "./rng";

export const MORELESS_LEVELS = [
  { slug: "billionaires", short: "Billionaires", title: "Forbes Billionaires" },
  { slug: "market-cap", short: "Market Cap", title: "Company Market Cap" },
  { slug: "player-salaries", short: "Salaries", title: "Player Salaries" },
  { slug: "box-office", short: "Box Office", title: "Movie Box Office" },
  { slug: "country-gdp", short: "GDP", title: "Country GDP" },
] as const;

export const ROUNDS_PER_LEVEL = 5;

export interface MorelessItem {
  id: number;
  name: string;
  subtitle: string | null;
  value: number;
  displayValue: string;
  imageUrl: string | null;
}

export interface MorelessLevelPuzzle {
  slug: string;
  title: string;
  short: string;
  metricLabel: string;
  chain: MorelessItem[];
}

export function buildChain(items: MorelessItem[], rounds: number, rand: Rng): MorelessItem[] {
  const need = rounds + 1;
  const pool = shuffle(items, rand);
  const chain: MorelessItem[] = [];

  for (const item of pool) {
    if (chain.length === 0) {
      chain.push(item);
      continue;
    }
    if (item.id === chain[chain.length - 1].id) continue;
    if (item.value === chain[chain.length - 1].value) continue;
    chain.push(item);
    if (chain.length >= need) break;
  }

  if (chain.length < need) {
    for (const item of shuffle(items, rand)) {
      if (chain.some((c) => c.id === item.id)) continue;
      chain.push(item);
      if (chain.length >= need) break;
    }
  }

  return chain.slice(0, need);
}
