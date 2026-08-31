import { eq } from "drizzle-orm";

import { Header } from "@/components/layout/header";
import { db, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";
import { getClerkUserId } from "@/lib/auth";
import { getPublishedJobs } from "@/lib/queries";

/**
 * Server wrapper so the header clock can use the signed-in
 * profile timezone (from Location) when available.
 */
export async function SiteHeader() {
  let timeZone: string | null = null;
  let avatarUrl: string | null = null;
  let xHandle: string | null = null;

  if (isDatabaseConfigured() && db) {
    const userId = await getClerkUserId();
    if (userId) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.clerkUserId, userId),
        columns: { timezone: true, avatarUrl: true, xHandle: true },
      });
      timeZone = profile?.timezone ?? null;
      avatarUrl = profile?.avatarUrl ?? null;
      xHandle = profile?.xHandle ?? null;
    }
  }

  const openJobs = await getPublishedJobs();

  return (
    <Header
      timeZone={timeZone}
      openJobCount={openJobs.length}
      profileAvatarUrl={avatarUrl}
      profileXHandle={xHandle}
    />
  );
}
