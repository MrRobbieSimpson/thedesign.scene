import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ContentWithMaker } from "@/lib/demo-data";
import { formatSitWithTimeShort } from "@/lib/format";

function articleHref(item: ContentWithMaker) {
  if (item.type === "article" && item.slug) return `/article/${item.slug}`;
  return `/content/${item.id}`;
}

function authorLabel(item: ContentWithMaker) {
  return (
    item.authorProfile?.displayName ??
    (item.authorProfile?.handle
      ? `@${item.authorProfile.handle}`
      : null) ??
    item.authorName ??
    (item.authorHandle ? `@${item.authorHandle}` : null) ??
    "A designer"
  );
}

/**
 * Calm home strip for writing published by designers in the community.
 */
export function DesignersStrip({ items }: { items: ContentWithMaker[] }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-5 sm:px-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            From designers
          </p>
          <h2 className="font-heading text-lg tracking-tight sm:text-xl">
            Writing from the community
          </h2>
        </div>
      </div>

      <ul className="divide-y divide-border/50">
        {items.map((item) => {
          const sit = formatSitWithTimeShort(item.readingTimeMinutes);
          return (
            <li key={item.id}>
              <Link
                href={articleHref(item)}
                className="group flex items-start justify-between gap-3 py-3 transition-opacity first:pt-0 last:pb-0 hover:opacity-90"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-heading text-base leading-snug tracking-tight text-balance">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {authorLabel(item)}
                    {sit ? ` · ${sit}` : null}
                  </p>
                </div>
                <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
