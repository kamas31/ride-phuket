# Koh Ride — Master Project Context
Version: June 2026

---

## PROJECT SUMMARY

Koh Ride is a scooter rental marketplace focused on Phuket.

Koh Ride is NOT a rental company.
Koh Ride does NOT own scooters.
Koh Ride connects riders and local rental shops.

Core mission:
- Help tourists find the exact scooter they want.
- Help shops get qualified leads.
- Become the largest scooter discovery platform in Phuket.

---

## THE MOST IMPORTANT DECISION IN PROJECT HISTORY

Originally the project was closer to:
- Airbnb for scooters
- Reservation platform
- Booking flow

After many iterations, the project pivoted.

Current positioning:
- Marketplace
- Discovery platform
- Lead generation platform
- Chat-first platform

Think: Leboncoin / Marketplace
Do NOT think: Airbnb / Booking.com / RentalCars

This decision impacts every future feature.

---

## CURRENT BUSINESS MODEL

100% FREE.

There is currently:
- No subscription
- No commission
- No premium plan
- No paid visibility

Reason: The marketplace must first prove it can generate leads.

Current objectives:
- Get shops
- Get scooters
- Generate leads
- Validate demand

Monetization comes later.

---

## FUTURE BUSINESS MODEL (PLANNED, NOT ACTIVE)

- Free: up to 5 scooters
- Starter: ~15 scooters
- Pro: ~40 scooters
- Premium: featured visibility, featured map placement, sponsored listings

---

## CORE PRODUCT PHILOSOPHY

Business > Acquisition > UX > Technology

Always ask:
- Will this bring more riders?
- Will this bring more shops?

If not, it is probably not a priority.

---

## WHAT KOH RIDE IS NOT

Koh Ride does NOT:
- Manage reservations
- Process payments
- Manage deposits
- Manage contracts
- Manage insurance
- Manage cancellations

Shop handles the rental. Koh Ride generates the lead.

---

## CORE USER FLOW

Rider discovers scooter
→ Opens scooter page
→ Contacts shop
→ Conversation starts
→ Shop handles rental

---

## TARGET USERS

**Primary:** Tourists visiting Phuket (Western Europeans, Australians, Russians)
- Age 25–45, tech-savvy, used to Airbnb/Grab
- Want convenience, trust, transparency

**Secondary:** Expats and long-term residents
- Monthly rentals, price-sensitive

**Supply side:** Scooter rental shops in Phuket
- Small businesses (5–200 scooters)
- Currently rely on walk-ins, hotel commission, Google Maps

---

## FEATURES DELIBERATELY REJECTED

Do not reopen without strong evidence:
- Integrated payments
- Reservation engine
- Booking confirmation flow
- Complex availability calendars
- Rental contracts
- Insurance marketplace
- Loyalty systems
- One conversation per scooter

Reason: Complexity without solving current business problems.

---

## CURRENT STATUS (June 2026)

Estimated completion: 90–95%

Major remaining blockers:
- Apple Developer account
- Apple Sign In activation (code done, not yet activated in Apple Dev Console)
- Physical iPhone testing
- TestFlight
- App Store review

The biggest business risk is now marketplace liquidity, not code.

---

## TECH STACK

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 (CSS-first, no tailwind.config.ts) |
| Components | shadcn/ui + Radix UI |
| Backend | Supabase (Auth + Postgres + Storage + Realtime) |
| Hosting | Vercel (region: sin1 Singapore) |
| Maps | Mapbox |
| Mobile | Capacitor (iOS) |
| Testing | Playwright |
| Email | Resend |

---

## SUPABASE

Handles: Auth, Profiles, Shops, Scooters, Messages, Favorites, Storage

**CRITICAL:** Use singleton Supabase client only. Multiple browser clients caused a major auth incident (stale auth, wrong roles, profile inconsistency). Never revert.

Auth methods: Email/Password, Google, Apple Sign In

Roles: `rider` | `shop_owner` stored in `profiles.role` + `auth.users.user_metadata.role`

---

## MESSAGING SYSTEM

Core feature. Chat-first marketplace.

One conversation per `(client_id, owner_id)` — NOT per scooter.

Context switch messages allow changing scooter context inside the same thread.

---

## MAP SYSTEM

Airbnb-style clustering:
- Zoomed out: area clusters with counts
- Zoomed in: exact locations explode, approximate remain clustered

Location types: Type 1 (exact), Type 2 (approximate), Type 3 (zone center)

---

## SEO STRATEGY

SEO is a strategic pillar. Every scooter and shop is a potential landing page.

Implemented: Metadata, Open Graph, Canonicals, Sitemap, Robots, Search Console, Bing Webmaster, Structured Data, FAQ schema.

Location pages: Patong, Kata, Karon, Rawai, Bang Tao, Kamala, Phuket Town, Nai Harn, Chalong.

Estimated level: 8.5–9/10.

---

## ACQUISITION STRATEGY

Supply (shops) is the current priority. Without scooters there is no marketplace.

Order: finish product → publish app → recruit shops.

Rider acquisition: SEO (not paid ads). No serious ad spending until 20+ shops and 100+ scooters.

---

## TESTING

Playwright: 54 passed, 22 skipped, 0 failed. Desktop: PASS. Mobile: PASS.

---

## ROADMAP

See `docs/ROADMAP.md` for current state.

---

## HOW TO WORK ON THIS PROJECT

Always ask: Will this bring more riders? Will this bring more shops?

Prefer:
- Direct answers
- Honest criticism
- Business-first thinking
- Prioritization

Avoid:
- Corporate language
- Fake positivity
- Over-engineering
- Feature creep

---

## THINGS THAT SHOULD NEVER BE REOPENED LIGHTLY

- Integrated payments
- Reservation engine
- Airbnb model
- One conversation per scooter
- Complex availability system
- Commission-based marketplace
- Multiple Supabase browser clients
