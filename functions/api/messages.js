import { json, isAuthed, requireAuthJson } from "../_utils.js";

export async function onRequestGet(context) {
  const authed = await isAuthed(context);
  const unauthedResp = requireAuthJson(authed);
  if (unauthedResp) return unauthedResp;

  const { env } = context;
  const { results } = await env.DB.prepare(
    `SELECT ml.id, ml.customer_id, ml.message, ml.sent_at, c.name, c.mobile
     FROM message_logs ml JOIN customers c ON c.id = ml.customer_id
     ORDER BY ml.sent_at DESC LIMIT 500`
  ).all();

  return json({ ok: true, messages: results });
}

export async function onRequestPost(context) {
  const authed = await isAuthed(context);
  const unauthedResp = requireAuthJson(authed);
  if (unauthedResp) return unauthedResp;

  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const customerId = body.customer_id;
  const message = (body.message || "").trim();
  if (!customerId || !message) {
    return json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO message_logs (customer_id, message) VALUES (?, ?)"
  )
    .bind(customerId, message)
    .run();

  return json({ ok: true });
}
