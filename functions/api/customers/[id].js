import { json, isAuthed, requireAuthJson } from "../../_utils.js";

export async function onRequestPut(context) {
  const authed = await isAuthed(context);
  const unauthedResp = requireAuthJson(authed);
  if (unauthedResp) return unauthedResp;

  const { request, env, params } = context;
  const id = params.id;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const mobile = (body.mobile || "").trim();
  const birthday = (body.birthday || "").trim();
  const notes = (body.notes || "").trim();

  if (!name || !mobile || !birthday) {
    return json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  await env.DB.prepare(
    "UPDATE customers SET name=?, mobile=?, birthday=?, notes=? WHERE id=?"
  )
    .bind(name, mobile, birthday, notes, id)
    .run();

  const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?")
    .bind(id)
    .first();

  return json({ ok: true, customer });
}

export async function onRequestDelete(context) {
  const authed = await isAuthed(context);
  const unauthedResp = requireAuthJson(authed);
  if (unauthedResp) return unauthedResp;

  const { env, params } = context;
  const id = params.id;
  await env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
