import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { FeedGrid } from "@/components/content/feed-grid";
import { WriteButton } from "@/components/writing/write-button";
import { Badge } from "@/components/ui/badge";
import { getClerkUserId } from "@/lib/auth";
import {
  getActiveGuestTerm,
  getProfileByHandle,
  getPublishedContentByProfile,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type PortfolioPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: PortfolioPageProps) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) return { title: "Profile not found" };
  return {
    title: profile.displayName ?? `@${profile.handle}`,
    description: profile.bio ?? undefined,
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const [items, guestTerm, userId] = await Promise.all([
    getPublishedContentByProfile(profile.id),
    getActiveGuestTerm(profile.id),
    getClerkUserId(),
  ]);

  const isOwner = Boolean(userId && userId === profile.clerkUserId);
  const displayName = profile.displayName ?? profile.handle ?? "Designer";
  const initial = displayName.replace("@", "").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <section className="mb-12 flex flex-col gap-6 border-b border-border/60 pb-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-5">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={displayName}
              width={88}
              height={88}
              className="size-20 rounded-full object-cover ring-1 ring-border sm:size-22"
            />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-muted text-xl font-medium sm:size-22">
              {initial}
            </span>
          )}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-4xl tracking-tight">
                  {displayName}
                </h1>
                {guestTerm ? (
                  <Badge variant="secondary">Guest Editor</Badge>
                ) : null}
              </div>
              {profile.handle ? (
                <p className="text-muted-foreground">@{profile.handle}</p>
              ) : null}
            </div>
            {profile.bio ? (
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            ) : null}
            {profile.location ? (
              <p className="text-sm text-muted-foreground">{profile.location}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {profile.website ? (
            <Link
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Website
              <ArrowUpRight className="size-3.5" />
            </Link>
          ) : null}
          {profile.xHandle ? (
            <Link
              href={`https://x.com/${profile.xHandle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              @{profile.xHandle}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ) : null}
          {isOwner ? (
            <Link
              href="/settings/profile"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Edit profile
            </Link>
          ) : null}
        </div>
      </section>

      {guestTerm?.intro ? (
        <aside className="mb-10 rounded-2xl border border-border/70 bg-muted/25 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          <p className="mb-1 text-[11px] font-medium tracking-[0.14em] text-muted-foreground/80 uppercase">
            {guestTerm.label}
          </p>
          {guestTerm.intro}
        </aside>
      ) : null}

      <div className="mb-6 flex items-end justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Work</h2>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-heading text-2xl tracking-tight">Nothing published yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {isOwner
              ? "Your published writing will live here."
              : "Check back soon."}
          </p>
          {isOwner ? (
            <div className="mt-6 flex justify-center">
              <WriteButton />
            </div>
          ) : null}
        </div>
      ) : (
        <FeedGrid items={items} />
      )}
    </div>
  );
}
