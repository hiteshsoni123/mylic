// Shared helpers used by all Pages Functions (API routes)

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookieHeader(sessionId, maxAgeSeconds) {
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSeconds}`;
}

export function clearCookieHeader() {
  return `session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

// Returns true if the request carries a valid, non-expired session cookie.
export async function isAuthed(context) {
  const { request, env } = context;
  const sid = getCookie(request, "session");
  if (!sid) return false;
  const row = await env.DB.prepare(
    "SELECT id FROM sessions WHERE id = ? AND expires_at > datetime('now')"
  )
    .bind(sid)
    .first();
  return !!row;
}

export function requireAuthJson(authed) {
  if (!authed) {
    return json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}
