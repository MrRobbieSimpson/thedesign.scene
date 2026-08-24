import Link from "next/link";

import { createScene, getUserScenes } from "@/app/actions/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Scenes",
  path: "/scenes",
  description: "Your private scenes on sit with design.",
  noIndex: true,
});

export default async function ScenesPage() {
  const userScenes = await getUserScenes();

  async function createAction(formData: FormData) {
    "use server";
    const result = await createScene(formData);
    if (result.ok && result.id) {
      const { redirect } = await import("next/navigation");
      redirect(`/scenes/${result.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <section className="mb-10 space-y-3">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Library
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Scenes</h1>
        <p className="max-w-xl text-muted-foreground">
          Personal collections — group articles and visuals around a
          theme.
        </p>
      </section>

      <form
        action={createAction}
        className="mb-12 space-y-4 rounded-2xl border border-border/70 bg-card p-6"
      >
        <h2 className="font-heading text-xl tracking-tight">New scene</h2>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Quiet interfaces" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Optional note…"
          />
        </div>
        <Button type="submit">Create</Button>
      </form>

      {userScenes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scenes yet. Create one above.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">
          {userScenes.map((scene) => (
            <li key={scene.id}>
              <Link
                href={`/scenes/${scene.id}`}
                className="flex items-center justify-between gap-4 bg-card px-5 py-4 transition-colors hover:bg-muted/30"
              >
                <div>
                  <p className="font-medium">{scene.title}</p>
                  {scene.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {scene.description}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm text-muted-foreground">
                  {scene.items.length}{" "}
                  {scene.items.length === 1 ? "item" : "items"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
