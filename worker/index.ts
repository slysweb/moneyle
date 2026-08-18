import { denverDate } from "./denver";
import { ensureAllDailyPuzzles, ensureGuessr, ensureMoneyle, ensureMoreless } from "./daily";
import { handleFeedback } from "./feedback";
import { closenessPct, findCurrency, formatRate, fxRates, FX_CURRENCIES } from "./moneyle";

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
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

const noStore = { headers: { "cache-control": "no-store" } };

async function handleMorelessToday(env: Env): Promise<Response> {
  const date = denverDate();
  const puzzle = await ensureMoreless(env.DB, date);
  return json({ date, ...puzzle }, noStore);
}

async function handleGuessrToday(env: Env): Promise<Response> {
  const date = denverDate();
  const puzzle = await ensureGuessr(env.DB, date);
  return json({ date, ...puzzle }, noStore);
}

async function handleMoneylePuzzle(env: Env): Promise<Response> {
  const date = denverDate();
  const puzzle = await ensureMoneyle(env.DB, date);
  return json(
    {
      date,
      imageUrl: puzzle.imageUrl,
      maxGuesses: 6,
      currencies: FX_CURRENCIES,
    },
    noStore
  );
}

async function handleMoneyleGuess(env: Env, url: URL): Promise<Response> {
  const raw = url.searchParams.get("code");
  if (!raw) return json({ error: "Missing 'code' parameter" }, { status: 400 });
  const guess = findCurrency(raw);
  if (!guess) return json({ error: "Unknown currency" }, { status: 400 });

  const date = denverDate();
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
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
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
        if (url.pathname === "/api/moreless/today") return await handleMorelessToday(env);
        if (url.pathname === "/api/guessr/today") return await handleGuessrToday(env);
        if (url.pathname === "/api/moneyle/puzzle") return await handleMoneylePuzzle(env);
        if (url.pathname === "/api/moneyle/guess") return await handleMoneyleGuess(env, url);
      } catch (err) {
        console.error("API error", err instanceof Error ? err.message : err);
        return json({ error: "Internal error" }, { status: 500 });
      }
      return json({ error: "Not found" }, { status: 404 });
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
