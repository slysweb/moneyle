import {
  ARTICLES,
  ARTICLES_INDEX,
  articlePath,
  formatArticleDate,
  type Article,
  type ArticleFigure,
} from "./articles";
import { SITE_ORIGIN, canonicalUrl } from "./pageMeta";

export interface RankingHtml {
  slug: string;
  title: string;
  live: boolean;
  metricLabel: string;
  sourceName: string | null;
  sourceUrl: string | null;
  fetchedAt: string;
  items: {
    rank: number;
    name: string;
    subtitle: string | null;
    displayValue: string;
    imageUrl: string | null;
  }[];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function p(text: string): string {
  return `<p>${escapeHtml(text)}</p>`;
}

function figure(fig: ArticleFigure): string {
  const caption = fig.caption ? `<figcaption>${escapeHtml(fig.caption)}</figcaption>` : "";
  return `<figure class="article-figure"><img src="${escapeHtml(fig.src)}" alt="${escapeHtml(fig.alt)}" width="${fig.width}" height="${fig.height}" loading="lazy" decoding="async">${caption}</figure>`;
}

function footer(): string {
  return `<footer class="site-footer"><nav class="site-footer-nav" aria-label="Site"><a href="/">Home</a><a href="/articles">Articles</a><a href="/about">About us</a></nav><p>moneyle.app — data from public sources, refreshed regularly.</p></footer>`;
}

function moreArticles(current: string): string {
  const rest = ARTICLES.filter((a) => a.slug !== current).slice(0, 4);
  return `<section class="more-articles"><h2>More articles</h2><ul>${rest
    .map((a) => `<li><a href="${articlePath(a.slug)}">${escapeHtml(a.title)}</a></li>`)
    .join("")}</ul></section>`;
}

function rankingTable(article: Article, ranking: RankingHtml): string {
  const fetched = new Date(ranking.fetchedAt).toISOString();
  const source =
    ranking.sourceUrl && ranking.sourceName
      ? ` · <a href="${escapeHtml(ranking.sourceUrl)}" rel="noreferrer">${escapeHtml(ranking.sourceName)}</a>`
      : "";
  const rows = ranking.items
    .map((item) => {
      const img = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="" width="40" height="40">`
        : `<span class="rank-person-fallback" aria-hidden="true">${escapeHtml(item.name.slice(0, 1))}</span>`;
      const sub = item.subtitle ? `<small>${escapeHtml(item.subtitle)}</small>` : "";
      return `<tr><td class="rank-num">${item.rank}</td><td><span class="rank-person">${img}<span><strong>${escapeHtml(item.name)}</strong>${sub}</span></span></td><td class="rank-value">${escapeHtml(item.displayValue)}</td></tr>`;
    })
    .join("");
  const metric = escapeHtml(article.metricLabel ?? ranking.metricLabel);
  const kind = ranking.live ? "Forbes real-time list" : "From the Moneyle database";
  const count = `${ranking.items.length} ${ranking.items.length === 1 ? "entry" : "entries"}`;
  return `<p class="article-fetched">${kind} · ${count} · <time datetime="${fetched}">${escapeHtml(fetched)}</time>${source}</p><div class="rank-table-wrap"><table class="rank-table"><thead><tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">${metric}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderArticlesIndexHtml(): string {
  const cards = ARTICLES.map((article) => {
    const live = article.live ? `<span class="article-live">Live</span>` : "";
    return `<li><a href="${articlePath(article.slug)}" class="article-card"><div class="article-card-meta"><time datetime="${article.published}">${escapeHtml(formatArticleDate(article.published))}</time>${live}<span>${escapeHtml(article.gameLabel)}</span></div><h2>${escapeHtml(article.title)}</h2><p>${escapeHtml(article.blurb)}</p></a></li>`;
  }).join("");
  return `<main class="page article-index"><p class="info-kicker"><a href="/">← Home</a></p><h1>${escapeHtml(ARTICLES_INDEX.title)}</h1><p class="article-lead">Rankings and notes behind the daily games. The Forbes list on this site refreshes from the real-time billionaire feed; the other tables use the same data More/Less plays with.</p><ul class="article-list">${cards}</ul>${footer()}</main>`;
}

export function renderArticleHtml(article: Article, ranking: RankingHtml | null): string {
  const live = article.live ? `<span class="article-live">Live</span>` : "";
  const intros = article.intros.map(p).join("");
  const sections = (article.sections ?? [])
    .map((section) => {
      const h = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : "";
      return `${h}${section.paragraphs.map((block) => (typeof block === "string" ? p(block) : figure(block))).join("")}`;
    })
    .join("");
  const related = article.related?.length
    ? `<p>${article.related.map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`).join(" · ")}</p>`
    : "";
  const table =
    article.kind === "ranking" && ranking
      ? rankingTable(article, ranking)
      : article.kind === "ranking"
        ? `<p class="status-msg">Ranking table loads with the page.</p>`
        : "";
  const note = article.note ? `<p class="article-note">${escapeHtml(article.note)}</p>` : "";
  const klass = `page article-page${article.kind === "ranking" ? " ranking" : ""}`;
  return `<main class="${klass}"><p class="info-kicker"><a href="/articles">← Articles</a></p><p class="article-meta"><time datetime="${article.published}">${escapeHtml(formatArticleDate(article.published))}</time>${live}<span>Played in <a href="${escapeHtml(article.gameTo)}">${escapeHtml(article.gameLabel)}</a></span></p><h1>${escapeHtml(article.title)}</h1>${intros}${table}${sections}${related}${note}<p class="article-play"><a href="${escapeHtml(article.gameTo)}">Play ${escapeHtml(article.gameLabel)} →</a></p>${moreArticles(article.slug)}${footer()}</main>`;
}

export function injectIntoRoot(html: string, inner: string): string {
  return html.replace('<div id="root"></div>', `<div id="root">${inner}</div>`);
}

function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

export function articlesIndexJsonLd(): string {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${ARTICLES_INDEX.title} — Moneyle`,
    description: ARTICLES_INDEX.description,
    url: canonicalUrl("/articles"),
    publisher: { "@type": "Organization", name: "Moneyle", url: SITE_ORIGIN },
  });
}

export function articleJsonLd(article: Article): string {
  const url = canonicalUrl(articlePath(article.slug));
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.published,
    dateModified: article.published,
    mainEntityOfPage: url,
    url,
    author: { "@type": "Organization", name: "Moneyle", url: SITE_ORIGIN },
    publisher: { "@type": "Organization", name: "Moneyle", url: SITE_ORIGIN },
  });
}

export function rankingBootstrapScript(ranking: RankingHtml): string {
  return `<script>window.__RANKING__=${JSON.stringify(ranking).replace(/</g, "\\u003c")}</script>`;
}

export function injectHead(html: string, snippets: string): string {
  if (!snippets) return html;
  return html.replace("</head>", `${snippets}</head>`);
}

export function withArticleDocument(
  html: string,
  inner: string,
  headSnippets = ""
): string {
  return injectHead(injectIntoRoot(html, inner), headSnippets);
}
