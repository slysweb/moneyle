import type { GuideGame, GuideItem, GuideToday } from "../src/lib/gameGuide";
import { ensureGuessr, ensureMoreless } from "./daily";

interface CashRow {
  kind: "bill" | "coin";
  name: string;
  image_url: string;
  country: string | null;
}

async function guessrToday(db: D1Database, date: string): Promise<GuideToday> {
  const { currency } = await ensureGuessr(db, date);
  const { results } = await db
    .prepare(
      `SELECT d.kind, d.name, d.image_url, c.country
       FROM denominations d
       JOIN currencies c ON c.id = d.currency_id
       WHERE c.slug = ? AND d.is_active = 1
       ORDER BY d.sort_order`
    )
    .bind(currency.slug)
    .all<CashRow>();
  const country = results[0]?.country;
  const toItem = (row: CashRow): GuideItem => ({ label: row.name, imageUrl: row.image_url });
  const bills = results.filter((r) => r.kind === "bill").map(toItem);
  const coins = results.filter((r) => r.kind === "coin").map(toItem);
  return {
    date,
    heading: `Today’s currency: ${currency.name} (${currency.code})`,
    lead: `All five piles today are ${currency.name}${country ? ` from ${country}` : ""}. These are the notes and coins that can land on the table — learn them before you start.`,
    groups: [
      ...(bills.length ? [{ title: "Banknotes", items: bills }] : []),
      ...(coins.length ? [{ title: "Coins", items: coins }] : []),
    ],
    images: true,
  };
}

async function morelessToday(db: D1Database, date: string): Promise<GuideToday> {
  const { levels } = await ensureMoreless(db, date);
  return {
    date,
    heading: "Today’s line-up",
    lead: "The people, companies, films, and countries you will compare today, level by level. The numbers stay hidden until you pick.",
    groups: levels.map((level, i) => {
      const seen = new Set<string>();
      const items: GuideItem[] = [];
      for (const item of level.chain) {
        if (seen.has(item.name)) continue;
        seen.add(item.name);
        items.push({ label: item.name, detail: item.subtitle });
      }
      return { title: `Level ${i + 1} · ${level.title}`, items };
    }),
  };
}

interface CurrencyRow {
  name: string;
  code: string;
  country: string | null;
}

async function moneyleToday(db: D1Database, date: string): Promise<GuideToday> {
  const { results } = await db
    .prepare(
      `SELECT name, code, country FROM currencies WHERE is_active = 1 ORDER BY sort_order, name`
    )
    .all<CurrencyRow>();
  return {
    date,
    heading: "Today’s hidden note",
    lead: "The banknote stays frosted until you name its currency. It is always one of the notes we have photographed — these are the currencies in that set. The guess list is larger: 153 ISO codes.",
    groups: [
      {
        title: "Photographed currencies",
        items: results.map((row) => ({
          label: `${row.name} (${row.code})`,
          detail: row.country,
        })),
      },
    ],
  };
}

function connectionsToday(date: string): GuideToday {
  return {
    date,
    heading: "Today’s 4×4 grid",
    lead: "Four countries, sixteen tiles. Each country appears as a flag, a photographed bill or coin, a GDP figure, and a currency name. The tiles themselves stay in the live grid so the grouping is not given away here.",
    groups: [],
  };
}

export async function guideToday(db: D1Database, game: GuideGame, date: string): Promise<GuideToday | null> {
  if (game === "guessr") return guessrToday(db, date);
  if (game === "moreless") return morelessToday(db, date);
  if (game === "moneyle") return moneyleToday(db, date);
  if (game === "connections") return connectionsToday(date);
  return null;
}
