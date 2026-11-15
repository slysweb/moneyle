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
import { ALLDLE_VERIFY_BY_PATH, ALLDLE_VERIFY_NAME, applyPageMeta, metaForPath } from "../src/lib/pageMeta";
import { isGameSeoPath, withGameDocument } from "../src/lib/gameHtml";
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
  const page = metaForPath(path);
  if (!isGameSeoPath(path) || !page) return null;

  // Always start from the SPA shell. Fetching the request URL would return
  // moreless/index.html, whose #root is already the how-to article.
  const shell = await env.ASSETS.fetch(new URL("/index.html", request.url));
  let html = applyPageMeta(await shell.text(), page, path);
  const alldleVerify = ALLDLE_VERIFY_BY_PATH[path];
  if (alldleVerify) {
    html = injectHead(
      html,
      `<meta name="${ALLDLE_VERIFY_NAME}" content="${alldleVerify}" />`
    );
  }
  html = withGameDocument(html, path, page);

  const headers = {
    "content-type": "text/html; charset=utf-8",
    // Don't keep a rewritten document for an hour. A stale copy is what made
    // Chrome stay on the how-to page until a later reload.
    "cache-control": "public, max-age=0, must-revalidate",
  };
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(html, { status: 200, headers });
}
