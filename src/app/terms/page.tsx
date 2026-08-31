import Link from "next/link";

import { SITE_CREATOR_X, SITE_NAME } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Terms",
  path: "/terms",
  description: `Terms of use for ${SITE_NAME}.`,
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Terms
      </p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight">Terms of use</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated 31 Aug 2026
      </p>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            The service
          </h2>
          <p>
            {SITE_NAME} is an editorial site for design writing, visuals, events,
            and curated openings. We may change or pause features as the product
            evolves.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Your account
          </h2>
          <p>
            You’re responsible for activity under your account. Keep credentials
            safe. Don’t impersonate others or use the service to spam, harass, or
            break the law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Your content
          </h2>
          <p>
            You keep ownership of writing and images you publish. By publishing,
            you grant us a licence to host, display, and distribute that content
            on {SITE_NAME} (including the feed, portfolio pages, and digest). You
            confirm you have the rights to share it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Our content &amp; jobs
          </h2>
          <p>
            Curated articles, editor’s notes, and job listings are provided for
            information. Openings link out to third parties — we don’t control
            their hiring processes. Event details can change; always check the
            source.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Disclaimer
          </h2>
          <p>
            The site is provided “as is.” We’re not liable for indirect or
            consequential losses arising from use of {SITE_NAME}.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-tight text-foreground">
            Contact
          </h2>
          <p>
            Questions:{" "}
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
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy
        </Link>
        {" · "}
        <Link href="/" className="underline underline-offset-4">
          Feed
        </Link>
      </p>
    </div>
  );
}
