import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const INK = "#121413";
const SUB = "#68706b";
const FONT = "Segoe UI";

const shots = {
  home: "public/screenshot/moneygames-home.png",
  guessr: "public/screenshot/微信图片_2026-09-07_221634_457.png",
  note: "public/screenshot/moneygames-moneyle.png",
};

function backup() {
  const dir = path.join(os.tmpdir(), "mg-shot-backup");
  fs.mkdirSync(dir, { recursive: true });
  for (const file of Object.values(shots)) {
    const dest = path.join(dir, path.basename(file));
    if (fs.existsSync(dest)) fs.copyFileSync(dest, file);
    else fs.copyFileSync(file, dest);
  }
  console.log("backup", dir);
}

function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

async function renderText(text, { size, weight, color, tracking, width = 700 }) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${size * 2}">
      <text x="0" y="${size}" font-family="${FONT}" font-weight="${weight}" font-size="${size}" letter-spacing="${tracking}" fill="${color}">${esc(text)}</text>
    </svg>`,
  );
  const { data, info } = await sharp(svg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let maxX = 0;
  let minY = info.height;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toBuffer();
  return { png, width: cropW, height: cropH };
}

function restoreBand(data, w, c, x0, x1, y0, y1, yAbove, yBelow) {
  for (let y = y0; y <= y1; y++) {
    const t = (y - yAbove) / (yBelow - yAbove);
    for (let x = x0; x <= x1; x++) {
      const above = (yAbove * w + x) * c;
      const below = (yBelow * w + x) * c;
      const i = (y * w + x) * c;
      const sr = data[above] + (data[below] - data[above]) * t;
      const sg = data[above + 1] + (data[below + 1] - data[above + 1]) * t;
      const sb = data[above + 2] + (data[below + 2] - data[above + 2]) * t;
      const darker = sr - data[i] > 16 || sg - data[i + 1] > 16;
      if (darker) {
        data[i] = Math.round(sr);
        data[i + 1] = Math.round(sg);
        data[i + 2] = Math.round(sb);
      }
    }
  }
}

function fillRect(data, w, c, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * w + x) * c;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
    }
  }
}

function sample(data, w, c, x, y) {
  const i = (y * w + x) * c;
  return [data[i], data[i + 1], data[i + 2]];
}

async function loadRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, info };
}

async function saveRaw(file, data, info, overlays) {
  let img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  if (overlays.length) img = img.composite(overlays);
  const out = file + ".tmp.png";
  await img.png({ compressionLevel: 9 }).toFile(out);
  fs.renameSync(out, file);
}

async function patchHome() {
  const { data, info } = await loadRaw(shots.home);
  const w = info.width;
  const c = info.channels;
  restoreBand(data, w, c, 16, 240, 68, 106, 66, 108);
  restoreBand(data, w, c, 14, 310, 116, 133, 112, 136);
  restoreBand(data, w, c, 76, 210, 230, 252, 226, 254);
  restoreBand(data, w, c, 76, 170, 296, 318, 292, 322);
  restoreBand(data, w, c, 76, 240, 362, 383, 358, 386);

  const title = await renderText("Moneyle", { size: 34, weight: 700, color: INK, tracking: -0.6 });
  const sub = await renderText("The same daily puzzles as moneyle.app", {
    size: 16,
    weight: 500,
    color: SUB,
    tracking: 0,
    width: 900,
  });
  const guessr = await renderText("Worth Guessr", { size: 22, weight: 700, color: INK, tracking: -0.3 });
  const note = await renderText("Banknotele", { size: 22, weight: 700, color: INK, tracking: -0.3 });
  const connections = await renderText("Connections", { size: 22, weight: 700, color: INK, tracking: -0.3 });

  const overlays = [
    { input: title.png, left: 20, top: 69 },
    { input: sub.png, left: 18, top: 116 },
    { input: guessr.png, left: 80, top: 232 },
    { input: note.png, left: 80, top: 297 },
    { input: connections.png, left: 80, top: 363 },
  ];
  await saveRaw(shots.home, data, info, overlays);
  console.log("home", { title: title.width, sub: sub.width, guessr: guessr.width, note: note.width, connections: connections.width });
}

async function patchHeader(file, text, box, anchor) {
  const { data, info } = await loadRaw(file);
  const bg = sample(data, info.width, info.channels, anchor[0], anchor[1]);
  fillRect(data, info.width, info.channels, box[0], box[1], box[2], box[3], bg);
  const label = await renderText(text, { size: 21, weight: 700, color: INK, tracking: -0.3 });
  const center = Math.round((box[0] + box[2]) / 2);
  const left = center - Math.round(label.width / 2);
  const top = box[1] + Math.round((box[3] - box[1] + 1 - label.height) / 2);
  await saveRaw(file, data, info, [{ input: label.png, left, top }]);
  console.log(path.basename(file), text, { left, top, w: label.width, h: label.height, bg });
}

backup();
await patchHome();
await patchHeader(shots.guessr, "Worth Guessr", [145, 10, 280, 30], [110, 18]);
await patchHeader(shots.note, "Banknotele", [155, 11, 275, 31], [110, 18]);
