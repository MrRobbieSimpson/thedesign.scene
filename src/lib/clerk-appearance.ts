/**
 * Scene-quiet Clerk chrome — CSS variables + element classes.
 * No @clerk/ui theme package (it dragged mismatched React peers).
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
    socialButtonsBlockButton:
      "border border-border/60 bg-background hover:bg-muted/40",
    formButtonPrimary:
      "bg-foreground text-background hover:bg-foreground/90 shadow-none",
    footerActionLink: "text-foreground underline-offset-4 hover:underline",
  },
} as const;
