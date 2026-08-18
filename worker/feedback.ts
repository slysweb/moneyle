const MAX_MESSAGE = 2000;
const MIN_MESSAGE = 8;
const RATE_MAX = 5;

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers,
    },
  });
}

function clientIp(request: Request): string {
  const cf = request.headers.get("CF-Connecting-IP");
  if (cf) return cf.trim();
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "";
  return "";
}

export async function handleFeedback(db: D1Database, request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "Expected JSON" }, { status: 415 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 12_000) return json({ error: "Payload too large" }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: pretend success so bots move on.
  if (typeof body.website === "string" && body.website.trim()) {
    return json({ ok: true });
  }

  const category = body.category === "suggestion" ? "suggestion" : body.category === "bug" ? "bug" : null;
  if (!category) return json({ error: "Pick a category" }, { status: 400 });

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < MIN_MESSAGE) {
    return json({ error: "Message is too short" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return json({ error: "Message is too long" }, { status: 400 });
  }

  const page =
    typeof body.page === "string" ? body.page.trim().slice(0, 200) : "";
  const ip = clientIp(request).slice(0, 64);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300);

  if (ip) {
    const recent = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM feedback
         WHERE ip = ? AND created_at >= datetime('now', '-60 minutes')`
      )
      .bind(ip)
      .first<{ n: number }>();
    if ((recent?.n ?? 0) >= RATE_MAX) {
      return json({ error: "Too many submissions. Try again later." }, { status: 429 });
    }
  }

  await db
    .prepare(
      `INSERT INTO feedback (category, message, page, user_agent, ip)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(category, message, page || null, userAgent || null, ip || null)
    .run();

  return json({ ok: true });
}
