"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Loader2, PenLine, X } from "lucide-react";

import { saveArticleDraft } from "@/app/actions/write";
import { ArticleBody } from "@/components/content/article-body";
import { useWriting } from "@/components/writing/writing-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function estimateMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function WritingStudio() {
  const { open, visible, draft, setDraft, closeWriter } = useWriting();
  const router = useRouter();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(draft.id);
  const [preview, setPreview] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [dirty, setDirty] = useState(false);

  const minutes = useMemo(() => estimateMinutes(draft.body), [draft.body]);
  const wordCount = useMemo(
    () => draft.body.trim().split(/\s+/).filter(Boolean).length,
    [draft.body]
  );

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

  // Debounced autosave for drafts with content
  useEffect(() => {
    if (!open || !dirty || preview) return;
    if (!draft.title.trim() && !draft.body.trim()) return;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await saveArticleDraft({
          id: draftId,
          title: draft.title,
          body: draft.body,
          excerpt: excerpt || undefined,
          image: cover || undefined,
          status: "draft",
        });
        if (result.ok) {
          setDraftId(result.id);
          setDraft({ ...draft, id: result.id });
          setStatus("saved");
          setMessage("Draft saved");
          setDirty(false);
        }
      });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [draft, draftId, dirty, excerpt, cover, open, preview, setDraft]);

  function updateDraft(next: Partial<{ title: string; body: string }>) {
    setDraft({ ...draft, ...next });
    setDirty(true);
    setStatus("idle");
  }

  function requestClose() {
    if (dirty && (draft.title.trim() || draft.body.trim())) {
      const ok = window.confirm("Discard unsaved changes?");
      if (!ok) return;
    }
    closeWriter();
  }

  function persist(nextStatus: "draft" | "published") {
    setStatus("idle");
    setMessage(null);
    startTransition(async () => {
      const result = await saveArticleDraft({
        id: draftId,
        title: draft.title,
        body: draft.body,
        excerpt: excerpt || undefined,
        image: cover || undefined,
        status: nextStatus,
      });
      if (!result.ok) {
        setStatus("error");
        setMessage(result.message);
        return;
      }
      setDraftId(result.id);
      setDraft({ ...draft, id: result.id });
      setDirty(false);
      setStatus("saved");
      setMessage(nextStatus === "published" ? "Published." : "Draft saved");
      if (nextStatus === "published" && result.slug) {
        closeWriter();
        router.push(`/article/${result.slug}?published=1`);
        router.refresh();
      }
    });
  }

  function requestPublish() {
    if (!draft.title.trim() && !draft.body.trim()) return;
    const ok = window.confirm("Publish this to the scene?");
    if (!ok) return;
    persist("published");
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persist("draft");
        return;
      }
      if (meta && event.key === "Enter") {
        event.preventDefault();
        requestPublish();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- latest draft via re-subscribe
  }, [open, draft, draftId, excerpt, cover, dirty, pending]);

  if (!open) return null;

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
              <span>
                {wordCount} words · ~{minutes} min to sit with
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreview((value) => !value)}
              disabled={pending}
              className="gap-1.5"
            >
              {preview ? (
                <PenLine className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {preview ? "Edit" : "Preview"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={requestClose}
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
              onClick={requestPublish}
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
            {preview ? (
              <div className="mx-auto w-full max-w-[40.625rem] space-y-6">
                <p className="text-sm text-muted-foreground">
                  ~{minutes} min to sit with
                </p>
                <h1 className="font-heading text-3xl leading-[1.15] tracking-tight text-balance sm:text-4xl">
                  {draft.title.trim() || "Untitled"}
                </h1>
                {(excerpt || draft.body) && (
                  <p className="text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
                    {excerpt ||
                      draft.body
                        .replace(/[#>*_`~\-\[\]\(\)!]/g, " ")
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 40)
                        .join(" ")}
                  </p>
                )}
                {cover.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover.trim()}
                    alt=""
                    className="aspect-[16/10] w-full rounded-2xl border border-border/60 object-cover"
                  />
                ) : null}
                {draft.body ? (
                  <ArticleBody markdown={draft.body} />
                ) : (
                  <p className="text-muted-foreground">
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  ref={titleRef}
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft({ title: event.target.value })
                  }
                  placeholder="Title"
                  rows={1}
                  className="font-heading mb-4 w-full resize-none border-0 bg-transparent text-3xl leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
                  onInput={(event) => {
                    const el = event.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }}
                />
                <div className="mb-6 space-y-3">
                  <Input
                    value={excerpt}
                    onChange={(event) => {
                      setExcerpt(event.target.value);
                      setDirty(true);
                    }}
                    placeholder="Optional deck / excerpt"
                    className="border-0 bg-muted/30"
                  />
                  <Input
                    value={cover}
                    onChange={(event) => {
                      setCover(event.target.value);
                      setDirty(true);
                    }}
                    placeholder="Optional cover image URL"
                    className="border-0 bg-muted/30"
                  />
                </div>
                <textarea
                  value={draft.body}
                  onChange={(event) =>
                    updateDraft({ body: event.target.value })
                  }
                  placeholder="Start writing… Markdown welcome."
                  className="min-h-[45vh] w-full flex-1 resize-none border-0 bg-transparent text-[1.125rem] leading-[1.8] text-foreground/90 outline-none placeholder:text-muted-foreground/35"
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-xs text-muted-foreground sm:px-12">
            <span>
              Autosaves · {">"} pull quote · [^1] footnote · ⌘S · ⌘⏎ · Esc
            </span>
            <button
              type="button"
              className="transition-colors hover:text-foreground"
              onClick={requestClose}
            >
              Back to site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
