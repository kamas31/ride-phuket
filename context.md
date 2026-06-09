# Koh Ride — Product Context

## Product Vision

Koh Ride is the premium scooter rental marketplace for Phuket, Thailand.

Think: **Airbnb meets Uber for scooter rentals.** A platform where tourists and expats can:
- Discover available scooters on a map
- Book instantly without phone calls
- Pay securely online or on delivery
- Get their scooter delivered to their hotel
- Trust verified rental partners

The goal is to replace the chaotic street-rental experience with a polished, trustworthy, digital-first marketplace.

---

## Target Users

**Primary:** Tourists visiting Phuket (Western Europeans, Australians, Chinese, Russian)
- Age: 25–45
- Tech-savvy, used to booking apps (Airbnb, Agoda, Grab)
- Want convenience, trust, and transparency
- Will pay a premium for reliability

**Secondary:** Expats and long-term residents in Phuket
- Monthly rentals, repeat customers
- Price-sensitive, value consistency

**Supply side:** Scooter rental shops in Phuket
- Small businesses (5–200 scooters)
- Currently rely on walk-ins, hotel commission, and Google Maps
- Want more online bookings and less hassle

---

## Founder Goals

- Return to Phuket in August 2025 with a beautiful, investor-ready MVP
- Sign 10–20 partner shops before public launch
- Reach 100 bookings in Month 1
- Build a brand that looks like a funded startup, not a side project

---

## Business Model

**MVP (Commission):**
- 10–15% commission on each booking
- Shops pay nothing to join (land-grab phase)
- Customers pay via cash on delivery or online

**Phase 2:**
- Subscription tier for shops (premium placement, analytics)
- Featured listings (pay-per-click)
- Insurance upsell (partner with Thai insurer)
- Delivery upsell

---

## UX Direction

Premium, mobile-first, Apple-polish aesthetic.

Inspirations: Airbnb, Uber, Revolut, Apple.

- Clean: maximum 3 decisions per screen
- Fast: sub-300ms interactions
- Trustworthy: verified badges, real photos, clear pricing
- Delightful: micro-animations, smooth transitions

Design principles:
- No clutter. Every element earns its place.
- Orange (#FF6B35) = action, energy, warmth
- White + near-white = premium feel
- No dark mode in v1 (complexity not worth it)

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | Best DX, SEO, performance |
| Language | TypeScript strict | No runtime bugs |
| Styling | Tailwind CSS v4 | Speed, consistency |
| Components | shadcn/ui + Radix | Accessible, composable |
| Backend | Supabase | Postgres + Auth + Storage + Realtime |
| Deployment | Vercel | CDN, previews, edge functions |
| Maps | Mapbox (planned) | Best for custom UI |
| Payments | Stripe + PromptPay (Phase 2) |
| Analytics | PostHog (planned) | Product analytics |

---

## Current Status (May 2026)

- ✅ Project scaffolded (Next.js 15, TypeScript, Tailwind)
- ✅ Design system implemented (tokens, components)
- ✅ 6 core pages built (Home, Explore, Detail, Checkout, Bookings, Profile)
- ✅ Mock data: 6 scooters, 3 shops, 4 reviews, 2 bookings
- ✅ Supabase schema designed (schema.sql + rls.sql + seed.sql)
- ✅ Vercel config ready
- ✅ PWA manifest ready
- ⏳ Supabase project not yet created
- ⏳ Auth not integrated
- ⏳ Real payments not integrated
- ⏳ Real map (Mapbox) not integrated
- ⏳ No real data

---

## Next Milestones

### Phase 1 — Launch-Ready MVP (June 2025)
1. Create Supabase project, run migrations
2. Integrate Supabase Auth (email + Google OAuth)
3. Wire real data from Supabase
4. Add Mapbox interactive map
5. Deploy to Vercel + connect domain
6. Add basic booking flow to DB

### Phase 2 — Partner Onboarding (July 2025)
1. Shop dashboard (manage scooters, view bookings)
2. Booking notifications (WhatsApp Business API)
3. Stripe payment integration
4. Review system

### Phase 3 — Growth (August 2025 — launch in Phuket)
1. PromptPay / Thai payment options
2. SEO landing pages per location
3. Referral program
4. Admin dashboard

---

## Supabase Architecture Plan

**Tables:** profiles, shops, scooters, bookings, payments, reviews

**Auth:** Supabase Auth with:
- Email/password
- Google OAuth
- Profile auto-created via trigger on signup

**Storage buckets:**
- `avatars` (public, user profile photos)
- `scooter-images` (public, scooter gallery)
- `documents` (private, passport/license uploads)

**Realtime:** Booking status updates pushed to users

---

## Vercel Deployment Plan

- Region: `sin1` (Singapore — closest to Thailand)
- Branch preview: every PR gets a preview URL
- Production: auto-deploy from `main`
- Environment variables: set in Vercel dashboard
- Domain: kohride.com (to be purchased)

---

## Future Features

- Driver license verification (automated OCR)
- WhatsApp chatbot for booking support
- Multi-language (Thai, Chinese, Russian)
- B2B hotel concierge integration
- Fleet management for shop owners
- Dynamic pricing (peak season, events)
- GPS tracker integration
- Loyalty points system
