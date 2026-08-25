import Link from "next/link";

import { JobsExplorer } from "@/components/jobs/jobs-explorer";
import { getPublishedJobs } from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Jobs",
  path: "/jobs",
  description:
    "Curated UI and product design roles — openings you’d recommend to a friend, not a firehose.",
});

export default async function JobsPage() {
  const jobs = await getPublishedJobs();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <section className="mb-12 max-w-2xl space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Openings
        </p>
        <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
          Roles you’d recommend to a friend.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          A short list of UI and product design openings — selected with the
          same taste as the writing. Quality over quantity.
        </p>
        <p className="text-sm text-muted-foreground/80">
          {jobs.length === 0
            ? "Nothing open at the moment"
            : `${jobs.length} open ${jobs.length === 1 ? "role" : "roles"}`}
          {" · "}
          <Link href="/" className="underline underline-offset-4">
            Back to the feed
          </Link>
        </p>
      </section>

      <JobsExplorer jobs={jobs} />
    </div>
  );
}
