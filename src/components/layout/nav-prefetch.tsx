"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES = ["/", "/events", "/jobs", "/subscribe"] as const;

/**
 * Warm primary destinations so Feed ↔ Events ↔ Jobs feel instant.
 */
export function NavPrefetch() {
  const router = useRouter();

  useEffect(() => {
    for (const href of ROUTES) {
      router.prefetch(href);
    }
  }, [router]);

  return null;
}
