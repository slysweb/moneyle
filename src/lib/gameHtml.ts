import { escapeHtml, injectHead } from "./articleHtml";
import { guideFaqJsonLd, guideGameForPath, renderGuideHtml, type GuideToday } from "./gameGuide";
import { GAME_PAGES, SITE_ORIGIN, canonicalUrl, type PageMeta } from "./pageMeta";

interface GameSeo {
  path: string;
  short: string;
  lead: string;
}

const GAME_SEO: GameSeo[] = [
  { path: "/moreless", short: "More/Less", lead: GAME_PAGES.moreless.description },
  { path: "/guessr", short: "Money Guessr", lead: GAME_PAGES.guessr.description },
  { path: "/moneyle", short: "Moneyle", lead: GAME_PAGES.moneyle.description },
  { path: "/connections", short: "MoneyConnections", lead: GAME_PAGES.connections.description },
];

function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function footer(): string {
  return `<footer class="site-footer"><nav class="site-footer-nav" aria-label="Site"><a href="/">Home</a><a href="/articles">Articles</a><a href="/about">About us</a><a href="/scoring">Scoring rules</a></nav><p>moneygames.cc — data from public sources, refreshed regularly.</p></footer>`;
}

export function gameSeoForPath(pathname: string): GameSeo | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return GAME_SEO.find((game) => game.path === path) ?? null;
}

export function isGameSeoPath(pathname: string): boolean {
  return gameSeoForPath(pathname) != null;
}

export function renderGameHtml(pathname: string, today: GuideToday | null = null): string | null {
  const game = gameSeoForPath(pathname);
  const guide = guideGameForPath(pathname);
  if (!game || !guide) return null;
  return `<h1 class="ssr-game-title">${escapeHtml(game.short)}</h1>${renderGuideHtml(guide, today)}${footer()}`;
}

export function injectAfterRoot(html: string, inner: string): string {
  if (html.includes('id="ssr-guide"')) return html;
  return html.replace(
    '<div id="root"></div>',
    `<div id="root"></div><div id="ssr-guide">${inner}</div>`
  );
}

export function gameJsonLd(page: PageMeta, pathname: string): string {
  const url = canonicalUrl(pathname);
  const app = jsonLd({
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
  const guide = guideGameForPath(pathname);
  return guide ? app + jsonLd(guideFaqJsonLd(guide)) : app;
}

export function withGameDocument(html: string, pathname: string, page: PageMeta): string {
  const inner = renderGameHtml(pathname);
  if (!inner) return html;
  return injectHead(injectAfterRoot(html, inner), gameJsonLd(page, pathname));
}
