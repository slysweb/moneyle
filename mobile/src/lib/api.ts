import { API_ORIGIN, assetUrl } from "./config";

export interface GameItem {
  id: number;
  name: string;
  subtitle: string | null;
  value: number;
  displayValue: string;
  imageUrl: string | null;
}

export interface MorelessLevel {
  slug: string;
  title: string;
  short: string;
  metricLabel: string;
  chain: GameItem[];
}

export interface MorelessTodayResponse {
  date: string;
  levels: MorelessLevel[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function withAssets(item: GameItem): GameItem {
  return { ...item, imageUrl: assetUrl(item.imageUrl) };
}

export async function fetchMorelessToday(): Promise<MorelessTodayResponse> {
  const data = await getJson<MorelessTodayResponse>("/api/moreless/today");
  return {
    ...data,
    levels: data.levels.map((level) => ({
      ...level,
      chain: level.chain.map(withAssets),
    })),
  };
}

export interface GuessrPiece {
  denominationId: number;
  slug: string;
  kind: "bill" | "coin";
  name: string;
  valueCents: number;
  imageUrl: string;
}

export interface GuessrCurrency {
  slug: string;
  name: string;
  code: string;
  symbol: string;
  minorDigits: number;
}

export interface GuessrTodayResponse {
  date: string;
  currency: GuessrCurrency;
  puzzles: { pieces: GuessrPiece[] }[];
}

export async function fetchGuessrToday(): Promise<GuessrTodayResponse> {
  const data = await getJson<GuessrTodayResponse>("/api/guessr/today");
  return {
    ...data,
    puzzles: data.puzzles.map((puzzle) => ({
      pieces: puzzle.pieces.map((piece) => ({
        ...piece,
        imageUrl: assetUrl(piece.imageUrl) ?? piece.imageUrl,
      })),
    })),
  };
}

export interface MoneyleCurrency {
  code: string;
  name: string;
  country: string;
}

export interface MoneylePuzzleResponse {
  date: string;
  imageUrl: string;
  maxGuesses: number;
  currencies: MoneyleCurrency[];
}

export interface MoneyleGuessResult {
  correct: boolean;
  remaining: number;
  closeness: number;
  stronger: boolean;
  rateDisplay: string;
  target: MoneyleCurrency | null;
}

export async function fetchMoneylePuzzle(): Promise<MoneylePuzzleResponse> {
  const data = await getJson<MoneylePuzzleResponse>("/api/moneyle/puzzle");
  return { ...data, imageUrl: assetUrl(data.imageUrl) ?? data.imageUrl };
}

export function fetchMoneyleGuess(code: string, attempt?: number): Promise<MoneyleGuessResult> {
  const params = new URLSearchParams({ code });
  if (attempt != null) params.set("attempt", String(attempt));
  return getJson(`/api/moneyle/guess?${params.toString()}`);
}

export type BonusKind = "flag" | "gdp" | "population" | "gdppc";

export interface BonusOption {
  id: string;
  label: string;
  imageUrl: string | null;
  correct: boolean;
}

export interface BonusRound {
  kind: BonusKind;
  title: string;
  prompt: string;
  options: BonusOption[];
}

export interface MoneyleBonusResponse {
  date: string;
  available: boolean;
  country?: string;
  currencyCode?: string;
  rounds?: BonusRound[];
}

export async function fetchMoneyleBonus(): Promise<MoneyleBonusResponse> {
  const data = await getJson<MoneyleBonusResponse>("/api/moneyle/bonus");
  if (!data.rounds) return data;
  return {
    ...data,
    rounds: data.rounds.map((round) => ({
      ...round,
      options: round.options.map((opt) => ({
        ...opt,
        imageUrl: assetUrl(opt.imageUrl),
      })),
    })),
  };
}

export type ConnectionKind = "flag" | "money" | "gdp" | "currency";
export type ConnectionColor = "yellow" | "green" | "blue" | "purple";

export interface ConnectionTile {
  id: string;
  groupId: string;
  kind: ConnectionKind;
  label: string;
  imageUrl: string | null;
  moneyKind?: "bill" | "coin";
}

export interface ConnectionGroup {
  id: string;
  country: string;
  currencyCode: string;
  currencyName: string;
  color: ConnectionColor;
}

export interface ConnectionsTodayResponse {
  date: string;
  groups: ConnectionGroup[];
  tiles: ConnectionTile[];
}

export async function fetchConnectionsToday(): Promise<ConnectionsTodayResponse> {
  const data = await getJson<ConnectionsTodayResponse>("/api/connections/today");
  return {
    ...data,
    tiles: data.tiles.map((tile) => ({ ...tile, imageUrl: assetUrl(tile.imageUrl) })),
  };
}
