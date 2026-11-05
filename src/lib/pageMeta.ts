import { ARTICLES, ARTICLES_INDEX } from "./articles";

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute social preview image. Omitted pages do not advertise one. */
  image?: string;
}

export const SITE_ORIGIN = "https://moneyle.app";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function ogImageUrl(file: string): string {
  return `${SITE_ORIGIN}/og/${file}`;
}

export const HOME_META: PageMeta = {
  title: "Moneyle — Daily Financial & Economic Puzzles",
  description:
    "Free browser games about money. Play More/Less, Worth Guessr, Banknotele, and Connections — test your intuition for wealth, cash, and currencies.",
  image: ogImageUrl("home.png"),
};

export const GAME_PAGES = {
  moreless: {
    path: "/moreless",
    title: "More/Less - A daily more or less money guessing game.",
    description:
      "Five levels of money comparisons — billionaires, market caps, salaries, box office and GDP. Tap the higher one each round.",
    image: ogImageUrl("moreless.png"),
  },
  guessr: {
    path: "/guessr",
    title: "Worth Guessr - A daily money amount guessing game.",
    description:
      "A pile of bills and coins flashes for five seconds. How much was it? Five rounds, scored by how close your guess is.",
    image: ogImageUrl("guessr.png"),
  },
  moneyle: {
    path: "/banknotele",
    title: "Banknotele - A daily currency guessing game.",
    description:
      "A frosted banknote and six guesses. Use exchange-rate clues and the note’s blurred outline to deduce the hidden currency.",
    image: ogImageUrl("moneyle.png"),
  },
  connections: {
    path: "/connections",
    title: "Connections - A daily money connections game.",
    description:
      "A 4×4 grid of flags, cash, GDP figures, and currency names. Find the four tiles that belong to the same country.",
    image: ogImageUrl("connections.png"),
  },
} as const satisfies Record<string, PageMeta & { path: string }>;

export function crawlerPages(): (PageMeta & { path: string })[] {
  return [
    ...Object.values(GAME_PAGES),
    {
      path: "/articles",
      title: `${ARTICLES_INDEX.title} — Moneyle`,
      description: ARTICLES_INDEX.description,
    },
    ...ARTICLES.map((article) => ({
      path: `/articles/${article.slug}`,
      title: `${article.title} — Moneyle`,
      description: article.description,
    })),
  ];
}

export function canonicalUrl(pathname: string): string {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return `${SITE_ORIGIN}${path || "/"}`;
}

export function metaForPath(pathname: string): (PageMeta & { path: string }) | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return crawlerPages().find((page) => page.path === path) ?? null;
}

function attr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function replaceMeta(html: string, attrName: "name" | "property", key: string, content: string): string {
  const pattern = new RegExp(`(<meta\\s+${attrName}="${key}"[\\s\\S]*?content=")[^"]*(")`);
  const tag = `<meta ${attrName}="${key}" content="${content}" />`;
  if (pattern.test(html)) return html.replace(pattern, `$1${content}$2`);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function removeMeta(html: string, attrName: "name" | "property", key: string): string {
  return html.replace(new RegExp(`\\n?\\s*<meta\\s+${attrName}="${key}"[^>]*>`, "g"), "");
}

/** Rewrites title, description, Open Graph, Twitter, and canonical tags in the SPA shell. */
export function applyPageMeta(html: string, page: PageMeta, pathname: string): string {
  const url = attr(canonicalUrl(pathname));
  const title = attr(page.title);
  const description = attr(page.description);
  let next = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"[\s\S]*?content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta\s+property="og:title"[\s\S]*?content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+property="og:description"[\s\S]*?content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta\s+property="og:url"[\s\S]*?content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta\s+name="twitter:title"[\s\S]*?content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+name="twitter:description"[\s\S]*?content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link\s+rel="canonical"[\s\S]*?href=")[^"]*(")/, `$1${url}$2`);

  const imageKeys: Array<["property" | "name", string]> = [
    ["property", "og:image"],
    ["property", "og:image:width"],
    ["property", "og:image:height"],
    ["property", "og:image:alt"],
    ["name", "twitter:image"],
    ["name", "twitter:image:alt"],
  ];
  if (page.image) {
    const image = attr(page.image);
    next = replaceMeta(next, "property", "og:image", image);
    next = replaceMeta(next, "property", "og:image:width", String(OG_IMAGE_WIDTH));
    next = replaceMeta(next, "property", "og:image:height", String(OG_IMAGE_HEIGHT));
    next = replaceMeta(next, "property", "og:image:alt", title);
    next = replaceMeta(next, "name", "twitter:card", "summary_large_image");
    next = replaceMeta(next, "name", "twitter:image", image);
    next = replaceMeta(next, "name", "twitter:image:alt", title);
  } else {
    for (const [attrName, key] of imageKeys) next = removeMeta(next, attrName, key);
    next = replaceMeta(next, "name", "twitter:card", "summary");
  }
  return next;
}
