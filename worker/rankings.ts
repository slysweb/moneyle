import { refreshBillionaires } from "./refresh";

interface CategoryRow {
  id: number;
  slug: string;
  title: string;
  metric_label: string;
  source_name: string | null;
  source_url: string | null;
}

interface ItemRow {
  name: string;
  subtitle: string | null;
  display_value: string;
  image_url: string | null;
  meta: string | null;
}

export interface RankingItem {
  rank: number;
  name: string;
  subtitle: string | null;
  displayValue: string;
  imageUrl: string | null;
}

export interface RankingPayload {
  slug: string;
  title: string;
  metricLabel: string;
  sourceName: string | null;
  sourceUrl: string | null;
  live: boolean;
  fetchedAt: string;
  items: RankingItem[];
}

const ALLOWED = new Set([
  "billionaires",
  "country-gdp",
  "market-cap",
  "player-salaries",
  "box-office",
]);

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function rankOf(meta: Record<string, unknown>, index: number): number {
  const rank = meta.rank;
  return typeof rank === "number" && rank > 0 ? rank : index + 1;
}

function fromRows(rows: ItemRow[]): RankingItem[] {
  return rows.map((row, i) => {
    const meta = parseMeta(row.meta);
    return {
      rank: rankOf(meta, i),
      name: row.name,
      subtitle: row.subtitle,
      displayValue: row.display_value,
      imageUrl: row.image_url,
    };
  });
}

export async function loadRanking(
  env: { DB: D1Database },
  slug: string,
  ctx?: ExecutionContext
): Promise<RankingPayload | null> {
  if (!ALLOWED.has(slug)) return null;

  const category = await env.DB.prepare(
    `SELECT id, slug, title, metric_label, source_name, source_url
     FROM categories WHERE slug = ? AND is_active = 1`
  )
    .bind(slug)
    .first<CategoryRow>();
  if (!category) return null;

  const live = slug === "billionaires";
  if (live && ctx) {
    ctx.waitUntil(
      refreshBillionaires(env.DB).catch((err) => {
        console.error("background billionaires refresh", err instanceof Error ? err.message : err);
      })
    );
  }

  const { results } = await env.DB.prepare(
    `SELECT name, subtitle, display_value, image_url, meta
     FROM items WHERE category_id = ? AND is_active = 1
     ORDER BY value DESC LIMIT 100`
  )
    .bind(category.id)
    .all<ItemRow>();

  return {
    slug: category.slug,
    title: category.title,
    metricLabel: category.metric_label,
    sourceName: category.source_name,
    sourceUrl: category.source_url,
    live,
    fetchedAt: new Date().toISOString(),
    items: fromRows(results),
  };
}

export async function handleRanking(
  env: { DB: D1Database },
  slug: string,
  ctx?: ExecutionContext
): Promise<Response> {
  const data = await loadRanking(env, slug, ctx);
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const cache = data.live ? "public, max-age=120" : "public, max-age=600";
  return Response.json(data, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}
