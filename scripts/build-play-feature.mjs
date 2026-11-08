import fs from "node:fs";
import sharp from "sharp";

const W = 1024;
const H = 500;
const BG = "#13b77b";
const FONT = "C:/Windows/Fonts/segoeui.ttf";
const FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf";
const OUT = "mobile/assets/play-feature-1024x500.png";
const LOGO = "mobile/assets/play-icon-512.png";

const logoSize = 400;
const logo = await sharp(LOGO).resize(logoSize, logoSize).ensureAlpha().raw().toBuffer();
const keyed = Buffer.alloc(logoSize * logoSize * 4);
for (let i = 0; i < logo.length; i += 4) {
  const r = logo[i];
  const g = logo[i + 1];
  const b = logo[i + 2];
  const dist = Math.hypot(r - 28, g - 204, b - 142);
  keyed[i] = r;
  keyed[i + 1] = g;
  keyed[i + 2] = b;
  keyed[i + 3] = dist < 90 ? 0 : dist < 140 ? Math.round(((dist - 90) / 50) * 255) : 255;
}
const logoPng = await sharp(keyed, { raw: { width: logoSize, height: logoSize, channels: 4 } }).png().toBuffer();

const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face { font-family: "Card"; src: url("${FONT}"); font-weight: 400; }
      @font-face { font-family: "Card"; src: url("${FONT_BOLD}"); font-weight: 700; }
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <text x="372" y="224" fill="#ffffff" font-family="Card, Segoe UI, sans-serif" font-size="92" font-weight="700">Moneyle</text>
  <text x="376" y="294" fill="#ffffff" font-family="Card, Segoe UI, sans-serif" font-size="26" font-weight="400">Daily puzzles for your financial &amp; economic intuition.</text>
  <text x="376" y="368" fill="#ffffff" font-family="Card, Segoe UI, sans-serif" font-size="22" font-weight="700" opacity="0.95">More/Less   ·   Worth Guessr   ·   Banknotele   ·   Connections</text>
</svg>`);

await sharp(svg)
  .composite([{ input: logoPng, left: 4, top: 50 }])
  .png({ compressionLevel: 9 })
  .toFile(OUT + ".tmp.png");

fs.renameSync(OUT + ".tmp.png", OUT);
console.log("wrote", OUT, fs.statSync(OUT).size);
