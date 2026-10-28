import { buildSchema } from "../zod/buildSchema";
import { useBuildStore } from "../stores/BuildStore";
const KEY = "retroforge.authDraft";
// A modal sign-in keeps the live store. Only a full redirect reload needs the
// snapshot; restoring it in the same page could erase edits made after opening
// (and possibly cancelling) the sign-in modal.
let preservedOnThisPage = false;

export function preserveAuthDraft() {
  preservedOnThisPage = true;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ build: useBuildStore.getState().build, expires: Date.now() + 10 * 60_000 }));
  } catch { /* Sign-in remains available when browser storage is blocked. */ }
}
export function restoreAuthDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (preservedOnThisPage) { preservedOnThisPage = false; return; }
    if (!raw) return;
    const value = JSON.parse(raw);
    const result = buildSchema.safeParse(value.build);
    if (value.expires > Date.now() && result.success) useBuildStore.getState().setBuild(result.data);
  } catch { /* Invalid or expired drafts never replace the current build. */ }
}
export function discardAuthDraft() {
  preservedOnThisPage = false;
  try { sessionStorage.removeItem(KEY); } catch { /* Storage may be unavailable. */ }
}
