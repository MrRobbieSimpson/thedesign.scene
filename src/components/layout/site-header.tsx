import { Suspense } from "react";
import { eq } from "drizzle-orm";

import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { db, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";
import { getClerkUserId } from "@/lib/auth";
import { getPublishedJobCount } from "@/lib/queries";

async function loadHeaderProfile() {
  let timeZone: string | null = null;
  let avatarUrl: string | null = null;
  let xHandle: string | null = null;
  let openJobCount = 0;

  const [userId, jobCount] = await Promise.all([
    getClerkUserId(),
    getPublishedJobCount(),
  ]);
  openJobCount = jobCount;

  if (userId && isDatabaseConfigured() && db) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkUserId, userId),
      columns: { timezone: true, avatarUrl: true, xHandle: true },
    });
    timeZone = profile?.timezone ?? null;
    avatarUrl = profile?.avatarUrl ?? null;
    xHandle = profile?.xHandle ?? null;
  }

  return { timeZone, avatarUrl, xHandle, openJobCount };
}

/**
 * Server wrapper so the header clock can use the signed-in
 * profile timezone (from Location) when available.
 */
export async function SiteHeader() {
  const { timeZone, avatarUrl, xHandle, openJobCount } =
    await loadHeaderProfile();

  return (
    <Header
      timeZone={timeZone}
      openJobCount={openJobCount}
      profileAvatarUrl={avatarUrl}
      profileXHandle={xHandle}
    />
  );
}

/**
 * Mobile bottom nav — keep outside SiteStage so position:fixed
 * attaches to the viewport (transforms on ancestors break fixed).
 */
export async function SiteMobileNav() {
  const openJobCount = await getPublishedJobCount();
  return (
    <Suspense fallback={null}>
      <MobileBottomNav openJobCount={openJobCount} />
    </Suspense>
  );
}
