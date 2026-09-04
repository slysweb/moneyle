import { ARTICLES } from "./articles";
import { GAME_PAGES, SITE_ORIGIN } from "./pageMeta";

export interface SitemapUrl {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
}

/** Public HTML pages worth indexing. No API, no redirects, no member-only puzzle dates. */
export function sitemapUrls(): SitemapUrl[] {
  return [
    { path: "/", changefreq: "daily", priority: 1 },
    ...Object.values(GAME_PAGES).map((page) => ({
      path: page.path,
      changefreq: "daily" as const,
      priority: 0.9,
    })),
    { path: "/articles", changefreq: "weekly", priority: 0.8 },
    ...ARTICLES.map((article) => ({
      path: `/articles/${article.slug}`,
      lastmod: article.published,
      changefreq: (article.live ? "daily" : "weekly") as "daily" | "weekly",
      priority: 0.7,
    })),
    { path: "/about", changefreq: "monthly", priority: 0.5 },
    { path: "/scoring", changefreq: "monthly", priority: 0.5 },
    { path: "/changelog", changefreq: "weekly", priority: 0.4 },
    { path: "/archive", changefreq: "daily", priority: 0.4 },
    { path: "/register", changefreq: "monthly", priority: 0.3 },
    { path: "/terms", changefreq: "yearly", priority: 0.2 },
    { path: "/privacy", changefreq: "yearly", priority: 0.2 },
  ];
}

export function sitemapXml(): string {
  const urls = sitemapUrls()
    .map((entry) => {
      const loc = entry.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${entry.path}`;
      const bits = [`    <loc>${loc}</loc>`];
      if (entry.lastmod) bits.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      if (entry.changefreq) bits.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority != null) bits.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      return `  <url>\n${bits.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}
