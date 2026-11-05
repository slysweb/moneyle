import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = 1200;
const H = 630;
const OUT = path.resolve("public/og");
const FONT = "C:/Windows/Fonts/segoeui.ttf";
const FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf";

const SHOTS = {
  moreless: "public/screenshot/moneygames-more-less.png",
  guessr: "public/screenshot/微信图片_2026-09-07_221634_457.png",
  moneyle: "public/screenshot/moneygames-moneyle.png",
  connections: "public/screenshot/moneygames-money-connections.png",
};

function esc(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function svgDoc(body) {
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @font-face { font-family: "Card"; src: url("${FONT}"); font-weight: 400; }
        @font-face { font-family: "Card"; src: url("${FONT_BOLD}"); font-weight: 700; }
      </style>
    </defs>
    <rect width="${W}" height="${H}" fill="#eef7f2"/>
    <circle cx="180" cy="-40" r="280" fill="#dff5ea"/>
    <circle cx="1180" cy="40" r="220" fill="#dceafc"/>
    ${body}
  </svg>`);
}

function textBlock(lines, x, y) {
  let cursor = y;
  return lines
    .map((line, i) => {
      if (i > 0) cursor += line.gap;
      return `<text x="${x}" y="${cursor}" fill="${line.fill}" font-family="Card, Segoe UI, sans-serif" font-size="${line.size}" font-weight="${line.weight}">${esc(line.text)}</text>`;
    })
    .join("");
}

async function logo(height) {
  const icon = await sharp("public/icon.png").resize({ height }).png().toBuffer();
  const iconW = (await sharp(icon).metadata()).width ?? height;
  const gap = Math.round(height * 0.28);
  const fontSize = Math.round(height * 0.58);
  const text = "Moneyle";
  const textW = Math.round(fontSize * text.length * 0.62);
  const width = iconW + gap + textW;
  const baseline = Math.round(height * 0.72);
  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @font-face { font-family: "Card"; src: url("${FONT_BOLD}"); font-weight: 700; }
      </style>
    </defs>
    <text x="${iconW + gap}" y="${baseline}" fill="#14241c" font-family="Card, Segoe UI, sans-serif" font-size="${fontSize}" font-weight="700">${text}</text>
  </svg>`);
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: icon, left: 0, top: 0 },
      { input: svg, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

async function framedShot(file, maxHeight) {
  const resized = await sharp(file).resize({ height: maxHeight }).png().toBuffer();
  const meta = await sharp(resized).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="32" ry="32" fill="#fff"/></svg>`
  );
  const buffer = await sharp(resized).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return { buffer, width, height };
}

async function writeCard(name, body, layers) {
  const base = await sharp(svgDoc(body)).png().toBuffer();
  const image = sharp(base).composite(layers);
  const out = path.join(OUT, `${name}.png`);
  await image.png({ compressionLevel: 9 }).toFile(out);
  const stat = fs.statSync(out);
  console.log(name, `${Math.round(stat.size / 1024)}KB`);
}

async function home() {
  const mark = await logo(86);
  const games = ["More/Less", "Worth Guessr", "Banknotele", "Connections"];
  const lines = games
    .map(
      (name, i) =>
        `<text x="96" y="${292 + i * 64}" fill="#14241c" font-family="Card, Segoe UI, sans-serif" font-size="36" font-weight="700">${esc(name)}</text>`
    )
    .join("");
  const body = `${textBlock(
    [
      { text: "Daily puzzles for your financial & economic intuition.", fill: "#5d7266", size: 28, weight: 400, gap: 0 },
    ],
    96,
    210
  )}${lines}`;
  await writeCard("home", body, [{ input: mark, left: 88, top: 64 }]);
}

async function game(name, title, subtitle, shotFile) {
  const mark = await logo(64);
  const shot = await framedShot(shotFile, 560);
  const left = W - shot.width - 56;
  const top = Math.round((H - shot.height) / 2);
  const body = `${textBlock(
    [
      { text: title, fill: "#14241c", size: 64, weight: 700, gap: 0 },
      { text: subtitle, fill: "#5d7266", size: 28, weight: 400, gap: 56 },
      { text: "moneyle.app", fill: "#0a8f58", size: 24, weight: 700, gap: 112 },
    ],
    72,
    250
  )}<rect x="${left - 10}" y="${top - 10}" width="${shot.width + 20}" height="${shot.height + 20}" rx="40" fill="#ffffff"/>`;
  await writeCard(name, body, [
    { input: mark, left: 72, top: 56 },
    { input: shot.buffer, left, top },
  ]);
}

fs.mkdirSync(OUT, { recursive: true });
await home();
await game("moreless", "More/Less", "Tap the higher value.", SHOTS.moreless);
await game("guessr", "Worth Guessr", "Five seconds. Name the total.", SHOTS.guessr);
await game("moneyle", "Banknotele", "Name the frosted banknote.", SHOTS.moneyle);
await game("connections", "Connections", "Four tiles, one country.", SHOTS.connections);
