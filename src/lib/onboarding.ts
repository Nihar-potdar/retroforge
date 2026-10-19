export const ONBOARDING_KEY = "retroforge.onboarding.v1";
let dismissedInSession = false;
export function shouldShowWelcome(storage?: Pick<Storage, "getItem">): boolean {
  if (dismissedInSession) return false;
  try {
    return (
      (storage ?? window.localStorage).getItem(ONBOARDING_KEY) !== "dismissed"
    );
  } catch {
    return true;
  }
}
export function dismissWelcome(storage?: Pick<Storage, "setItem">) {
  dismissedInSession = true;
  try {
    (storage ?? window.localStorage).setItem(ONBOARDING_KEY, "dismissed");
  } catch {
    /* A session-only dismissal still avoids repeated interruptions. */
  }
}
