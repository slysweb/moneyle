import { escapeHtml, injectHead, injectIntoRoot } from "./articleHtml";
import { GAME_PAGES, SITE_ORIGIN, canonicalUrl, type PageMeta } from "./pageMeta";

interface GameSeo {
  path: string;
  short: string;
  heading: string;
  lead: string;
  steps: string[];
  extra: string;
  relatedHref: string;
  relatedLabel: string;
}

const GAME_SEO: GameSeo[] = [
  {
    path: "/moreless",
    short: "More/Less",
    heading: "More/Less",
    lead: GAME_PAGES.moreless.description,
    steps: [
      "Two cards. Tap whichever is worth more — net worth, market cap, salary, box office, or GDP.",
      "Five rounds per level, five levels. One point per correct pick.",
      "The same puzzle for everyone until midnight Denver time.",
    ],
    extra: "Numbers come from the same public lists used on the Articles pages.",
    relatedHref: "/articles/forbes-top-100",
    relatedLabel: "Forbes real-time top 100",
  },
  {
    path: "/guessr",
    short: "Money Guessr",
    heading: "Money Guessr",
    lead: GAME_PAGES.guessr.description,
    steps: [
      "A pile of photographed bills and coins appears for five seconds.",
      "Then type the total. Five piles a day.",
      "Exact is 2 points; within 20% is 1.",
    ],
    extra: "Each day uses one currency from the cash we have on file, including dollars, francs, dong, and others.",
    relatedHref: "/articles/world-currencies",
    relatedLabel: "Banknotes and coins in MoneyGames",
  },
  {
    path: "/moneyle",
    short: "Moneyle",
    heading: "Moneyle",
    lead: GAME_PAGES.moneyle.description,
    steps: [
      "One frosted banknote. Six guesses.",
      "Each miss tells you whether that currency is stronger or weaker than the hidden one, using a mid-market rate.",
      "A bonus round after the reveal asks about the country: flag, GDP, population, GDP per person.",
    ],
    extra: "Search the guess list by name, country, or ISO code.",
    relatedHref: "/articles/world-currencies",
    relatedLabel: "Banknotes and coins in MoneyGames",
  },
  {
    path: "/connections",
    short: "MoneyConnections",
    heading: "MoneyConnections",
    lead: GAME_PAGES.connections.description,
    steps: [
      "Each country appears as four tiles: its flag, a bill or coin, a GDP figure, and a currency name.",
      "Select four tiles you think belong together, then Submit.",
      "Four mistakes and the remaining countries are revealed. “One away…” means you had three right.",
    ],
    extra:
      "Two points per group — 8 if you find all four. One 4×4 grid a day, the same puzzle for everyone until midnight Denver time. GDP figures are World Bank annual totals.",
    relatedHref: "/articles/four-tiles-one-country",
    relatedLabel: "Four tiles, one country",
  },
];

function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function footer(): string {
  return `<footer class="site-footer"><nav class="site-footer-nav" aria-label="Site"><a href="/">Home</a><a href="/articles">Articles</a><a href="/about">About us</a></nav><p>moneygames.cc — data from public sources, refreshed regularly.</p></footer>`;
}

export function gameSeoForPath(pathname: string): GameSeo | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return GAME_SEO.find((game) => game.path === path) ?? null;
}

export function isGameSeoPath(pathname: string): boolean {
  return gameSeoForPath(pathname) != null;
}

export function renderGameHtml(pathname: string): string | null {
  const game = gameSeoForPath(pathname);
  if (!game) return null;
  const others = GAME_SEO.filter((item) => item.path !== game.path)
    .map((item) => `<li><a href="${item.path}">${escapeHtml(item.short)}</a></li>`)
    .join("");
  const steps = game.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  return `<main class="page"><p class="info-kicker"><a href="/">← Home</a></p><h1>${escapeHtml(game.heading)}</h1><p>${escapeHtml(game.lead)}</p><h2>How to play</h2><ol>${steps}</ol><p>${escapeHtml(game.extra)}</p><p>The live grid runs in your browser. <a href="${game.path}">Play today’s ${escapeHtml(game.short)}</a>, or read <a href="${escapeHtml(game.relatedHref)}">${escapeHtml(game.relatedLabel)}</a>. <a href="/scoring">Scoring rules</a>.</p><section class="more-articles"><h2>More games</h2><ul>${others}</ul></section>${footer()}</main>`;
}

export function gameJsonLd(page: PageMeta, pathname: string): string {
  const url = canonicalUrl(pathname);
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.title.replace(/\s+[—-]\s+.*$/, ""),
    description: page.description,
    url,
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "MoneyGames", url: SITE_ORIGIN },
  });
}

export function withGameDocument(html: string, pathname: string, page: PageMeta): string {
  const inner = renderGameHtml(pathname);
  if (!inner) return html;
  return injectHead(injectIntoRoot(html, inner), gameJsonLd(page, pathname));
}
