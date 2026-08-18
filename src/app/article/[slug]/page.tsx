import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ArticleBody } from "@/components/content/article-body";
import { SaveButton } from "@/components/save-button";
import { Badge } from "@/components/ui/badge";
import { contentTypeLabel, formatPublishedDate } from "@/lib/format";
import { getContentBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const item = await getContentBySlug(slug);
  if (!item || item.type !== "article") return { title: "Not found" };
  return {
    title: item.title,
    description: item.excerpt ?? undefined,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const item = await getContentBySlug(slug);

  if (!item || item.type !== "article" || item.status !== "published") {
    notFound();
  }

  return (
    <article className="mx-auto max-w-[42rem] px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{contentTypeLabel("article")}</Badge>
          {item.featured ? <Badge variant="outline">Featured</Badge> : null}
          {item.publishedAt ? (
            <span className="text-sm text-muted-foreground">
              {formatPublishedDate(item.publishedAt)}
            </span>
          ) : null}
          {item.readingTimeMinutes ? (
            <span className="text-sm text-muted-foreground">
              {item.readingTimeMinutes} min read
            </span>
          ) : null}
        </div>

        <h1 className="font-heading text-4xl leading-[1.15] text-balance sm:text-5xl">
          {item.title}
        </h1>

        {item.excerpt ? (
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
            {item.excerpt}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/60 py-5">
          {item.maker ? (
            <Link
              href={`/maker/${item.maker.handle}`}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              {item.maker.avatar ? (
                <Image
                  src={item.maker.avatar}
                  alt={item.maker.name}
                  width={44}
                  height={44}
                  className="size-11 rounded-full object-cover ring-1 ring-border"
                />
              ) : null}
              <div>
                <p className="text-sm font-medium">{item.maker.name}</p>
                <p className="text-sm text-muted-foreground">
                  @{item.maker.handle}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          <SaveButton contentId={item.id} />
        </div>
      </header>

      {item.image ? (
        <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl border border-border/70 bg-muted">
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

      {item.maker?.bio ? (
        <aside className="mt-16 rounded-2xl border border-border/70 bg-muted/30 p-6">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            About the author
          </p>
          <div className="mt-4 space-y-1">
            <Link
              href={`/maker/${item.maker.handle}`}
              className="font-medium hover:underline"
            >
              {item.maker.name}
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.maker.bio}
            </p>
          </div>
        </aside>
      ) : null}
    </article>
  );
}
