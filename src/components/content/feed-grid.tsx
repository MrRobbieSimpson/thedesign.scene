import { ContentCard } from "@/components/content/content-card";
import type { ContentWithMaker } from "@/lib/demo-data";

export function FeedGrid({ items }: { items: ContentWithMaker[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-6 py-20 text-center">
        <p className="font-heading text-2xl tracking-tight">Nothing here yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Published thoughts, visuals, builds, news, and posts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={
            (item.type === "thought" || item.type === "news") && item.featured
              ? "md:col-span-2"
              : undefined
          }
        >
          <ContentCard item={item} />
        </div>
      ))}
    </div>
  );
}
