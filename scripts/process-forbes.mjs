// Processes the raw Forbes real-time billionaires dump (data/raw/forbes-rtb.json)
// into a clean top-100 list at data/forbes-top100.json.
//
// Raw source: https://www.forbes.com/forbesapi/person/rtb/0/position/true.json
//   ?fields=rank,personName,finalWorth,source,countryOfCitizenship,squareImage
// finalWorth is expressed in millions of USD.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatUsd } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = path.join(root, "data", "raw", "forbes-rtb.json");
const outPath = path.join(root, "data", "forbes-top100.json");

let raw = fs.readFileSync(rawPath, "utf8");
// The dump may have a text preamble before the JSON body; skip to the first brace.
raw = raw.slice(raw.indexOf("{"));
const parsed = JSON.parse(raw);
const persons = parsed.personList?.personsLists ?? parsed;

const top100 = persons
  .filter((p) => p.personName && p.finalWorth > 0)
  .sort((a, b) => a.rank - b.rank)
  .slice(0, 100)
  .map((p) => {
    const usd = p.finalWorth * 1e6;
    let image = p.squareImage || null;
    if (image && image.startsWith("//")) image = "https:" + image;
    return {
      rank: p.rank,
      name: p.personName.trim(),
      netWorthUsd: Math.round(usd),
      displayValue: formatUsd(usd),
      source: p.source || null,
      country: p.countryOfCitizenship || null,
      imageUrl: image,
    };
  });

fs.writeFileSync(outPath, JSON.stringify(top100, null, 2));
console.log(`Wrote ${top100.length} billionaires to ${outPath}`);
console.log(`#1: ${top100[0].name} — ${top100[0].displayValue}`);
console.log(`#100: ${top100[99].name} — ${top100[99].displayValue}`);
