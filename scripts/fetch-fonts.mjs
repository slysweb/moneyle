// Downloads the woff2 files behind the Google Fonts stylesheet into src/fonts/
// so the app ships its own fonts instead of depending on fonts.gstatic.com at runtime.
//
// Only the latin and latin-ext subsets are kept: the UI is English, and latin-ext
// covers the accented characters that show up in names and currencies (e.g. Złoty).
//
// Usage: node scripts/fetch-fonts.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "fonts");

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600;700&family=Outfit:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap";

// A desktop UA is required, otherwise Google serves the legacy ttf stylesheet.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const KEEP_SUBSETS = new Set(["latin", "latin-ext"]);

const SLUGS = {
  "IBM Plex Mono": "ibm-plex-mono",
  Outfit: "outfit",
  "Space Grotesk": "space-grotesk",
};

function parseFaces(css) {
  const faces = [];
  // Each @font-face block is preceded by a /* subset */ comment.
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    const [, subset, body] = match;
    const family = body.match(/font-family:\s*'([^']+)'/)?.[1];
    const weight = body.match(/font-weight:\s*(\d+)/)?.[1];
    const url = body.match(/url\(([^)]+)\)/)?.[1];
    if (!family || !weight || !url) continue;
    faces.push({ subset, family, weight: Number(weight), url });
  }
  return faces;
}

const res = await fetch(CSS_URL, { headers: { "user-agent": UA } });
if (!res.ok) throw new Error(`Failed to fetch font CSS: HTTP ${res.status}`);
const css = await res.text();

const faces = parseFaces(css).filter((f) => KEEP_SUBSETS.has(f.subset));
if (faces.length === 0) throw new Error("No matching @font-face blocks found");

// Variable fonts reuse one file across every weight, so dedupe by URL.
const byUrl = new Map();
for (const face of faces) {
  const entry = byUrl.get(face.url);
  if (entry) {
    entry.weights.add(face.weight);
  } else {
    byUrl.set(face.url, { ...face, weights: new Set([face.weight]) });
  }
}

fs.mkdirSync(outDir, { recursive: true });

const manifest = [];
for (const entry of byUrl.values()) {
  const slug = SLUGS[entry.family] ?? entry.family.toLowerCase().replace(/\s+/g, "-");
  const weights = [...entry.weights].sort((a, b) => a - b);
  const variable = weights.length > 1;
  const weightPart = variable ? "var" : String(weights[0]);
  const name = `${slug}-${weightPart}-${entry.subset}.woff2`;
  const dest = path.join(outDir, name);

  const fontRes = await fetch(entry.url, { headers: { "user-agent": UA } });
  if (!fontRes.ok) throw new Error(`Failed to download ${entry.url}: HTTP ${fontRes.status}`);
  const buf = Buffer.from(await fontRes.arrayBuffer());
  fs.writeFileSync(dest, buf);

  const unicodeRange = css
    .slice(css.indexOf(entry.url))
    .match(/unicode-range:\s*([^;]+);/)?.[1]
    ?.trim();

  manifest.push({
    file: name,
    family: entry.family,
    subset: entry.subset,
    weights,
    variable,
    unicodeRange,
    bytes: buf.length,
  });
  console.log(`✓ ${name}  ${(buf.length / 1024).toFixed(1)} KB`);
}

const total = manifest.reduce((sum, m) => sum + m.bytes, 0);
console.log(`\n${manifest.length} files, ${(total / 1024).toFixed(1)} KB total`);
console.log("\n@font-face source of truth (paste into src/styles.css if regenerating):\n");
for (const m of manifest) {
  const weight = m.variable ? `${m.weights[0]} ${m.weights[m.weights.length - 1]}` : m.weights[0];
  console.log(`@font-face {
  font-family: "${m.family}";
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url("./fonts/${m.file}") format("woff2");
  unicode-range: ${m.unicodeRange};
}`);
}
