import Link from "next/link";

import { BrandMarkChip } from "@/components/brand/mark";
import { FooterJoinCta } from "@/components/layout/footer-join-cta";
import { isCurrentUserOnDigest } from "@/lib/digest-subscription";
import { getRegisteredDesignerCount } from "@/lib/queries";
import { SITE_CREATOR_X } from "@/lib/site";

export async function Footer() {
  const [designers, subscribedToDigest] = await Promise.all([
    getRegisteredDesignerCount(),
    isCurrentUserOnDigest(),
  ]);
  const year = 2026;

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-6">
        <FooterJoinCta subscribedToDigest={subscribedToDigest} />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <BrandMarkChip className="size-6 rounded-md p-[0.3rem] [&_svg]:size-[0.95rem]" />
              <p className="font-sans text-lg font-medium tracking-tight">
                sit with design
              </p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A considered selection of writing, visuals, and events — quality
              over quantity.
            </p>
            {designers > 30 ? (
              <p className="pt-1 text-sm text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground">
                  {designers.toLocaleString("en-GB")}
                </span>{" "}
                designers registered
              </p>
            ) : null}
            <p className="pt-1 text-sm text-muted-foreground/80">
              Created by{" "}
              <a
                href={`https://x.com/${SITE_CREATOR_X}`}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {SITE_CREATOR_X}
              </a>
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:justify-end"
            aria-label="Footer"
          >
            <Link
              href="/about"
              className="transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/subscribe"
              className="transition-colors hover:text-foreground"
            >
              Digest
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <span className="text-border">·</span>
            <span>© {year}</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
