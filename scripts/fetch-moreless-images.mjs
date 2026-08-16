// Downloads More/Less remote images (avatars, flags, posters, logos)
// into public/moreless/{category}/ and rewrites JSON image fields to local paths.
//
// Usage: node scripts/fetch-moreless-images.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public", "moreless");

const DATASETS = [
  { file: "forbes-top100.json", category: "billionaires", field: "imageUrl", key: (x) => x.name },
  { file: "gdp.json", category: "flags", field: "flagUrl", key: (x) => x.iso2 || x.name },
  { file: "athletes-top100.json", category: "athletes", field: "imageUrl", key: (x) => x.name },
  { file: "box-office-top100.json", category: "posters", field: "imageUrl", key: (x) => x.imdbId || x.name },
  { file: "market-cap-top100.json", category: "logos", field: "imageUrl", key: (x) => x.ticker || x.name },
];

const EXT_FROM_TYPE = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

function slugify(value) {
  const s = String(value || "item")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 80) || "item";
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const m = pathname.match(/\.(jpe?g|png|webp|gif|svg|avif)$/);
    if (!m) return "";
    return m[1] === "jpeg" ? ".jpg" : `.${m[1]}`;
  } catch {
    return "";
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRemote(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function isLocal(url) {
  return typeof url === "string" && url.startsWith("/moreless/");
}

async function download(url, destBase) {
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MoneyGames/1.0",
    accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  };
  try {
    const host = new URL(url).hostname;
    if (host.includes("forbes")) headers.referer = "https://www.forbes.com/";
    else if (host.includes("amazon") || host.includes("imdb")) headers.referer = "https://www.imdb.com/";
    else if (host.includes("companiesmarketcap")) headers.referer = "https://companiesmarketcap.com/";
    else if (host.includes("thesportsdb") || host.includes("espn")) headers.referer = "https://www.thesportsdb.com/";
    else if (host.includes("flagcdn")) headers.referer = "https://flagcdn.com/";
  } catch {
    /* ignore */
  }

  let lastErr = "unknown";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers, redirect: "follow" });
      if (res.status === 429 || res.status === 503) {
        await sleep(800 * (attempt + 1));
        lastErr = `HTTP ${res.status}`;
        continue;
      }
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        break;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 80) {
        lastErr = "tiny payload";
        break;
      }
      const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const ext = EXT_FROM_TYPE[type] || extFromUrl(url) || ".jpg";
      const dest = destBase + ext;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      return dest;
    } catch (err) {
      lastErr = err.message;
      await sleep(400 * (attempt + 1));
    }
  }
  throw new Error(lastErr);
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

let ok = 0;
let skip = 0;
let fail = 0;
const failures = [];

for (const ds of DATASETS) {
  const filePath = path.join(root, "data", ds.file);
  const items = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const dir = path.join(publicDir, ds.category);
  fs.mkdirSync(dir, { recursive: true });

  await mapPool(items, 6, async (item) => {
    const current = item[ds.field];
    const remote = isRemote(current) ? current : isRemote(item.sourceImageUrl) ? item.sourceImageUrl : null;
    const slug = slugify(ds.key(item));
    const destBase = path.join(dir, slug);
    const publicPathFor = (abs) =>
      "/" + path.relative(path.join(root, "public"), abs).replaceAll("\\", "/");

    if (!remote) {
      if (isLocal(current)) {
        skip++;
        return;
      }
      skip++;
      return;
    }

    if (isRemote(current)) item.sourceImageUrl = current;

    try {
      const abs = await download(remote, destBase);
      item[ds.field] = publicPathFor(abs);
      ok++;
      process.stdout.write(`✓ ${ds.category}/${slug}\n`);
    } catch (err) {
      fail++;
      failures.push(`${ds.category}/${slug}: ${err.message}`);
      process.stdout.write(`✗ ${ds.category}/${slug} (${err.message})\n`);
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(items, null, 2) + "\n");
  console.log(`Wrote ${filePath}`);
}

console.log(`\nDownloaded: ${ok}, skipped: ${skip}, failed: ${fail}`);
if (failures.length) {
  console.log("Failures:");
  for (const line of failures) console.log("  " + line);
}
