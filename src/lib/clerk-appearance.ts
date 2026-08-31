/**
 * Scene-quiet Clerk chrome — CSS variables + element classes.
 * No @clerk/ui theme package (it dragged mismatched React peers).
 *
 * Social SSO (Google / GitHub / X) is hidden for launch — email only.
 * Re-enable when Production OAuth credentials are wired in Clerk.
 */
export const clerkAppearance = {
  variables: {
    borderRadius: "0.875rem",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons:
      "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    colorPrimary: "var(--foreground)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorBackground: "var(--card)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorNeutral: "var(--muted-foreground)",
    colorDanger: "var(--destructive)",
  },
  elements: {
    rootBox: "font-sans",
    card: "border border-border/60 bg-card shadow-none",
    headerTitle: "font-heading tracking-tight",
    headerSubtitle: "text-muted-foreground",
    // Email-only launch: hide broken Google / GitHub / X buttons + “or” divider
    socialButtonsRoot: "hidden",
    socialButtons: "hidden",
    socialButtonsBlockButton: "hidden",
    dividerRow: "hidden",
    dividerLine: "hidden",
    dividerText: "hidden",
    formButtonPrimary:
      "bg-foreground text-background hover:bg-foreground/90 shadow-none",
    footerActionLink: "text-foreground underline-offset-4 hover:underline",
  },
} as const;
