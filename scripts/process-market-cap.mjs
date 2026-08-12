// Parses data/raw/marketcap.html (CompaniesMarketCap top companies)
// into data/market-cap-top100.json.
//
// Source: https://companiesmarketcap.com/
// Refresh the raw HTML, then rerun this script.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatUsd } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = path.join(root, "data", "raw", "marketcap.html");
const outPath = path.join(root, "data", "market-cap-top100.json");

const html = fs.readFileSync(rawPath, "utf8");
  const rowRe =
  /data-sort="(\d+)"[^>]*>\1<\/td><td class="name-td">[\s\S]*?src="(\/img\/company-logos\/)\d+(\/[^"]+)"[\s\S]*?<div class="company-name">([^<]+)<\/div><div class="company-code">[\s\S]*?<\/span>([^<]+)<\/div>[\s\S]*?data-sort="(\d+)"/g;

const companies = [];
let match;
while ((match = rowRe.exec(html)) !== null) {
  const rank = Number(match[1]);
  if (rank > 100) break;
  const marketCap = Number(match[6]);
  const ticker = match[5].trim();
  // Prefer 256px logos — 64px looks blurry when displayed large.
  companies.push({
    rank,
    name: match[4].trim(),
    ticker,
    marketCapUsd: marketCap,
    displayValue: formatUsd(marketCap),
    imageUrl: `https://companiesmarketcap.com${match[2]}256${match[3]}`,
  });
}

if (companies.length < 100) {
  console.error(`Only parsed ${companies.length} companies — check HTML structure.`);
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify(companies.slice(0, 100), null, 2));
console.log(`Wrote ${Math.min(companies.length, 100)} companies to ${outPath}`);
console.log(`#1: ${companies[0].name} — ${companies[0].displayValue}`);
console.log(`#100: ${companies[99].name} — ${companies[99].displayValue}`);
