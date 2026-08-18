import type { Content, ContentType, Event, Maker } from "@/db/schema";

const now = new Date("2026-08-01T12:00:00.000Z");

export const demoMakers: Maker[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Maya Chen",
    handle: "mayachen",
    bio: "Product designer exploring calm interfaces and editorial systems.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    website: "https://example.com",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Jonas Reed",
    handle: "jonasreed",
    bio: "Builder of quiet tools for creative teams.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    website: "https://example.com",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Aisha Okonkwo",
    handle: "aisha",
    bio: "Visual thinker, type nerd, and occasional essayist.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    website: "https://example.com",
    createdAt: now,
    updatedAt: now,
  },
];

type DemoContent = Content & { maker: Maker | null };

type DemoInput = Omit<
  DemoContent,
  | "createdAt"
  | "updatedAt"
  | "maker"
  | "sourcePlatform"
  | "sourceUrl"
  | "externalId"
  | "authorHandle"
  | "authorName"
  | "sourcePayload"
> &
  Partial<
    Pick<
      DemoContent,
      | "sourcePlatform"
      | "sourceUrl"
      | "externalId"
      | "authorHandle"
      | "authorName"
      | "sourcePayload"
    >
  > & {
    maker?: Maker | null;
  };

function item(partial: DemoInput): DemoContent {
  return {
    ...{
      sourcePlatform: null as string | null,
      sourceUrl: null as string | null,
      externalId: null as string | null,
      authorHandle: null as string | null,
      authorName: null as string | null,
      sourcePayload: null as Record<string, unknown> | null,
      createdAt: now,
      updatedAt: now,
      maker: null as Maker | null,
    },
    ...partial,
    maker: partial.maker ?? null,
  };
}

export const demoContent: DemoContent[] = [
  item({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    type: "thought",
    title: "Design systems should feel like places, not paperwork",
    url: null,
    excerpt:
      "The best systems aren't checklists. They're atmospheres — consistent enough to feel familiar, flexible enough to stay human.",
    image: null,
    status: "published",
    featured: true,
    makerId: demoMakers[0].id,
    publishedAt: new Date("2026-08-10T10:00:00.000Z"),
    maker: demoMakers[0],
  }),
  item({
    id: "41111111-1111-4111-8111-111111111111",
    type: "news",
    title: "Calming Color Theory | Design Picks #34",
    url: "https://www.handheld.design/p/calming-color-theory-design-picks",
    excerpt:
      "The 7 best mobile designs of the week, ranked — from Mayor’s pastel interest setup to Hephra’s green health dashboard.",
    image:
      "https://substack-post-media.s3.amazonaws.com/public/images/acdb4d83-ad4e-4dd3-859c-2c50e140f98b_3024x2160.png",
    status: "published",
    featured: true,
    makerId: null,
    publishedAt: new Date("2026-05-11T12:31:32.000Z"),
    sourcePlatform: "handheld",
    sourceUrl: "https://www.handheld.design/p/calming-color-theory-design-picks",
    externalId: "https://www.handheld.design/p/calming-color-theory-design-picks",
    authorName: "Cam",
    authorHandle: "camjxrdan",
  }),
  item({
    id: "42222222-2222-4222-8222-222222222222",
    type: "news",
    title:
      "Atelier Vens Vanbelle references brick industrial buildings for cubic home in Belgium",
    url: "https://www.dezeen.com/2026/08/18/atelier-vens-vanbelle-project-tomas-katrien/",
    excerpt:
      "A brick cube reminiscent of old industrial structures forms this family home in the suburbs of Ghent.",
    image:
      "https://static.dezeen.com/uploads/2026/08/atelier-vens-vanbelle-project-tomas-katrien-house-belgium-sq_dezeen_2364_col_0-852x852.jpg",
    status: "published",
    featured: false,
    makerId: null,
    publishedAt: new Date("2026-08-18T10:30:42.000Z"),
    sourcePlatform: "dezeen",
    sourceUrl:
      "https://www.dezeen.com/2026/08/18/atelier-vens-vanbelle-project-tomas-katrien/",
    externalId: "https://www.dezeen.com/?p=2351068",
    authorName: "Jon Astbury",
  }),
  item({
    id: "43333333-3333-4333-8333-333333333333",
    type: "news",
    title:
      "Barbican and Made.com launch homeware collection celebrating iconic London estate",
    url: "https://www.dezeen.com/2026/08/18/barbican-made-homeware/",
    excerpt:
      "Geometric, gridded and curved architectural references feature throughout a 23-piece MADE × Barbican collection.",
    image:
      "https://static.dezeen.com/uploads/2026/08/barbican-made-furniture-homeware-design-london_dezeen_2364_sq-852x852.jpg",
    status: "published",
    featured: false,
    makerId: null,
    publishedAt: new Date("2026-08-18T10:00:46.000Z"),
    sourcePlatform: "dezeen",
    sourceUrl: "https://www.dezeen.com/2026/08/18/barbican-made-homeware/",
    externalId: "https://www.dezeen.com/?p=2355368",
    authorName: "Lizzie Crook",
  }),
  item({
    id: "51111111-1111-4111-8111-111111111111",
    type: "post",
    title: "Interest setup flow by Mayor",
    url: "https://x.com/mayowafalowo/status/2038861297089995081",
    excerpt:
      "Pastel background doing the emotional work — onboarding that feels calm instead of transactional. Featured as Design of the Week in Handheld #34.",
    image:
      "https://substackcdn.com/image/fetch/$s_!r99i!,w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F044473af-174a-4400-a881-995428583a6d_4096x2904.jpeg",
    status: "published",
    featured: true,
    makerId: null,
    publishedAt: new Date("2026-05-11T12:00:00.000Z"),
    sourcePlatform: "x",
    sourceUrl: "https://x.com/mayowafalowo/status/2038861297089995081",
    externalId: "2038861297089995081",
    authorHandle: "mayowafalowo",
    authorName: "Mayor",
  }),
  item({
    id: "52222222-2222-4222-8222-222222222222",
    type: "post",
    title: "Health management dashboard by Hephra",
    url: "https://x.com/Hephrastan/status/2038889715667996963",
    excerpt:
      "A green palette that sells wellness without clinical blue — spacious craft density for vitals that need room to breathe.",
    image:
      "https://substackcdn.com/image/fetch/$s_!qa8o!,w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd43500db-84be-403f-9d80-9f9f4afa9321_1639x2048.jpeg",
    status: "published",
    featured: false,
    makerId: null,
    publishedAt: new Date("2026-05-10T18:00:00.000Z"),
    sourcePlatform: "x",
    sourceUrl: "https://x.com/Hephrastan/status/2038889715667996963",
    externalId: "2038889715667996963",
    authorHandle: "Hephrastan",
    authorName: "Hephra",
  }),
  item({
    id: "53333333-3333-4333-8333-333333333333",
    type: "post",
    title: "Compliance scanner flow by Nick Baked",
    url: "https://x.com/nickbakeddesign/status/2038367912311062831",
    excerpt:
      "Made a compliance flow you actually want to look at — warm gradients where B2B usually goes sterile.",
    image:
      "https://substackcdn.com/image/fetch/$s_!Yf2y!,w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb61f886d-fd2f-4850-80b2-5ca090e6a71c_4096x2913.jpeg",
    status: "published",
    featured: false,
    makerId: null,
    publishedAt: new Date("2026-05-09T16:00:00.000Z"),
    sourcePlatform: "x",
    sourceUrl: "https://x.com/nickbakeddesign/status/2038367912311062831",
    externalId: "2038367912311062831",
    authorHandle: "nickbakeddesign",
    authorName: "Nick Baked",
  }),
  item({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    type: "visual",
    title: "Muted gradients & soft geometry",
    url: "https://layers.to",
    excerpt:
      "A moodboard of restrained color and quiet form — inspiration for product surfaces that don't shout.",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83fe110ce4c?w=1200&h=800&fit=crop",
    status: "published",
    featured: false,
    makerId: demoMakers[2].id,
    publishedAt: new Date("2026-08-08T14:00:00.000Z"),
    maker: demoMakers[2],
    sourcePlatform: "layers",
    sourceUrl: "https://layers.to",
    externalId: "/explore",
    authorName: "Layers",
  }),
  item({
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    type: "build",
    title: "Lumen — a reading light for the web",
    url: "https://example.com",
    excerpt:
      "An open-source reading mode that preserves typography, images, and calm. Built with Next.js and a tiny custom CSS engine.",
    image:
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=800&fit=crop",
    status: "published",
    featured: true,
    makerId: demoMakers[1].id,
    publishedAt: new Date("2026-08-05T09:30:00.000Z"),
    maker: demoMakers[1],
  }),
  item({
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    type: "thought",
    title: "On curation as craft",
    url: null,
    excerpt:
      "Curation isn't collecting. It's editing with taste — knowing what to leave out so what remains can breathe.",
    image: null,
    status: "published",
    featured: false,
    makerId: demoMakers[2].id,
    publishedAt: new Date("2026-08-03T16:00:00.000Z"),
    maker: demoMakers[2],
  }),
  item({
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    type: "visual",
    title: "Editorial layouts from independent magazines",
    url: "https://example.com",
    excerpt:
      "Cropped pages, generous margins, and type that leads. Scans and references for denser storytelling on the feed.",
    image:
      "https://images.unsplash.com/photo-1456513080800-b6be5626ad6d?w=1200&h=800&fit=crop",
    status: "published",
    featured: false,
    makerId: demoMakers[0].id,
    publishedAt: new Date("2026-07-28T11:00:00.000Z"),
    maker: demoMakers[0],
  }),
  item({
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    type: "build",
    title: "Palette — shared color decisions for small teams",
    url: "https://example.com",
    excerpt:
      "A tiny app for agreeing on tokens before they become debt. Export to CSS variables, Tailwind, and Figma.",
    image:
      "https://images.unsplash.com/photo-1558655146-9f40138fdf94?w=1200&h=800&fit=crop",
    status: "published",
    featured: false,
    makerId: demoMakers[1].id,
    publishedAt: new Date("2026-07-20T08:00:00.000Z"),
    maker: demoMakers[1],
  }),
  item({
    id: "99999999-9999-4999-8999-999999999999",
    type: "thought",
    title: "Draft: Notes on dark mode contrast",
    url: null,
    excerpt: "Unpublished thinking on soft contrast and eye strain.",
    image: null,
    status: "draft",
    featured: false,
    makerId: demoMakers[0].id,
    publishedAt: null,
    maker: demoMakers[0],
  }),
];

export const demoEvents: Event[] = [
  {
    id: "e1111111-1111-4111-8111-111111111111",
    title: "Typographics London",
    description:
      "A day of talks on type, editorial design, and the future of reading interfaces.",
    url: "https://example.com",
    location: "London, UK",
    startDate: new Date("2026-09-12T09:00:00.000Z"),
    endDate: new Date("2026-09-12T18:00:00.000Z"),
    type: "in-person",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "e2222222-2222-4222-8222-222222222222",
    title: "thedesign.scene Studio Hours",
    description:
      "Open office hours for makers shipping calm tools. Bring a WIP.",
    url: "https://example.com",
    location: "Online",
    startDate: new Date("2026-08-25T17:00:00.000Z"),
    endDate: new Date("2026-08-25T18:30:00.000Z"),
    type: "remote",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "e3333333-3333-4333-8333-333333333333",
    title: "Design × Code Meetup",
    description:
      "Hybrid evening for designers and engineers who ship together.",
    url: "https://example.com",
    location: "Berlin + Online",
    startDate: new Date("2026-10-02T18:00:00.000Z"),
    endDate: new Date("2026-10-02T21:00:00.000Z"),
    type: "hybrid",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
];

export type ContentWithMaker = Content & { maker: Maker | null };

export function filterDemoContent(
  type?: ContentType | "all",
  options?: { includeDrafts?: boolean }
): ContentWithMaker[] {
  return demoContent
    .filter((entry) => {
      if (!options?.includeDrafts && entry.status !== "published") return false;
      if (type && type !== "all" && entry.type !== type) return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
}
