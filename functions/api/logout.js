import { json, getCookie, clearCookieHeader } from "../_utils.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const sid = getCookie(request, "session");
  if (sid) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  }
  return json({ ok: true }, { headers: { "Set-Cookie": clearCookieHeader() } });
}
