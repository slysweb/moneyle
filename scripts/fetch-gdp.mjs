// Fetches the latest GDP (current US$) for all real countries from the
// World Bank API and writes the top 100 economies to data/gdp.json.
// Flag images come from flagcdn.com using ISO 3166-1 alpha-2 codes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatUsd } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "data", "gdp.json");

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// 1. Build the set of real countries (the API also returns regional aggregates).
const [, countries] = await getJson(
  "https://api.worldbank.org/v2/country?format=json&per_page=400"
);
const realCountries = new Map();
for (const c of countries) {
  if (c.region?.value && c.region.value !== "Aggregates") {
    realCountries.set(c.id, {
      iso2: c.iso2Code,
      name: c.name,
      region: c.region.value.trim(),
      capital: c.capitalCity || null,
    });
  }
}

// 2. Latest GDP value per country (mrv=1 = most recent non-null value).
const [, gdpRows] = await getJson(
  "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&mrv=1&per_page=400"
);

const list = [];
for (const row of gdpRows ?? []) {
  const country = realCountries.get(row.countryiso3code);
  if (!country || row.value == null) continue;
  list.push({
    name: country.name,
    iso2: country.iso2.toLowerCase(),
    iso3: row.countryiso3code,
    region: country.region,
    year: Number(row.date),
    gdpUsd: Math.round(row.value),
    displayValue: formatUsd(row.value),
    flagUrl: `https://flagcdn.com/w320/${country.iso2.toLowerCase()}.png`,
  });
}

list.sort((a, b) => b.gdpUsd - a.gdpUsd);
const top100 = list.slice(0, 100);

fs.writeFileSync(outPath, JSON.stringify(top100, null, 2));
console.log(`Wrote ${top100.length} countries to ${outPath}`);
console.log(`#1: ${top100[0].name} (${top100[0].year}) — ${top100[0].displayValue}`);
console.log(`#100: ${top100[99].name} (${top100[99].year}) — ${top100[99].displayValue}`);
