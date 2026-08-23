import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { getCurrentGuestEditor } from "@/lib/queries";

type Guest = NonNullable<Awaited<ReturnType<typeof getCurrentGuestEditor>>>;

export function GuestEditorStrip({ guest }: { guest: Guest }) {
  const profile = guest.profile;
  if (!profile?.handle) return null;

  const name = profile.displayName ?? `@${profile.handle}`;

  return (
    <section className="mb-12 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={name}
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {name.replace("@", "").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Guest Editor</Badge>
              <p className="text-sm text-muted-foreground">{guest.label}</p>
            </div>
            <p className="font-heading text-lg tracking-tight sm:text-xl">
              {name}
            </p>
            {guest.intro ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {guest.intro}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={`/u/${profile.handle}`}
          className="shrink-0 self-start text-sm font-medium underline-offset-4 hover:underline sm:self-center"
        >
          View portfolio
        </Link>
      </div>
    </section>
  );
}
