import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addToScene,
  getSceneById,
  listPublishedContentIds,
  removeFromScene,
} from "@/app/actions/library";
import { FeedGrid } from "@/components/content/feed-grid";
import { Button } from "@/components/ui/button";
import type { ContentWithMaker } from "@/lib/demo-data";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Scene",
  path: "/scenes",
  noIndex: true,
});

type ScenePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SceneDetailPage({ params }: ScenePageProps) {
  const { id } = await params;
  const scene = await getSceneById(id);
  if (!scene) notFound();

  const items = scene.items
    .map((row) => row.content)
    .filter(Boolean) as ContentWithMaker[];

  const candidates = await listPublishedContentIds();
  const existingIds = new Set(scene.items.map((item) => item.contentId));
  const addable = candidates.filter((c) => !existingIds.has(c.id));

  async function addAction(formData: FormData) {
    "use server";
    const contentId = String(formData.get("contentId") ?? "");
    if (contentId) await addToScene(id, contentId);
  }

  return (
    <div className="mx-auto max-w-[45rem] px-5 py-14 sm:px-6 sm:py-20">
      <Link
        href="/scenes"
        className="mb-8 inline-flex text-sm text-muted-foreground hover:text-foreground"
      >
        ← All scenes
      </Link>

      <section className="mb-10 space-y-3">
        <h1 className="font-heading text-4xl tracking-tight">{scene.title}</h1>
        {scene.description ? (
          <p className="max-w-xl text-muted-foreground">{scene.description}</p>
        ) : null}
      </section>

      {addable.length > 0 ? (
        <form
          action={addAction}
          className="mb-10 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <label htmlFor="contentId" className="text-sm font-medium">
              Add from feed
            </label>
            <select
              id="contentId"
              name="contentId"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Choose a piece…
              </option>
              {addable.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Add</Button>
        </form>
      ) : null}

      <FeedGrid items={items} />

      {items.length > 0 ? (
        <ul className="mt-8 space-y-2">
          {scene.items.map((row) =>
            row.content ? (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
              >
                <span className="truncate">{row.content.title}</span>
                <form
                  action={async () => {
                    "use server";
                    await removeFromScene(id, row.contentId);
                  }}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ) : null
          )}
        </ul>
      ) : null}
    </div>
  );
}
