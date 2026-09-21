import { denverDate, resolvePuzzleDate, type GameId } from "./denver";
import {
  ensureAllDailyPuzzles,
  ensureConnections,
  ensureGuessr,
  ensureMoneyle,
  ensureMoreless,
} from "./daily";
import { handleFeedback } from "./feedback";
import { handleAuth, sessionUser } from "./auth";
import { handleProgress } from "./progress";
import { buildMoneyleBonus } from "./bonus";
import { closenessPct, findCurrency, formatRate, fxRates, FX_CURRENCIES } from "./moneyle";
import { handleArticleHtml, handleGameHtml, isArticlePath, isGameHtmlPath } from "./articleSsr";
import { handleRanking } from "./rankings";
import { robotsTxt, sitemapXml } from "../src/lib/sitemap";

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

interface CategoryRow {
  id: number;
  slug: string;
  title: string;
  metric_label: string;
  description: string | null;
  icon: string | null;
  unit_prefix: string;
  unit_suffix: string;
  source_name: string | null;
  source_url: string | null;
  is_active: number;
  item_count: number;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

async function handleCategories(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.slug, c.title, c.metric_label, c.description, c.icon,
            c.unit_prefix, c.unit_suffix, c.source_name, c.source_url, c.is_active,
            COUNT(i.id) AS item_count
     FROM categories c
     LEFT JOIN items i ON i.category_id = c.id AND i.is_active = 1
     GROUP BY c.id
     ORDER BY c.sort_order`
  ).all<CategoryRow>();

  return json(
    {
      categories: results.map((c) => ({
        slug: c.slug,
        title: c.title,
        metricLabel: c.metric_label,
        description: c.description,
        icon: c.icon,
        unitPrefix: c.unit_prefix,
        unitSuffix: c.unit_suffix,
        sourceName: c.source_name,
        sourceUrl: c.source_url,
        isActive: c.is_active === 1,
        itemCount: c.item_count,
      })),
    },
    { headers: { "cache-control": "public, max-age=300" } }
  );
}

function seoText(body: string, contentType: string, method: string): Response {
  return new Response(method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}

function handleSeoAsset(pathname: string, method: string): Response | null {
  if (pathname === "/sitemap.xml/") {
    return new Response(null, {
      status: 301,
      headers: { location: "/sitemap.xml" },
    });
  }
  if (pathname === "/sitemap.xml") {
    return seoText(sitemapXml(), "application/xml; charset=utf-8", method);
  }
  if (pathname === "/robots.txt") {
    return seoText(robotsTxt(), "text/plain; charset=utf-8", method);
  }
  return null;
}

const noStore = { headers: { "cache-control": "no-store" } };

function puzzleCache(_date: string): ResponseInit {
  return noStore;
}

async function puzzleDateOrError(
  env: Env,
  request: Request,
  url: URL,
  game: GameId
): Promise<{ date: string } | Response> {
  const resolved = resolvePuzzleDate(url.searchParams.get("date"), game);
  if (!resolved.ok) return json({ error: resolved.error }, { status: 400 });
  if (resolved.date !== denverDate()) {
    const user = await sessionUser(env, request);
    if (!user) {
      return json(
        { error: "Archive is for registered members", code: "archive_auth" },
        { status: 401 }
      );
    }
  }
  return { date: resolved.date };
}

async function handleMorelessToday(env: Env, request: Request, url: URL): Promise<Response> {
  const resolved = await puzzleDateOrError(env, request, url, "moreless");
  if (resolved instanceof Response) return resolved;
  const { date } = resolved;
  const puzzle = await ensureMoreless(env.DB, date);
  return json({ date, ...puzzle }, puzzleCache(date));
}

async function handleGuessrToday(env: Env, request: Request, url: URL): Promise<Response> {
  const resolved = await puzzleDateOrError(env, request, url, "guessr");
  if (resolved instanceof Response) return resolved;
  const { date } = resolved;
  const puzzle = await ensureGuessr(env.DB, date);
  return json({ date, ...puzzle }, puzzleCache(date));
}

async function handleConnectionsToday(env: Env, request: Request, url: URL): Promise<Response> {
  const resolved = await puzzleDateOrError(env, request, url, "connections");
  if (resolved instanceof Response) return resolved;
  const { date } = resolved;
  const puzzle = await ensureConnections(env.DB, date);
  return json({ date, ...puzzle }, puzzleCache(date));
}

async function handleMoneylePuzzle(env: Env, request: Request, url: URL): Promise<Response> {
  const resolved = await puzzleDateOrError(env, request, url, "moneyle");
  if (resolved instanceof Response) return resolved;
  const { date } = resolved;
  const puzzle = await ensureMoneyle(env.DB, date);
  return json(
    {
      date,
      imageUrl: puzzle.imageUrl,
      maxGuesses: 6,
      currencies: FX_CURRENCIES,
    },
    puzzleCache(date)
  );
}

async function handleMoneyleBonus(env: Env, request: Request, url: URL): Promise<Response> {
  const resolved = await puzzleDateOrError(env, request, url, "moneyle");
  if (resolved instanceof Response) return resolved;
  const { date } = resolved;
  const puzzle = await ensureMoneyle(env.DB, date);
  const quiz = await buildMoneyleBonus(env.DB, date, puzzle.target.code);
  if (!quiz) return json({ date, available: false }, puzzleCache(date));
  return json({ date, available: true, ...quiz }, puzzleCache(date));
}

async function handleMoneyleGuess(env: Env, request: Request, url: URL): Promise<Response> {
  const raw = url.searchParams.get("code");
  if (!raw) return json({ error: "Missing 'code' parameter" }, { status: 400 });
  const guess = findCurrency(raw);
  if (!guess) return json({ error: "Unknown currency" }, { status: 400 });

  const resolved = await puzzleDateOrError(env, request, url, "moneyle");
  if (resolved instanceof Response) return resolved;
  const { date } = resolved;
  const puzzle = await ensureMoneyle(env.DB, date);
  const target = puzzle.target;
  const attempt = Math.min(Math.max(Number(url.searchParams.get("attempt")) || 1, 1), 6);
  const correct = guess.code === target.code;

  const rates = await fxRates(target.code);
  const unitsOfGuessPerTarget = rates[guess.code];
  if (unitsOfGuessPerTarget == null || !(unitsOfGuessPerTarget > 0)) {
    return json({ error: "No rate for that currency" }, { status: 404 });
  }
  const unitsOfTargetPerGuess = 1 / unitsOfGuessPerTarget;
  const remaining = correct ? 0 : 6 - attempt;
  const showTarget = correct || remaining <= 0;

  return json(
    {
      correct,
      remaining,
      closeness: correct ? 100 : closenessPct(unitsOfTargetPerGuess),
      stronger: unitsOfTargetPerGuess > 1,
      rateDisplay: formatRate(unitsOfTargetPerGuess),
      target: showTarget ? target : null,
    },
    noStore
  );
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    const seo = handleSeoAsset(url.pathname, request.method);
    if (seo) return seo;

    if (url.pathname.startsWith("/api/")) {
      try {
        if (url.pathname.startsWith("/api/auth")) {
          return await handleAuth(env, request, url);
        }
        if (url.pathname.startsWith("/api/progress")) {
          return await handleProgress(env, request, url);
        }
        if (url.pathname === "/api/feedback") {
          if (request.method !== "POST") {
            return json({ error: "Method not allowed" }, { status: 405 });
          }
          return await handleFeedback(env.DB, request);
        }
        if (request.method !== "GET") {
          return json({ error: "Method not allowed" }, { status: 405 });
        }
        if (url.pathname === "/api/categories") return await handleCategories(env);
        if (url.pathname.startsWith("/api/rankings/")) {
          const slug = url.pathname.slice("/api/rankings/".length);
          return await handleRanking(env, slug, ctx);
        }
        if (url.pathname === "/api/moreless/today") return await handleMorelessToday(env, request, url);
        if (url.pathname === "/api/guessr/today") return await handleGuessrToday(env, request, url);
        if (url.pathname === "/api/moneyle/puzzle") return await handleMoneylePuzzle(env, request, url);
        if (url.pathname === "/api/moneyle/guess") return await handleMoneyleGuess(env, request, url);
        if (url.pathname === "/api/moneyle/bonus") return await handleMoneyleBonus(env, request, url);
        if (url.pathname === "/api/connections/today") return await handleConnectionsToday(env, request, url);
      } catch (err) {
        console.error("API error", err instanceof Error ? err.message : err);
        return json({ error: "Internal error" }, { status: 500 });
      }
      return json({ error: "Not found" }, { status: 404 });
    }

    if (
      isGameHtmlPath(url.pathname) &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      try {
        const game = await handleGameHtml(request, env);
        if (game) return game;
      } catch (err) {
        console.error("game html", err instanceof Error ? err.message : err);
      }
    }

    if (
      isArticlePath(url.pathname) &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      try {
        return await handleArticleHtml(request, env, ctx);
      } catch (err) {
        console.error("article SSR", err instanceof Error ? err.message : err);
      }
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const date = await ensureAllDailyPuzzles(env.DB, new Date(controller.scheduledTime));
        console.log(`Daily puzzles ready for ${date} (cron ${controller.cron})`);
      })().catch((err) => {
        console.error("scheduled failed", err);
        throw err;
      })
    );
  },
} satisfies ExportedHandler<Env>;
