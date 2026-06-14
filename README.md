# FLCut — URL Shortener for Finite Loop Club

> Reference build id: FLC-FLCut-2627-Trace-visible

Built with Next.js 16 (App Router), TypeScript, Prisma 7, and Neon PostgreSQL.

---

## What is this

FLCut is an internal URL shortener for Finite Loop Club — the kind of tool a student club actually needs when sharing Google Forms, event pages, and registration links across WhatsApp groups, Instagram bios, and Discord servers. Long URLs break in messages, look ugly in bios, and give you zero signal about whether anyone actually clicked the thing. FLCut solves all three.

---

## What I built

- **Link shortening** with collision-safe 6-character base-62 codes, with an optional custom alias (`flcut.io/apply`, `flcut.io/my-event-2026`)
- **Scheduling** — links can have an `activatesAt` time (link won't work before that datetime) and an `expiresAt` time (returns an expired page after). Both are datetime-local, not just date, because a link that goes live on the right day but wrong hour is still broken.
- **Reserved aliases** — a blocklist of words like `api`, `admin`, `dashboard`, `login`, `analytics` that can't be claimed as custom aliases, because someone shortening to `flcut.io/api` would shadow a real Next.js route.
- **Analytics** — every click records: total count, unique visitor count (cookie-based, scoped per link), and which platform sent the traffic. The referrer source detection handles Instagram, LinkedIn, Discord, WhatsApp (via User-Agent since WhatsApp strips the `Referer` header), Twitter/X, Facebook, Reddit, Telegram, YouTube, GitHub, Google, and falls back to the raw hostname for anything else.
- **Delete** — two-step confirm (click once to see "Sure?", click again to actually delete). All associated click records cascade-delete automatically.
- **Analytics drawer** — slide-in side panel showing total clicks, unique visitors, return visits, and a ranked source breakdown with colored progress bars. Closes on Escape or clicking the backdrop.

---

## Data model, and why I designed it that way

Two tables. `Link` and `Click`.

```
Link
  id           Int       (PK, autoincrement)
  originalUrl  String
  shortCode    String    (unique — the generated 6-char code)
  customAlias  String?   (unique — user-chosen alias, nullable)
  expiresAt    DateTime?
  activatesAt  DateTime?
  createdAt    DateTime  (default now)
  clicks       Click[]

Click
  id          Int      (PK)
  linkId      Int      (FK → Link, cascade delete)
  visitorId   String   (UUID from httpOnly cookie)
  isUnique    Boolean  (true if first time this visitor clicked this specific link)
  referrer    String?  (raw Referer header value)
  source      String   (parsed label: "Instagram", "WhatsApp", "Direct", etc.)
  clickedAt   DateTime (default now)

  @@index([linkId])
  @@index([linkId, visitorId])
```

Why this and not one table with aggregates? Because I didn't know upfront which analytics questions I'd need to answer. Storing raw click events lets you slice however you want later — clicks by day, by source, by unique vs returning. If I'd stored just a counter, adding source breakdown later would require a migration and data loss.

The `customAlias` and `shortCode` both being unique but separate was a deliberate choice. When redirecting, the route checks `OR [shortCode, customAlias]` — this means a link with a custom alias of `apply` is reachable at `/apply` but its internal short code still exists and also works. I could have overwritten shortCode with the alias, but keeping them separate means you can always fall back if you need to.

The `isUnique` field is written at click time and scoped per-link. A browser that has visited link A before is still unique on link B. I check `findFirst({ where: { linkId, visitorId } })` before creating the click record. Yes, this is one extra query per redirect. I decided that's acceptable given the analytics value — and it's an indexed query.

---

## If I only had 4 hours, what would I build first and what would I cut

**Build first:** The redirect route and the shortening API. If a short link doesn't work, nothing else matters. After that, the basic dashboard table so you can see your links exist. That's about 90 minutes of honest work.

**Cut:** Analytics entirely. Tracking is a nice-to-have for a demo. I'd also cut custom aliases and just generate codes — aliases are where most of the validation edge cases live (reserved words, collision with existing aliases, format checking). Scheduling (activatesAt/expiresAt) would also go — it's useful but it's not core to "shorten a URL."

**Keep but simplify:** The UI. The design is nice but I'd trim it to basic functional if time was tight. The gradient hero and drawer animation can wait.

---

## One tradeoff I made, and what I gave up

**Tradeoff:** Cookie-based unique visitor tracking instead of IP-based or fingerprint-based.

Cookies are easy to implement, don't require any external service, and work fine for honest traffic. But they're trivially cleared — open incognito, clear cookies, and you'll count as unique again. IP-based would be more resilient to that but brings privacy concerns and wouldn't work behind NAT (a whole university on the same IP). A real fingerprinting library would be more accurate but adds a dependency and is overkill for a club tool.

What I gave up: accuracy. If someone clicks a link from three different browsers, they count as three unique visitors. If WhatsApp's in-app browser and the user's Chrome browser both visit, that's two uniques. For Finite Loop Club's use case — roughly knowing whether 50 people or 500 people clicked the registration link — cookie-based unique tracking is good enough.

---

## What I assumed because the PRD didn't tell me

- **No authentication required.** The PRD didn't mention login or access control. I built the dashboard as an open page. In production you'd want at least a simple secret or OAuth for club admins.

- **No rate limiting on shortening.** Anyone can hit `/api/shorten` and create links. I assumed this was an internal tool used by club members, not a public service where abuse is likely.

- **Clicks should be counted even for scheduled/expired links.** The PRD said to track clicks, but didn't specify whether that means only successful redirects or all attempts. I only create a Click record after all the scheduling checks pass — so failed redirects (expired, not yet active) don't count.

- **"Unique" means unique per link, not per session.** The PRD mentioned unique clicks but didn't define the scope. Per-browser-per-link felt the most useful for "how many distinct people saw this link."

- **WhatsApp = null referrer.** WhatsApp's mobile app strips the Referer header. Rather than lumping all null-referrer traffic into "Direct," I check the User-Agent for `WhatsApp/` and label those separately. Direct means genuinely typed-in or unknown.

- **Short codes are permanent once created.** The PRD didn't say anything about editing. I built delete but not edit. Editing a short code would require invalidating caches and potentially breaking existing links already shared.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| ORM | Prisma 7 |
| Database | Neon (serverless PostgreSQL) |
| Styling | Vanilla CSS (no Tailwind) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Icons | Lucide React |

---

## Running locally

```bash
# 1. Install
npm install

# 2. Set up .env.local
DATABASE_URL="your-neon-postgres-url"

# 3. Push schema
npx prisma db push

# 4. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
Live : https://flcut-three.vercel.app/

---

## Repo

[github.com/shishirshettyyy/FLCut](https://github.com/shishirshettyyy/FLCut)
