export interface AuthEnv {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

const SESSION_COOKIE = "mg_session";
const OAUTH_COOKIE = "mg_oauth";
const SESSION_DAYS = 30;
const APP_CODE_MINUTES = 2;
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

interface OauthCookie {
  state: string;
  verifier: string;
  next: string;
  appRedirect?: string;
}

interface GoogleUserinfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  pictureUrl: string | null;
  joinedAt: string | null;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function cookieFlags(url: URL): string {
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax${secure}`;
}

function getCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("Cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    return part.slice(idx + 1).trim();
  }
  return null;
}

function setCookie(headers: Headers, name: string, value: string, url: URL, maxAge: number): void {
  headers.append("Set-Cookie", `${name}=${value}; Max-Age=${maxAge}; ${cookieFlags(url)}`);
}

function clearCookie(headers: Headers, name: string, url: URL): void {
  headers.append("Set-Cookie", `${name}=; Max-Age=0; ${cookieFlags(url)}`);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(byteLength = 32): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return bytesToBase64Url(new Uint8Array(digest));
}

function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/";
  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return "/";
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return "/";
  if (path.startsWith("/api") || path.startsWith("/register")) return "/";
  return path.slice(0, 200);
}

function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

/** Deep link back into the Expo app after Google finishes on moneygames.cc. */
function safeAppRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.username || parsed.password || parsed.hash) return null;
  const host = parsed.hostname;
  const path = parsed.pathname;
  const looksLikeAuth = /auth/i.test(path) || host === "auth";
  if (!looksLikeAuth) return null;

  if (parsed.protocol === "moneygames:") return parsed.toString().slice(0, 400);
  if (parsed.protocol === "exp:") return parsed.toString().slice(0, 400);
  if ((parsed.protocol === "http:" || parsed.protocol === "https:") && isPrivateHost(host)) {
    return parsed.toString().slice(0, 400);
  }
  return null;
}

function withQuery(base: string, params: Record<string, string>): string {
  const parsed = new URL(base);
  for (const [key, value] of Object.entries(params)) parsed.searchParams.set(key, value);
  return parsed.toString();
}

function callbackUrl(url: URL): string {
  return `${url.origin}/api/auth/google/callback`;
}

function registerError(url: URL, code: string): Response {
  return Response.redirect(`${url.origin}/register?error=${encodeURIComponent(code)}`, 302);
}

function appReturnPage(target: string, params: Record<string, string>): Response {
  const dest = withQuery(target, params);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Returning to MoneyGames</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 48px 24px; color: #111413; background: #f4f5f4; }
    a { color: #1b7a4c; font-weight: 600; }
  </style>
</head>
<body>
  <p>Returning to the MoneyGames app…</p>
  <p><a href="${dest.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">Open MoneyGames</a></p>
  <script>location.replace(${JSON.stringify(dest)});</script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function appRedirect(target: string, params: Record<string, string>): Response {
  return appReturnPage(target, params);
}

function configured(env: AuthEnv): env is AuthEnv & { GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string } {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

function readOauthCookie(request: Request): OauthCookie | null {
  const raw = getCookie(request, OAUTH_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as OauthCookie;
  } catch {
    return null;
  }
}

function failAuth(url: URL, request: Request, code: string): Response {
  const oauth = readOauthCookie(request);
  if (oauth?.appRedirect) return appRedirect(oauth.appRedirect, { error: code });
  return registerError(url, code);
}

function bearerToken(request: Request): string | null {
  const raw = request.headers.get("Authorization");
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(\S+)/i);
  return match?.[1] ?? null;
}

async function userFromToken(env: AuthEnv, token: string): Promise<AuthUser | null> {
  const hash = await sha256Hex(token);
  return env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.picture_url AS pictureUrl,
            date(u.created_at) AS joinedAt
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
  )
    .bind(hash)
    .first<AuthUser>();
}

async function requestToken(request: Request): Promise<string | null> {
  return bearerToken(request) || getCookie(request, SESSION_COOKIE);
}

async function readSessionUser(env: AuthEnv, request: Request): Promise<AuthUser | null> {
  const token = await requestToken(request);
  if (!token) return null;
  return userFromToken(env, token);
}

export async function sessionUser(env: AuthEnv, request: Request) {
  return readSessionUser(env, request);
}

async function ensureAuthCodes(env: AuthEnv): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS auth_codes (
      code_hash     TEXT PRIMARY KEY,
      session_token TEXT NOT NULL,
      expires_at    TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ).run();
}

async function issueAppCode(env: AuthEnv, sessionToken: string): Promise<string> {
  await ensureAuthCodes(env);
  await env.DB.prepare(`DELETE FROM auth_codes WHERE expires_at <= datetime('now')`).run();
  const code = randomToken(32);
  await env.DB.prepare(
    `INSERT INTO auth_codes (code_hash, session_token, expires_at)
     VALUES (?, ?, datetime('now', '+${APP_CODE_MINUTES} minutes'))`
  )
    .bind(await sha256Hex(code), sessionToken)
    .run();
  return code;
}

async function handleMe(env: AuthEnv, request: Request): Promise<Response> {
  const user = await readSessionUser(env, request);
  return json({ user: user ?? null });
}

async function handleLogout(env: AuthEnv, request: Request, url: URL): Promise<Response> {
  const headers = new Headers({ "cache-control": "no-store" });
  const token = await requestToken(request);
  if (token) {
    await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`)
      .bind(await sha256Hex(token))
      .run();
  }
  clearCookie(headers, SESSION_COOKIE, url);
  return json({ ok: true }, { headers });
}

async function handleExchange(env: AuthEnv, request: Request): Promise<Response> {
  await ensureAuthCodes(env);
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code || code.length > 200) return json({ error: "Invalid code" }, { status: 400 });

  const hash = await sha256Hex(code);
  const row = await env.DB.prepare(
    `SELECT session_token AS sessionToken
     FROM auth_codes
     WHERE code_hash = ? AND expires_at > datetime('now')`
  )
    .bind(hash)
    .first<{ sessionToken: string }>();
  if (!row) return json({ error: "That sign-in link expired. Try again." }, { status: 400 });

  await env.DB.prepare(`DELETE FROM auth_codes WHERE code_hash = ?`).bind(hash).run();
  const user = await userFromToken(env, row.sessionToken);
  if (!user) return json({ error: "Invalid session" }, { status: 400 });
  return json({ token: row.sessionToken, user });
}

async function handleGoogleStart(env: AuthEnv, url: URL): Promise<Response> {
  if (!configured(env)) return json({ error: "Google sign-in is not configured" }, { status: 503 });

  const state = randomToken(16);
  const verifier = randomToken(32);
  const next = safeNext(url.searchParams.get("next"));
  const appRedirectUri =
    url.searchParams.get("client") === "app" || url.searchParams.has("redirect_uri")
      ? safeAppRedirect(url.searchParams.get("redirect_uri")) ?? "moneygames:///auth"
      : undefined;
  const challenge = await pkceChallenge(verifier);
  const payload = encodeURIComponent(
    JSON.stringify({ state, verifier, next, appRedirect: appRedirectUri } satisfies OauthCookie)
  );

  const google = new URL(GOOGLE_AUTH);
  google.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  google.searchParams.set("redirect_uri", callbackUrl(url));
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("state", state);
  google.searchParams.set("code_challenge", challenge);
  google.searchParams.set("code_challenge_method", "S256");
  google.searchParams.set("prompt", "select_account");

  const headers = new Headers({ Location: google.toString(), "cache-control": "no-store" });
  setCookie(headers, OAUTH_COOKIE, payload, url, 600);
  return new Response(null, { status: 302, headers });
}

async function createSession(env: AuthEnv, info: GoogleUserinfo): Promise<string | null> {
  if (!info.sub || !info.email || info.email_verified !== true) return null;

  const name = (info.name || info.email.split("@")[0] || "Player").slice(0, 120);
  const email = info.email.slice(0, 254);
  const picture = info.picture ? info.picture.slice(0, 500) : null;

  await env.DB.prepare(`DELETE FROM sessions WHERE expires_at <= datetime('now')`).run();
  await env.DB.prepare(
    `INSERT INTO users (google_sub, email, name, picture_url, last_login_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(google_sub) DO UPDATE SET
       email = excluded.email,
       name = excluded.name,
       picture_url = excluded.picture_url,
       last_login_at = datetime('now')`
  )
    .bind(info.sub, email, name, picture)
    .run();

  const user = await env.DB.prepare(`SELECT id FROM users WHERE google_sub = ?`)
    .bind(info.sub)
    .first<{ id: number }>();
  if (!user) return null;

  const sessionToken = randomToken(32);
  await env.DB.prepare(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`
  )
    .bind(user.id, await sha256Hex(sessionToken))
    .run();
  return sessionToken;
}

async function handleGoogleCallback(env: AuthEnv, request: Request, url: URL): Promise<Response> {
  if (!configured(env)) return failAuth(url, request, "config");

  const denied = url.searchParams.get("error");
  if (denied) return failAuth(url, request, denied === "access_denied" ? "denied" : "google");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauth = readOauthCookie(request);
  if (!code || !state || !oauth) return failAuth(url, request, "invalid");
  if (oauth.state !== state || !oauth.verifier) return failAuth(url, request, "invalid");

  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: callbackUrl(url),
    grant_type: "authorization_code",
    code_verifier: oauth.verifier,
  });

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as { access_token?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error("google token failed", tokenRes.status);
    return failAuth(url, request, "google");
  }

  const infoRes = await fetch(GOOGLE_USERINFO, {
    headers: { authorization: `Bearer ${tokenJson.access_token}` },
  });
  const info = (await infoRes.json().catch(() => ({}))) as GoogleUserinfo;
  if (!infoRes.ok) return failAuth(url, request, "google");

  const sessionToken = await createSession(env, info);
  if (!sessionToken) return failAuth(url, request, "google");

  if (oauth.appRedirect) {
    const appCode = await issueAppCode(env, sessionToken);
    const page = appReturnPage(oauth.appRedirect, { code: appCode });
    const headers = new Headers(page.headers);
    setCookie(headers, SESSION_COOKIE, sessionToken, url, SESSION_DAYS * 24 * 60 * 60);
    clearCookie(headers, OAUTH_COOKIE, url);
    return new Response(page.body, { status: 200, headers });
  }

  const next = safeNext(oauth.next);
  const headers = new Headers({ Location: `${url.origin}${next}`, "cache-control": "no-store" });
  setCookie(headers, SESSION_COOKIE, sessionToken, url, SESSION_DAYS * 24 * 60 * 60);
  clearCookie(headers, OAUTH_COOKIE, url);
  return new Response(null, { status: 302, headers });
}

export async function handleAuth(env: AuthEnv, request: Request, url: URL): Promise<Response> {
  const path = url.pathname;
  if (path === "/api/auth/me" && request.method === "GET") return handleMe(env, request);
  if (path === "/api/auth/logout" && request.method === "POST") return handleLogout(env, request, url);
  if (path === "/api/auth/exchange" && request.method === "POST") return handleExchange(env, request);
  if (path === "/api/auth/app-return" && request.method === "GET") {
    const target = safeAppRedirect(url.searchParams.get("to"));
    if (!target) return json({ error: "Invalid redirect" }, { status: 400 });
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const params: Record<string, string> = {};
    if (code) params.code = code;
    if (error) params.error = error;
    return appReturnPage(target, params);
  }
  if (path === "/api/auth/google" && request.method === "GET") return handleGoogleStart(env, url);
  if (path === "/api/auth/google/callback" && request.method === "GET") {
    return handleGoogleCallback(env, request, url);
  }
  if (request.method !== "GET" && request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  return json({ error: "Not found" }, { status: 404 });
}
