import { json, isAuthed } from "../_utils.js";

export async function onRequestGet(context) {
  const authed = await isAuthed(context);
  return json({ authenticated: authed });
}
