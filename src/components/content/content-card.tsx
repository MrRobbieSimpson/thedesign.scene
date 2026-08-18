import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  BookOpen,
  Layers,
  Lightbulb,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  contentTypeLabel,
  formatPublishedDate,
  sourcePlatformLabel,
} from "@/lib/format";
import type { ContentWithMaker } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

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
      return <Layers className={className} />;
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
  const name =
    item.maker?.name ??
    (item.authorHandle ? `@${item.authorHandle}` : null) ??
    item.authorName ??
    sourcePlatformLabel(item.sourcePlatform) ??
    "thedesign.scene";

  const inner = (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      {item.maker?.avatar ? (
        <Image
          src={item.maker.avatar}
          alt={item.maker.name}
          width={22}
          height={22}
          className="size-[22px] rounded-full object-cover ring-1 ring-border"
        />
      ) : (
        <span className="flex size-[22px] items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {name.replace("@", "").charAt(0).toUpperCase()}
        </span>
      )}
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
            {item.readingTimeMinutes} min
          </>
        ) : null}
      </span>
    </div>
  );

  if (item.maker?.handle) {
    return (
      <Link
        href={`/maker/${item.maker.handle}`}
        onClick={(event) => event.stopPropagation()}
        className="transition-colors hover:text-foreground"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

export function ContentCard({ item }: { item: ContentWithMaker }) {
  switch (item.type) {
    case "article":
      return <ArticleCard item={item} />;
    case "thought":
      return <ThoughtCard item={item} />;
    case "visual":
      return <VisualCard item={item} />;
    case "build":
      return <BuildCard item={item} />;
    case "news":
      return <NewsCard item={item} />;
    case "post":
      return <PostCard item={item} />;
  }
}

function ArticleCard({ item }: { item: ContentWithMaker }) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-8 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.4)]"
      )}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <TypeIcon type="article" />
            {contentTypeLabel("article")}
          </Badge>
          {item.featured ? (
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Featured
            </span>
          ) : null}
        </div>
        <div className="space-y-3">
          <h3 className="font-heading text-[1.65rem] leading-[1.2] text-balance">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="line-clamp-3 text-[0.98rem] leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between gap-3">
        <Attribution item={item} date={item.publishedAt} />
        <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function ThoughtCard({ item }: { item: ContentWithMaker }) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-7 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <TypeIcon type="thought" />
            {contentTypeLabel("thought")}
          </Badge>
          {item.featured ? (
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Featured
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-2xl leading-[1.2] text-balance transition-colors group-hover:text-foreground">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="line-clamp-4 text-[0.95rem] leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Attribution item={item} date={item.publishedAt} />
        <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function VisualCard({ item }: { item: ContentWithMaker }) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
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
          <h3 className="font-heading text-xl leading-snug text-balance">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          ) : null}
        </div>
        <div className="mt-auto">
          <Attribution item={item} date={item.publishedAt} />
        </div>
      </div>
    </Link>
  );
}

function BuildCard({ item }: { item: ContentWithMaker }) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-secondary">
            <Layers className="size-8 opacity-40" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className="gap-1.5 border-0 bg-background/90 text-foreground backdrop-blur-md">
            <TypeIcon type="build" />
            {contentTypeLabel("build")}
          </Badge>
          {item.featured ? (
            <Badge
              variant="secondary"
              className="border-0 bg-background/80 backdrop-blur-md"
            >
              Featured
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pt-1 pb-5">
        <div className="space-y-2">
          <h3 className="font-heading text-xl leading-snug text-balance">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <Attribution item={item} date={item.publishedAt} />
          {item.url ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              Visit
              <ArrowUpRight className="size-3.5" />
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function NewsCard({ item }: { item: ContentWithMaker }) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="size-8 opacity-40" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className="gap-1.5 border-0 bg-background/90 text-foreground backdrop-blur-md">
            <TypeIcon type="news" />
            {contentTypeLabel("news")}
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
          <h3 className="font-heading text-xl leading-snug text-balance">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <Attribution item={item} date={item.publishedAt} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Read
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ item }: { item: ContentWithMaker }) {
  return (
    <Link
      href={contentHref(item)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]"
      )}
    >
      {item.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="gap-1.5 border-0 bg-background/90 text-foreground backdrop-blur-md">
              <TypeIcon type="post" />
              {contentTypeLabel("post")}
            </Badge>
            <Badge
              variant="secondary"
              className="border-0 bg-background/80 backdrop-blur-md"
            >
              {sourcePlatformLabel(item.sourcePlatform) ?? "X"}
            </Badge>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 p-5">
        {!item.image ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <TypeIcon type="post" />
              {contentTypeLabel("post")}
            </Badge>
            <Badge variant="outline">
              {sourcePlatformLabel(item.sourcePlatform) ?? "X"}
            </Badge>
          </div>
        ) : null}

        <div className="space-y-3">
          <h3 className="font-heading text-xl leading-snug text-balance">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Attribution item={item} date={item.publishedAt} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            View on X
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
