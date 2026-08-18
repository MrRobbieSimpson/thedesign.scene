import Link from "next/link";

import { getRegisteredDesignerCount } from "@/lib/queries";

export async function Footer() {
  const designers = await getRegisteredDesignerCount();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-sans text-lg font-medium tracking-tight">
            thedesign.scene
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            A considered selection of writing, builds, visuals, and events —
            quality over quantity.
          </p>
          <p className="pt-1 text-sm text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">
              {designers.toLocaleString()}
            </span>{" "}
            {designers === 1 ? "designer" : "designers"} registered
          </p>
          <p className="pt-1 text-sm text-muted-foreground/80">
            Created by{" "}
            <a
              href="https://x.com/robbothecreat0r"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              robbothecreat0r
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Feed
          </Link>
          <Link
            href="/events"
            className="transition-colors hover:text-foreground"
          >
            Events
          </Link>
          <Link
            href="/sign-up"
            className="transition-colors hover:text-foreground"
          >
            Join
          </Link>
          <span className="text-border">·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
