"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";

import { hasSatWith, toggleSitWith } from "@/app/actions/reading";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { cn } from "@/lib/utils";

function SitWithAuthed({ contentId }: { contentId: string }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [sat, setSat] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!isSignedIn) return;
    let active = true;
    hasSatWith(contentId).then((value) => {
      if (active) setSat(value);
    });
    return () => {
      active = false;
    };
  }, [contentId, isSignedIn]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <SitWithGuest />;

  function onClick() {
    startTransition(async () => {
      const result = await toggleSitWith(contentId);
      if (result.ok) setSat(result.satWith);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={sat}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm transition-colors",
        sat
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {sat ? <Check className="size-3.5 shrink-0" strokeWidth={2.25} /> : null}
      I sat with this
    </button>
  );
}

function SitWithGuest() {
  return (
    <Link
      href="/sign-up"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Join to mark that you sat with this
    </Link>
  );
}

export function SitWithButton({ contentId }: { contentId: string }) {
  if (!isClerkPublishableConfigured()) {
    return <SitWithGuest />;
  }
  return <SitWithAuthed contentId={contentId} />;
}
