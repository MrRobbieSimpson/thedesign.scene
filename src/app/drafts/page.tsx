import Link from "next/link";

import { deleteMyDraft, getMyDrafts } from "@/app/actions/write";
import { ContinueDraftButton } from "@/components/writing/continue-draft-button";
import { WriteButton } from "@/components/writing/write-button";
import { Button } from "@/components/ui/button";
import { formatPublishedDate } from "@/lib/format";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Drafts",
  path: "/drafts",
  description: "Your unpublished writing on sit with design.",
  noIndex: true,
});

function ArticleRow({
  draft,
}: {
  draft: Awaited<ReturnType<typeof getMyDrafts>>[number];
}) {
  return (
    <li className="flex flex-col gap-4 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium">{draft.title || "Untitled"}</p>
        <p className="text-xs text-muted-foreground">
          {draft.status === "published" ? "Published" : "Draft"}
          {draft.updatedAt
            ? ` · updated ${formatPublishedDate(draft.updatedAt)}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {draft.status === "published" && draft.slug ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/article/${draft.slug}`} />}
          >
            View
          </Button>
        ) : null}
        <ContinueDraftButton
          id={draft.id}
          title={draft.title}
          body={draft.body ?? ""}
          excerpt={draft.excerpt}
          image={draft.image}
        />
        <form
          action={async () => {
            "use server";
            await deleteMyDraft(draft.id);
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            Delete
          </Button>
        </form>
      </div>
    </li>
  );
}

export default async function DraftsPage() {
  const articles = await getMyDrafts();
  const drafts = articles.filter((item) => item.status === "draft");
  const published = articles.filter((item) => item.status === "published");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <section className="mb-10 space-y-3">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Writing
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Your writing</h1>
        <p className="max-w-xl text-muted-foreground">
          Drafts stay private. Published pieces appear on your portfolio.
        </p>
      </section>

      <section className="mb-12 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">Drafts</h2>
          <p className="text-sm text-muted-foreground">
            {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
          </p>
        </div>

        {drafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center">
            <p className="font-heading text-2xl tracking-tight">No drafts yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Open a blank page and start something — you can publish when it’s
              ready.
            </p>
            <div className="mt-6 flex justify-center">
              <WriteButton />
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">
            {drafts.map((draft) => (
              <ArticleRow key={draft.id} draft={draft} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">Published</h2>
          <p className="text-sm text-muted-foreground">
            {published.length}{" "}
            {published.length === 1 ? "article" : "articles"}
          </p>
        </div>

        {published.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-muted/15 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing published yet. Finish a draft and hit Publish.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">
            {published.map((draft) => (
              <ArticleRow key={draft.id} draft={draft} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
