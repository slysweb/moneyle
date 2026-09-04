import {
  articleJsonLd,
  articlesIndexJsonLd,
  injectHead,
  rankingBootstrapScript,
  renderArticleHtml,
  renderArticlesIndexHtml,
} from "../src/lib/articleHtml";
import { articleBySlug } from "../src/lib/articles";
import { applyPageMeta, metaForPath } from "../src/lib/pageMeta";
import { loadRanking } from "./rankings";

interface ArticleEnv {
  DB: D1Database;
  ASSETS: Fetcher;
}

export function isArticlePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === "/articles" || path.startsWith("/articles/");
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

async function loadShell(env: ArticleEnv, request: Request): Promise<string> {
  const res = await env.ASSETS.fetch(request);
  const type = res.headers.get("content-type") ?? "";
  if (res.ok && type.includes("text/html")) return res.text();
  const index = await env.ASSETS.fetch(new URL("/index.html", request.url));
  return index.text();
}

function fillRoot(html: string, inner: string, headers: HeadersInit, method: string): Response {
  const response = new Response(html, {
    status: 200,
    headers,
  });
  const rewritten = new HTMLRewriter()
    .on("div#root", {
      element(el) {
        el.setInnerContent(inner, { html: true });
      },
    })
    .transform(response);
  if (method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }
  return rewritten;
}

export async function handleArticleHtml(
  request: Request,
  env: ArticleEnv,
  ctx?: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  let html = await loadShell(env, request);
  const page = metaForPath(path);
  if (page) html = applyPageMeta(html, page, path);

  let inner: string;
  let rankingScript = "";
  const cache = path.includes("forbes-top-100") ? "public, max-age=120" : "public, max-age=300";

  if (path === "/articles") {
    inner = renderArticlesIndexHtml();
    if (!html.includes("application/ld+json")) html = injectHead(html, articlesIndexJsonLd());
  } else {
    const article = articleBySlug(path.slice("/articles/".length));
    if (!article) {
      return Response.redirect(new URL("/articles", url.origin).href, 302);
    }
    let ranking = null;
    if (article.kind === "ranking" && article.rankingSlug) {
      try {
        ranking = await loadRanking(env, article.rankingSlug, ctx);
      } catch (err) {
        console.error("article ranking", err instanceof Error ? err.message : err);
      }
    }
    inner = renderArticleHtml(article, ranking);
    if (!html.includes("application/ld+json")) html = injectHead(html, articleJsonLd(article));
    if (ranking) rankingScript = rankingBootstrapScript(ranking);
  }

  if (rankingScript && !html.includes("window.__RANKING__")) {
    html = injectHead(html, rankingScript);
  }

  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": cache,
  };
  return fillRoot(html, inner, headers, request.method);
}
