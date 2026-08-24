"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  ImagePlus,
  Loader2,
  PenLine,
  Settings2,
  Upload,
  X,
} from "lucide-react";

import { saveArticleDraft } from "@/app/actions/write";
import { ArticleBody } from "@/components/content/article-body";
import { ArticleEnd } from "@/components/reading/article-end";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublishDialog } from "@/components/writing/publish-dialog";
import { useWriting } from "@/components/writing/writing-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadArticleImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

/** Match reading column — editorial, not full-bleed. */
const COLUMN = "max-w-[40.625rem]"; // ~650px

function estimateMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function WritingStudio() {
  const { open, visible, draft, setDraft, closeWriter } = useWriting();
  const router = useRouter();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<"cover" | "inline" | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(draft.id);
  const [preview, setPreview] = useState(false);
  const [details, setDetails] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [excerpt, setExcerpt] = useState(draft.excerpt ?? "");
  const [cover, setCover] = useState(draft.image ?? "");
  const [dirty, setDirty] = useState(false);

  const minutes = useMemo(() => estimateMinutes(draft.body), [draft.body]);
  const wordCount = useMemo(
    () => draft.body.trim().split(/\s+/).filter(Boolean).length,
    [draft.body]
  );

  useEffect(() => {
    if (!open) return;
    setDraftId(draft.id);
    setExcerpt(draft.excerpt ?? "");
    setCover(draft.image ?? "");
    setPreview(false);
    setDetails(Boolean(draft.excerpt?.trim() || draft.image?.trim()));
    setDirty(false);
    setStatus("idle");
    setMessage(null);
    setPublishOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, open]);

  useEffect(() => {
    if (!visible || preview) return;
    const timer = window.setTimeout(() => {
      titleRef.current?.focus();
    }, 380);
    return () => window.clearTimeout(timer);
  }, [visible, preview]);

  useEffect(() => {
    if (!open || !dirty || preview || publishOpen) return;
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
          setDraft({
            ...draft,
            id: result.id,
            excerpt,
            image: cover,
          });
          setStatus("saved");
          setMessage("Draft saved");
          setDirty(false);
        }
      });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [
    draft,
    draftId,
    dirty,
    excerpt,
    cover,
    open,
    preview,
    publishOpen,
    setDraft,
  ]);

  function updateDraft(next: Partial<{ title: string; body: string }>) {
    setDraft({ ...draft, ...next, excerpt, image: cover });
    setDirty(true);
    setStatus("idle");
  }

  function insertImageMarkdown(url: string, alt = "Image") {
    const textarea = bodyRef.current;
    const snippet = `\n\n![${alt}](${url})\n\n`;
    if (!textarea) {
      updateDraft({ body: `${draft.body.trimEnd()}${snippet}` });
      return;
    }
    const start = textarea.selectionStart ?? draft.body.length;
    const end = textarea.selectionEnd ?? start;
    const next = `${draft.body.slice(0, start)}${snippet}${draft.body.slice(end)}`;
    updateDraft({ body: next });
    requestAnimationFrame(() => {
      const cursor = start + snippet.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function handleImageFile(
    file: File | undefined,
    target: "cover" | "inline"
  ) {
    if (!file) return;
    setUploading(target);
    setStatus("idle");
    setMessage(null);
    try {
      const url = await uploadArticleImage(file);
      if (target === "cover") {
        setCover(url);
        setDraft({ ...draft, excerpt, image: url });
        setDetails(true);
        setDirty(true);
        setMessage("Cover uploaded");
      } else {
        insertImageMarkdown(url);
        setMessage("Image inserted");
      }
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  function requestClose() {
    if (publishOpen) {
      setPublishOpen(false);
      return;
    }
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
      setDraft({
        ...draft,
        id: result.id,
        excerpt,
        image: cover,
      });
      setDirty(false);
      setStatus("saved");
      setMessage(nextStatus === "published" ? "Published." : "Draft saved");
      if (nextStatus === "published" && result.slug) {
        setPublishOpen(false);
        closeWriter();
        router.push(`/article/${result.slug}?published=1`);
        router.refresh();
      }
    });
  }

  function requestPublish() {
    if (!draft.title.trim() && !draft.body.trim()) return;
    setPublishOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!publishOpen) persist("draft");
        return;
      }
      if (meta && event.key === "Enter") {
        event.preventDefault();
        if (publishOpen) persist("published");
        else requestPublish();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft, draftId, excerpt, cover, dirty, pending, publishOpen]);

  if (!open) return null;

  const deck =
    excerpt.trim() ||
    draft.body
      .replace(/[#>*_`~\-\[\]\(\)!]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 40)
      .join(" ");

  const statusLine = uploading ? (
    <span className="inline-flex items-center gap-1.5">
      <Loader2 className="size-3 animate-spin" />
      Uploading image…
    </span>
  ) : pending ? (
    <span className="inline-flex items-center gap-1.5">
      <Loader2 className="size-3 animate-spin" />
      Saving…
    </span>
  ) : status === "saved" ? (
    <span className="inline-flex items-center gap-1.5 text-foreground/60">
      <Check className="size-3" />
      {message}
    </span>
  ) : status === "error" ? (
    <span className="text-destructive">{message}</span>
  ) : (
    <span>
      {wordCount} words · ~{minutes} min to sit with
    </span>
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center",
        "transition-[opacity,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible
          ? "bg-background/80 opacity-100 backdrop-blur-md dark:bg-background/85"
          : "bg-background/0 opacity-0 backdrop-blur-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Writing studio"
    >
      {/* Soft vignette — column is the focus */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          visible ? "opacity-100" : "opacity-0",
          "bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_42%,oklch(0_0_0/0.12)_100%)]",
          "dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,oklch(0_0_0/0.45)_100%)]"
        )}
      />

      <div
        className={cn(
          "relative z-10 flex h-[min(100dvh,920px)] w-full flex-col px-4 py-5 sm:px-6 sm:py-8",
          COLUMN,
          "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-5 scale-[0.98] opacity-0"
        )}
      >
        {/* Quiet chrome — whispers until you need it */}
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="min-w-0 truncate text-xs text-muted-foreground/70">
            {statusLine}
          </p>
          <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity hover:opacity-100 focus-within:opacity-100">
            <ThemeToggle />
            {!preview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDetails((value) => !value)}
                disabled={pending || Boolean(uploading)}
                className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                aria-pressed={details}
              >
                <Settings2 className="size-3.5" />
                <span className="hidden sm:inline">
                  {details ? "Writing" : "Details"}
                </span>
              </Button>
            ) : null}
            {!preview ? (
              <>
                <input
                  ref={inlineInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void handleImageFile(file, "inline");
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => inlineInputRef.current?.click()}
                  disabled={pending || Boolean(uploading)}
                  className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                  aria-label="Insert image"
                  title="Insert image"
                >
                  {uploading === "inline" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">Image</span>
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreview((value) => !value)}
              disabled={pending || Boolean(uploading)}
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
            >
              {preview ? (
                <PenLine className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              <span className="hidden sm:inline">
                {preview ? "Edit" : "Preview"}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => persist("draft")}
              disabled={pending}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={requestPublish}
              disabled={pending || (!draft.title.trim() && !draft.body.trim())}
              className="h-8 px-3 text-xs"
            >
              Publish
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={requestClose}
              disabled={pending}
              className="h-8 px-2 text-muted-foreground"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card",
            "shadow-[0_24px_80px_-40px_rgba(0,0,0,0.55)] ring-1 ring-foreground/[0.03]"
          )}
        >
          <PublishDialog
            open={publishOpen}
            pending={pending}
            onCancel={() => setPublishOpen(false)}
            onConfirm={() => persist("published")}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-10 sm:px-10 sm:py-14">
            {preview ? (
              /* Exact reading shell */
              <div className="reading-surface mx-auto w-full space-y-6">
                <p className="text-sm text-muted-foreground">
                  ~{minutes} min to sit with
                </p>
                <h1 className="font-heading text-4xl leading-[1.15] tracking-tight text-balance sm:text-5xl">
                  {draft.title.trim() || "Untitled"}
                </h1>
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- studio preview
                  <img
                    src={cover}
                    alt=""
                    className="aspect-[16/10] w-full rounded-2xl border border-border/60 object-cover"
                  />
                ) : null}
                {deck ? (
                  <p className="text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
                    {deck}
                  </p>
                ) : null}
                {cover.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover.trim()}
                    alt=""
                    className="mt-4 aspect-[16/10] w-full rounded-2xl border border-border/60 object-cover"
                  />
                ) : null}
                {draft.body ? (
                  <div className="mt-6">
                    <ArticleBody markdown={draft.body} />
                    <ArticleEnd />
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="mx-auto flex w-full flex-1 flex-col">
                <textarea
                  ref={titleRef}
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft({ title: event.target.value })
                  }
                  placeholder="Title"
                  rows={1}
                  className="font-heading mb-6 w-full resize-none border-0 bg-transparent text-4xl leading-[1.15] tracking-tight text-foreground outline-none placeholder:text-muted-foreground/35 sm:text-5xl"
                  onInput={(event) => {
                    const el = event.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }}
                />
                {details ? (
                  <div className="mb-8 space-y-3 border-b border-border/40 pb-8">
                    <Input
                      value={excerpt}
                      onChange={(event) => {
                        setExcerpt(event.target.value);
                        setDirty(true);
                      }}
                      placeholder="Optional deck / excerpt"
                      className="border-0 bg-muted/25"
                    />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={cover}
                          onChange={(event) => {
                            setCover(event.target.value);
                            setDirty(true);
                          }}
                          placeholder="Cover image URL (optional)"
                          className="min-w-0 flex-1 border-0 bg-muted/25"
                        />
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            void handleImageFile(file, "cover");
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 gap-1.5"
                          disabled={pending || Boolean(uploading)}
                          onClick={() => coverInputRef.current?.click()}
                        >
                          {uploading === "cover" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                          Upload
                        </Button>
                        {cover ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                              setCover("");
                              setDraft({ ...draft, excerpt, image: "" });
                              setDirty(true);
                            }}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element -- studio preview of remote/blob URL
                        <img
                          src={cover}
                          alt="Cover preview"
                          className="mt-1 max-h-40 w-full rounded-xl border border-border/50 object-cover"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Upload from your computer, or paste a URL.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
                <textarea
                  ref={bodyRef}
                  value={draft.body}
                  onChange={(event) =>
                    updateDraft({ body: event.target.value })
                  }
                  onPaste={(event) => {
                    const items = event.clipboardData?.items;
                    if (!items) return;
                    for (const item of items) {
                      if (!item.type.startsWith("image/")) continue;
                      const file = item.getAsFile();
                      if (!file) continue;
                      event.preventDefault();
                      void handleImageFile(file, "inline");
                      break;
                    }
                  }}
                  placeholder="Start writing… Markdown welcome. Paste or insert images."
                  className="min-h-[50vh] w-full flex-1 resize-none border-0 bg-transparent font-serif text-[1.275rem] leading-[1.85] text-foreground/90 outline-none placeholder:font-sans placeholder:text-[1.05rem] placeholder:text-muted-foreground/35"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/40 px-6 py-2.5 text-[11px] text-muted-foreground/60 sm:px-10">
            <span>Autosaves · ⌘S · ⌘⏎ publish · Esc</span>
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
