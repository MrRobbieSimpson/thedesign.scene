import Link from "next/link";

import { deleteMyDraft, getMyDrafts } from "@/app/actions/write";
import { ContinueDraftButton } from "@/components/writing/continue-draft-button";
import { Button } from "@/components/ui/button";
import { formatPublishedDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Drafts",
};

export default async function DraftsPage() {
  const drafts = await getMyDrafts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <section className="mb-10 space-y-3">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Writing
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Your drafts</h1>
        <p className="max-w-xl text-muted-foreground">
          Private articles in progress. Use Write anytime to open a blank page.
        </p>
      </section>

      {drafts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-heading text-2xl tracking-tight">No drafts yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Hit Write in the nav to begin.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="flex flex-col gap-4 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">
                  {draft.title || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {draft.status}
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
          ))}
        </ul>
      )}
    </div>
  );
}
