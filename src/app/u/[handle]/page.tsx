import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { PortfolioWork } from "@/components/writing/portfolio-work";
import { WriteButton } from "@/components/writing/write-button";
import { Avatar } from "@/components/ui/avatar";
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

  return (
    <div className="mx-auto max-w-[45rem] px-5 py-14 sm:px-6 sm:py-20">
      <section className="mb-14 space-y-8 border-b border-border/50 pb-14">
        <div className="flex items-start gap-5">
          <Avatar
            src={profile.avatarUrl}
            alt={displayName}
            size={96}
            xHandle={profile.xHandle}
            priority
            className="ring-1 ring-border"
          />
          <div className="min-w-0 space-y-3 pt-1">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
                  {displayName}
                </h1>
                {guestTerm ? (
                  <Badge variant="secondary">Guest Editor</Badge>
                ) : null}
              </div>
              {profile.handle ? (
                <p className="text-sm text-muted-foreground">
                  @{profile.handle}
                </p>
              ) : null}
            </div>
            {profile.bio ? (
              <p className="max-w-prose text-[0.95rem] leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            ) : null}
            {profile.location ? (
              <p className="text-sm text-muted-foreground/80">
                {profile.location}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {profile.website ? (
            <Link
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
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
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              @{profile.xHandle}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ) : null}
          {(profile.links ?? []).map((link) => (
            <Link
              key={`${link.label}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              {link.label}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ))}
          {isOwner ? (
            <Link
              href="/settings/profile"
              className="transition-colors hover:text-foreground"
            >
              Edit profile
            </Link>
          ) : null}
        </div>
      </section>

      {guestTerm?.intro ? (
        <aside className="mb-12 rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          <p className="mb-1 text-[11px] font-medium tracking-[0.14em] text-muted-foreground/80 uppercase">
            {guestTerm.label}
          </p>
          {guestTerm.intro}
        </aside>
      ) : null}

      <div className="mb-8 flex items-end justify-between gap-3">
        <h2 className="font-heading text-xl tracking-tight">Work</h2>
        <p className="text-xs text-muted-foreground/70">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-6 py-20 text-center">
          <p className="font-heading text-2xl tracking-tight">
            {isOwner ? "Your first piece belongs here" : "Nothing published yet"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {isOwner
              ? "Write something worth sitting with — it’ll show up on this portfolio."
              : "Check back soon."}
          </p>
          {isOwner ? (
            <div className="mt-6 flex justify-center">
              <WriteButton />
            </div>
          ) : null}
        </div>
      ) : (
        <PortfolioWork items={items} />
      )}
    </div>
  );
}
