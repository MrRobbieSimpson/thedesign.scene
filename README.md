# thedesign.scene

A curated design platform for writing, visuals, and events — quality over quantity.

Editor’s selection on the home feed, designer portfolios, guest editors, and a weekly digest.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Drizzle ORM** + **PostgreSQL** (Neon / Supabase ready)
- **Lucide** icons
- **next-themes** for dark mode

## Getting started

```bash
cd scene
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon/Postgres |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (required for sign-in) |
| `CLERK_SECRET_KEY` | Clerk server |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob — article image uploads (Hobby free tier is fine) |

Create a Clerk app, enable **Google**, **X**, and **LinkedIn**, then paste keys into `.env.local` and Vercel.

**Article images:** Vercel → Storage → Create Blob store → copy the read-write token into `BLOB_READ_WRITE_TOKEN` (local + Vercel env). No paid plan required to start.

Without `DATABASE_URL`, the app runs on **demo data**. Admin / Saves / Scenes require Clerk sign-in.

## Database (Neon or Supabase)

1. Create a Postgres database and copy the connection string into `.env.local`:

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

2. Push the schema and seed sample content:

```bash
npm run db:push
npm run db:seed
```

Useful commands:

| Script | Purpose |
| --- | --- |
| `npm run db:generate` | Generate SQL migrations from the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (great for local/dev) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Insert demo makers, content, and events |

## Project structure

```
src/
  app/                 # App Router pages
    page.tsx           # Public feed
    content/[id]/      # Content detail
    events/            # Events list
    admin/             # Create / publish content
  components/
    content/           # Feed cards & filters
    events/
    layout/            # Header + footer
    admin/
    ui/                # shadcn primitives
  db/
    schema.ts          # Drizzle schema
    seed.ts
  lib/
    queries.ts         # Data access (+ demo fallback)
    demo-data.ts
```

## Schema

- **makers** — name, handle, bio, avatar, website
- **content** — type (`thought` | `visual` | `build` | `news` | `post`), title, url, excerpt, image, status, featured, source metadata (`sourcePlatform`, `sourceUrl`, `externalId`, `authorHandle`…), belongs to maker
- **events** — title, description, dates, location, type (`in-person` | `hybrid` | `remote`), status

## Design notes

Editorial, calm, and premium — inspired by recent.design, handheld.design, and spottedinprod.com:

- **Primary typeface: Geist Sans** (body, UI, brand, headings). **Geist Mono** for code only — no display serif for now
- Headings use the same family with medium weight + tight tracking
- Generous spacing and soft borders
- Distinct card treatments per content type
- First-class light / dark themes

## Phase 1 routes

| Route | Description |
| --- | --- |
| `/` | Curated feed (All / Articles / Visuals / Events) · Notes from X secondary |
| `/content/[id]` | Reading / viewing experience |
| `/events` | Published events |
| `/admin` | Import URL, browse RSS, create + publish (unprotected) |

## Curating content

thedesign.scene is editorial — imports land as **drafts** until you publish.

### Admin

1. Open `/admin`
2. **Import URL** — paste an X status, Layers project, Handheld issue, Dezeen story, or any URL
3. **Browse RSS** — load Handheld or Dezeen, select items, import as drafts
4. Publish from the list

### CLI

```bash
# Preview RSS (no DB required)
npm run ingest:rss -- --source handheld --limit 8 --dry-run
npm run ingest:rss -- --source dezeen --limit 10 --dry-run

# Preview a single URL
npm run ingest:url -- "https://x.com/user/status/123" --dry-run

# Insert drafts (requires DATABASE_URL + migrations)
npm run ingest:rss -- --source handheld --limit 10
npm run ingest:url -- "https://www.handheld.design/p/…"
```

Registered feeds live in `src/lib/ingest/sources.ts` (Handheld, Dezeen, Dribbble Stories, Awwwards, Smashing, Medium…).

**Import URL** works for almost any design site via Open Graph: Behance, Layers, Siteinspire, Spotted in Prod, Awwwards sites, X posts, Medium articles, studio sites, etc. Suggested type is picked from the host (visual vs news vs post) and you can override before saving.
