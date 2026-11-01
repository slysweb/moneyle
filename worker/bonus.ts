import { EUROZONE } from "./connections";
import { formatUsd } from "./format";
import { POPULATION, POPULATION_YEAR } from "./population";
import { pick, rngFor, shuffle, type Rng } from "./rng";

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

export interface BonusQuiz {
  country: string;
  currencyCode: string;
  rounds: BonusRound[];
}

interface GdpRow {
  name: string;
  display_value: string;
  image_url: string | null;
  value: number;
  meta: string | null;
}

interface CountryFact {
  iso2: string;
  name: string;
  flagUrl: string;
  gdp: number;
  gdpLabel: string;
  population: number;
  popLabel: string;
  gdppc: number;
  gdppcLabel: string;
  year: number;
}

/** Banknote currencies we can map onto a GDP/flag country. */
const SOLO: Record<string, { iso2: string; country: string }> = {
  USD: { iso2: "us", country: "the United States" },
  GBP: { iso2: "gb", country: "the United Kingdom" },
  JPY: { iso2: "jp", country: "Japan" },
  CNY: { iso2: "cn", country: "China" },
  CAD: { iso2: "ca", country: "Canada" },
  KRW: { iso2: "kr", country: "South Korea" },
  BRL: { iso2: "br", country: "Brazil" },
  MXN: { iso2: "mx", country: "Mexico" },
  NOK: { iso2: "no", country: "Norway" },
  PLN: { iso2: "pl", country: "Poland" },
  RUB: { iso2: "ru", country: "Russia" },
  THB: { iso2: "th", country: "Thailand" },
  TRY: { iso2: "tr", country: "Turkey" },
  UAH: { iso2: "ua", country: "Ukraine" },
  EGP: { iso2: "eg", country: "Egypt" },
  ZAR: { iso2: "za", country: "South Africa" },
  BZD: { iso2: "bz", country: "Belize" },
  CHF: { iso2: "ch", country: "Switzerland" },
  VND: { iso2: "vn", country: "Vietnam" },
  AUD: { iso2: "au", country: "Australia" },
  INR: { iso2: "in", country: "India" },
  HKD: { iso2: "hk", country: "Hong Kong" },
  SGD: { iso2: "sg", country: "Singapore" },
  SEK: { iso2: "se", country: "Sweden" },
};

function parseMeta(meta: string | null): { iso2: string | null; year: number | null } {
  if (!meta) return { iso2: null, year: null };
  try {
    const parsed = JSON.parse(meta) as { iso2?: string; year?: number };
    return {
      iso2: parsed.iso2?.toLowerCase() ?? null,
      year: typeof parsed.year === "number" ? parsed.year : null,
    };
  } catch {
    return { iso2: null, year: null };
  }
}

function formatPeople(n: number): string {
  if (n >= 1e9) {
    const b = n / 1e9;
    return `${b >= 10 ? b.toFixed(1) : b.toFixed(2)} billion`;
  }
  if (n >= 1e6) {
    const m = n / 1e6;
    const label = m >= 100 ? String(Math.round(m)) : m.toFixed(1);
    return `${label} million`;
  }
  return Math.round(n).toLocaleString("en-US");
}

function formatGdpPc(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function nearbyWindow<T>(sorted: T[], index: number, isSelf: (item: T) => boolean): T[] {
  const lo = Math.max(0, index - 7);
  const hi = Math.min(sorted.length, index + 9);
  return sorted.slice(lo, hi).filter((item) => !isSelf(item));
}

/** Each option’s value must differ from the correct one, and from the other options, by at least this much. */
const MIN_OPTION_GAP = 0.01;

function separated(value: number, chosen: number[], answerValue: number): boolean {
  if (!(answerValue > 0)) return false;
  return chosen.every((other) => Math.abs(value - other) / answerValue >= MIN_OPTION_GAP);
}

/** Prefer nearby countries, but never reuse a display label (5.61M and 5.65M both become “5.6 million”). */
function pickDistinct(
  preferred: CountryFact[],
  fallback: CountryFact[],
  n: number,
  rand: Rng,
  labelOf: (fact: CountryFact) => string,
  answerLabel: string,
  answerValue?: number,
  valueOf?: (fact: CountryFact) => number
): CountryFact[] {
  const used = new Set([answerLabel]);
  const chosen = answerValue != null ? [answerValue] : [];
  const out: CountryFact[] = [];
  const seen = new Set<string>();

  const take = (pool: CountryFact[]) => {
    for (const item of shuffle(pool, rand)) {
      if (seen.has(item.iso2)) continue;
      const label = labelOf(item);
      if (used.has(label)) continue;
      const value = valueOf?.(item);
      if (value != null && answerValue != null && !separated(value, chosen, answerValue)) continue;
      used.add(label);
      if (value != null) chosen.push(value);
      seen.add(item.iso2);
      out.push(item);
      if (out.length >= n) return;
    }
  };

  take(preferred);
  if (out.length < n) take(fallback);
  return out;
}

function choiceRound(
  kind: BonusKind,
  title: string,
  prompt: string,
  answer: CountryFact,
  distractors: CountryFact[],
  rand: Rng,
  field: "flagUrl" | "gdpLabel" | "popLabel" | "gdppcLabel"
): BonusRound {
  const raw: BonusOption[] = [
    {
      id: `${kind}:${answer.iso2}`,
      label: field === "flagUrl" ? answer.name : answer[field],
      imageUrl: field === "flagUrl" ? answer.flagUrl : null,
      correct: true,
    },
    ...distractors.map((d) => ({
      id: `${kind}:${d.iso2}`,
      label: field === "flagUrl" ? d.name : d[field],
      imageUrl: field === "flagUrl" ? d.flagUrl : null,
      correct: false,
    })),
  ];
  return { kind, title, prompt, options: shuffle(raw, rand) };
}

async function loadFacts(db: D1Database): Promise<CountryFact[]> {
  const { results } = await db
    .prepare(
      `SELECT i.name, i.display_value, i.image_url, i.value, i.meta
       FROM items i
       JOIN categories c ON c.id = i.category_id
       WHERE c.slug = 'country-gdp' AND i.is_active = 1`
    )
    .all<GdpRow>();

  const facts: CountryFact[] = [];
  for (const row of results) {
    const { iso2, year } = parseMeta(row.meta);
    if (!iso2 || !row.image_url) continue;
    const population = POPULATION[iso2];
    if (!population || population <= 0 || !(row.value > 0)) continue;
    const gdppc = row.value / population;
    facts.push({
      iso2,
      name: row.name,
      flagUrl: row.image_url,
      gdp: row.value,
      gdpLabel: row.display_value || formatUsd(row.value),
      population,
      popLabel: formatPeople(population),
      gdppc,
      gdppcLabel: formatGdpPc(gdppc),
      year: year ?? POPULATION_YEAR,
    });
  }
  return facts;
}

function resolveCountry(
  code: string,
  facts: CountryFact[],
  rand: Rng
): { iso2: string; country: string } | null {
  if (code === "EUR") {
    const euro = EUROZONE.filter((c) => facts.some((f) => f.iso2 === c.iso2));
    if (!euro.length) return null;
    const picked = pick(euro, rand);
    return { iso2: picked.iso2, country: picked.country };
  }
  return SOLO[code] ?? null;
}

export async function buildMoneyleBonus(
  db: D1Database,
  date: string,
  currencyCode: string
): Promise<BonusQuiz | null> {
  const facts = await loadFacts(db);
  if (facts.length < 8) return null;

  const rand = rngFor(`${date}:moneyle:bonus`);
  const target = resolveCountry(currencyCode, facts, rand);
  if (!target) return null;

  const answer = facts.find((f) => f.iso2 === target.iso2);
  if (!answer) return null;

  const byGdp = [...facts].sort((a, b) => b.gdp - a.gdp);
  const byPop = [...facts].sort((a, b) => b.population - a.population);
  const byPc = [...facts].sort((a, b) => b.gdppc - a.gdppc);
  const gdpIdx = byGdp.findIndex((f) => f.iso2 === answer.iso2);
  const popIdx = byPop.findIndex((f) => f.iso2 === answer.iso2);
  const pcIdx = byPc.findIndex((f) => f.iso2 === answer.iso2);
  const self = (f: CountryFact) => f.iso2 === answer.iso2;

  const others = facts.filter((f) => f.iso2 !== answer.iso2);
  const flagOthers = pickDistinct(others, others, 3, rand, (f) => f.name, answer.name);
  const gdpOthers = pickDistinct(
    nearbyWindow(byGdp, gdpIdx, self),
    others,
    3,
    rand,
    (f) => f.gdpLabel,
    answer.gdpLabel,
    answer.gdp,
    (f) => f.gdp
  );
  const popOthers = pickDistinct(
    nearbyWindow(byPop, popIdx, self),
    others,
    3,
    rand,
    (f) => f.popLabel,
    answer.popLabel,
    answer.population,
    (f) => f.population
  );
  const pcOthers = pickDistinct(
    nearbyWindow(byPc, pcIdx, self),
    others,
    3,
    rand,
    (f) => f.gdppcLabel,
    answer.gdppcLabel,
    answer.gdppc,
    (f) => f.gdppc
  );

  const name = target.country;
  const gdpYear = answer.year;
  return {
    country: name.replace(/^the /, "").replace(/^The /, ""),
    currencyCode,
    rounds: [
      choiceRound(
        "flag",
        "Flag",
        `Which flag belongs to ${name}?`,
        answer,
        flagOthers,
        rand,
        "flagUrl"
      ),
      choiceRound(
        "gdp",
        `GDP (${gdpYear})`,
        `What is ${name}’s GDP in ${gdpYear}?`,
        answer,
        gdpOthers,
        rand,
        "gdpLabel"
      ),
      choiceRound(
        "population",
        `Population (${POPULATION_YEAR})`,
        `About how many people lived in ${name} in ${POPULATION_YEAR}?`,
        answer,
        popOthers,
        rand,
        "popLabel"
      ),
      choiceRound(
        "gdppc",
        `GDP per person (${gdpYear})`,
        `What is ${name}’s GDP per person in ${gdpYear}?`,
        answer,
        pcOthers,
        rand,
        "gdppcLabel"
      ),
    ],
  };
}
