import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { applyPageMeta, crawlerPages, metaForPath } from "./src/lib/pageMeta.ts";
import { articleBySlug } from "./src/lib/articles.ts";
import {
  articleJsonLd,
  articlesIndexJsonLd,
  renderArticleHtml,
  renderArticlesIndexHtml,
  withArticleDocument,
} from "./src/lib/articleHtml.ts";
import { robotsTxt, sitemapXml } from "./src/lib/sitemap.ts";

function articleDocument(pathname: string, html: string): string {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (path === "/articles") {
    return withArticleDocument(html, renderArticlesIndexHtml(), articlesIndexJsonLd());
  }
  if (path.startsWith("/articles/")) {
    const article = articleBySlug(path.slice("/articles/".length));
    if (!article) return html;
    return withArticleDocument(html, renderArticleHtml(article, null), articleJsonLd(article));
  }
  return html;
}

function gameHtmlMeta(): Plugin {
  return {
    name: "game-html-meta",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          next();
          return;
        }
        const pathname = req.url ? new URL(req.url, "http://vite.local").pathname : "";
        if (pathname === "/sitemap.xml") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          res.end(sitemapXml());
          return;
        }
        if (pathname === "/robots.txt") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(robotsTxt());
          return;
        }
        const page = metaForPath(pathname);
        const pathnameNorm =
          pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
        // Article HTML is filled by the Worker (D1 rankings). Don't steal those requests.
        if (!page || pathnameNorm === "/articles" || pathnameNorm.startsWith("/articles/")) {
          next();
          return;
        }
        try {
          const raw = fs.readFileSync(path.resolve("index.html"), "utf8");
          const html = articleDocument(pathname, applyPageMeta(raw, page, page.path));
          const transformed = await server.transformIndexHtml(pathname, html);
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(transformed);
        } catch (err) {
          next(err);
        }
      });
    },
    writeBundle(options) {
      const dir = options.dir;
      if (!dir) return;
      const indexPath = path.join(dir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const html = fs.readFileSync(indexPath, "utf8");
      for (const page of crawlerPages()) {
        const slug = page.path.replace(/^\//, "");
        const rewritten = articleDocument(page.path, applyPageMeta(html, page, page.path));
        const htmlFile = path.join(dir, `${slug}.html`);
        fs.mkdirSync(path.dirname(htmlFile), { recursive: true });
        fs.writeFileSync(htmlFile, rewritten);
        const nested = path.join(dir, slug);
        fs.mkdirSync(nested, { recursive: true });
        fs.writeFileSync(path.join(nested, "index.html"), rewritten);
      }
      fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemapXml());
      fs.writeFileSync(path.join(dir, "robots.txt"), robotsTxt());
    },
  };
}

export default defineConfig({
  plugins: [gameHtmlMeta(), react(), cloudflare()],
});
