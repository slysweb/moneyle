// Downloads common USD bill and coin images into public/money/usd/.
// Bills: U.S. Currency Education Program specimen/feature photos (public domain).
// Coins: Wikimedia Commons / U.S. Mint designs (public domain).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "money", "usd");

const UA = { "User-Agent": "MoneyGames/1.0 (https://moneygames.cc; currency image script)" };

const BILLS = [
  {
    file: "bill-1.png",
    url: "https://www.uscurrency.gov/sites/default/files/downloadable-materials/thumbnails/usc-downloads-1-1963-present-features-thumbnail_0.png",
  },
  {
    file: "bill-2.png",
    url: "https://www.uscurrency.gov/sites/default/files/downloadable-materials/thumbnails/usc-downloads-2-1976-present-features-thumbnail_0.png",
  },
  {
    file: "bill-5.png",
    url: "https://www.uscurrency.gov/sites/default/files/downloadable-materials/thumbnails/usc-downloads-5-2008-present-features-thumbnail.png",
  },
  {
    file: "bill-10.png",
    url: "https://www.uscurrency.gov/sites/default/files/downloadable-materials/thumbnails/usc-downloads-10-2006-present-features-thumbnail_0.png",
  },
  {
    file: "bill-20.png",
    url: "https://www.uscurrency.gov/sites/default/files/downloadable-materials/thumbnails/usc-downloads-20-2003-present-features-thumbnail_0.png",
  },
  {
    file: "bill-50.png",
    url: "https://www.uscurrency.gov/sites/default/files/downloadable-materials/thumbnails/usc-downloads-50-2004-present-features-thumbnail_0.png",
  },
  {
    file: "bill-100.png",
    url: "https://www.uscurrency.gov/sites/default/files/downloadable-materials/thumbnails/usc-downloads-100-2013-present-features-thumbnail_0.png",
  },
];

const COINS = [
  {
    file: "coin-penny.png",
    url: "https://wsrv.nl/?url=commons.wikimedia.org/wiki/Special:FilePath/US%20Penny%202.PNG&w=500",
  },
  {
    file: "coin-nickel.jpg",
    url: "https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/72/Jefferson-Nickel-Unc-Obv.jpg/500px-Jefferson-Nickel-Unc-Obv.jpg&w=500",
  },
  {
    file: "coin-dime.png",
    url: "https://wsrv.nl/?url=commons.wikimedia.org/wiki/Special:FilePath/2005%20Dime%20Obv%20Unc%20P.png&w=500",
  },
  {
    file: "coin-quarter.jpg",
    url: "https://wsrv.nl/?url=commons.wikimedia.org/wiki/Special:FilePath/1994-P%20Washington%20quarter%20obverse.jpg&w=500",
  },
];

async function download(url, dest) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error(`File too small (${buf.length} bytes): ${url}`);
  fs.writeFileSync(dest, buf);
  console.log(`✓ ${path.basename(dest)} (${(buf.length / 1024).toFixed(0)} KB)`);
}

fs.mkdirSync(outDir, { recursive: true });

for (const bill of BILLS) {
  await download(bill.url, path.join(outDir, bill.file));
}
for (const coin of COINS) {
  await download(coin.url, path.join(outDir, coin.file));
}

const sources = `USD cash images for Money Guessr
=====================================

Bills (U.S. Currency Education Program, public domain):
  https://www.uscurrency.gov/denominations/

Coins (U.S. government designs via Wikimedia Commons, public domain):
  Penny   — File:US Penny 2.PNG
  Nickel  — File:Jefferson-Nickel-Unc-Obv.jpg (U.S. Mint)
  Dime    — File:2005 Dime Obv Unc P.png
  Quarter — File:1994-P Washington quarter obverse.jpg

Illustrations are one-sided and displayed smaller than 3/4 of actual
note dimensions, per 31 CFR 411.
`;
fs.writeFileSync(path.join(outDir, "SOURCES.txt"), sources);
console.log(`\nWrote images to ${outDir}`);
