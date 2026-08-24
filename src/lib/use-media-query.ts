"use client";

import { useEffect, useState } from "react";

/** Client media-query hook. Defaults to `false` until mounted. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

/** Tailwind `sm` and up — mosaic is desktop-only. */
export function useIsSmUp() {
  return useMediaQuery("(min-width: 640px)");
}
