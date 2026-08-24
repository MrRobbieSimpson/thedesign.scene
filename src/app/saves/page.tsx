import { FeedGrid } from "@/components/content/feed-grid";
import { getSavedContent } from "@/app/actions/library";
import type { ContentWithMaker } from "@/lib/demo-data";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Saves",
  path: "/saves",
  description: "Pieces you’ve saved on sit with design.",
  noIndex: true,
});

export default async function SavesPage() {
  const items = (await getSavedContent()) as ContentWithMaker[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <section className="mb-10 space-y-3">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Library
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Saves</h1>
        <p className="max-w-xl text-muted-foreground">
          Pieces you’ve bookmarked for later — private to you.
        </p>
      </section>

      <FeedGrid items={items} />
    </div>
  );
}
