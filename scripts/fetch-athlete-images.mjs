// Fetches athlete headshots from TheSportsDB (free demo key) and writes
// imageUrl back into data/athletes-top100.json.
//
// API: https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=Name

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filePath = path.join(root, "data", "athletes-top100.json");
const athletes = JSON.parse(fs.readFileSync(filePath, "utf8"));

const SPORT_MAP = {
  Soccer: "Soccer",
  NBA: "Basketball",
  NFL: "American Football",
};

// Manual fallbacks when TheSportsDB has no match / wrong sport.
const MANUAL_OVERRIDES = {
  "Will Anderson Jr.":
    "https://a.espncdn.com/i/headshots/nfl/players/full/4430807.png",
  "Sergej Milinković-Savić":
    "https://r2.thesportsdb.com/images/media/player/thumb/iq30bq1750761696.jpg",
  "Ivan Toney":
    "https://r2.thesportsdb.com/images/media/player/thumb/1enhi91777238548.jpg",
  "Harry Kane":
    "https://r2.thesportsdb.com/images/media/player/thumb/0w9up71770542636.jpg",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function searchPlayer(name) {
  const url =
    "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=" +
    encodeURIComponent(name);

  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, {
      headers: { "user-agent": "MoneyGames/1.0 (local data script)" },
    });
    if (res.status === 429) {
      const wait = 1500 * (attempt + 1);
      console.log(`  rate-limited, wait ${wait}ms…`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.player ?? [];
  }
  throw new Error("HTTP 429");
}

function pickImage(player) {
  return player.strThumb || player.strCutout || player.strRender || null;
}

function scoreCandidate(player, athlete) {
  let score = 0;
  const wantSport = SPORT_MAP[athlete.sport];
  if (wantSport && player.strSport === wantSport) score += 5;
  if (pickImage(player)) score += 3;
  const n1 = normalize(player.strPlayer || "");
  const n2 = normalize(athlete.name);
  if (n1 === n2) score += 4;
  else if (n1.includes(n2) || n2.includes(n1)) score += 2;
  // Prefer currently active / better known when team matches loosely.
  if (
    athlete.team &&
    player.strTeam &&
    normalize(player.strTeam).includes(normalize(athlete.team).split(" ").pop())
  ) {
    score += 1;
  }
  return score;
}

async function resolveImage(athlete) {
  let players = await searchPlayer(athlete.name);
  if (!players.length) {
    // Retry without accents / punctuation, e.g. "Luka Dončić" -> "Luka Doncic"
    const plain = athlete.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['.]/g, "");
    if (plain !== athlete.name) players = await searchPlayer(plain);
  }
  if (!players.length) return null;

  players.sort((a, b) => scoreCandidate(b, athlete) - scoreCandidate(a, athlete));
  const best = players[0];
  // Require a sport match when possible to avoid wrong-person photos.
  const wantSport = SPORT_MAP[athlete.sport];
  if (wantSport && best.strSport && best.strSport !== wantSport) {
    const sameSport = players.find((p) => p.strSport === wantSport && pickImage(p));
    if (sameSport) return pickImage(sameSport);
  }
  return pickImage(best);
}

let ok = 0;
let fail = 0;
for (const athlete of athletes) {
  if (athlete.imageUrl) {
    ok++;
    continue;
  }
  if (MANUAL_OVERRIDES[athlete.name]) {
    athlete.imageUrl = MANUAL_OVERRIDES[athlete.name];
    ok++;
    console.log(`✓ ${athlete.rank}. ${athlete.name} (manual)`);
    continue;
  }
  try {
    const url = await resolveImage(athlete);
    athlete.imageUrl = url;
    if (url) {
      ok++;
      console.log(`✓ ${athlete.rank}. ${athlete.name}`);
    } else {
      fail++;
      console.log(`✗ ${athlete.rank}. ${athlete.name} (no image)`);
    }
  } catch (err) {
    fail++;
    console.log(`✗ ${athlete.rank}. ${athlete.name} (${err.message})`);
  }
  await sleep(600);
}

fs.writeFileSync(filePath, JSON.stringify(athletes, null, 2));
console.log(`\nDone. with image: ${ok}, missing: ${fail}`);
console.log(`Wrote ${filePath}`);
