import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ArticleBody } from "@/components/content/article-body";
import { EditorNote } from "@/components/content/editor-note";
import { ArticleEnd } from "@/components/reading/article-end";
import { CopyLink } from "@/components/reading/copy-link";
import { FocusToggle } from "@/components/reading/focus-toggle";
import { MoreFromWriter } from "@/components/reading/more-from-writer";
import { ReadingProgress } from "@/components/reading/reading-progress";
import { SitWithButton } from "@/components/reading/sit-with-button";
import { SaveButton } from "@/components/save-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PublishedBanner } from "@/components/writing/published-banner";
import {
  contentTypeLabel,
  formatPublishedDate,
  formatSitWithTime,
} from "@/lib/format";
import {
  getContentBySlug,
  getPublishedContentByProfile,
} from "@/lib/queries";
import { buildPageMetadata, NO_INDEX } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/site";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ published?: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const item = await getContentBySlug(slug);
  if (!item || item.type !== "article") {
    return { title: "Not found", ...NO_INDEX };
  }
  return buildPageMetadata({
    title: item.title,
    description: item.excerpt,
    path: `/article/${item.slug}`,
    image: item.image,
    type: "article",
    noIndex: item.status !== "published",
  });
}

export default async function ArticlePage({
  params,
  searchParams,
}: ArticlePageProps) {
  const { slug } = await params;
  const { published } = await searchParams;
  const item = await getContentBySlug(slug);

  if (!item || item.type !== "article" || item.status !== "published") {
    notFound();
  }

  const profile = item.authorProfile;
  const maker = item.maker;
  const authorName =
    maker?.name ??
    profile?.displayName ??
    (profile?.handle ? `@${profile.handle}` : null) ??
    item.authorName ??
    (item.authorHandle ? `@${item.authorHandle}` : null);
  const authorHandle = maker?.handle ?? profile?.handle ?? item.authorHandle;
  const authorAvatar = maker?.avatar ?? profile?.avatarUrl ?? null;
  const authorHref = maker?.handle
    ? `/maker/${maker.handle}`
    : profile?.handle
      ? `/u/${profile.handle}`
      : null;
  const authorBio = maker?.bio ?? profile?.bio ?? null;
  const portfolioHandle = profile?.handle ?? null;
  const justPublished = published === "1";
  const needsBio = justPublished && Boolean(profile) && !profile?.bio?.trim();
  const articleUrl = `${SITE_ORIGIN}/article/${item.slug}`;
  const sitWith = formatSitWithTime(item.readingTimeMinutes);

  const related =
    profile?.id != null
      ? (await getPublishedContentByProfile(profile.id))
          .filter((row) => row.id !== item.id)
          .slice(0, 3)
      : [];

  return (
    <article
      id="article-reading"
      className="reading-surface mx-auto max-w-[40.625rem] px-5 py-16 sm:px-6 sm:py-24"
    >
      <ReadingProgress targetId="article-reading" />

      {justPublished ? (
        <PublishedBanner
          portfolioHandle={portfolioHandle}
          needsBio={needsBio}
        />
      ) : null}

      <div
        className="mb-10 flex flex-wrap items-center justify-between gap-3"
        data-hide-on-focus
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to feed
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FocusToggle />
          <CopyLink url={articleUrl} />
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Share
          </a>
        </div>
      </div>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge
            variant="secondary"
            className="text-[11px] font-normal tracking-wide"
          >
            {contentTypeLabel("article")}
          </Badge>
          {item.featured ? (
            <Badge variant="outline" className="text-[11px] font-normal">
              Featured
            </Badge>
          ) : null}
          {item.publishedAt ? (
            <span className="text-xs text-muted-foreground/75">
              {formatPublishedDate(item.publishedAt)}
            </span>
          ) : null}
          {sitWith ? (
            <span className="text-xs text-muted-foreground/75">{sitWith}</span>
          ) : null}
        </div>

        <h1 className="font-heading text-4xl leading-[1.15] text-balance sm:text-5xl">
          {item.title}
        </h1>

        {item.excerpt ? (
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl sm:leading-relaxed">
            {item.excerpt}
          </p>
        ) : null}

        {item.featured && item.editorNote ? (
          <EditorNote note={item.editorNote} variant="reading" />
        ) : null}

        <div
          className="flex flex-wrap items-center justify-between gap-4 border-y border-border/60 py-5"
          data-hide-on-focus
        >
          {authorName ? (
            authorHref ? (
              <Link
                href={authorHref}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <Avatar
                  src={authorAvatar}
                  alt={authorName}
                  size={44}
                  xHandle={profile?.xHandle ?? authorHandle}
                  className="ring-1 ring-border"
                />
                <div>
                  <p className="text-sm font-medium">{authorName}</p>
                  {authorHandle ? (
                    <p className="text-sm text-muted-foreground">
                      @{authorHandle}
                    </p>
                  ) : null}
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar
                  src={authorAvatar}
                  alt={authorName}
                  size={44}
                  xHandle={profile?.xHandle ?? authorHandle}
                  className="ring-1 ring-border"
                />
                <div>
                  <p className="text-sm font-medium">{authorName}</p>
                  {authorHandle ? (
                    <p className="text-sm text-muted-foreground">
                      @{authorHandle}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          ) : (
            <div />
          )}
          <SaveButton contentId={item.id} />
        </div>
      </header>

      {item.image ? (
        <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <Image
            src={item.image}
            alt={item.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
          />
        </div>
      ) : null}

      {item.body ? (
        <div className="mt-12">
          <ArticleBody markdown={item.body} />
        </div>
      ) : null}

      {item.body ? (
        <>
          <ArticleEnd />
          <div className="mt-8 flex justify-center">
            <SitWithButton contentId={item.id} />
          </div>
        </>
      ) : null}

      {authorBio && authorName ? (
        <aside
          className="mt-16 rounded-2xl border border-border/70 bg-muted/25 p-6 sm:mt-20"
          data-hide-on-focus
        >
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            About the author
          </p>
          <div className="mt-4 space-y-1">
            {authorHref ? (
              <Link href={authorHref} className="font-medium hover:underline">
                {authorName}
              </Link>
            ) : (
              <p className="font-medium">{authorName}</p>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {authorBio}
            </p>
          </div>
        </aside>
      ) : null}

      <div data-hide-on-focus>
        <MoreFromWriter items={related} authorName={authorName} />
      </div>
    </article>
  );
}
