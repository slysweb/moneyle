import { ARTICLES, ARTICLES_INDEX } from "./articles";

export interface PageMeta {
  title: string;
  description: string;
}

export const SITE_ORIGIN = "https://moneygames.cc";

export const HOME_META: PageMeta = {
  title: "MoneyGames - Games about money",
  description:
    "Free browser games about money. Play More/Less, Money Guessr, Moneyle, and MoneyConnections — test your intuition for wealth, cash, and currencies.",
};

export const GAME_PAGES = {
  moreless: {
    path: "/moreless",
    title: "More/Less - A daily more or less money guessing game.",
    description:
      "Five levels of money comparisons — billionaires, market caps, salaries, box office and GDP. Tap the higher one each round.",
  },
  guessr: {
    path: "/guessr",
    title: "Money Guessr - A daily money amount guessing game.",
    description:
      "A pile of bills and coins flashes for five seconds. How much was it? Five rounds, scored by how close your guess is.",
  },
  moneyle: {
    path: "/moneyle",
    title: "Moneyle - A daily currency guessing game.",
    description:
      "A frosted banknote and six guesses. Use exchange-rate clues and the note’s blurred outline to deduce the hidden currency.",
  },
  connections: {
    path: "/connections",
    title: "MoneyConnections - A daily money connections game.",
    description:
      "A 4×4 grid of flags, cash, GDP figures, and currency names. Find the four tiles that belong to the same country.",
  },
} as const satisfies Record<string, PageMeta & { path: string }>;

export function crawlerPages(): (PageMeta & { path: string })[] {
  return [
    ...Object.values(GAME_PAGES),
    {
      path: "/articles",
      title: `${ARTICLES_INDEX.title} — MoneyGames`,
      description: ARTICLES_INDEX.description,
    },
    ...ARTICLES.map((article) => ({
      path: `/articles/${article.slug}`,
      title: `${article.title} — MoneyGames`,
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

/** Rewrites title, description, Open Graph, Twitter, and canonical tags in the SPA shell. */
export function applyPageMeta(html: string, page: PageMeta, pathname: string): string {
  const url = attr(canonicalUrl(pathname));
  const title = attr(page.title);
  const description = attr(page.description);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"[\s\S]*?content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta\s+property="og:title"[\s\S]*?content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+property="og:description"[\s\S]*?content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta\s+property="og:url"[\s\S]*?content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta\s+name="twitter:title"[\s\S]*?content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+name="twitter:description"[\s\S]*?content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link\s+rel="canonical"[\s\S]*?href=")[^"]*(")/, `$1${url}$2`);
}
