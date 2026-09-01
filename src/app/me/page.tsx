import { redirect } from "next/navigation";

import { getOrCreateProfile, requireClerkUserId } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Your portfolio",
  path: "/me",
  noIndex: true,
});

/**
 * Avatar menu entry → public portfolio.
 * If the profile has no handle yet, send them to settings first.
 */
export default async function MePage() {
  await requireClerkUserId();
  const profile = await getOrCreateProfile({ syncFromClerk: true });
  if (!profile?.handle) {
    redirect("/settings/profile");
  }
  redirect(`/u/${profile.handle}`);
}
