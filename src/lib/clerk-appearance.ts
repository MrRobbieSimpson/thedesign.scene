import { shadcn } from "@clerk/ui/themes";

/**
 * Scene-quiet Clerk chrome — matches paper/ink tokens and soft borders.
 */
export const clerkAppearance = {
  theme: shadcn,
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
    userButtonPopoverCard:
      "border border-border/60 bg-card shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]",
    userButtonPopoverMain: "bg-card",
    userButtonPopoverFooter: "hidden",
    userButtonPopoverActionButton:
      "text-sm text-foreground/90 hover:bg-muted/50",
    userButtonPopoverActionButtonText: "text-sm font-normal tracking-tight",
    userButtonPopoverActionButtonIconBox: "text-muted-foreground",
    userButtonPopoverCustomItemButton:
      "text-sm text-foreground/90 hover:bg-muted/50",
    userPreviewMainIdentifier: "text-sm font-medium tracking-tight",
    userPreviewSecondaryIdentifier: "text-xs text-muted-foreground",
  },
} as const;

export const userButtonAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    rootBox: "flex size-8 items-center justify-center font-sans",
    avatarBox: "size-8 rounded-full ring-1 ring-border/60",
    userButtonTrigger: "rounded-full focus:shadow-none focus:ring-0",
  },
} as const;
