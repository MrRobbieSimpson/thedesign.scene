"use client";

import {
  useEffect,
  useState,
  useTransition,
  type MouseEvent,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

import { isSaved, toggleSave } from "@/app/actions/library";
import { Button } from "@/components/ui/button";
import { useSoftToast } from "@/components/ui/soft-toast";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { cn } from "@/lib/utils";

type SaveButtonProps = {
  contentId: string;
  /** Full button (article) or quiet icon for feed cards. */
  variant?: "button" | "icon";
  className?: string;
};

function SaveControl({
  contentId,
  variant = "button",
  className,
  signedIn,
}: SaveButtonProps & { signedIn: boolean }) {
  const router = useRouter();
  const softToast = useSoftToast();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    isSaved(contentId).then((value) => {
      if (active) setSaved(value);
    });
    return () => {
      active = false;
    };
  }, [contentId, signedIn]);

  function onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!signedIn) {
      router.push("/sign-in");
      return;
    }
    startTransition(async () => {
      const result = await toggleSave(contentId);
      if (result.ok) {
        setSaved(result.saved);
        softToast?.toast(
          result.saved ? "Saved to sit with later" : "Removed from saves"
        );
      }
    });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={saved ? "Remove from saves" : "Save for later"}
        title={saved ? "Saved" : "Save for later"}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full",
          "border border-border/60 bg-background/80 text-muted-foreground backdrop-blur-md",
          "transition-colors hover:border-foreground/25 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          saved && "border-foreground/20 text-foreground",
          className
        )}
      >
        <Bookmark
          className={cn("size-3.5", saved && "fill-foreground text-foreground")}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className={cn("gap-1.5", className)}
    >
      <Bookmark
        className={cn("size-3.5", saved && "fill-foreground text-foreground")}
      />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

function SaveButtonAuthed(props: SaveButtonProps) {
  const { isSignedIn } = useAuth();
  return <SaveControl {...props} signedIn={Boolean(isSignedIn)} />;
}

function SaveButtonGuest(props: SaveButtonProps) {
  return <SaveControl {...props} signedIn={false} />;
}

export function SaveButton(props: SaveButtonProps) {
  if (!isClerkPublishableConfigured()) {
    return <SaveButtonGuest {...props} />;
  }
  return <SaveButtonAuthed {...props} />;
}
