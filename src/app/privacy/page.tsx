import Link from "next/link";

import { SITE_CREATOR_X, SITE_NAME } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Privacy",
  path: "/privacy",
  description: `How ${SITE_NAME} handles accounts, location, saves, and the weekly digest.`,
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Privacy
      </p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight">Privacy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated 31 Aug 2026
      </p>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            What we collect
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Account details</span> when you
              sign up via Clerk (name, email, avatar, and linked social profiles
              you choose to connect).
            </li>
            <li>
              <span className="text-foreground">Optional location</span> on your
              profile — used only to favour nearby events in the digest and on
              the site.
            </li>
            <li>
              <span className="text-foreground">Saves and “sat with”</span> marks
              — private to your account.
            </li>
            <li>
              <span className="text-foreground">Digest email</span> if you
              subscribe (with or without an account).
            </li>
            <li>
              <span className="text-foreground">Writing you publish</span> —
              titles, body, and images you upload.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            How we use it
          </h2>
          <p>
            To run {SITE_NAME}: authentication, showing your portfolio, sending
            the weekly digest, curating openings and events, and improving the
            product. We don’t sell personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Processors
          </h2>
          <p>
            We use Clerk for auth, Neon for the database, Vercel for hosting and
            image storage, and Resend for email. Their processing is governed by
            their own privacy policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Cookies
          </h2>
          <p>
            Essential cookies keep you signed in (Clerk) and remember light
            preferences such as feed layout. We don’t run third-party ad trackers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Your choices
          </h2>
          <p>
            Update or clear location in{" "}
            <Link
              href="/settings/profile"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Profile
            </Link>
            . Unsubscribe links appear in digest emails. To delete an account or
            ask about your data, message{" "}
            <a
              href={`https://x.com/${SITE_CREATOR_X}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              @{SITE_CREATOR_X}
            </a>{" "}
            on X.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        <Link href="/terms" className="underline underline-offset-4">
          Terms
        </Link>
        {" · "}
        <Link href="/" className="underline underline-offset-4">
          Feed
        </Link>
      </p>
    </div>
  );
}
