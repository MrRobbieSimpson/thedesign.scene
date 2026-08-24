import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { FeedGrid } from "@/components/content/feed-grid";
import { Avatar } from "@/components/ui/avatar";
import {
  getMakerByHandle,
  getPublishedContentByMaker,
} from "@/lib/queries";
import { buildPageMetadata, NO_INDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

type MakerPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: MakerPageProps) {
  const { handle } = await params;
  const maker = await getMakerByHandle(handle);
  if (!maker) return { title: "Maker not found", ...NO_INDEX };
  return buildPageMetadata({
    title: maker.name,
    description:
      maker.bio ??
      `${maker.name} on sit with design — curated design work and writing.`,
    path: `/maker/${maker.handle}`,
    image: maker.avatar,
    type: "profile",
  });
}

export default async function MakerPage({ params }: MakerPageProps) {
  const { handle } = await params;
  const maker = await getMakerByHandle(handle);
  if (!maker) notFound();

  const items = await getPublishedContentByMaker(maker.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <section className="mb-12 flex flex-col gap-6 border-b border-border/60 pb-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-5">
          <Avatar
            src={maker.avatar}
            alt={maker.name}
            size={88}
            priority
            className="ring-1 ring-border"
          />
          <div className="space-y-3">
            <div>
              <h1 className="font-heading text-4xl tracking-tight">
                {maker.name}
              </h1>
              <p className="mt-1 text-muted-foreground">@{maker.handle}</p>
            </div>
            {maker.bio ? (
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                {maker.bio}
              </p>
            ) : null}
          </div>
        </div>

        {maker.website ? (
          <Link
            href={maker.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Website
            <ArrowUpRight className="size-3.5" />
          </Link>
        ) : null}
      </section>

      <div className="mb-6 flex items-end justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Work</h2>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <FeedGrid items={items} />
    </div>
  );
}
