import { redirect } from "next/navigation";

import { getOrCreateProfile, requireClerkUserId } from "@/lib/auth";

/**
 * Avatar menu entry → public portfolio.
 * If the profile has no handle yet, send them to settings first.
 */
export default async function MePage() {
  await requireClerkUserId();
  const profile = await getOrCreateProfile();
  if (!profile?.handle) {
    redirect("/settings/profile");
  }
  redirect(`/u/${profile.handle}`);
}
