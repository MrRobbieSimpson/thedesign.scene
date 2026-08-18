import { getOrCreateProfile } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/clerk";

/**
 * Ensures a local profile row exists for the signed-in Clerk user
 * so the “designers registered” count stays accurate.
 */
export async function EnsureProfile() {
  if (!isClerkConfigured()) return null;
  await getOrCreateProfile();
  return null;
}
