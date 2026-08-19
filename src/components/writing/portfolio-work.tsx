import Image from "next/image";
import Link from "next/link";

import type { ContentWithMaker } from "@/lib/demo-data";
import {
  contentTypeLabel,
  formatPublishedDate,
  formatSitWithTimeShort,
} from "@/lib/format";
import { cn } from "@/lib/utils";

function hrefFor(item: ContentWithMaker) {
  if (item.type === "article" && item.slug) return `/article/${item.slug}`;
  return `/content/${item.id}`;
}

/**
 * Quiet writing-first portfolio list — not a dense feed mosaic.
 */
export function PortfolioWork({ items }: { items: ContentWithMaker[] }) {
  return (
    <ul className="divide-y divide-border/50 border-y border-border/50">
      {items.map((item) => {
        const sit = formatSitWithTimeShort(item.readingTimeMinutes);
        return (
          <li key={item.id}>
            <Link
              href={hrefFor(item)}
              className="group flex gap-5 py-8 transition-opacity hover:opacity-90 sm:gap-6"
            >
              {item.image ? (
                <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted sm:block">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
                  {contentTypeLabel(item.type)}
                  {item.featured ? " · Editor’s pick" : ""}
                </p>
                <h3
                  className={cn(
                    "font-heading text-xl leading-snug tracking-tight text-balance sm:text-2xl",
                    "transition-colors group-hover:text-foreground"
                  )}
                >
                  {item.title}
                </h3>
                {item.excerpt ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {item.excerpt}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground/70">
                  {item.publishedAt
                    ? formatPublishedDate(item.publishedAt)
                    : null}
                  {sit ? (
                    <>
                      {item.publishedAt ? " · " : null}
                      {sit}
                    </>
                  ) : null}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
