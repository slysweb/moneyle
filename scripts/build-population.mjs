// Fetches latest population (SP.POP.TOTL) from the World Bank and writes
// iso2 → headcount for countries already in data/gdp.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gdpPath = path.join(root, "data", "gdp.json");
const outJson = path.join(root, "data", "population.json");
const outTs = path.join(root, "worker", "population.ts");

const gdp = JSON.parse(fs.readFileSync(gdpPath, "utf8"));
const iso3ToIso2 = new Map(gdp.map((c) => [c.iso3, c.iso2]));

const res = await fetch(
  "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=400"
);
if (!res.ok) throw new Error(`World Bank population ${res.status}`);
const [, rows] = await res.json();

const byIso2 = {};
for (const row of rows ?? []) {
  const iso2 = iso3ToIso2.get(row.countryiso3code);
  if (!iso2 || row.value == null) continue;
  byIso2[iso2] = Math.round(row.value);
}

fs.writeFileSync(outJson, JSON.stringify(byIso2, null, 2));

const lines = Object.entries(byIso2)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([iso2, n]) => `  ${iso2}: ${n},`);

fs.writeFileSync(
  outTs,
  `/** Headcount by ISO 3166-1 alpha-2. Source: World Bank SP.POP.TOTL. */\n` +
    `export const POPULATION: Record<string, number> = {\n${lines.join("\n")}\n};\n`
);

console.log(`Wrote population for ${Object.keys(byIso2).length} countries`);
