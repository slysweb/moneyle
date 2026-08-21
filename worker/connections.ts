import { pick, shuffle, type Rng } from "./rng";

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

export interface ConnectionsDailyPayload {
  groups: ConnectionGroup[];
  tiles: ConnectionTile[];
}

interface GdpRow {
  name: string;
  display_value: string;
  image_url: string | null;
  value: number;
  meta: string | null;
}

interface DenomRow {
  id: number;
  slug: string;
  kind: "bill" | "coin";
  name: string;
  image_url: string;
  currency_slug: string;
  currency_name: string;
  currency_code: string;
}

/** Currencies we have cash art for, mapped onto a GDP/flag country. */
const SOLO_CURRENCIES: { slug: string; iso2: string; country: string; shortName: string }[] = [
  { slug: "usd", iso2: "us", country: "United States", shortName: "Dollar" },
  { slug: "cny", iso2: "cn", country: "China", shortName: "Yuan" },
  { slug: "jpy", iso2: "jp", country: "Japan", shortName: "Yen" },
  { slug: "cad", iso2: "ca", country: "Canada", shortName: "Dollar" },
  { slug: "won", iso2: "kr", country: "South Korea", shortName: "Won" },
  { slug: "brl", iso2: "br", country: "Brazil", shortName: "Real" },
  { slug: "mxn", iso2: "mx", country: "Mexico", shortName: "Peso" },
  { slug: "nok", iso2: "no", country: "Norway", shortName: "Krone" },
  { slug: "pln", iso2: "pl", country: "Poland", shortName: "Złoty" },
  { slug: "rub", iso2: "ru", country: "Russia", shortName: "Ruble" },
  { slug: "thb", iso2: "th", country: "Thailand", shortName: "Baht" },
  { slug: "try", iso2: "tr", country: "Turkey", shortName: "Lira" },
  { slug: "uah", iso2: "ua", country: "Ukraine", shortName: "Hryvnia" },
  { slug: "egp", iso2: "eg", country: "Egypt", shortName: "Pound" },
];

/** Euro is shared, so a puzzle never includes two eurozone countries. */
export const EUROZONE: { iso2: string; country: string }[] = [
  { iso2: "de", country: "Germany" },
  { iso2: "fr", country: "France" },
  { iso2: "it", country: "Italy" },
  { iso2: "es", country: "Spain" },
  { iso2: "nl", country: "Netherlands" },
  { iso2: "be", country: "Belgium" },
  { iso2: "ie", country: "Ireland" },
  { iso2: "at", country: "Austria" },
  { iso2: "pt", country: "Portugal" },
  { iso2: "fi", country: "Finland" },
  { iso2: "gr", country: "Greece" },
  { iso2: "sk", country: "Slovakia" },
  { iso2: "si", country: "Slovenia" },
  { iso2: "lt", country: "Lithuania" },
  { iso2: "lv", country: "Latvia" },
  { iso2: "hr", country: "Croatia" },
  { iso2: "lu", country: "Luxembourg" },
];

const COLORS: ConnectionColor[] = ["yellow", "green", "blue", "purple"];

function parseIso2(meta: string | null): string | null {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta) as { iso2?: string };
    return parsed.iso2?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function generateConnections(
  db: D1Database,
  rand: Rng
): Promise<ConnectionsDailyPayload> {
  const [gdpRes, denomRes] = await Promise.all([
    db
      .prepare(
        `SELECT i.name, i.display_value, i.image_url, i.value, i.meta
         FROM items i
         JOIN categories c ON c.id = i.category_id
         WHERE c.slug = 'country-gdp' AND i.is_active = 1`
      )
      .all<GdpRow>(),
    db
      .prepare(
        `SELECT d.id, d.slug, d.kind, d.name, d.image_url,
                c.slug AS currency_slug, c.name AS currency_name, c.code AS currency_code
         FROM denominations d
         JOIN currencies c ON c.id = d.currency_id
         WHERE d.is_active = 1 AND c.is_active = 1`
      )
      .all<DenomRow>(),
  ]);

  const gdpByIso = new Map<string, GdpRow>();
  for (const row of gdpRes.results) {
    const iso = parseIso2(row.meta);
    if (iso && row.image_url) gdpByIso.set(iso, row);
  }

  const denomsBySlug = new Map<string, DenomRow[]>();
  for (const row of denomRes.results) {
    const list = denomsBySlug.get(row.currency_slug) ?? [];
    list.push(row);
    denomsBySlug.set(row.currency_slug, list);
  }

  const pool: {
    slug: string;
    iso2: string;
    country: string;
    shortName: string;
    gdp: GdpRow;
    denoms: DenomRow[];
  }[] = [];

  for (const entry of SOLO_CURRENCIES) {
    const gdp = gdpByIso.get(entry.iso2);
    const denoms = denomsBySlug.get(entry.slug);
    if (!gdp || !denoms?.length) continue;
    pool.push({ ...entry, gdp, denoms });
  }

  const euroDenoms = denomsBySlug.get("eur") ?? [];
  const euroCountries = EUROZONE.filter((c) => gdpByIso.has(c.iso2));
  if (euroDenoms.length && euroCountries.length) {
    const picked = pick(euroCountries, rand);
    pool.push({
      slug: "eur",
      iso2: picked.iso2,
      country: picked.country,
      shortName: "Euro",
      gdp: gdpByIso.get(picked.iso2)!,
      denoms: euroDenoms,
    });
  }

  if (pool.length < 4) throw new Error("Not enough countries for Connections");

  const moneyKind: "bill" | "coin" = rand() < 0.5 ? "bill" : "coin";
  const withKind = pool.filter((c) => c.denoms.some((d) => d.kind === moneyKind));
  const chosen = pickDistinctNames(withKind.length >= 4 ? withKind : pool, 4, rand).sort(
    (a, b) => b.gdp.value - a.gdp.value
  );

  const groups: ConnectionGroup[] = [];
  const tiles: ConnectionTile[] = [];

  chosen.forEach((country, index) => {
    const groupId = country.iso2;
    const matching = country.denoms.filter((d) => d.kind === moneyKind);
    const denom = pick(matching.length ? matching : country.denoms, rand);
    groups.push({
      id: groupId,
      country: country.country,
      currencyCode: denom.currency_code,
      currencyName: country.shortName,
      color: COLORS[index],
    });
    tiles.push(
      {
        id: `${groupId}:flag`,
        groupId,
        kind: "flag",
        label: country.country,
        imageUrl: country.gdp.image_url,
      },
      {
        id: `${groupId}:money`,
        groupId,
        kind: "money",
        label: denom.name,
        imageUrl: denom.image_url,
        moneyKind: denom.kind,
      },
      {
        id: `${groupId}:gdp`,
        groupId,
        kind: "gdp",
        label: country.gdp.display_value,
        imageUrl: null,
      },
      {
        id: `${groupId}:currency`,
        groupId,
        kind: "currency",
        label: country.shortName,
        imageUrl: null,
      }
    );
  });

  return { groups, tiles: shuffle(tiles, rand) };
}

/** Keep currency short names unique so two "Dollar" tiles never share a board. */
function pickDistinctNames<T extends { shortName: string }>(pool: T[], n: number, rand: Rng): T[] {
  const out: T[] = [];
  const used = new Set<string>();
  for (const item of shuffle(pool, rand)) {
    if (used.has(item.shortName)) continue;
    used.add(item.shortName);
    out.push(item);
    if (out.length === n) return out;
  }
  throw new Error("Not enough distinct currency names for Connections");
}
