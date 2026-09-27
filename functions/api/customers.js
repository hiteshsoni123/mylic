import { json, isAuthed, requireAuthJson } from "../_utils.js";

export async function onRequestGet(context) {
  const authed = await isAuthed(context);
  const unauthedResp = requireAuthJson(authed);
  if (unauthedResp) return unauthedResp;

  const { env, request } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  let stmt;
  if (q) {
    stmt = env.DB.prepare(
      `SELECT * FROM customers WHERE name LIKE ?1 OR mobile LIKE ?1 ORDER BY name ASC`
    ).bind(`%${q}%`);
  } else {
    stmt = env.DB.prepare(`SELECT * FROM customers ORDER BY name ASC`);
  }

  const { results } = await stmt.all();
  return json({ ok: true, customers: results });
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

  const name = (body.name || "").trim();
  const mobile = (body.mobile || "").trim();
  const birthday = (body.birthday || "").trim(); // YYYY-MM-DD
  const notes = (body.notes || "").trim();

  if (!name || !mobile || !birthday) {
    return json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    "INSERT INTO customers (name, mobile, birthday, notes) VALUES (?, ?, ?, ?)"
  )
    .bind(name, mobile, birthday, notes)
    .run();

  const id = result.meta.last_row_id;
  const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?")
    .bind(id)
    .first();

  return json({ ok: true, customer });
}
