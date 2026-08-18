/**
 * True when Clerk env keys are present at build/runtime.
 * Used to soft-disable auth so the public site can boot without crashing.
 */
export function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

/** Client-safe check — only the public key is available in the browser. */
export function isClerkPublishableConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}
