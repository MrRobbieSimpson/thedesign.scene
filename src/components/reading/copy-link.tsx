"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Quiet fail — no toast theater
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
