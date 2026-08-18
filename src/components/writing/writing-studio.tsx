"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

import { saveArticleDraft } from "@/app/actions/write";
import { useWriting } from "@/components/writing/writing-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WritingStudio() {
  const { open, visible, draft, setDraft, closeWriter } = useWriting();
  const router = useRouter();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(draft.id);

  useEffect(() => {
    setDraftId(draft.id);
  }, [draft.id]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      titleRef.current?.focus();
    }, 380);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!open) return null;

  function persist(nextStatus: "draft" | "published") {
    setStatus("idle");
    setMessage(null);
    startTransition(async () => {
      const result = await saveArticleDraft({
        id: draftId,
        title: draft.title,
        body: draft.body,
        status: nextStatus,
      });
      if (!result.ok) {
        setStatus("error");
        setMessage(result.message);
        return;
      }
      setDraftId(result.id);
      setDraft({ ...draft, id: result.id });
      setStatus("saved");
      setMessage(
        nextStatus === "published" ? "Published." : "Draft saved."
      );
      if (nextStatus === "published" && result.slug) {
        closeWriter();
        router.push(`/article/${result.slug}`);
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-stretch justify-center",
        "transition-[opacity,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible
          ? "bg-background/55 opacity-100 backdrop-blur-md"
          : "bg-background/0 opacity-0 backdrop-blur-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Writing studio"
    >
      {/* Dimmed stage — suggests the site falling away */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-foreground/[0.03] transition-opacity duration-500",
          visible ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        className={cn(
          "relative z-10 flex h-full w-full max-w-3xl flex-col px-4 py-4 sm:px-8 sm:py-8",
          "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-[0.97] opacity-0"
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium tracking-tight text-foreground/80">
              Writing
            </span>
            <span className="text-border">·</span>
            {pending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </span>
            ) : status === "saved" ? (
              <span className="inline-flex items-center gap-1.5 text-foreground/70">
                <Check className="size-3.5" />
                {message}
              </span>
            ) : status === "error" ? (
              <span className="text-destructive">{message}</span>
            ) : (
              <span>Draft</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeWriter}
              disabled={pending}
            >
              <X className="size-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Close</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => persist("draft")}
              disabled={pending}
            >
              Save draft
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => persist("published")}
              disabled={pending || (!draft.title.trim() && !draft.body.trim())}
            >
              Publish
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)]",
            "ring-1 ring-foreground/[0.04]"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-12 sm:py-12">
            <textarea
              ref={titleRef}
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
              placeholder="Title"
              rows={1}
              className="font-heading mb-6 w-full resize-none border-0 bg-transparent text-3xl leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
              onInput={(event) => {
                const el = event.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            <textarea
              value={draft.body}
              onChange={(event) =>
                setDraft({ ...draft, body: event.target.value })
              }
              placeholder="Start writing… Markdown welcome."
              className="min-h-[50vh] w-full flex-1 resize-none border-0 bg-transparent text-[1.125rem] leading-[1.8] text-foreground/90 outline-none placeholder:text-muted-foreground/35"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-xs text-muted-foreground sm:px-12">
            <span>Markdown supported · Esc to close</span>
            <button
              type="button"
              className="transition-colors hover:text-foreground"
              onClick={closeWriter}
            >
              Back to site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
