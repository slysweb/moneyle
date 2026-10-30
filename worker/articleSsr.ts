import {
  articleJsonLd,
  articlesIndexJsonLd,
  injectHead,
  rankingBootstrapScript,
  injectIntoRoot,
  renderArticleHtml,
  renderArticlesIndexHtml,
} from "../src/lib/articleHtml";
import { articleBySlug } from "../src/lib/articles";
import { applyPageMeta, metaForPath } from "../src/lib/pageMeta";
import { isGameSeoPath, renderGameHtml, gameJsonLd } from "../src/lib/gameHtml";
import { renderHomeHtml } from "../src/lib/homeHtml";
import { loadRanking } from "./rankings";

interface ArticleEnv {
  DB: D1Database;
  ASSETS: Fetcher;
}

export function isArticlePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === "/articles" || path.startsWith("/articles/");
}

export function isGameHtmlPath(pathname: string): boolean {
  return isGameSeoPath(pathname);
}

export function isHomePath(pathname: string): boolean {
  return normalizePath(pathname) === "/";
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

export async function handleHomeHtml(request: Request, env: ArticleEnv): Promise<Response> {
  const shell = await env.ASSETS.fetch(new URL("/index.html", request.url));
  const html = injectIntoRoot(await shell.text(), renderHomeHtml());
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=300",
  };
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(html, { status: 200, headers });
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

export async function handleGameHtml(
  request: Request,
  env: ArticleEnv
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  const inner = renderGameHtml(path);
  const page = metaForPath(path);
  if (!inner || !page) return null;

  let html = await loadShell(env, request);
  html = applyPageMeta(html, page, path);
  if (!html.includes("application/ld+json")) html = injectHead(html, gameJsonLd(page, path));

  return fillRoot(html, inner, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=3600",
  }, request.method);
}
