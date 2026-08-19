// Converts the raster images under public/ to WebP and rewrites the local
// image paths stored in data/*.json to match.
//
// Sources are capped at the largest size they can ever be displayed at (see
// MAX_SIDE below) — the currency scans in particular ship at print resolution
// but never render wider than a couple hundred CSS pixels.
//
// Safe to re-run: files that are already WebP are left alone.
//
// Usage: node scripts/convert-images-webp.mjs [--dry]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const dry = process.argv.includes("--dry");

const CONVERTIBLE = /\.(jpe?g|png)$/i;

// Longest edge to keep, keyed by what the asset is used for.
const MAX_SIDE = {
  flags: 320, // rendered at 64px in the How-to-play cards
  logos: 512, // .card-media.logo caps at 220 CSS px
  card: 900, // More/Less card art, already ~889 for most sources
  bill: 800, // .guessr-stack.bill caps at 240 CSS px
  coin: 360, // coinPx() tops out at 90 CSS px
};

function rule(relPath) {
  const parts = relPath.split("/");
  if (parts[0] === "moreless") {
    if (parts[1] === "flags") return { maxSide: MAX_SIDE.flags, quality: 85 };
    if (parts[1] === "logos") return { maxSide: MAX_SIDE.logos, quality: 85 };
    return { maxSide: MAX_SIDE.card, quality: 80 };
  }
  if (parts[0] === "money") {
    const base = path.basename(relPath);
    if (base.startsWith("coin-")) return { maxSide: MAX_SIDE.coin, quality: 88 };
    return { maxSide: MAX_SIDE.bill, quality: 85 };
  }
  return null;
}

// An alpha channel where every pixel is opaque carries no information, and the
// encoder is right to drop it. Only a real cutout needs protecting.
async function hasRealTransparency(file) {
  const meta = await sharp(file).metadata();
  if (!meta.hasAlpha) return false;
  const stats = await sharp(file).stats();
  const alpha = stats.channels[stats.channels.length - 1];
  return alpha.min < 255;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const abs = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(abs) : [abs];
  });
}

const all = walk(publicDir)
  .map((abs) => ({ abs, rel: path.relative(publicDir, abs).replaceAll("\\", "/") }))
  .filter((f) => CONVERTIBLE.test(f.rel))
  .filter((f) => rule(f.rel) !== null);

// Two sources that differ only by extension would overwrite each other.
const collisions = new Map();
for (const f of all) {
  const target = f.rel.replace(CONVERTIBLE, ".webp");
  const list = collisions.get(target) ?? [];
  list.push(f.rel);
  collisions.set(target, list);
}
const clashes = [...collisions.entries()].filter(([, list]) => list.length > 1);
if (clashes.length) {
  console.error("Refusing to run — these sources map to the same .webp target:");
  for (const [target, list] of clashes) console.error(`  ${target} <- ${list.join(", ")}`);
  process.exit(1);
}

let converted = 0;
let beforeBytes = 0;
let afterBytes = 0;

for (const f of all) {
  const { maxSide, quality } = rule(f.rel);
  const relWebp = f.rel.replace(CONVERTIBLE, ".webp");
  const destAbs = path.join(publicDir, relWebp);
  const srcBytes = fs.statSync(f.abs).size;

  const meta = await sharp(f.abs).metadata();
  const needsResize = Math.max(meta.width, meta.height) > maxSide;

  if (dry) {
    console.log(
      `${f.rel} -> ${relWebp}  ${meta.width}x${meta.height}${needsResize ? ` (resize to ${maxSide})` : ""}`
    );
    beforeBytes += srcBytes;
    continue;
  }

  let pipeline = sharp(f.abs);
  if (needsResize) {
    pipeline = pipeline.resize({ width: maxSide, height: maxSide, fit: "inside" });
  }
  // alphaQuality 100 keeps the coin cutout masks bit-exact while the colour
  // channels stay lossy.
  await pipeline.webp({ quality, effort: 6, alphaQuality: 100 }).toFile(destAbs);

  if ((await hasRealTransparency(f.abs)) && !(await sharp(destAbs).metadata()).hasAlpha) {
    console.error(`Lost the cutout transparency converting ${f.rel} — aborting.`);
    process.exit(1);
  }

  fs.unlinkSync(f.abs);
  const destBytes = fs.statSync(destAbs).size;
  beforeBytes += srcBytes;
  afterBytes += destBytes;
  converted++;
  process.stdout.write(
    `✓ ${relWebp}  ${(srcBytes / 1024).toFixed(0)} → ${(destBytes / 1024).toFixed(0)} KB\n`
  );
}

// Rewrite the local image paths recorded in the dataset JSON. This is driven by
// what is actually on disk rather than by this run's conversions, so an
// interrupted run can simply be repeated.
function rewriteValue(value) {
  if (typeof value !== "string") return value;
  if (!value.startsWith("/moreless/") && !value.startsWith("/money/")) return value;
  if (!CONVERTIBLE.test(value)) return value;
  const swapped = value.replace(CONVERTIBLE, ".webp");
  return fs.existsSync(path.join(publicDir, swapped.slice(1))) ? swapped : value;
}

function rewriteTree(node) {
  if (Array.isArray(node)) return node.map(rewriteTree);
  if (node && typeof node === "object") {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, rewriteTree(v)]));
  }
  return rewriteValue(node);
}

let jsonTouched = 0;
if (fs.existsSync(dataDir)) {
  for (const name of fs.readdirSync(dataDir)) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(dataDir, name);
    const before = fs.readFileSync(file, "utf8");
    const after = JSON.stringify(rewriteTree(JSON.parse(before)), null, 2) + "\n";
    if (before === after) continue;
    if (!dry) fs.writeFileSync(file, after);
    jsonTouched++;
    console.log(`${dry ? "would update" : "updated"} data/${name}`);
  }
}

if (dry) {
  console.log(
    `\nDry run: ${all.length} images (${(beforeBytes / 1048576).toFixed(1)} MB) would be converted.` +
      `\nJSON paths are rewritten against the files on disk, so nothing is reported here.`
  );
} else {
  const saved = beforeBytes - afterBytes;
  console.log(
    `\nConverted ${converted} images: ${(beforeBytes / 1048576).toFixed(1)} MB → ` +
      `${(afterBytes / 1048576).toFixed(1)} MB (saved ${(saved / 1048576).toFixed(1)} MB, ` +
      `${((saved / beforeBytes) * 100).toFixed(0)}%)`
  );
  console.log(`Updated ${jsonTouched} JSON files`);
}
