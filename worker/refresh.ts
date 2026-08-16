import { formatUsd } from "./format";

const UA = "MoneyGames/1.0 (https://moneygames.cc)";

export interface IncomingItem {
  name: string;
  subtitle: string | null;
  value: number;
  displayValue: string;
  imageUrl: string | null;
  meta: Record<string, unknown>;
}

interface ExistingItem {
  id: number;
  name: string;
  image_url: string | null;
  meta: string | null;
}

async function getJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(20_000),
    headers: {
      "user-agent": UA,
      accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const text = await res.text();
  const start = text.indexOf("{") >= 0 && (text.indexOf("[") < 0 || text.indexOf("{") < text.indexOf("["))
    ? text.indexOf("{")
    : text.indexOf("[");
  if (start < 0) throw new Error(`No JSON in ${url}`);
  return JSON.parse(text.slice(start));
}

async function getText(url: string, referer?: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(25_000),
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MoneyGames/1.0",
      accept: "text/html,application/xhtml+xml",
      ...(referer ? { referer } : {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

function tickerOf(meta: string | null): string | null {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta) as { ticker?: unknown };
    return typeof parsed.ticker === "string" ? parsed.ticker : null;
  } catch {
    return null;
  }
}

async function categoryId(db: D1Database, slug: string): Promise<number> {
  const row = await db
    .prepare(`SELECT id FROM categories WHERE slug = ?`)
    .bind(slug)
    .first<{ id: number }>();
  if (!row) throw new Error(`Unknown category ${slug}`);
  return row.id;
}

async function loadExisting(db: D1Database, catId: number): Promise<ExistingItem[]> {
  const { results } = await db
    .prepare(`SELECT id, name, image_url, meta FROM items WHERE category_id = ?`)
    .bind(catId)
    .all<ExistingItem>();
  return results;
}

async function runBatches(db: D1Database, statements: D1PreparedStatement[]): Promise<void> {
  const size = 40;
  for (let i = 0; i < statements.length; i += size) {
    await db.batch(statements.slice(i, i + size));
  }
}

function keepImage(existing: ExistingItem | undefined, incoming: string | null): string | null {
  if (existing?.image_url) return existing.image_url;
  return incoming;
}

/** Replace a category's active top list. Existing local images are kept. */
async function syncItems(
  db: D1Database,
  slug: string,
  incoming: IncomingItem[],
  match: "name" | "ticker"
): Promise<number> {
  if (incoming.length < 50) throw new Error(`${slug}: only ${incoming.length} rows`);
  const catId = await categoryId(db, slug);
  const existing = await loadExisting(db, catId);
  const byName = new Map(existing.map((e) => [e.name, e]));
  const byTicker = new Map<string, ExistingItem>();
  for (const e of existing) {
    const t = tickerOf(e.meta);
    if (t) byTicker.set(t, e);
  }

  const keepIds = new Set<number>();
  const statements: D1PreparedStatement[] = [];

  for (const item of incoming) {
    const ticker = typeof item.meta.ticker === "string" ? item.meta.ticker : null;
    const found =
      match === "ticker" && ticker ? (byTicker.get(ticker) ?? byName.get(item.name)) : byName.get(item.name);
    const image = keepImage(found, item.imageUrl);
    const meta = JSON.stringify(item.meta);

    if (found) {
      keepIds.add(found.id);
      statements.push(
        db
          .prepare(
            `UPDATE items
             SET name = ?, subtitle = ?, value = ?, display_value = ?, image_url = ?,
                 meta = ?, is_active = 1, updated_at = datetime('now')
             WHERE id = ?`
          )
          .bind(item.name, item.subtitle, item.value, item.displayValue, image, meta, found.id)
      );
    } else {
      statements.push(
        db
          .prepare(
            `INSERT INTO items (category_id, name, subtitle, value, display_value, image_url, meta, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
          )
          .bind(catId, item.name, item.subtitle, item.value, item.displayValue, image, meta)
      );
    }
  }

  const stale = existing.filter((e) => !keepIds.has(e.id));
  for (const e of stale) {
    statements.push(
      db.prepare(`UPDATE items SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).bind(e.id)
    );
  }

  await runBatches(db, statements);
  return incoming.length;
}

export async function fetchBillionaires(): Promise<IncomingItem[]> {
  const url =
    "https://www.forbes.com/forbesapi/person/rtb/0/position/true.json" +
    "?fields=rank,personName,finalWorth,source,countryOfCitizenship,squareImage";
  const parsed = (await getJson(url, {
    headers: { referer: "https://www.forbes.com/real-time-billionaires/" },
  })) as {
    personList?: { personsLists?: ForbesPerson[] };
  };
  const persons = parsed.personList?.personsLists ?? [];
  return persons
    .filter((p) => p.personName && p.finalWorth > 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 100)
    .map((p) => {
      const usd = p.finalWorth * 1e6;
      let image = p.squareImage || null;
      if (image && image.startsWith("//")) image = "https:" + image;
      return {
        name: p.personName.trim(),
        subtitle: p.source || null,
        value: Math.round(usd),
        displayValue: formatUsd(usd),
        imageUrl: image,
        meta: { rank: p.rank, country: p.countryOfCitizenship || null },
      };
    });
}

interface ForbesPerson {
  rank: number;
  personName: string;
  finalWorth: number;
  source?: string;
  countryOfCitizenship?: string;
  squareImage?: string;
}

export async function fetchGdp(): Promise<IncomingItem[]> {
  const countriesRaw = (await getJson(
    "https://api.worldbank.org/v2/country?format=json&per_page=400"
  )) as [unknown, WbCountry[]];
  const real = new Map<string, { iso2: string; name: string; region: string }>();
  for (const c of countriesRaw[1] ?? []) {
    if (c.region?.value && c.region.value !== "Aggregates") {
      real.set(c.id, {
        iso2: c.iso2Code.toLowerCase(),
        name: c.name,
        region: c.region.value.trim(),
      });
    }
  }

  const gdpRaw = (await getJson(
    "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&mrv=1&per_page=400"
  )) as [unknown, WbGdp[]];

  const list: IncomingItem[] = [];
  for (const row of gdpRaw[1] ?? []) {
    const country = real.get(row.countryiso3code);
    if (!country || row.value == null) continue;
    list.push({
      name: country.name,
      subtitle: country.region,
      value: Math.round(row.value),
      displayValue: formatUsd(row.value),
      imageUrl: `https://flagcdn.com/w320/${country.iso2}.png`,
      meta: { iso2: country.iso2, iso3: row.countryiso3code, year: Number(row.date) },
    });
  }
  list.sort((a, b) => b.value - a.value);
  return list.slice(0, 100);
}

interface WbCountry {
  id: string;
  iso2Code: string;
  name: string;
  region?: { value?: string };
}

interface WbGdp {
  countryiso3code: string;
  value: number | null;
  date: string;
}

export async function fetchMarketCap(): Promise<IncomingItem[]> {
  const html = await getText("https://companiesmarketcap.com/", "https://companiesmarketcap.com/");
  const rowRe =
    /data-sort="(\d+)"[^>]*>\1<\/td><td class="name-td">[\s\S]*?src="(\/img\/company-logos\/)\d+(\/[^"]+)"[\s\S]*?<div class="company-name">([^<]+)<\/div><div class="company-code">[\s\S]*?<\/span>([^<]+)<\/div>[\s\S]*?data-sort="(\d+)"/g;
  const companies: IncomingItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html)) !== null) {
    const rank = Number(match[1]);
    if (rank > 100) break;
    const marketCap = Number(match[6]);
    const ticker = match[5].trim();
    companies.push({
      name: match[4].trim(),
      subtitle: ticker,
      value: marketCap,
      displayValue: formatUsd(marketCap),
      imageUrl: `https://companiesmarketcap.com${match[2]}256${match[3]}`,
      meta: { rank, ticker },
    });
  }
  if (companies.length < 80) throw new Error(`market-cap: parsed ${companies.length} rows`);
  return companies.slice(0, 100);
}

export interface RefreshResult {
  billionaires: number | string;
  gdp: number | string;
  marketCap: number | string;
}

/** Fetch live lists and upsert D1. Failures are isolated so one source cannot block the others. */
export async function refreshLiveStats(db: D1Database): Promise<RefreshResult> {
  const result: RefreshResult = { billionaires: 0, gdp: 0, marketCap: 0 };

  const [billionaires, gdp, marketCap] = await Promise.allSettled([
    fetchBillionaires(),
    fetchGdp(),
    fetchMarketCap(),
  ]);

  try {
    if (billionaires.status === "rejected") throw billionaires.reason;
    result.billionaires = await syncItems(db, "billionaires", billionaires.value, "name");
  } catch (err) {
    result.billionaires = err instanceof Error ? err.message : String(err);
    console.error("refresh billionaires", err);
  }

  try {
    if (gdp.status === "rejected") throw gdp.reason;
    result.gdp = await syncItems(db, "country-gdp", gdp.value, "name");
  } catch (err) {
    result.gdp = err instanceof Error ? err.message : String(err);
    console.error("refresh gdp", err);
  }

  try {
    if (marketCap.status === "rejected") throw marketCap.reason;
    result.marketCap = await syncItems(db, "market-cap", marketCap.value, "ticker");
  } catch (err) {
    result.marketCap = err instanceof Error ? err.message : String(err);
    console.error("refresh market-cap", err);
  }

  return result;
}
