import type { GuideBootstrap, GuideGame } from "./gameGuide";

export interface Category {
  slug: string;
  title: string;
  metricLabel: string;
  description: string | null;
  icon: string | null;
  unitPrefix: string;
  unitSuffix: string;
  sourceName: string | null;
  sourceUrl: string | null;
  isActive: boolean;
  itemCount: number;
}

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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchCategories(): Promise<{ categories: Category[] }> {
  return getJson("/api/categories");
}

export interface RankingItem {
  rank: number;
  name: string;
  subtitle: string | null;
  displayValue: string;
  imageUrl: string | null;
}

export interface RankingResponse {
  slug: string;
  title: string;
  metricLabel: string;
  sourceName: string | null;
  sourceUrl: string | null;
  live: boolean;
  fetchedAt: string;
  items: RankingItem[];
}

export function fetchRanking(slug: string): Promise<RankingResponse> {
  return getJson(`/api/rankings/${encodeURIComponent(slug)}`);
}

declare global {
  interface Window {
    __RANKING__?: RankingResponse;
    __GUIDE__?: GuideBootstrap;
  }
}

export function fetchGuide(game: GuideGame): Promise<GuideBootstrap> {
  return getJson(`/api/guide?game=${encodeURIComponent(game)}`);
}

function dateQuery(date?: string | null): string {
  if (!date) return "";
  return `?date=${encodeURIComponent(date)}`;
}

export function fetchMorelessToday(date?: string | null): Promise<MorelessTodayResponse> {
  return getJson(`/api/moreless/today${dateQuery(date)}`);
}

export function fetchGuessrToday(date?: string | null): Promise<GuessrTodayResponse> {
  return getJson(`/api/guessr/today${dateQuery(date)}`);
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

export function fetchMoneylePuzzle(date?: string | null): Promise<MoneylePuzzleResponse> {
  return getJson(`/api/moneyle/puzzle${dateQuery(date)}`);
}

export function fetchMoneyleGuess(
  code: string,
  attempt?: number,
  date?: string | null
): Promise<MoneyleGuessResult> {
  const params = new URLSearchParams({ code });
  if (attempt != null) params.set("attempt", String(attempt));
  if (date) params.set("date", date);
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

export function fetchMoneyleBonus(date?: string | null): Promise<MoneyleBonusResponse> {
  return getJson(`/api/moneyle/bonus${dateQuery(date)}`);
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

export function fetchConnectionsToday(date?: string | null): Promise<ConnectionsTodayResponse> {
  return getJson(`/api/connections/today${dateQuery(date)}`);
}

export type FeedbackCategory = "bug" | "suggestion";

export async function submitFeedback(input: {
  category: FeedbackCategory;
  message: string;
  page?: string;
  website?: string;
}): Promise<void> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
}
