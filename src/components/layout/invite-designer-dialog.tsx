"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Loader2, UserPlus, X } from "lucide-react";

import { inviteDesignerByEmail } from "@/app/actions/invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type InviteDesignerDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Calm invite dialog — email (digest-styled) or copy join link.
 * Portaled to document.body so sticky header doesn’t clip fixed layout.
 */
export function InviteDesignerDialog({
  open,
  onClose,
}: InviteDesignerDialogProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const joinUrl = absoluteUrl("/sign-up");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setMessage(null);
    setError(null);
    setCopied(false);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await inviteDesignerByEmail(email);
      if (result.ok) {
        setMessage(result.message);
        setEmail("");
      } else {
        setError(result.message);
      }
    });
  }

  async function onCopyLink() {
    setError(null);
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setMessage("Link copied — share it with a designer you admire.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn’t copy. Select and copy the link below.");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 w-full max-w-md overflow-y-auto overscroll-contain",
          "max-h-[min(36rem,calc(100dvh-2rem))] rounded-2xl border border-border/70 bg-card p-6",
          "shadow-[0_24px_60px_-32px_rgba(0,0,0,0.55)]"
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border/50">
            <UserPlus className="size-4 text-muted-foreground" />
          </span>
          <div>
            <h2
              id={titleId}
              className="font-heading text-xl tracking-tight text-foreground"
            >
              Invite a designer
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Grow the scene — send a calm invite, or share a link to join.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Designer&apos;s email
            </span>
            <Input
              ref={inputRef}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="alex@studio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
              className="h-9"
              required
            />
          </label>
          <Button
            type="submit"
            className="w-full"
            disabled={pending || !email.trim()}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send invite"
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            or
          </span>
          <span className="h-px flex-1 bg-border/60" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void onCopyLink()}
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy join link
            </>
          )}
        </Button>
        <p className="mt-2 truncate text-center text-xs text-muted-foreground">
          {joinUrl}
        </p>

        {message ? (
          <p
            className="mt-4 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-sm text-foreground/90"
            role="status"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
