import { eq } from "drizzle-orm";

import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { db, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";
import { getClerkUserId } from "@/lib/auth";
import { getPublishedJobCount } from "@/lib/queries";

/**
 * Server wrapper so the header clock can use the signed-in
 * profile timezone (from Location) when available.
 * Profile + job count run in parallel; job badge uses COUNT only.
 */
export async function SiteHeader() {
  const userIdPromise = getClerkUserId();
  const jobCountPromise = getPublishedJobCount();

  let timeZone: string | null = null;
  let avatarUrl: string | null = null;
  let xHandle: string | null = null;

  const [userId, openJobCount] = await Promise.all([
    userIdPromise,
    jobCountPromise,
  ]);

  if (userId && isDatabaseConfigured() && db) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkUserId, userId),
      columns: { timezone: true, avatarUrl: true, xHandle: true },
    });
    timeZone = profile?.timezone ?? null;
    avatarUrl = profile?.avatarUrl ?? null;
    xHandle = profile?.xHandle ?? null;
  }

  return (
    <>
      <Header
        timeZone={timeZone}
        openJobCount={openJobCount}
        profileAvatarUrl={avatarUrl}
        profileXHandle={xHandle}
      />
      <MobileBottomNav openJobCount={openJobCount} />
    </>
  );
}
