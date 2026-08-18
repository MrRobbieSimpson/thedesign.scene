import type { ContentType } from "@/db/schema";
import type { SourcePlatform } from "@/lib/ingest/types";

export type FeedSource = {
  id: string;
  name: string;
  feedUrl: string;
  platform: SourcePlatform;
  defaultType: ContentType;
  siteUrl: string;
  description?: string;
};

/**
 * Curated RSS sources — design news, writing, and visual inspiration.
 * Non-RSS sites (Layers, Siteinspire, Spottedinprod…) use Import URL / OG.
 */
export const FEED_SOURCES: FeedSource[] = [
  {
    id: "handheld",
    name: "Handheld",
    feedUrl: "https://www.handheld.design/feed",
    platform: "handheld",
    defaultType: "news",
    siteUrl: "https://www.handheld.design",
    description: "Mobile craft & ranked design picks",
  },
  {
    id: "dezeen",
    name: "Dezeen",
    feedUrl: "https://www.dezeen.com/feed/",
    platform: "dezeen",
    defaultType: "news",
    siteUrl: "https://www.dezeen.com",
    description: "Architecture & design news",
  },
  {
    id: "behance",
    name: "Behance Projects",
    feedUrl: "https://www.behance.net/feeds/projects",
    platform: "behance",
    defaultType: "visual",
    siteUrl: "https://www.behance.net",
    description: "Creative project showcases",
  },
  {
    id: "dribbble-stories",
    name: "Dribbble Stories",
    feedUrl: "https://dribbble.com/stories.rss",
    platform: "dribbble",
    defaultType: "news",
    siteUrl: "https://dribbble.com/stories",
    description: "Editorial from the Dribbble community",
  },
  {
    id: "awwwards",
    name: "Awwwards Blog",
    feedUrl: "https://www.awwwards.com/blog/feed/",
    platform: "awwwards",
    defaultType: "news",
    siteUrl: "https://www.awwwards.com/blog/",
    description: "Web design awards & inspiration",
  },
  {
    id: "smashing",
    name: "Smashing Magazine",
    feedUrl: "https://www.smashingmagazine.com/feed/",
    platform: "smashing",
    defaultType: "news",
    siteUrl: "https://www.smashingmagazine.com",
    description: "Design & front-end articles",
  },
  {
    id: "uxdesign",
    name: "UX Collective",
    feedUrl: "https://uxdesign.cc/feed",
    platform: "medium",
    defaultType: "news",
    siteUrl: "https://uxdesign.cc",
    description: "UX & product design writing",
  },
  {
    id: "css-tricks",
    name: "CSS-Tricks",
    feedUrl: "https://css-tricks.com/feed/",
    platform: "web",
    defaultType: "news",
    siteUrl: "https://css-tricks.com",
    description: "CSS, UI engineering, craft",
  },
  {
    id: "designboom",
    name: "designboom",
    feedUrl: "https://www.designboom.com/feed/",
    platform: "web",
    defaultType: "news",
    siteUrl: "https://www.designboom.com",
    description: "Art, architecture & design",
  },
  {
    id: "creativebloq",
    name: "Creative Bloq",
    feedUrl: "https://www.creativebloq.com/feed",
    platform: "web",
    defaultType: "news",
    siteUrl: "https://www.creativebloq.com",
    description: "Design news & inspiration",
  },
  {
    id: "sidebar",
    name: "Sidebar",
    feedUrl: "https://sidebar.io/feed.xml",
    platform: "web",
    defaultType: "news",
    siteUrl: "https://sidebar.io",
    description: "Daily design links",
  },
  {
    id: "webdesignerdepot",
    name: "Webdesigner Depot",
    feedUrl: "https://www.webdesignerdepot.com/feed/",
    platform: "web",
    defaultType: "news",
    siteUrl: "https://www.webdesignerdepot.com",
    description: "Web design resources & news",
  },
  {
    id: "medium-product-design",
    name: "Medium · Product Design",
    feedUrl: "https://medium.com/feed/tag/product-design",
    platform: "medium",
    defaultType: "news",
    siteUrl: "https://medium.com/tag/product-design",
    description: "Tagged product-design writing",
  },
];

export function getFeedSource(id: string) {
  return FEED_SOURCES.find((source) => source.id === id) ?? null;
}
