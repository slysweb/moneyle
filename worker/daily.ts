import { denverDate } from "./denver";
import { generatePuzzles, type DenomRow, type GuessrCurrency, type GuessrPuzzle } from "./guessr";
import { pick, rngFor } from "./rng";
import {
  buildChain,
  MORELESS_LEVELS,
  ROUNDS_PER_LEVEL,
  type MorelessItem,
  type MorelessLevelPuzzle,
} from "./moreless";
import { FX_CURRENCIES, type FxCurrency } from "./moneyle";
import { refreshLiveStats } from "./refresh";

export type DailyGame = "moreless" | "guessr" | "moneyle";

export interface MorelessDailyPayload {
  levels: MorelessLevelPuzzle[];
}

export interface GuessrDailyPayload {
  currency: GuessrCurrency;
  puzzles: GuessrPuzzle[];
}

export interface MoneyleDailyPayload {
  target: FxCurrency;
  imageUrl: string;
}

interface CurrencyRow {
  id: number;
  slug: string;
  name: string;
  code: string;
  symbol: string;
  minor_digits: number;
  country: string | null;
}

async function loadRow(
  db: D1Database,
  game: DailyGame,
  date: string
): Promise<string | null> {
  const row = await db
    .prepare(`SELECT payload FROM daily_puzzles WHERE game = ? AND puzzle_date = ?`)
    .bind(game, date)
    .first<{ payload: string }>();
  return row?.payload ?? null;
}

async function saveRow(db: D1Database, game: DailyGame, date: string, payload: unknown): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO daily_puzzles (game, puzzle_date, payload) VALUES (?, ?, ?)`
    )
    .bind(game, date, JSON.stringify(payload))
    .run();
}

async function generateMoreless(db: D1Database, date: string): Promise<MorelessDailyPayload> {
  const refresh = await refreshLiveStats(db);
  console.log("live stats refresh", date, refresh);

  const levels: MorelessLevelPuzzle[] = [];
  for (const lvl of MORELESS_LEVELS) {
    const rand = rngFor(`${date}:moreless:${lvl.slug}`);
    const category = await db
      .prepare(
        `SELECT id, slug, title, metric_label FROM categories WHERE slug = ? AND is_active = 1`
      )
      .bind(lvl.slug)
      .first<{ id: number; slug: string; title: string; metric_label: string }>();
    if (!category) throw new Error(`Missing category ${lvl.slug}`);

    const { results } = await db
      .prepare(
        `SELECT id, name, subtitle, value, display_value, image_url
         FROM items WHERE category_id = ? AND is_active = 1`
      )
      .bind(category.id)
      .all<{
        id: number;
        name: string;
        subtitle: string | null;
        value: number;
        display_value: string;
        image_url: string | null;
      }>();

    const items: MorelessItem[] = results.map((i) => ({
      id: i.id,
      name: i.name,
      subtitle: i.subtitle,
      value: i.value,
      displayValue: i.display_value,
      imageUrl: i.image_url,
    }));

    levels.push({
      slug: lvl.slug,
      title: lvl.title,
      short: lvl.short,
      metricLabel: category.metric_label,
      chain: buildChain(items, ROUNDS_PER_LEVEL, rand),
    });
  }
  return { levels };
}

async function listCurrencies(db: D1Database): Promise<CurrencyRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, slug, name, code, symbol, minor_digits, country
       FROM currencies WHERE is_active = 1 ORDER BY sort_order`
    )
    .all<CurrencyRow>();
  return results;
}

async function generateGuessr(db: D1Database, date: string): Promise<GuessrDailyPayload> {
  const rand = rngFor(`${date}:guessr`);
  const currencies = await listCurrencies(db);
  if (!currencies.length) throw new Error("No currencies");
  const currency = pick(currencies, rand);

  const { results } = await db
    .prepare(
      `SELECT id, slug, kind, name, value_cents, image_url
       FROM denominations WHERE currency_id = ? AND is_active = 1 ORDER BY sort_order`
    )
    .bind(currency.id)
    .all<DenomRow>();
  if (!results.length) throw new Error(`No denominations for ${currency.slug}`);

  return {
    currency: {
      slug: currency.slug,
      name: currency.name,
      code: currency.code,
      symbol: currency.symbol,
      minorDigits: currency.minor_digits,
    },
    puzzles: generatePuzzles(results, rand, 5),
  };
}

async function generateMoneyle(db: D1Database, date: string): Promise<MoneyleDailyPayload> {
  const rand = rngFor(`${date}:moneyle`);
  const { results } = await db
    .prepare(
      `SELECT c.code, c.name, c.country, d.image_url
       FROM denominations d
       JOIN currencies c ON c.id = d.currency_id
       WHERE d.kind = 'bill' AND d.is_active = 1 AND c.is_active = 1`
    )
    .all<{ code: string; name: string; country: string | null; image_url: string }>();
  if (!results.length) throw new Error("No banknotes");

  const codes = [...new Set(results.map((r) => r.code))];
  const code = pick(codes, rand);
  const bills = results.filter((r) => r.code === code);
  const note = pick(bills, rand);
  const listed = FX_CURRENCIES.find((c) => c.code === code);
  const target: FxCurrency = listed ?? {
    code: note.code,
    name: note.name,
    country: note.country ?? note.code,
  };
  return { target, imageUrl: note.image_url };
}

async function ensureGame<T>(db: D1Database, game: DailyGame, date: string, gen: () => Promise<T>): Promise<T> {
  const existing = await loadRow(db, game, date);
  if (existing) return JSON.parse(existing) as T;
  const payload = await gen();
  await saveRow(db, game, date, payload);
  const saved = await loadRow(db, game, date);
  return saved ? (JSON.parse(saved) as T) : payload;
}

export async function ensureMoreless(db: D1Database, date: string): Promise<MorelessDailyPayload> {
  return ensureGame(db, "moreless", date, () => generateMoreless(db, date));
}

export async function ensureGuessr(db: D1Database, date: string): Promise<GuessrDailyPayload> {
  return ensureGame(db, "guessr", date, () => generateGuessr(db, date));
}

export async function ensureMoneyle(db: D1Database, date: string): Promise<MoneyleDailyPayload> {
  return ensureGame(db, "moneyle", date, () => generateMoneyle(db, date));
}

export async function ensureAllDailyPuzzles(db: D1Database, at: Date = new Date()): Promise<string> {
  const date = denverDate(at);
  await Promise.all([ensureMoreless(db, date), ensureGuessr(db, date), ensureMoneyle(db, date)]);
  return date;
}
