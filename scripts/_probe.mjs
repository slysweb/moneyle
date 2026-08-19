import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync("scripts/build-money-seed.mjs", "utf8");

// Each catalog entry looks like { slug, name, code, symbol, minorDigits, country, denoms: [...] }
const entries = [];
const re = /\{\s*slug:\s*"([a-z]+)",\s*name:\s*"([^"]+)",\s*code:\s*"([A-Z]+)",\s*symbol:\s*"([^"]*)",\s*minorDigits:\s*(\d+),\s*country:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(src)) !== null) {
  entries.push({ slug: m[1], name: m[2], code: m[3], symbol: m[4], minorDigits: +m[5], country: m[6] });
}

const gdp = JSON.parse(fs.readFileSync("data/gdp.json", "utf8"));
const byName = new Map(gdp.map((g) => [g.name.toLowerCase(), g]));

console.log("slug  code  currency name              catalog country            GDP match");
console.log("-".repeat(96));
for (const e of entries) {
  const hit = byName.get(e.country.toLowerCase());
  const dir = path.join("public", "money", e.slug);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".webp")) : [];
  const bills = files.filter((f) => f.startsWith("bill-")).length;
  const coins = files.filter((f) => f.startsWith("coin-")).length;
  console.log(
    `${e.slug.padEnd(6)}${e.code.padEnd(6)}${e.name.padEnd(26)}${e.country.padEnd(22)}` +
      `${hit ? `${hit.iso2} ${hit.displayValue}` : "*** NO MATCH ***"}  (${bills}b/${coins}c)`
  );
}

console.log(`\ncatalog entries parsed: ${entries.length}`);

// Which currency unit names collide? Two countries sharing one in a puzzle would be ambiguous.
const unit = (name) => name.split(" ").slice(-1)[0];
const units = new Map();
for (const e of entries) {
  const u = unit(e.name);
  units.set(u, [...(units.get(u) ?? []), e.code]);
}
console.log("\ncurrency unit names shared by more than one currency:");
for (const [u, codes] of units) if (codes.length > 1) console.log(`  ${u}: ${codes.join(", ")}`);
