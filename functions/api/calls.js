import { json, isAuthed, requireAuthJson } from "../_utils.js";

export async function onRequestGet(context) {
  const authed = await isAuthed(context);
  const unauthedResp = requireAuthJson(authed);
  if (unauthedResp) return unauthedResp;

  const { env, request } = context;
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");

  let stmt;
  if (customerId) {
    stmt = env.DB.prepare(
      `SELECT cl.id, cl.customer_id, cl.called_at, c.name, c.mobile
       FROM call_logs cl JOIN customers c ON c.id = cl.customer_id
       WHERE cl.customer_id = ?
       ORDER BY cl.called_at DESC`
    ).bind(customerId);
  } else {
    stmt = env.DB.prepare(
      `SELECT cl.id, cl.customer_id, cl.called_at, c.name, c.mobile
       FROM call_logs cl JOIN customers c ON c.id = cl.customer_id
       ORDER BY cl.called_at DESC LIMIT 500`
    );
  }

  const { results } = await stmt.all();
  return json({ ok: true, calls: results });
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
  if (!customerId) {
    return json({ ok: false, error: "missing_customer_id" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    "INSERT INTO call_logs (customer_id) VALUES (?)"
  )
    .bind(customerId)
    .run();

  const id = result.meta.last_row_id;
  const log = await env.DB.prepare(
    `SELECT cl.id, cl.customer_id, cl.called_at, c.name, c.mobile
     FROM call_logs cl JOIN customers c ON c.id = cl.customer_id WHERE cl.id = ?`
  )
    .bind(id)
    .first();

  return json({ ok: true, call: log });
}
