// Builds data/athletes-top100.json — ~100 top annual salaries across
// soccer, NBA and NFL. Values are estimated club/team salaries (on-field /
// AAV / season cap hit), not endorsement totals.
//
// Sources:
//   Soccer — Capology weekly wages (annualised) + Forbes on-field figures
//   NBA    — Spotrac / Sporting News 2026-27 season cap hits
//   NFL    — Spotrac / NFL.com 2026 average annual value (AAV)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatUsd } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "data", "athletes-top100.json");

// salaryUsd = estimated annual salary in USD
const raw = [
  // ---- Soccer (club salary) ----
  { name: "Cristiano Ronaldo", team: "Al Nassr", sport: "Soccer", salaryUsd: 230_000_000 },
  { name: "Karim Benzema", team: "Al Ittihad", sport: "Soccer", salaryUsd: 100_000_000 },
  { name: "Kylian Mbappé", team: "Real Madrid", sport: "Soccer", salaryUsd: 70_000_000 },
  { name: "Lionel Messi", team: "Inter Miami", sport: "Soccer", salaryUsd: 60_000_000 },
  { name: "Erling Haaland", team: "Manchester City", sport: "Soccer", salaryUsd: 60_000_000 },
  { name: "Sadio Mané", team: "Al Nassr", sport: "Soccer", salaryUsd: 50_000_000 },
  { name: "Vinicius Jr.", team: "Real Madrid", sport: "Soccer", salaryUsd: 40_000_000 },
  { name: "Mohamed Salah", team: "Liverpool", sport: "Soccer", salaryUsd: 35_000_000 },
  { name: "Lamine Yamal", team: "Barcelona", sport: "Soccer", salaryUsd: 33_000_000 },
  { name: "Jude Bellingham", team: "Real Madrid", sport: "Soccer", salaryUsd: 29_000_000 },
  { name: "Kalidou Koulibaly", team: "Al Hilal", sport: "Soccer", salaryUsd: 37_000_000 },
  { name: "Sergej Milinković-Savić", team: "Al Hilal", sport: "Soccer", salaryUsd: 28_000_000 },
  { name: "Ivan Toney", team: "Al Ahli", sport: "Soccer", salaryUsd: 28_000_000 },
  { name: "Harry Kane", team: "Bayern Munich", sport: "Soccer", salaryUsd: 27_000_000 },
  { name: "Neymar", team: "Santos", sport: "Soccer", salaryUsd: 25_000_000 },
  { name: "Jamal Musiala", team: "Bayern Munich", sport: "Soccer", salaryUsd: 25_000_000 },
  { name: "Darwin Núñez", team: "Al Hilal", sport: "Soccer", salaryUsd: 24_000_000 },
  { name: "Virgil van Dijk", team: "Liverpool", sport: "Soccer", salaryUsd: 23_000_000 },
  { name: "Kevin De Bruyne", team: "Napoli", sport: "Soccer", salaryUsd: 22_000_000 },
  { name: "Robert Lewandowski", team: "Barcelona", sport: "Soccer", salaryUsd: 22_000_000 },
  { name: "Bruno Fernandes", team: "Manchester United", sport: "Soccer", salaryUsd: 21_000_000 },
  { name: "Marcus Rashford", team: "Barcelona", sport: "Soccer", salaryUsd: 20_000_000 },
  { name: "Casemiro", team: "Manchester United", sport: "Soccer", salaryUsd: 20_000_000 },
  { name: "Phil Foden", team: "Manchester City", sport: "Soccer", salaryUsd: 20_000_000 },
  { name: "Bukayo Saka", team: "Arsenal", sport: "Soccer", salaryUsd: 18_000_000 },
  { name: "Rodri", team: "Manchester City", sport: "Soccer", salaryUsd: 18_000_000 },
  { name: "Bernardo Silva", team: "Manchester City", sport: "Soccer", salaryUsd: 18_000_000 },
  { name: "Declan Rice", team: "Arsenal", sport: "Soccer", salaryUsd: 17_000_000 },
  { name: "Martin Ødegaard", team: "Arsenal", sport: "Soccer", salaryUsd: 16_000_000 },
  { name: "Pedri", team: "Barcelona", sport: "Soccer", salaryUsd: 16_000_000 },
  { name: "Gavi", team: "Barcelona", sport: "Soccer", salaryUsd: 15_000_000 },
  { name: "Ousmane Dembélé", team: "PSG", sport: "Soccer", salaryUsd: 20_000_000 },
  { name: "Lautaro Martínez", team: "Inter Milan", sport: "Soccer", salaryUsd: 18_000_000 },
  { name: "Victor Osimhen", team: "Galatasaray", sport: "Soccer", salaryUsd: 22_000_000 },
  { name: "Rafael Leão", team: "AC Milan", sport: "Soccer", salaryUsd: 15_000_000 },
  { name: "Khvicha Kvaratskhelia", team: "PSG", sport: "Soccer", salaryUsd: 15_000_000 },
  { name: "Federico Valverde", team: "Real Madrid", sport: "Soccer", salaryUsd: 15_000_000 },
  { name: "Antonio Rüdiger", team: "Real Madrid", sport: "Soccer", salaryUsd: 16_000_000 },
  { name: "Thibaut Courtois", team: "Real Madrid", sport: "Soccer", salaryUsd: 14_000_000 },
  { name: "Alisson Becker", team: "Liverpool", sport: "Soccer", salaryUsd: 14_000_000 },

  // ---- NBA (2026-27 season cap hit) ----
  { name: "Stephen Curry", team: "Golden State Warriors", sport: "NBA", salaryUsd: 62_590_000 },
  { name: "Nikola Jokić", team: "Denver Nuggets", sport: "NBA", salaryUsd: 59_030_000 },
  { name: "Giannis Antetokounmpo", team: "Miami Heat", sport: "NBA", salaryUsd: 58_460_000 },
  { name: "Anthony Davis", team: "Washington Wizards", sport: "NBA", salaryUsd: 58_460_000 },
  { name: "Jayson Tatum", team: "Boston Celtics", sport: "NBA", salaryUsd: 58_460_000 },
  { name: "Joel Embiid", team: "Philadelphia 76ers", sport: "NBA", salaryUsd: 57_990_000 },
  { name: "Devin Booker", team: "Phoenix Suns", sport: "NBA", salaryUsd: 57_080_000 },
  { name: "Jaylen Brown", team: "Boston Celtics", sport: "NBA", salaryUsd: 57_080_000 },
  { name: "Karl-Anthony Towns", team: "New York Knicks", sport: "NBA", salaryUsd: 57_080_000 },
  { name: "Jimmy Butler", team: "Golden State Warriors", sport: "NBA", salaryUsd: 56_830_000 },
  { name: "Paul George", team: "Philadelphia 76ers", sport: "NBA", salaryUsd: 54_130_000 },
  { name: "Kawhi Leonard", team: "LA Clippers", sport: "NBA", salaryUsd: 50_300_000 },
  { name: "Cade Cunningham", team: "Detroit Pistons", sport: "NBA", salaryUsd: 50_110_000 },
  { name: "Donovan Mitchell", team: "Cleveland Cavaliers", sport: "NBA", salaryUsd: 50_110_000 },
  { name: "Evan Mobley", team: "Cleveland Cavaliers", sport: "NBA", salaryUsd: 50_110_000 },
  { name: "Jamal Murray", team: "Denver Nuggets", sport: "NBA", salaryUsd: 50_110_000 },
  { name: "Bam Adebayo", team: "Miami Heat", sport: "NBA", salaryUsd: 49_500_000 },
  { name: "Luka Dončić", team: "Los Angeles Lakers", sport: "NBA", salaryUsd: 49_500_000 },
  { name: "De'Aaron Fox", team: "San Antonio Spurs", sport: "NBA", salaryUsd: 49_500_000 },
  { name: "Trae Young", team: "Washington Wizards", sport: "NBA", salaryUsd: 49_500_000 },
  { name: "Jaren Jackson Jr.", team: "Utah Jazz", sport: "NBA", salaryUsd: 49_000_000 },
  { name: "Zach LaVine", team: "Sacramento Kings", sport: "NBA", salaryUsd: 48_970_000 },
  { name: "Anthony Edwards", team: "Minnesota Timberwolves", sport: "NBA", salaryUsd: 48_920_000 },
  { name: "Tyrese Haliburton", team: "Indiana Pacers", sport: "NBA", salaryUsd: 48_920_000 },
  { name: "Pascal Siakam", team: "Indiana Pacers", sport: "NBA", salaryUsd: 48_920_000 },
  { name: "LeBron James", team: "Los Angeles Lakers", sport: "NBA", salaryUsd: 52_800_000 },
  { name: "Kevin Durant", team: "Houston Rockets", sport: "NBA", salaryUsd: 54_800_000 },
  { name: "Shai Gilgeous-Alexander", team: "Oklahoma City Thunder", sport: "NBA", salaryUsd: 46_000_000 },
  { name: "Ja Morant", team: "Memphis Grizzlies", sport: "NBA", salaryUsd: 42_000_000 },
  { name: "Zion Williamson", team: "New Orleans Pelicans", sport: "NBA", salaryUsd: 40_000_000 },
  { name: "Paolo Banchero", team: "Orlando Magic", sport: "NBA", salaryUsd: 39_000_000 },
  { name: "Chet Holmgren", team: "Oklahoma City Thunder", sport: "NBA", salaryUsd: 39_000_000 },
  { name: "Jalen Williams", team: "Oklahoma City Thunder", sport: "NBA", salaryUsd: 39_000_000 },
  { name: "Scottie Barnes", team: "Toronto Raptors", sport: "NBA", salaryUsd: 38_000_000 },
  { name: "Franz Wagner", team: "Orlando Magic", sport: "NBA", salaryUsd: 38_000_000 },

  // ---- NFL (2026 contract AAV) ----
  { name: "Patrick Mahomes", team: "Kansas City Chiefs", sport: "NFL", salaryUsd: 63_100_000 },
  { name: "Dak Prescott", team: "Dallas Cowboys", sport: "NFL", salaryUsd: 60_000_000 },
  { name: "Matthew Stafford", team: "Los Angeles Rams", sport: "NFL", salaryUsd: 55_000_000 },
  { name: "Josh Allen", team: "Buffalo Bills", sport: "NFL", salaryUsd: 55_000_000 },
  { name: "Jordan Love", team: "Green Bay Packers", sport: "NFL", salaryUsd: 55_000_000 },
  { name: "Trevor Lawrence", team: "Jacksonville Jaguars", sport: "NFL", salaryUsd: 55_000_000 },
  { name: "Joe Burrow", team: "Cincinnati Bengals", sport: "NFL", salaryUsd: 55_000_000 },
  { name: "Brock Purdy", team: "San Francisco 49ers", sport: "NFL", salaryUsd: 53_000_000 },
  { name: "Jared Goff", team: "Detroit Lions", sport: "NFL", salaryUsd: 53_000_000 },
  { name: "Justin Herbert", team: "Los Angeles Chargers", sport: "NFL", salaryUsd: 52_500_000 },
  { name: "Lamar Jackson", team: "Baltimore Ravens", sport: "NFL", salaryUsd: 52_000_000 },
  { name: "Jalen Hurts", team: "Philadelphia Eagles", sport: "NFL", salaryUsd: 51_000_000 },
  { name: "Will Anderson Jr.", team: "Houston Texans", sport: "NFL", salaryUsd: 50_000_000 },
  { name: "Micah Parsons", team: "Green Bay Packers", sport: "NFL", salaryUsd: 46_500_000 },
  { name: "Deshaun Watson", team: "Cleveland Browns", sport: "NFL", salaryUsd: 46_000_000 },
  { name: "Aidan Hutchinson", team: "Detroit Lions", sport: "NFL", salaryUsd: 45_000_000 },
  { name: "Daniel Jones", team: "Indianapolis Colts", sport: "NFL", salaryUsd: 44_000_000 },
  { name: "Jaxon Smith-Njigba", team: "Seattle Seahawks", sport: "NFL", salaryUsd: 42_150_000 },
  { name: "Myles Garrett", team: "Los Angeles Rams", sport: "NFL", salaryUsd: 41_640_000 },
  { name: "T.J. Watt", team: "Pittsburgh Steelers", sport: "NFL", salaryUsd: 41_000_000 },
  { name: "Ja'Marr Chase", team: "Cincinnati Bengals", sport: "NFL", salaryUsd: 40_250_000 },
  { name: "Danielle Hunter", team: "Houston Texans", sport: "NFL", salaryUsd: 40_100_000 },
  { name: "Jalen Carter", team: "Philadelphia Eagles", sport: "NFL", salaryUsd: 38_000_000 },
  { name: "Maxx Crosby", team: "Las Vegas Raiders", sport: "NFL", salaryUsd: 35_500_000 },
  { name: "Quinnen Williams", team: "Dallas Cowboys", sport: "NFL", salaryUsd: 35_300_000 },
];

const athletes = raw
  .map((a) => ({
    name: a.name,
    team: a.team,
    sport: a.sport,
    salaryUsd: a.salaryUsd,
    displayValue: formatUsd(a.salaryUsd),
    imageUrl: null,
  }))
  .sort((a, b) => b.salaryUsd - a.salaryUsd)
  .map((a, i) => ({ rank: i + 1, ...a }));

fs.writeFileSync(outPath, JSON.stringify(athletes, null, 2));
console.log(`Wrote ${athletes.length} athletes to ${outPath}`);
console.log(
  `Sports: Soccer ${athletes.filter((a) => a.sport === "Soccer").length}, NBA ${
    athletes.filter((a) => a.sport === "NBA").length
  }, NFL ${athletes.filter((a) => a.sport === "NFL").length}`
);
console.log(`#1: ${athletes[0].name} — ${athletes[0].displayValue}`);
console.log(`#${athletes.length}: ${athletes.at(-1).name} — ${athletes.at(-1).displayValue}`);
