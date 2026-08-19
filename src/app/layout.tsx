import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import { DeferredUi } from "@/components/deferred-ui";
import { EnsureProfile } from "@/components/ensure-profile";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteStage } from "@/components/writing/site-stage";
import { WritingProvider } from "@/components/writing/writing-context";
import { isClerkPublishableConfigured } from "@/lib/clerk";

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

export const metadata: Metadata = {
  title: {
    default: "thedesign.scene — curated design",
    template: "%s · thedesign.scene",
  },
  description:
    "A calm curation of writing, visuals, and design events — quality over quantity.",
};

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
        <EnsureProfile />
        <SiteStage>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SiteStage>
        <DeferredUi />
      </WritingProvider>
    </ThemeProvider>
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className={`${geistSans.className} min-h-dvh antialiased`}>
        {isClerkPublishableConfigured() ? (
          <ClerkProvider>{shell}</ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
