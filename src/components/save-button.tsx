"use client";

import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

import { isSaved, toggleSave } from "@/app/actions/library";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { cn } from "@/lib/utils";

function SaveButtonAuthed({ contentId }: { contentId: string }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!isSignedIn) return;
    let active = true;
    isSaved(contentId).then((value) => {
      if (active) setSaved(value);
    });
    return () => {
      active = false;
    };
  }, [contentId, isSignedIn]);

  function onClick() {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    startTransition(async () => {
      const result = await toggleSave(contentId);
      if (result.ok) setSaved(result.saved);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="gap-1.5"
    >
      <Bookmark
        className={cn("size-3.5", saved && "fill-foreground text-foreground")}
      />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

function SaveButtonGuest() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => router.push("/sign-in")}
      className="gap-1.5"
    >
      <Bookmark className="size-3.5" />
      Save
    </Button>
  );
}

export function SaveButton({ contentId }: { contentId: string }) {
  if (!isClerkPublishableConfigured()) {
    return <SaveButtonGuest />;
  }
  return <SaveButtonAuthed contentId={contentId} />;
}
