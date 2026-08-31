/**
 * Build the best available avatar URL.
 *
 * Clerk’s X OAuth thumbs are often locked at 48×48 (`_normal` on pbs.twimg.com).
 * We unwrap Clerk proxies and upgrade Twitter CDN size suffixes to `_400x400`.
 */

function decodeClerkProxy(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().includes("img.clerk")) return null;
    const token = parsed.pathname.split("/").filter(Boolean).pop();
    if (!token) return null;
    const padded =
      token.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((token.length + 3) % 4);
    const json = JSON.parse(atob(padded)) as { src?: string; type?: string };
    // Clerk “default” initials placeholders aren’t real photos.
    if (json.type === "default" || !json.src) return null;
    return json.src;
  } catch {
    return null;
  }
}

/** True when Clerk is serving a default initials glyph, not a user photo. */
export function isClerkDefaultAvatar(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().includes("img.clerk")) return false;
    const token = parsed.pathname.split("/").filter(Boolean).pop();
    if (!token) return true;
    const padded =
      token.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((token.length + 3) % 4);
    const json = JSON.parse(atob(padded)) as { type?: string; src?: string };
    return json.type === "default" || !json.src;
  } catch {
    return false;
  }
}

/** Prefer 400×400 (or original) over Twitter’s tiny `_normal` OAuth thumb. */
function upgradeTwitterCdn(url: string, displayPx: number): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().includes("pbs.twimg.com")) return url;
    if (!parsed.pathname.includes("/profile_images/")) return url;

    const want = displayPx >= 80 ? "_400x400" : displayPx >= 40 ? "_200x200" : "_bigger";
    parsed.pathname = parsed.pathname.replace(
      /_(?:normal|bigger|mini|200x200|400x400)(?=\.[a-z]+$)/i,
      want
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Google profile pics often ship as s96 — bump up, never shrink an already-sharp source. */
function upgradeGoogleCdn(url: string, displayPx: number): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().includes("googleusercontent.com")) {
      return url;
    }
    const want = Math.min(Math.max(Math.round(displayPx * 3), 200), 512);
    const pathMatch = parsed.pathname.match(/\/s(\d+)-c\//);
    if (pathMatch) {
      const current = Number(pathMatch[1]);
      if (current >= want) return url;
      parsed.pathname = parsed.pathname.replace(/\/s\d+-c\//, `/s${want}-c/`);
      return parsed.toString();
    }
    const queryMatch = parsed.href.match(/=s(\d+)(-[a-z]+)?/i);
    if (queryMatch) {
      const current = Number(queryMatch[1]);
      if (current >= want) return url;
      return parsed.href.replace(
        /=s\d+(-[a-z]+)?/i,
        (_, flags: string | undefined) => `=s${want}${flags ?? ""}`
      );
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function avatarSrc(
  url: string | null | undefined,
  displayPx: number,
  options?: { xHandle?: string | null }
): string | null {
  let resolved = url?.trim() || null;

  if (resolved) {
    const unwrapped = decodeClerkProxy(resolved);
    if (unwrapped) resolved = unwrapped;
    resolved = upgradeTwitterCdn(resolved, displayPx);
    resolved = upgradeGoogleCdn(resolved, displayPx);
    return resolved;
  }

  // Last-resort public social avatar when we only know the X handle.
  // Prefer not to rely on this — Unavatar’s X provider is often paywalled.
  const handle = options?.xHandle?.replace(/^@/, "").trim();
  if (handle) {
    const size = Math.min(Math.max(Math.round(displayPx * 3), 128), 512);
    return `https://unavatar.io/x/${encodeURIComponent(handle)}?size=${size}`;
  }

  return null;
}

type ClerkishAccount = {
  provider?: string | null;
  username?: string | null;
  imageUrl?: string | null;
  avatarUrl?: string | null;
  picture?: string | null;
};

type ClerkishUser = {
  imageUrl?: string | null;
  username?: string | null;
  externalAccounts?: ClerkishAccount[] | null;
};

function providerKey(account: ClerkishAccount) {
  return String(account.provider ?? "").toLowerCase();
}

function isXAccount(account: ClerkishAccount) {
  const provider = providerKey(account);
  return (
    provider.includes("twitter") ||
    provider === "x" ||
    provider.includes("oauth_x")
  );
}

function isGoogleAccount(account: ClerkishAccount) {
  const provider = providerKey(account);
  return provider.includes("google");
}

function accountPhoto(account: ClerkishAccount): string | null {
  return account.avatarUrl || account.picture || account.imageUrl || null;
}

/**
 * Pick the sharpest photo Clerk exposes for this user.
 * Prefers Google (often ≥400px) then upgraded X CDN, then Clerk imageUrl.
 */
export function bestAvatarFromClerkUser(
  user: ClerkishUser | null | undefined,
  displayPx = 128
): string | null {
  if (!user) return null;

  const accounts = user.externalAccounts ?? [];
  const google = accounts.find(isGoogleAccount);
  const x = accounts.find(isXAccount);

  // Prefer X when linked (matches public handle), then Google (often sharper),
  // then Clerk’s primary imageUrl — skip Clerk default initials placeholders.
  const candidates = [
    x ? accountPhoto(x) : null,
    google ? accountPhoto(google) : null,
    isClerkDefaultAvatar(user.imageUrl) ? null : user.imageUrl ?? null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const resolved = avatarSrc(candidate, displayPx);
    if (resolved) return resolved;
  }

  return null;
}

export function xHandleFromClerkUser(
  user: ClerkishUser | null | undefined
): string | null {
  if (!user) return null;
  const fromX = user.externalAccounts?.find(isXAccount)?.username?.trim();
  if (fromX) return fromX.replace(/^@/, "");
  return user.username?.replace(/^@/, "").trim() || null;
}

/** True when the URL is already a high-res social CDN (don't overwrite with Clerk thumbs). */
export function isSharpAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("pbs.twimg.com")) return /_(?:200x200|400x400)\./i.test(url) || !/_(?:normal|bigger|mini)\./i.test(url);
    if (host.includes("googleusercontent.com")) {
      const match = url.match(/=s(\d+)/i) || url.match(/\/s(\d+)-c\//i);
      return match ? Number(match[1]) >= 200 : true;
    }
    return false;
  } catch {
    return false;
  }
}
