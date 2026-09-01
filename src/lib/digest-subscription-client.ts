/** Client-safe digest subscription helpers (no server imports). */

/** Client hint after a successful guest/signed-in subscribe. */
export const DIGEST_SUBSCRIBED_STORAGE_KEY = "tds-digest-subscribed";

export function markDigestSubscribedLocally() {
  try {
    window.localStorage.setItem(DIGEST_SUBSCRIBED_STORAGE_KEY, "1");
    window.dispatchEvent(new Event("tds:digest-subscribed"));
  } catch {
    /* ignore */
  }
}
