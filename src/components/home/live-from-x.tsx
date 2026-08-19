import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ContentWithMaker } from "@/lib/demo-data";
import { formatPublishedDate } from "@/lib/format";

function hrefFor(item: ContentWithMaker) {
  if (item.url) return item.url;
  return `/content/${item.id}`;
}

export function LiveFromX({ items }: { items: ContentWithMaker[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-20 border-t border-border/60 pt-12 sm:mt-24 sm:pt-14">
      <div className="mb-6 space-y-2">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground/80 uppercase">
          Notes from X
        </p>
        <h2 className="font-heading text-xl tracking-tight text-foreground/90">
          A few notes from X
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Separate from the editor’s selection — craft chatter kept quiet on
          purpose.
        </p>
      </div>

      <ul className="grid gap-3">
        {items.map((item) => {
          const handle = item.authorHandle?.replace(/^@/, "");
          return (
            <li key={item.id}>
              <Link
                href={hrefFor(item)}
                target={item.url ? "_blank" : undefined}
                rel={item.url ? "noreferrer" : undefined}
                className="group flex h-full flex-col justify-between rounded-2xl border border-border/40 bg-muted/10 px-4 py-4 transition-colors hover:border-border/70 hover:bg-muted/20"
              >
                <div className="space-y-2">
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">
                    {item.excerpt?.trim() || item.title}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="truncate">
                    {handle ? `@${handle}` : item.authorName ?? "X"}
                    {item.publishedAt ? (
                      <>
                        {" "}
                        · {formatPublishedDate(item.publishedAt)}
                      </>
                    ) : null}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 transition-colors group-hover:text-foreground">
                    Open
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
