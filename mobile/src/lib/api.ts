import { API_ORIGIN, assetUrl } from "./config";
import { getBearer } from "./session";

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getBearer();
  return {
    ...(extra ?? {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
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

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error || `Request failed: ${res.status}`;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<T>;
}

async function putJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    method: "PUT",
    headers: authHeaders({ "content-type": "application/json" }),
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<T>;
}

export async function fetchProgress<T>(
  game: string,
  date: string
): Promise<{ state: T | null; updatedAt: number }> {
  return getJson(`/api/progress?game=${encodeURIComponent(game)}&date=${encodeURIComponent(date)}`);
}

export async function fetchProgressRange(
  from: string,
  to: string
): Promise<{ items: { game: string; date: string; finished: boolean }[] }> {
  return getJson(`/api/progress?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export async function fetchProgressStats(): Promise<{
  items: {
    game: string;
    date: string;
    score: number;
    max: number;
    won: boolean | null;
    perfect: boolean;
    guesses?: number;
  }[];
}> {
  return getJson("/api/progress?stats=1");
}

export async function putProgress(
  game: string,
  date: string,
  state: unknown,
  updatedAt: number
): Promise<void> {
  await putJson("/api/progress", { game, date, state, updatedAt });
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  pictureUrl: string | null;
  joinedAt: string | null;
}

export async function fetchMe(): Promise<AuthUser | null> {
  const data = await getJson<{ user?: AuthUser | null }>("/api/auth/me");
  return data.user ?? null;
}

export async function exchangeAuthCode(code: string): Promise<{ token: string; user: AuthUser }> {
  return postJson("/api/auth/exchange", { code });
}

export async function logoutRemote(): Promise<void> {
  await postJson("/api/auth/logout");
}

export async function deleteAccountRemote(): Promise<void> {
  await postJson("/api/auth/delete");
}

function withAssets(item: GameItem): GameItem {
  return { ...item, imageUrl: assetUrl(item.imageUrl) };
}

function dateQuery(date?: string | null): string {
  if (!date) return "";
  return `?date=${encodeURIComponent(date)}`;
}

export async function fetchMorelessToday(date?: string | null): Promise<MorelessTodayResponse> {
  const data = await getJson<MorelessTodayResponse>(`/api/moreless/today${dateQuery(date)}`);
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

export async function fetchGuessrToday(date?: string | null): Promise<GuessrTodayResponse> {
  const data = await getJson<GuessrTodayResponse>(`/api/guessr/today${dateQuery(date)}`);
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

export async function fetchMoneylePuzzle(date?: string | null): Promise<MoneylePuzzleResponse> {
  const data = await getJson<MoneylePuzzleResponse>(`/api/banknotele/puzzle${dateQuery(date)}`);
  return { ...data, imageUrl: assetUrl(data.imageUrl) ?? data.imageUrl };
}

export function fetchMoneyleGuess(
  code: string,
  attempt?: number,
  date?: string | null
): Promise<MoneyleGuessResult> {
  const params = new URLSearchParams({ code });
  if (attempt != null) params.set("attempt", String(attempt));
  if (date) params.set("date", date);
  return getJson(`/api/banknotele/guess?${params.toString()}`);
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

export async function fetchMoneyleBonus(date?: string | null): Promise<MoneyleBonusResponse> {
  const data = await getJson<MoneyleBonusResponse>(`/api/banknotele/bonus${dateQuery(date)}`);
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

export async function fetchConnectionsToday(date?: string | null): Promise<ConnectionsTodayResponse> {
  const data = await getJson<ConnectionsTodayResponse>(`/api/connections/today${dateQuery(date)}`);
  return {
    ...data,
    tiles: data.tiles.map((tile) => ({ ...tile, imageUrl: assetUrl(tile.imageUrl) })),
  };
}
