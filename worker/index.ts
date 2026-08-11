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

interface ItemRow {
  id: number;
  name: string;
  subtitle: string | null;
  value: number;
  display_value: string;
  image_url: string | null;
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

async function handleRound(env: Env, url: URL): Promise<Response> {
  const slug = url.searchParams.get("category");
  if (!slug) return json({ error: "Missing 'category' parameter" }, { status: 400 });

  const count = Math.min(
    Math.max(Number(url.searchParams.get("count")) || 100, 10),
    200
  );

  const category = await env.DB.prepare(
    `SELECT id, slug, title, metric_label FROM categories
     WHERE slug = ? AND is_active = 1`
  )
    .bind(slug)
    .first<{ id: number; slug: string; title: string; metric_label: string }>();

  if (!category) return json({ error: "Category not found" }, { status: 404 });

  const { results } = await env.DB.prepare(
    `SELECT id, name, subtitle, value, display_value, image_url
     FROM items WHERE category_id = ? AND is_active = 1
     ORDER BY RANDOM() LIMIT ?`
  )
    .bind(category.id, count)
    .all<ItemRow>();

  return json(
    {
      category: {
        slug: category.slug,
        title: category.title,
        metricLabel: category.metric_label,
      },
      items: results.map((i) => ({
        id: i.id,
        name: i.name,
        subtitle: i.subtitle,
        value: i.value,
        displayValue: i.display_value,
        imageUrl: i.image_url,
      })),
    },
    { headers: { "cache-control": "no-store" } }
  );
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, { status: 405 });
      }
      try {
        if (url.pathname === "/api/categories") return await handleCategories(env);
        if (url.pathname === "/api/round") return await handleRound(env, url);
      } catch (err) {
        console.error("API error", err);
        return json({ error: "Internal error" }, { status: 500 });
      }
      return json({ error: "Not found" }, { status: 404 });
    }

    // Non-API, non-asset requests fall through to the SPA (index.html).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
