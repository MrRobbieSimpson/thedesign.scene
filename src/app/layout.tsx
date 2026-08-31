import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";

import { DeferredUi } from "@/components/deferred-ui";
import { EnsureProfile } from "@/components/ensure-profile";
import { Footer } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { SoftToastProvider } from "@/components/ui/soft-toast";
import { SiteStage } from "@/components/writing/site-stage";
import { WritingProvider } from "@/components/writing/writing-context";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { rootMetadata, websiteJsonLd } from "@/lib/seo";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shell = (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <WritingProvider>
        <SoftToastProvider>
          <EnsureProfile />
          <SiteStage>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <Footer />
          </SiteStage>
          <DeferredUi />
        </SoftToastProvider>
      </WritingProvider>
    </ThemeProvider>
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable}`}
    >
      <body className={`${geistSans.className} min-h-dvh antialiased`}>
        <JsonLd data={websiteJsonLd()} />
        {isClerkPublishableConfigured() ? (
          <ClerkProvider
            appearance={clerkAppearance}
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          >
            {shell}
          </ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
