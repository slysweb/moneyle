// Fetches movie posters via the IMDb suggestion API (no key required)
// using imdbId from data/box-office-top100.json, then writes imageUrl back.
//
// Source pattern: https://v2.sg.media-imdb.com/suggestion/t/{imdbId}.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filePath = path.join(root, "data", "box-office-top100.json");
const movies = JSON.parse(fs.readFileSync(filePath, "utf8"));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Prefer a reasonably sized poster instead of the multi-MB original. */
function resizePoster(url) {
  if (!url) return null;
  return url.replace(/\._V1_.*$/, "._V1_SX600.jpg").replace(/\._V1_\.jpg$/, "._V1_SX600.jpg");
}

async function fetchPoster(imdbId) {
  const res = await fetch(`https://v2.sg.media-imdb.com/suggestion/t/${imdbId}.json`, {
    headers: { "user-agent": "MoneyGames/1.0 (local data script)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const item = Array.isArray(data.d) ? data.d.find((x) => x.id === imdbId) || data.d[0] : data;
  return resizePoster(item?.i?.imageUrl ?? null);
}

let ok = 0;
let fail = 0;
for (const movie of movies) {
  if (movie.imageUrl) {
    ok++;
    continue;
  }
  try {
    const url = await fetchPoster(movie.imdbId);
    movie.imageUrl = url;
    if (url) {
      ok++;
      console.log(`✓ ${movie.rank}. ${movie.name}`);
    } else {
      fail++;
      console.log(`✗ ${movie.rank}. ${movie.name} (no image)`);
    }
  } catch (err) {
    fail++;
    console.log(`✗ ${movie.rank}. ${movie.name} (${err.message})`);
  }
  await sleep(120);
}

fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
console.log(`\nDone. with image: ${ok}, missing: ${fail}`);
console.log(`Wrote ${filePath}`);
