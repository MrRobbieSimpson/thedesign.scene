import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  BookOpen,
  Lightbulb,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { EditorNote } from "@/components/content/editor-note";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  contentTypeLabel,
  formatPublishedDate,
  formatSitWithTimeShort,
  sourcePlatformLabel,
} from "@/lib/format";
import type { ContentWithMaker } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export type CardDensity = "comfortable" | "compact" | "mosaic";

function densityPad(density: CardDensity) {
  if (density === "compact") return "p-4";
  if (density === "mosaic") return "p-5";
  return "p-7";
}

function densityTitle(density: CardDensity, large?: boolean) {
  if (density === "compact") return "text-base leading-snug";
  if (density === "mosaic") return "text-lg leading-snug";
  return large ? "text-[1.65rem] leading-[1.2]" : "text-2xl leading-[1.2]";
}

function densityExcerpt(density: CardDensity) {
  if (density === "compact") return "line-clamp-2 text-xs leading-relaxed";
  if (density === "mosaic") return "line-clamp-3 text-sm leading-relaxed";
  return "line-clamp-3 text-[0.95rem] leading-relaxed";
}

function TypeIcon({ type }: { type: ContentWithMaker["type"] }) {
  const className = "size-3.5";
  switch (type) {
    case "article":
      return <BookOpen className={className} />;
    case "thought":
      return <Lightbulb className={className} />;
    case "visual":
      return <Sparkles className={className} />;
    case "build":
      // Legacy — treated as visual in the product.
      return <Sparkles className={className} />;
    case "news":
      return <Newspaper className={className} />;
    case "post":
      return <AtSign className={className} />;
  }
}

function contentHref(item: ContentWithMaker) {
  if (item.type === "article" && item.slug) return `/article/${item.slug}`;
  return `/content/${item.id}`;
}

function Attribution({
  item,
  date,
}: {
  item: ContentWithMaker;
  date?: Date | null;
}) {
  const profile = item.authorProfile;
  const name =
    item.maker?.name ??
    profile?.displayName ??
    (profile?.handle ? `@${profile.handle}` : null) ??
    (item.authorHandle ? `@${item.authorHandle}` : null) ??
    item.authorName ??
    sourcePlatformLabel(item.sourcePlatform) ??
    "thedesign.scene";

  const avatar = item.maker?.avatar ?? profile?.avatarUrl ?? null;
  const xHandle = profile?.xHandle ?? item.authorHandle ?? null;
  const href = item.maker?.handle
    ? `/maker/${item.maker.handle}`
    : profile?.handle
      ? `/u/${profile.handle}`
      : null;

  const inner = (
    <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
      <Avatar
        src={avatar}
        alt={name}
        size={20}
        xHandle={xHandle}
        className="ring-1 ring-border/70"
      />
      <span className="truncate">
        {name}
        {date ? (
          <>
            <span className="mx-1.5 text-border">·</span>
            {formatPublishedDate(date)}
          </>
        ) : null}
        {item.readingTimeMinutes ? (
          <>
            <span className="mx-1.5 text-border">·</span>
            {formatSitWithTimeShort(item.readingTimeMinutes)}
          </>
        ) : null}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={(event) => event.stopPropagation()}
        className="transition-colors hover:text-foreground"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

export function ContentCard({
  item,
  density = "comfortable",
  priority = false,
}: {
  item: ContentWithMaker;
  density?: CardDensity;
  priority?: boolean;
}) {
  switch (item.type) {
    case "article":
      return <ArticleCard item={item} density={density} />;
    case "thought":
      return <ThoughtCard item={item} density={density} />;
    case "visual":
      return <VisualCard item={item} density={density} priority={priority} />;
    case "build":
      return <VisualCard item={item} density={density} priority={priority} />;
    case "news":
      return <NewsCard item={item} density={density} priority={priority} />;
    case "post":
      return <PostCard item={item} density={density} priority={priority} />;
  }
}

function ArticleCard({
  item,
  density,
}: {
  item: ContentWithMaker;
  density: CardDensity;
}) {
  const comfortable = density === "comfortable";
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full w-full min-w-0 flex-col justify-between rounded-2xl border bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        item.featured
          ? "border-foreground/20"
          : "border-foreground/10",
        comfortable ? "p-5 sm:p-9" : densityPad(density),
        item.featured && comfortable && "sm:p-10",
        "hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-[0_24px_60px_-32px_rgba(0,0,0,0.55)] active:translate-y-0 active:scale-[0.99]"
      )}
    >
      <div className={cn(density === "compact" ? "space-y-3" : "space-y-5")}>
        <div className="flex items-center justify-between gap-3">
          <Badge className="gap-1.5 border-0 bg-foreground text-background">
            <TypeIcon type="article" />
            {contentTypeLabel("article")}
          </Badge>
          {item.featured && density !== "compact" ? (
            <span className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground/80 uppercase">
              Editor’s pick
            </span>
          ) : null}
        </div>
        <div className={cn("space-y-3", comfortable && "space-y-4")}>
          <h3
            className={cn(
              "font-heading text-balance tracking-tight",
              comfortable
                ? "text-[1.65rem] leading-[1.15] sm:text-[1.85rem]"
                : densityTitle(density, true)
            )}
          >
            {item.title}
          </h3>
          {item.excerpt ? (
            <p
              className={cn(
                "text-muted-foreground",
                comfortable
                  ? "line-clamp-4 text-[1.02rem] leading-relaxed"
                  : densityExcerpt(density)
              )}
            >
              {item.excerpt}
            </p>
          ) : null}
          {item.featured && item.editorNote && density !== "compact" ? (
            <EditorNote note={item.editorNote} variant="feed" />
          ) : null}
        </div>
      </div>
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t border-border/40",
          density === "compact" ? "mt-4 pt-3" : "mt-10 pt-4"
        )}
      >
        <Attribution item={item} date={item.publishedAt} />
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
          Read
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function ThoughtCard({
  item,
  density,
}: {
  item: ContentWithMaker;
  density: CardDensity;
}) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full w-full min-w-0 flex-col justify-between rounded-2xl border border-foreground/10 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        density === "comfortable" ? "p-5 sm:p-8" : densityPad(density),
        "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.4)] active:translate-y-0 active:scale-[0.985]"
      )}
    >
      <div className={cn(density === "compact" ? "space-y-3" : "space-y-5")}>
        <div className="flex items-center justify-between gap-3">
          <Badge className="gap-1.5 border-0 bg-foreground/90 text-background">
            <TypeIcon type="thought" />
            {contentTypeLabel("thought")}
          </Badge>
          {item.featured && density !== "compact" ? (
            <span className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground/80 uppercase">
              Editor’s pick
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3
            className={cn(
              "font-heading text-balance transition-colors group-hover:text-foreground",
              density === "comfortable"
                ? "text-[1.45rem] leading-[1.2]"
                : densityTitle(density)
            )}
          >
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className={cn("text-muted-foreground", densityExcerpt(density))}>
              {item.excerpt}
            </p>
          ) : null}
          {item.featured && item.editorNote && density !== "compact" ? (
            <EditorNote note={item.editorNote} variant="feed" />
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3",
          density === "compact" ? "mt-4" : "mt-8"
        )}
      >
        <Attribution item={item} date={item.publishedAt} />
        <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function VisualCard({
  item,
  density,
  priority = false,
}: {
  item: ContentWithMaker;
  density: CardDensity;
  priority?: boolean;
}) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-[0.985]"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          density === "mosaic"
            ? "aspect-[3/4]"
            : density === "compact"
              ? "aspect-[5/4]"
              : "aspect-[4/3]"
        )}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Sparkles className="size-8 opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="gap-1.5 border-0 bg-background/90 text-foreground backdrop-blur-md">
            <TypeIcon type="visual" />
            {contentTypeLabel("visual")}
          </Badge>
          {item.sourcePlatform ? (
            <Badge
              variant="secondary"
              className="border-0 bg-background/80 backdrop-blur-md"
            >
              {sourcePlatformLabel(item.sourcePlatform)}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3
            className={cn(
              "font-heading text-balance",
              density === "compact" ? "text-sm leading-snug" : "text-xl leading-snug"
            )}
          >
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          ) : null}
          {item.featured && item.editorNote && density !== "compact" ? (
            <EditorNote note={item.editorNote} variant="feed" />
          ) : null}
        </div>
        <div className="mt-auto">
          <Attribution item={item} date={item.publishedAt} />
        </div>
      </div>
    </Link>
  );
}

function NewsCard({
  item,
  density,
}: {
  item: ContentWithMaker;
  density: CardDensity;
  priority?: boolean;
}) {
  // Quieter treatment — secondary to editorial and events.
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full w-full min-w-0 flex-col justify-between rounded-2xl border border-border/50 bg-muted/20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        density === "compact" ? "p-4" : "p-5",
        "hover:border-border/80 hover:bg-muted/35 active:scale-[0.99]"
      )}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <TypeIcon type="news" />
            Brief
          </Badge>
          {item.sourcePlatform ? (
            <span className="text-[10px] tracking-wide text-muted-foreground/60 uppercase">
              {sourcePlatformLabel(item.sourcePlatform)}
            </span>
          ) : null}
        </div>
        <h3
          className={cn(
            "font-heading text-balance text-foreground/90",
            density === "compact" ? "text-sm leading-snug" : "text-lg leading-snug"
          )}
        >
          {item.title}
        </h3>
        {item.excerpt ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {item.excerpt}
          </p>
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Attribution item={item} date={item.publishedAt} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          Open
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function PostCard({
  item,
  density,
}: {
  item: ContentWithMaker;
  density: CardDensity;
  priority?: boolean;
}) {
  // Quiet secondary treatment — never competes with editorial.
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full w-full min-w-0 flex-col justify-between rounded-2xl border border-border/50 bg-muted/15 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        density === "compact" ? "p-4" : "p-5",
        "hover:border-border/80 hover:bg-muted/30 active:scale-[0.99]"
      )}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <TypeIcon type="post" />
            Note
          </Badge>
          <span className="text-[10px] tracking-wide text-muted-foreground/60 uppercase">
            {sourcePlatformLabel(item.sourcePlatform) ?? "X"}
          </span>
        </div>
        <h3
          className={cn(
            "font-heading text-balance text-foreground/90",
            density === "compact" ? "text-sm leading-snug" : "text-base leading-snug"
          )}
        >
          {item.title}
        </h3>
        {item.excerpt ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {item.excerpt}
          </p>
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
        <Attribution item={item} date={item.publishedAt} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          View
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
