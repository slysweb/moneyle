import { escapeHtml } from "./articleHtml";
import { ARTICLES, articlePath } from "./articles";
import { SOCIAL_LINKS } from "./contact";

const GAMES = [
  {
    to: "/moreless",
    icon: "moreless",
    title: "More/Less",
    blurb:
      "Five levels of money comparisons — billionaires, market caps, salaries, box office and GDP. Tap the higher one each round.",
    cta: "Play More/Less →",
  },
  {
    to: "/guessr",
    icon: "guessr",
    title: "Money Guessr",
    blurb:
      "A pile of bills and coins flashes for five seconds. How much was it? Five rounds, scored by how close your guess is.",
    cta: "Play Money Guessr →",
  },
  {
    to: "/moneyle",
    icon: "moneyle",
    title: "Moneyle",
    blurb:
      "A frosted banknote and six guesses. Use exchange-rate clues and the note’s blurred outline to deduce the hidden currency.",
    cta: "Play Moneyle →",
  },
  {
    to: "/connections",
    icon: "connections",
    title: "MoneyConnections",
    blurb:
      "A 4×4 grid of flags, cash, GDP figures, and currency names. Find the four tiles that belong to the same country.",
    cta: "Play MoneyConnections →",
  },
] as const;

const FOOTER_LINKS = [
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About us" },
  { href: "/scoring", label: "Scoring rules" },
  { href: "/changelog", label: "Changelog" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/delete-account", label: "Delete account" },
];

/** Same copy as the React homepage, so the first HTML response is not an empty root. */
export function renderHomeHtml(): string {
  const cards = GAMES.map(
    (game) =>
      `<a href="${game.to}" class="game-card playable"><div class="game-card-head"><span class="game-card-icon ${game.icon}" aria-hidden="true"></span><div class="game-card-badge">Play now</div></div><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.blurb)}</p><span class="game-card-cta">${escapeHtml(game.cta)}</span></a>`
  ).join("");
  const articles = ARTICLES.slice(0, 3)
    .map((article) => {
      const live = article.live ? `<span class="article-live">Live</span>` : "";
      return `<li><a href="${articlePath(article.slug)}">${live}${escapeHtml(article.title)}</a><p>${escapeHtml(article.blurb)}</p></li>`;
    })
    .join("");
  const footerNav = FOOTER_LINKS.map(
    (link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
  ).join("");
  const social = SOCIAL_LINKS.map(
    (link) =>
      `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.name)}</a>`
  ).join("");
  return `<div class="app"><header class="site-header"><a href="/" class="logo"><span class="logo-mark">$</span> MoneyGames</a><div class="header-actions"><a href="/archive" class="header-archive">Archive</a><a href="/me" class="header-archive">Me</a></div></header><main class="page"><section class="hero"><h1 class="brand-hero">MoneyGames</h1><p class="hero-tagline">Games about money.</p><p class="hero-sub">Quick, free browser games that test your intuition for the numbers behind wealth, economies and markets. New puzzles every day at midnight Denver time — the same ones for everyone.</p><p class="hero-archive">Missed a day? <a href="/archive">Unlock the archive</a> with a free Google account.</p></section><section class="game-grid">${cards}</section><section class="article-teaser"><div class="article-teaser-head"><h2>Articles</h2><a href="/articles">All articles →</a></div><ul>${articles}</ul></section><footer class="site-footer"><nav class="site-footer-nav" aria-label="Site">${footerNav}</nav><nav class="social-links" aria-label="Social">${social}</nav><p>moneygames.cc — data from public sources, refreshed regularly.</p></footer></main></div>`;
}
