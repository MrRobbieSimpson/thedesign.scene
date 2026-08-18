/**
 * Curated designer / design-adjacent writers.
 * Used by pull scripts to prioritise writing over link-dump news.
 */

export type WriterFeed = {
  id: string;
  name: string;
  feedUrl: string;
  siteUrl: string;
  /** Prefer article for long-form; thought for short essays */
  defaultType: "article" | "thought";
  description?: string;
};

/** RSS/Atom feeds from people and pubs that publish design writing. */
export const WRITER_FEEDS: WriterFeed[] = [
  {
    id: "smashing",
    name: "Smashing Magazine",
    feedUrl: "https://www.smashingmagazine.com/feed/",
    siteUrl: "https://www.smashingmagazine.com",
    defaultType: "article",
    description: "Craft essays on design & front-end",
  },
  {
    id: "css-tricks",
    name: "CSS-Tricks",
    feedUrl: "https://css-tricks.com/feed/",
    siteUrl: "https://css-tricks.com",
    defaultType: "article",
    description: "UI engineering & design craft",
  },
  {
    id: "uxdesign",
    name: "UX Collective",
    feedUrl: "https://uxdesign.cc/feed",
    siteUrl: "https://uxdesign.cc",
    defaultType: "article",
    description: "Product & UX writing",
  },
  {
    id: "nngroup",
    name: "Nielsen Norman Group",
    feedUrl: "https://www.nngroup.com/feed/rss/",
    siteUrl: "https://www.nngroup.com",
    defaultType: "article",
    description: "Evidence-based UX research writing",
  },
  {
    id: "bradfrost",
    name: "Brad Frost",
    feedUrl: "https://bradfrost.com/feed/",
    siteUrl: "https://bradfrost.com",
    defaultType: "article",
    description: "Design systems & atomic design",
  },
  {
    id: "joshwcomeau",
    name: "Josh W Comeau",
    feedUrl: "https://www.joshwcomeau.com/rss.xml",
    siteUrl: "https://www.joshwcomeau.com",
    defaultType: "article",
    description: "Interactive front-end essays",
  },
  {
    id: "sarasoueidan",
    name: "Sara Soueidan",
    feedUrl: "https://www.sarasoueidan.com/blog/index.xml",
    siteUrl: "https://www.sarasoueidan.com",
    defaultType: "article",
    description: "Accessible UI & SVG craft",
  },
  {
    id: "adactio",
    name: "Adactio (Jeremy Keith)",
    feedUrl: "https://adactio.com/articles/rss",
    siteUrl: "https://adactio.com",
    defaultType: "article",
    description: "Web design philosophy & practice",
  },
  {
    id: "maggieappleton",
    name: "Maggie Appleton",
    feedUrl: "https://maggieappleton.com/rss.xml",
    siteUrl: "https://maggieappleton.com",
    defaultType: "article",
    description: "Design engineering & digital gardening",
  },
  {
    id: "matthewstrom",
    name: "Matthew Ström",
    feedUrl: "https://matthewstrom.com/feed.xml",
    siteUrl: "https://matthewstrom.com",
    defaultType: "article",
    description: "Product design essays",
  },
  {
    id: "robinrendle",
    name: "Robin Rendle",
    feedUrl: "https://robinrendle.com/feed.xml",
    siteUrl: "https://robinrendle.com",
    defaultType: "thought",
    description: "Design systems & writing craft",
  },
  {
    id: "vanschneider",
    name: "Tobias van Schneider",
    feedUrl: "https://www.vanschneider.com/feed",
    siteUrl: "https://www.vanschneider.com",
    defaultType: "thought",
    description: "Design leadership notes",
  },
  {
    id: "handheld",
    name: "Handheld",
    feedUrl: "https://www.handheld.design/feed",
    siteUrl: "https://www.handheld.design",
    defaultType: "article",
    description: "Mobile craft editorial",
  },
  {
    id: "dribbble-stories",
    name: "Dribbble Stories",
    feedUrl: "https://dribbble.com/stories.rss",
    siteUrl: "https://dribbble.com/stories",
    defaultType: "article",
    description: "Community design editorial",
  },
];

/**
 * Known design writers / craft accounts on X.
 * Status URLs are pulled via oEmbed (no X API key required).
 */
export const DESIGNER_X_POSTS: {
  handle: string;
  note?: string;
  statuses: string[];
}[] = [
  {
    handle: "brian_lovin",
    note: "Product design writing & craft",
    statuses: ["https://x.com/brian_lovin/status/2080401424631140760"],
  },
  {
    handle: "joshpuckett",
    note: "Design craft",
    statuses: ["https://x.com/joshpuckett/status/2065871351265837335"],
  },
  {
    handle: "steveschoger",
    note: "UI details & craft",
    statuses: [],
  },
  {
    handle: "iantauri",
    note: "Interface craft",
    statuses: [],
  },
  {
    handle: "jsngr",
    note: "Design systems",
    statuses: [],
  },
  {
    handle: "dannypostma",
    note: "Indie design",
    statuses: [],
  },
  {
    handle: "tako_ux",
    note: "UX writing & craft",
    statuses: [],
  },
  {
    handle: "figma",
    note: "Official craft threads",
    statuses: ["https://x.com/figma/status/2088386933810663907"],
  },
  {
    handle: "notevenclose99",
    statuses: ["https://x.com/notevenclose99/status/2038861297089995081"],
  },
  {
    handle: "HephraUI",
    statuses: ["https://x.com/HephraUI/status/2038889715667996963"],
  },
  {
    handle: "nickbakeddesign",
    statuses: ["https://x.com/nickbakeddesign/status/2038367912311062831"],
  },
  {
    handle: "marcelkargul",
    statuses: ["https://x.com/marcelkargul/status/2089067498108813322"],
  },
  {
    handle: "rehanxahmed",
    statuses: ["https://x.com/rehanxahmed/status/2089566717311942661"],
  },
  {
    handle: "Anwuriii",
    statuses: ["https://x.com/Anwuriii/status/1953354542692639111"],
  },
  {
    handle: "uiuxbyvicko",
    statuses: ["https://x.com/uiuxbyvicko/status/2087569993206534580"],
  },
];

/** Flat list of status URLs for the pull script. */
export function allDesignerXStatusUrls() {
  return DESIGNER_X_POSTS.flatMap((writer) => writer.statuses).filter(Boolean);
}

/**
 * Longer X posts from designers read as Thoughts; short shots stay Posts.
 */
export function classifyXWriting(text: string | null | undefined): "thought" | "post" {
  if (!text) return "post";
  const trimmed = text.trim();
  const paragraphs = trimmed.split(/\n+/).filter((p) => p.trim().length > 0);
  if (trimmed.length >= 320 || paragraphs.length >= 3) return "thought";
  // Link-heavy craft commentary with substance
  if (trimmed.length >= 200 && /design|interface|craft|figma|type|layout/i.test(trimmed)) {
    return "thought";
  }
  return "post";
}
