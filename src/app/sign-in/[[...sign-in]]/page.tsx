import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Sign in",
  path: "/sign-in",
  description: "Sign in to sit with design.",
  noIndex: true,
});

export default function SignInPage() {
  if (!isClerkPublishableConfigured()) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="font-heading text-2xl">Sign in isn’t configured yet</h1>
        <p className="text-sm text-muted-foreground">
          Add Clerk publishable and secret keys to enable authentication.
        </p>
        <Button
          variant="outline"
          render={<Link href="/" />}
          nativeButton={false}
        >
          Back to feed
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border border-border/70 bg-card",
          },
        }}
      />
    </div>
  );
}
