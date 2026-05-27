# Koh Ride

**Premium scooter rental marketplace for Phuket, Thailand.**

Book verified scooters online. Delivered to your hotel or villa. Instant confirmation.

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase keys
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 2 | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 2 | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | Supabase service role (never public) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Phase 2 | Mapbox public token for maps |
| `STRIPE_SECRET_KEY` | Phase 3 | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Phase 3 | Stripe publishable key |

See `.env.example` for the full list.

---

## Project Structure

```
ride-phuket/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # / — Home landing
│   ├── explore/           # /explore — Map + grid
│   ├── scooter/[id]/      # /scooter/[id] — Detail page
│   ├── checkout/          # /checkout — Booking form
│   ├── bookings/          # /bookings — User bookings
│   ├── profile/           # /profile — User profile
│   ├── layout.tsx         # Root layout (Navbar + Footer)
│   └── globals.css        # Design tokens + global styles
│
├── components/
│   ├── layout/            # Navbar, Footer, MobileBottomNav
│   ├── ride/              # ScooterCard, ReviewCard, ExploreFilters
│   ├── map/               # MapPlaceholder (Mapbox in Phase 2)
│   └── ui/                # Button, Badge
│
├── data/
│   └── scooters.ts        # Mock data (replace with Supabase in Phase 2)
│
├── types/index.ts          # All TypeScript types
├── constants/index.ts      # Site config, locations, options
├── lib/utils.ts            # Formatting, calculation helpers
│
├── supabase/
│   ├── schema.sql         # Database schema
│   ├── rls.sql            # Row Level Security policies
│   └── seed.sql           # Development seed data
│
├── public/manifest.json    # PWA manifest
├── context.md             # Product vision + roadmap
├── decisions.md           # Architecture Decision Records
├── .env.example           # Environment variable template
└── vercel.json            # Vercel deployment config
```

---

## Deployment

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

**Vercel settings:**
- Region: `sin1` (Singapore)
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Supabase Setup

1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL editor
3. Run `supabase/rls.sql`
4. (Optional) Run `supabase/seed.sql`
5. Create buckets: `avatars`, `scooter-images`, `documents`
6. Copy keys to `.env.local`

---

## Available Scripts

```bash
npm run dev      # Development (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

---

## Pages

| Route | Description | Status |
|---|---|---|
| `/` | Home — hero, featured scooters, reviews | ✅ |
| `/explore` | Map + filters + scooter grid | ✅ |
| `/scooter/[id]` | Detail + booking CTA | ✅ |
| `/checkout` | 2-step booking form | ✅ |
| `/bookings` | User booking history | ✅ |
| `/profile` | User account + settings | ✅ |

---

## Phase 2 Priorities

1. Supabase integration — real DB
2. Auth — email + Google OAuth
3. Mapbox — real interactive map
4. Booking persistence to DB
5. Shop owner dashboard
6. WhatsApp booking notifications
7. Stripe payments

---

## Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · Radix UI · Lucide React · Supabase · Vercel
