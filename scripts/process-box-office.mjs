// Parses data/raw/boxoffice-mojo.html (Top Lifetime Grosses, Worldwide)
// into data/box-office-top100.json.
//
// Source: https://www.boxofficemojo.com/chart/ww_top_lifetime_gross/?area=XWW
// Refresh the raw HTML, then rerun this script.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatUsd } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = path.join(root, "data", "raw", "boxoffice-mojo.html");
const outPath = path.join(root, "data", "box-office-top100.json");

const html = fs.readFileSync(rawPath, "utf8");
const rowRe =
  /mojo-field-type-rank">(\d+)<\/td><td[^>]*><a[^>]*href="\/title\/(tt\d+)[^"]*"[^>]*>([^<]+)<\/a><\/td><td[^>]*>\$([\d,]+)<\/td>[\s\S]*?mojo-field-type-year"><a[^>]*>(\d{4})<\/a>/g;

const movies = [];
let match;
while ((match = rowRe.exec(html)) !== null) {
  const rank = Number(match[1]);
  if (rank > 100) break;
  const gross = Number(match[4].replace(/,/g, ""));
  movies.push({
    rank,
    name: match[3].replace(/&amp;/g, "&").trim(),
    imdbId: match[2],
    worldwideGrossUsd: gross,
    displayValue: formatUsd(gross),
    year: Number(match[5]),
    // Poster URLs require a paid/keyed API; the game falls back to initials.
    imageUrl: null,
  });
}

if (movies.length < 100) {
  console.error(`Only parsed ${movies.length} movies — check HTML structure.`);
  process.exit(1);
}

// Disambiguate remakes / same-title entries (e.g. The Lion King 1994 vs 2019).
const nameCount = new Map();
for (const m of movies) nameCount.set(m.name, (nameCount.get(m.name) || 0) + 1);
for (const m of movies) {
  if ((nameCount.get(m.name) || 0) > 1) m.name = `${m.name} (${m.year})`;
}

const top100 = movies.slice(0, 100);
fs.writeFileSync(outPath, JSON.stringify(top100, null, 2));
console.log(`Wrote ${top100.length} movies to ${outPath}`);
console.log(`#1: ${top100[0].name} — ${top100[0].displayValue}`);
console.log(`#100: ${top100[99].name} — ${top100[99].displayValue}`);
