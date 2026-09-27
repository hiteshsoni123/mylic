import { json, sessionCookieHeader } from "../_utils.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const password = (body && body.password) || "";
  const expected = env.APP_PASSWORD || "lic123"; // fallback for local/dev testing

  if (password !== expected) {
    return json({ ok: false, error: "wrong_password" }, { status: 401 });
  }

  const sessionId = crypto.randomUUID();
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  await env.DB.prepare(
    "INSERT INTO sessions (id, expires_at) VALUES (?, datetime('now', '+30 days'))"
  )
    .bind(sessionId)
    .run();

  return json(
    { ok: true },
    { headers: { "Set-Cookie": sessionCookieHeader(sessionId, maxAge) } }
  );
}
