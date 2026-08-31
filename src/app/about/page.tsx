import Link from "next/link";

import { SITE_CREATOR_X, SITE_NAME } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "About",
  path: "/about",
  description:
    "sit with design is a calm curation of writing, visuals, and design events — quality over quantity.",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
        About
      </p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight text-balance sm:text-5xl">
        Design worth sitting with.
      </h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
        <p>
          <span className="text-foreground">{SITE_NAME}</span> is a small,
          considered selection of writing, visuals, and events — not a firehose.
          We favour craft, clarity, and pieces you’d recommend to a friend.
        </p>
        <p>
          Designers can join, save what resonates, publish their own writing, and
          invite others. Openings stay high-bar: UI and product design roles only.
        </p>
        <p>
          Created by{" "}
          <a
            href={`https://x.com/${SITE_CREATOR_X}`}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            @{SITE_CREATOR_X}
          </a>
          .
        </p>
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          Back to the feed
        </Link>
        {" · "}
        <Link href="/subscribe" className="underline underline-offset-4">
          Join the digest
        </Link>
      </p>
    </div>
  );
}
