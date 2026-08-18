import { ContentForm } from "@/components/admin/content-form";
import { ContentList } from "@/components/admin/content-list";
import { EventList } from "@/components/admin/event-list";
import { ImportEventForm } from "@/components/admin/import-event-form";
import { ImportRssPanel } from "@/components/admin/import-rss-panel";
import { ImportUrlForm } from "@/components/admin/import-url-form";
import { isDatabaseConfigured } from "@/db";
import { getAllContent, getAllEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  description: "Manage thedesign.scene content.",
};

export default async function AdminPage() {
  const [items, eventItems] = await Promise.all([
    getAllContent(),
    getAllEvents(),
  ]);
  const dbReady = isDatabaseConfigured();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <section className="mb-10 space-y-3">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Admin
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Curate</h1>
        <p className="max-w-xl text-muted-foreground">
          Import design links and conferences, then publish with taste. Auth
          comes later — keep this private in production.
        </p>
      </section>

      {!dbReady ? (
        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-medium">Database not connected</p>
          <p className="mt-1 opacity-90">
            Demo feed is live with curated samples. Writes &amp; imports unlock
            when{" "}
            <code className="rounded bg-background/50 px-1.5 py-0.5 text-xs">
              DATABASE_URL
            </code>{" "}
            is set.
          </p>
        </div>
      ) : null}

      <div className="space-y-10">
        <ImportUrlForm disabled={!dbReady} />
        <ImportRssPanel disabled={!dbReady} />
        <ContentForm disabled={!dbReady} />

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-heading text-2xl tracking-tight">All content</h2>
            <p className="text-sm text-muted-foreground">{items.length} total</p>
          </div>
          <ContentList items={items} disabled={!dbReady} />
        </section>

        <div className="border-t border-border/60 pt-10">
          <h2 className="font-heading mb-6 text-3xl tracking-tight">Events</h2>
          <div className="space-y-10">
            <ImportEventForm disabled={!dbReady} />
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <h3 className="font-heading text-2xl tracking-tight">
                  All events
                </h3>
                <p className="text-sm text-muted-foreground">
                  {eventItems.length} total
                </p>
              </div>
              <EventList items={eventItems} disabled={!dbReady} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
