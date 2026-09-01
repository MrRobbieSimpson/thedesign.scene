import Link from "next/link";

import { BrandMarkChip } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { JOB_POST_AMOUNT_CENTS } from "@/lib/stripe";
import { cn } from "@/lib/utils";

const priceLabel = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(JOB_POST_AMOUNT_CENTS / 100);

const postBtnClass =
  "h-9 w-full border-0 bg-background px-4 text-sm font-medium text-foreground hover:bg-background/90 sm:w-auto";

/**
 * Jobs-page company nudge — same dark paper bar as the footer Join CTA.
 * Stacks cleanly on mobile; never overlaps the filter toolbar below.
 */
export function JobsPostCta() {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-foreground px-4 py-4 text-background sm:px-5",
        "shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <BrandMarkChip className="mt-0.5 size-8 shrink-0 rounded-lg bg-background p-[0.35rem] text-foreground [&_svg]:size-[1.05rem]" />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[0.95rem] font-medium tracking-tight text-background">
              Hiring?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-background/65">
              Post a UI or product design role — {priceLabel}, reviewed before
              it goes live.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          className={postBtnClass}
          render={<Link href="/jobs/post" />}
          nativeButton={false}
        >
          Post a role — {priceLabel}
        </Button>
      </div>
    </section>
  );
}
