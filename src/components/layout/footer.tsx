import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-sans text-lg font-medium tracking-tight">
            thedesign.scene
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            A calm curation of thoughts, visuals, builds, news, posts, and
            design events — quality over quantity.
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
            href="/admin"
            className="transition-colors hover:text-foreground"
          >
            Admin
          </Link>
          <span className="text-border">·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
