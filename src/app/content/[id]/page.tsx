import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";

import { SaveButton } from "@/components/save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  contentTypeLabel,
  formatPublishedDate,
  sourcePlatformLabel,
} from "@/lib/format";
import { getContentById } from "@/lib/queries";

export const dynamic = "force-dynamic";

type ContentPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ContentPageProps) {
  const { id } = await params;
  const item = await getContentById(id);
  if (!item) return { title: "Not found" };
  return {
    title: item.title,
    description: item.excerpt ?? undefined,
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { id } = await params;
  const item = await getContentById(id);

  if (!item || item.status !== "published") {
    notFound();
  }

  if (item.type === "article" && item.slug) {
    redirect(`/article/${item.slug}`);
  }

  const outbound = item.sourceUrl ?? item.url;
  const showHero = Boolean(item.image) && item.type !== "thought";
  const isPost = item.type === "post";
  const attribution =
    item.maker?.name ??
    (item.authorHandle ? `@${item.authorHandle}` : null) ??
    item.authorName ??
    sourcePlatformLabel(item.sourcePlatform);

  const ctaLabel =
    item.type === "post"
      ? "View on X"
      : item.type === "news"
        ? "Read original"
        : item.type === "visual" || item.type === "build"
          ? "Open visual"
          : "View source";

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{contentTypeLabel(item.type)}</Badge>
          {item.sourcePlatform ? (
            <Badge variant="outline">
              {sourcePlatformLabel(item.sourcePlatform)}
            </Badge>
          ) : null}
          {item.featured ? <Badge variant="outline">Featured</Badge> : null}
          {item.publishedAt ? (
            <span className="text-sm text-muted-foreground">
              {formatPublishedDate(item.publishedAt)}
            </span>
          ) : null}
        </div>

        <h1 className="font-heading text-4xl leading-[1.15] text-balance sm:text-5xl">
          {item.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {item.maker ? (
            <Link
              href={`/maker/${item.maker.handle}`}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              {item.maker.avatar ? (
                <Image
                  src={item.maker.avatar}
                  alt={item.maker.name}
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover ring-1 ring-border"
                />
              ) : null}
              <div>
                <p className="text-sm font-medium">{attribution}</p>
                <p className="text-sm text-muted-foreground">
                  @{item.maker.handle}
                </p>
              </div>
            </Link>
          ) : attribution ? (
            <p className="text-sm font-medium">{attribution}</p>
          ) : (
            <div />
          )}
          <SaveButton contentId={item.id} />
        </div>
      </header>

      {showHero ? (
        <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-[0_20px_60px_-40px_rgba(0,0,0,0.5)]">
          <Image
            src={item.image!}
            alt={item.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      {item.excerpt ? (
        <div
          className={
            isPost
              ? "mt-10 rounded-2xl border border-border/70 bg-muted/20 px-6 py-5"
              : "mt-10"
          }
        >
          <p
            className={
              isPost
                ? "text-[1.05rem] leading-[1.7] text-foreground/90 whitespace-pre-wrap"
                : "editorial-prose text-pretty"
            }
          >
            {item.excerpt}
          </p>
        </div>
      ) : null}

      {outbound ? (
        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            nativeButton={false}
            render={<a href={outbound} target="_blank" rel="noreferrer" />}
          >
            {ctaLabel}
            <ExternalLink data-icon="inline-end" />
          </Button>
        </div>
      ) : null}

      {item.maker?.bio ? (
        <aside className="mt-14 rounded-2xl border border-border/70 bg-muted/30 p-6">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            About the maker
          </p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium">{item.maker.name}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.maker.bio}
              </p>
            </div>
            {item.maker.website ? (
              <a
                href={item.maker.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Site
                <ArrowUpRight className="size-3.5" />
              </a>
            ) : null}
          </div>
        </aside>
      ) : null}
    </article>
  );
}
