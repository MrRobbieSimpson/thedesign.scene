import { redirect } from "next/navigation";

import { ContentForm } from "@/components/admin/content-form";
import { ContentList } from "@/components/admin/content-list";
import { EventList } from "@/components/admin/event-list";
import { GuestEditorForm } from "@/components/admin/guest-editor-form";
import { ImportEventForm } from "@/components/admin/import-event-form";
import { ImportRssPanel } from "@/components/admin/import-rss-panel";
import { ImportUrlForm } from "@/components/admin/import-url-form";
import { JobForm } from "@/components/admin/job-form";
import { JobList } from "@/components/admin/job-list";
import { isDatabaseConfigured } from "@/db";
import { isAdmin } from "@/lib/auth";
import {
  getAllContent,
  getAllEvents,
  getAllJobs,
  getMakers,
  getProfiles,
} from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Admin",
  path: "/admin",
  description: "Editorial back office for sit with design.",
  noIndex: true,
});

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/");
  }

  const [items, eventItems, jobItems, makers, profiles] = await Promise.all([
    getAllContent(),
    getAllEvents(),
    getAllJobs(),
    getMakers(),
    getProfiles(),
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
          Editorial back office — import links, publish with taste, feature
          picks with notes, manage events and openings, and set the monthly
          guest editor. Restricted to authorised curators.
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
        <ContentForm disabled={!dbReady} makers={makers} />
        <GuestEditorForm disabled={!dbReady} profiles={profiles} />

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

        <div className="border-t border-border/60 pt-10">
          <h2 className="font-heading mb-6 text-3xl tracking-tight">
            Openings
          </h2>
          <div className="space-y-10">
            <JobForm disabled={!dbReady} />
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <h3 className="font-heading text-2xl tracking-tight">
                  All openings
                </h3>
                <p className="text-sm text-muted-foreground">
                  {jobItems.length} total
                </p>
              </div>
              <JobList items={jobItems} disabled={!dbReady} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
