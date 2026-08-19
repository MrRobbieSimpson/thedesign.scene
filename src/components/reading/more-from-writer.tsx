import Link from "next/link";

import type { ContentWithMaker } from "@/lib/demo-data";

export function MoreFromWriter({
  items,
  authorName,
}: {
  items: ContentWithMaker[];
  authorName?: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <aside className="mt-14 border-t border-border/60 pt-10">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        More from {authorName ? authorName : "this writer"}
      </p>
      <ul className="mt-5 space-y-4">
        {items.map((item) => {
          const href =
            item.type === "article" && item.slug
              ? `/article/${item.slug}`
              : `/content/${item.id}`;
          return (
            <li key={item.id}>
              <Link
                href={href}
                className="group block transition-opacity hover:opacity-80"
              >
                <p className="font-heading text-lg leading-snug tracking-tight text-foreground">
                  {item.title}
                </p>
                {item.excerpt ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {item.excerpt}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
