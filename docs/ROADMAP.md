# sit with design — Product Roadmap

**North star:** *Design worth sitting with.*  
A calm, writing-first scene — quality over quantity, curation over aggregation. Not a firehose.

**Stack:** Next.js 15 (App Router) · React 19 · Clerk · Drizzle/Neon · Vercel · Resend (digest)

---

## Philosophy (protect at all costs)

| Do | Don’t |
| --- | --- |
| Small, considered selections | Dump everything published |
| Writing & thinking first | Let visuals/news dominate |
| Space, type, and silence as design | Timeline density / noise |
| Make publish feel like membership | Make publish feel like posting to a feed |
| Editor taste with reasons | Opaque “algorithmic” ranking |

**Voice:** calm, editorial, precise. Prefer “selected,” “considered,” “worth sitting with” over “trending,” “latest,” “for you.”

---

## Status snapshot (as of 2026-08)

### Shipped

| Theme | What’s live |
| --- | --- |
| Curation | Tight All mix (~22), Articles / Visuals / Events filters, featured-first, news/X capped |
| Builds | Dedicated Build type removed from product UI; rows treated as visuals |
| Profiles | `/u/[handle]` portfolio · `/settings/profile` · publish → celebration → portfolio |
| Editor notes | `editorNote` + Admin “Why this is here” · shown on picks |
| Guest editors | `guest_terms` · Admin form · home strip · portfolio badge |
| Digest | `/subscribe` · Thursday cron · Resend sender (needs env keys) |
| Reading/writing | Focus mode · share · studio preview · autosave · excerpt/cover fields |
| Auth | Clerk Sign in / Join · signed-in avatar · drafts |

### Still thin / needs ops

- Registered designers count still low (product loop works; growth is invite/story)
- Digest won’t send until `RESEND_API_KEY` + `DIGEST_FROM_EMAIL` (+ preferred `CRON_SECRET`)
- Guest editors need at least one real term created in Admin
- X posts moved out of All into quiet “Notes from X” strip (shipped)

---

## Roadmap pillars

```
Now (polish & prove)     →    Next (scene density)     →    Later (optional)
─────────────────────         ─────────────────────         ────────────────
Digest go-live                Live from X surface           High-bar jobs
Guest editor first month      Logged-out publish invite     Deeper guest tools
Portfolio & studio polish     News quarantine / retype      Custom domain email
Editor-note habit             Invite & onboarding
```

---

## Now — concrete implementation steps

### 1. Digest go-live (ops + light UX)

**Why:** Completes the “weekly sitting with” ritual outside the site.

**Technical**
1. Verify domain in Resend; set Vercel env: `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, `CRON_SECRET`
2. Confirm `vercel.json` cron (`0 14 * * 4` = Thursday 14:00 UTC)
3. Smoke-test: `curl -H "Authorization: Bearer $CRON_SECRET" https://sitwithdesign.online/api/cron/weekly-digest`
4. Optional: unsubscribe token endpoint (signed email param) if Resend headers aren’t enough

**UI/UX**
- Keep `/subscribe` quiet: one field, one button, short promise
- Footer “Digest” is enough discovery; optional one-line under home hero later

**Microcopy**
- Hero: *Design worth sitting with — in your inbox.*
- Sub: *A short Thursday note: editor’s picks, new writing, and upcoming events. No firehose.*
- CTA: *Subscribe*
- Success: *You’re on the list. See you Thursday.*
- Empty week (cron skip): do not send — silence is on-brand

---

### 2. First Guest Editor month (content ops + light product)

**Why:** Makes the scene feel inhabited by taste, not just accounts.

**Technical**
1. Ensure guest has profile handle (`/settings/profile`)
2. Admin → Guest editor form: profile, label, start/end, intro
3. Verify home strip + portfolio badge + byline when term active
4. Optionally feature 1–2 of their written pieces with `editorNote`

**UI/UX**
- Home strip stays one calm band (already shipped) — don’t add a second carousel
- Badge: secondary, small — *Guest Editor* not *FEATURED CREATOR*

**Microcopy**
- Label: *Guest Editor · September 2026*
- Intro example: *This month, [Name] brings a quieter eye to craft, systems, and writing that stays with you.*
- Strip CTA: *View portfolio*

**v1 rule:** Admin-only featuring (guests don’t get the keys yet). Elevate without flooding.

---

### 3. Portfolio & publishing polish (reward loop)

**Why:** Signing up only matters if publishing feels like joining the scene.

**Technical steps**
1. After publish, ensure redirect stays `?published=1` and portfolio link works when handle exists
2. Auto-prefix `https://` on website in `updateMyProfile` if missing
3. Studio: wire excerpt/cover already in UI to persist (done) — add Cmd/Ctrl+S to save draft
4. Portfolio empty state: if owner, primary *Start writing*; if visitor, soft *Nothing published yet*
5. Add “Edit profile” link on own `/u/[handle]`

**UI/UX**
- Portfolio = gallery of writing first (list or large cards), not a dense mosaic by default
- One hero identity block; generous whitespace; no stats spam beyond piece count + badge
- Celebration banner: dismissible, never blocks reading

**Microcopy**
- Celebration: *Published. It’s live on the feed and on your portfolio.*
- Empty (owner): *Your first piece belongs here. Write something worth sitting with.*
- Empty (visitor): *Nothing published yet.*
- Settings save: *Profile updated.*

---

### 4. Editor-note habit (curation craft)

**Why:** Turns “Featured” from a flag into editorial voice.

**Technical**
1. When featuring in Admin, require or strongly encourage `editorNote` (UI already shows field)
2. Soft validation: warn if featured && note empty (don’t hard-block)
3. Optional Admin list filter: “Picks missing notes”

**UI/UX**
- Note callout: muted panel, small caps label, 1–2 sentences max — never a essay
- On cards: show note only for featured; don’t clutter non-picks

**Microcopy**
- Label: *Why this is here*
- Placeholder: *One or two calm sentences on why this belongs in the scene…*
- Examples:  
  - *A rare piece that treats type as architecture, not decoration.*  
  - *Clear thinking about craft without the usual hot-take noise.*

---

### 5. Reading experience deepening

**Why:** The promise is *sitting with* — reading should feel slower than browsing.

**Technical**
1. Keep Focus mode; hide header/footer via `reading-focus` (shipped)
2. Add “Copy link” client control next to Share
3. “More from this writer” — query `getPublishedContentByProfile`, exclude current, limit 3
4. Slightly increase `.article-prose` measure comfort if needed (already Medium-calm)

**UI/UX**
- Focus = chrome fades, not a gimmicky reader skin
- Share row stays quiet; no share-count vanity
- Related pieces: simple linked titles, not a card dump under the essay

**Microcopy**
- Focus: *Focus* / *Exit focus*
- Share: *Share* / *Link copied*
- Related: *More from this writer*

---

### 6. Writing experience deepening

**Why:** Authors should feel they’re publishing into a journal, not posting content.

**Technical**
1. Cmd/Ctrl+S → save draft; Cmd/Ctrl+Enter → publish confirm
2. Confirm dialog before Publish: *Publish to the scene?*
3. Live word count + reading time (shipped)
4. Preview mode (shipped) — ensure preview matches article typography classes
5. Collision-safe slugs (shipped)

**UI/UX**
- Studio remains full-bleed calm overlay; avoid sidebar chrome
- Preview should feel identical to `/article/[slug]` prose
- Don’t add AI rewrite buttons or “engagement tips”

**Microcopy**
- Publish confirm: *Publish this to the scene?*
- Confirm CTA: *Publish* · Cancel: *Keep editing*
- Autosave: *Draft saved*
- Footer hint: *Autosaves · Markdown · Esc to close*

---

## Next — scene density (after Now)

### A. Live from X (secondary surface) — shipped

**Intent:** Keep craft chatter without polluting the main selection.

**Shipped**
- Non-featured (and featured) `post` excluded from All
- Home footer strip: *Notes from X* — 4 recent notes, quieter cards
- Ingest no longer auto-features X / pull-live imports

**Microcopy**
- *A few notes from X — separate from the editor’s selection.*

### B. Logged-out publish invite

**Intent:** Make “you can write here” obvious without hype.

**Approach**
- Soft strip under hero when signed out: text + *Join* / *Sign in*
- Hide when signed in

**Microcopy**
- *Write in the scene.*  
- *Join to publish essays worth sitting with.*  
- CTA: *Join* · secondary: *Sign in*

### C. News quarantine

**Intent:** Historical news volume still outweighs writing in DB.

**Approach**
- One-off script: demote/unpublish low-signal news; or retag selective pieces as article when they’re real essays
- Keep ingest caps low (already)

### D. Invite & onboarding

**Intent:** Grow “designers registered” with the right people.

**Approach**
- Personal invites > public growth hacks
- After first publish: prompt to complete profile (bio + handle)

**Microcopy**
- *One more step — add a short bio so readers know who’s writing.*

---

## Later — optional

| Idea | Bar |
| --- | --- |
| Job board | Only roles you’d recommend to a friend; curated applications, no scrapers |
| Guest self-serve featuring | Only after trust; still capped |
| Custom domain email | `digest@sitwithdesign.online` via Resend DNS |
| Drop PG `build` enum value | Low urgency; app already hides it |

---

## Suggested sequencing (weeks)

| Week | Focus | Exit criteria |
| --- | --- | --- |
| **1** | Digest env + first Guest Editor + 3 editor notes | Email sends; strip live; picks have reasons |
| **2** | Portfolio polish + logged-out write invite | First-time publish → portfolio feels complete |
| **3** | Reading “more from writer” + copy link; studio hotkeys | Reading/writing feel journal-grade |
| **4** | Live from X surface + news cleanup pass | Main feed stays quiet; X has a side door |

---

## Design tokens (keep consistent)

- Type: Geist Sans for UI + headings; **Source Serif 4** for `.article-prose` body (~1.2rem / 1.8)  
- Color: warm paper light + soft ink dark (OKLCH hue ~55–85); muted panels for notes  
- Space: prefer `gap-8` / `py-16` over dense grids on All; article measure ~40–42rem  
- Motion: soft 400ms cubic-bezier(0.22,1,0.36,1); respect `prefers-reduced-motion`  
- Words: *selected*, *editor’s pick*, *sit with*, *worth sitting with* — not *trending* / *for you* / *min read*

---

## Technical checklist (recurring)

- [ ] Neon migrations applied for any new schema (profile fields / guest / subscribers already patched on prod DB)  
- [ ] `revalidateTag("content" | "profiles")` on publish / feature / guest create  
- [ ] No `--legacy-peer-deps` installs  
- [ ] Cron authenticated with `CRON_SECRET` in production  
- [ ] Don’t expand All mix target without an editorial reason  

---

## Success metrics (tasteful, not vanity)

| Signal | Healthy |
| --- | --- |
| All feed size | ~15–25 selected items |
| Editorial share in All | Majority of slots |
| Editor notes on featured | Near 100% of new picks |
| Publish → portfolio | Every published article appears on `/u/[handle]` |
| Digest | Sends only when ≥2 quality items; open rate secondary to consistency |
| Registered designers | Slow, invited growth — not a growth chart |

---

## Open product choices (decide when needed)

1. Guest editors: admin-only featuring (current) vs limited self-serve later  
2. Digest: single opt-in (current) vs double opt-in  
3. Whether `/maker/[handle]` eventually redirects to `/u/...` when linked  

---

*This roadmap is the source of truth for near-term Scene work. Prefer small PRs that protect calm over large feature dumps.*
