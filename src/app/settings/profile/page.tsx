import Link from "next/link";
import { redirect } from "next/navigation";

import { updateMyProfile } from "@/app/actions/profile";
import { ProfileLinksFields } from "@/components/settings/profile-links-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOrCreateProfile } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Profile settings",
  path: "/settings/profile",
  description: "Edit how you appear on sit with design.",
  noIndex: true,
});

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const profile = await getOrCreateProfile({ syncFromClerk: true });
  if (!profile) {
    redirect("/sign-in");
  }
  const params = await searchParams;

  async function saveAction(formData: FormData) {
    "use server";
    const result = await updateMyProfile(formData);
    if (!result.ok) {
      redirect(
        `/settings/profile?error=${encodeURIComponent(result.message)}`
      );
    }
    redirect("/settings/profile?saved=1");
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12 sm:py-16">
      <section className="mb-10 space-y-3">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Profile</h1>
        <p className="max-w-md text-muted-foreground">
          How you appear on your portfolio and published work.
        </p>
      </section>

      {params.saved ? (
        <p className="mb-6 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Profile updated.
          {profile.handle ? (
            <>
              {" "}
              <Link
                href={`/u/${profile.handle}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                View portfolio
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {params.error ? (
        <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      <form
        action={saveAction}
        className="space-y-5 rounded-2xl border border-border/70 bg-card p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={profile.displayName ?? ""}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="handle">Handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              id="handle"
              name="handle"
              defaultValue={profile.handle ?? ""}
              placeholder="your-handle"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Letters, numbers, and hyphens. Used at /u/handle.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ""}
            placeholder="A short note about your practice…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={profile.website ?? ""}
            placeholder="https://"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="xHandle">X handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              id="xHandle"
              name="xHandle"
              defaultValue={profile.xHandle ?? ""}
              placeholder="username"
              className="flex-1"
            />
          </div>
        </div>

        <ProfileLinksFields initialLinks={profile.links} />

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={profile.location ?? ""}
            placeholder="Belfast"
          />
          <p className="text-xs text-muted-foreground">
            Used for nearby digest events and the header clock
            {profile.timezone ? (
              <>
                {" "}
                · currently{" "}
                <span className="text-foreground/80">{profile.timezone}</span>
              </>
            ) : null}
            .
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {profile.handle ? (
            <Link
              href={`/u/${profile.handle}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View portfolio
            </Link>
          ) : (
            <span />
          )}
          <Button type="submit">Save profile</Button>
        </div>
      </form>
    </div>
  );
}
