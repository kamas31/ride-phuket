# Koh Ride — Architecture Decision Records

---

## ADR-001: Next.js App Router

**Status:** Accepted  
**Date:** 2025-05-01

**Context:**  
Needed a React framework that supports SEO (crucial for travel marketplace), fast page loads, and server-side rendering.

**Decision:**  
Next.js 15 with App Router.

**Reasoning:**
- App Router = React Server Components = smaller JS bundles, faster LCP
- File-based routing = less configuration
- Built-in image optimization via `next/image`
- Vercel-native (zero-config deploy)
- Strong ecosystem for auth, DB, payments

**Consequences:**  
Server components cannot use hooks. Client components marked with `'use client'`. Filter/interactive pages are client-side.

---

## ADR-002: Supabase as Backend

**Status:** Accepted  
**Date:** 2025-05-01

**Context:**  
Needed auth, database, storage, and realtime — without building a custom backend API.

**Decision:**  
Supabase as the BaaS layer.

**Reasoning:**
- PostgreSQL = powerful, battle-tested, supports PostGIS for geo queries
- Supabase Auth = built-in email, OAuth, magic links
- Row Level Security = data access enforced at DB level, not application layer
- Storage = built-in S3-compatible for images and documents
- Realtime = booking status updates without polling
- Generous free tier for early stage

**Alternatives considered:**  
Firebase (NoSQL — poor for relational marketplace data), PlanetScale (no auth/storage), custom Postgres + Prisma (too much infra work).

---

## ADR-003: Tailwind CSS v4 (no separate config file)

**Status:** Accepted  
**Date:** 2025-05-01

**Context:**  
Tailwind v4 ships with a new CSS-first config approach — no `tailwind.config.ts` needed. Tokens defined in `globals.css` via `@theme`.

**Decision:**  
Use Tailwind v4 CSS-first configuration. All design tokens in `globals.css`.

**Reasoning:**
- Simpler setup
- Faster builds
- All tokens colocated in CSS
- CSS custom properties work everywhere (including inline styles)

**Tradeoff:**  
Less familiar for devs used to v3. Some plugins may not be compatible yet.

---

## ADR-004: shadcn/ui + Radix UI for components

**Status:** Accepted  
**Date:** 2025-05-01

**Context:**  
Needed accessible, composable UI primitives without a heavy opinionated component library.

**Decision:**  
Use Radix UI primitives with custom Tailwind styling, following the shadcn/ui pattern.

**Reasoning:**
- Full control over styling
- Accessibility built-in (keyboard nav, ARIA)
- No class conflicts with Tailwind
- Easy to evolve the design system

**Alternatives considered:**  
Material UI (too opinionated), Chakra (v3 breaking changes), Ant Design (too corporate).

---

## ADR-005: Client-side filtering on Explore page

**Status:** Accepted  
**Date:** 2025-05-01

**Context:**  
Explore page filters (category, price, location) need to be fast and interactive.

**Decision:**  
Use `useMemo` with local state for filtering on the client. Data fetched once from Supabase, filtered in-browser.

**Reasoning:**
- MVP has < 500 scooters — client-side is fast enough
- Avoids round-trips to server on each filter change
- Simpler to implement

**Future:**  
When fleet grows to 1000+ scooters, move to server-side filtering with URL params.

---

## ADR-006: Map strategy — placeholder first, Mapbox later

**Status:** Accepted  
**Date:** 2025-05-01

**Context:**  
Interactive maps require API keys and increase bundle size. For MVP, the map is a nice-to-have.

**Decision:**  
Build a visual map placeholder with pinned price markers. Replace with real Mapbox implementation in Phase 2.

**Reasoning:**
- Unblocks UI development without map API setup
- Placeholder looks professional enough for partner demos
- Mapbox GL JS adds ~250KB — defer until needed

---

## ADR-007: Mobile-first, no dark mode in v1

**Status:** Accepted  
**Date:** 2025-05-01

**Context:**  
Primary users are tourists on mobile. Dark mode adds CSS complexity.

**Decision:**  
Mobile-first responsive design. No dark mode in v1.

**Reasoning:**
- 80%+ of traffic will be mobile
- Dark mode doubles the style surface area
- Premium feel is easier to maintain in one theme
- Can add dark mode in v2 once design is stable

---

## ADR-008: Routing structure

**Status:** Accepted  
**Date:** 2025-05-01

**Decision:**
```
/                → Home (landing)
/explore         → Map + grid + filters
/scooter/[id]   → Scooter detail + booking CTA
/checkout        → 2-step booking form
/bookings        → User booking history
/profile         → User account
```

**Future routes:**
```
/shop/[slug]     → Shop profile
/admin           → Admin dashboard (password protected)
/partner         → Shop owner dashboard
```

---

## ADR-009: TypeScript strict mode

**Status:** Accepted  
**Date:** 2025-05-01

**Decision:**  
`strict: true` in tsconfig.

**Reasoning:**
- Catches null/undefined bugs at compile time
- Critical for marketplace where data from external sources (Supabase) is always `T | null`
- Small friction now prevents large bugs later

---

## ADR-010: Vercel region — Singapore (sin1)

**Status:** Accepted  
**Date:** 2025-05-01

**Reasoning:**
- Closest Vercel region to Thailand
- Reduces latency for Thai users and Supabase (also Singapore)
- Southeast Asia edge coverage

---

## ADR-011: Payment strategy — cash first, Stripe later

**Status:** Accepted  
**Date:** 2025-05-01

**Reasoning:**
- Stripe requires business registration in Thailand
- Tourists often prefer to pay on delivery
- Cash/bank transfer is the Thai norm for scooter rentals
- Stripe added in Phase 2 once legal entity is set up
- PromptPay integration for local riders

---

## ADR-012: State management — React useState, no global store

**Status:** Accepted  
**Date:** 2025-05-01

**Reasoning:**
- v1 has no complex shared state
- Context API sufficient for auth
- Adding Zustand/Redux is premature optimization
- Re-evaluate when shop dashboard is built

---

## ADR-013: Multi-role auth — `rider` / `shop_owner` stored in `profiles.role`

**Status:** Accepted  
**Date:** 2025-05-02

**Context:**  
Two distinct user types exist on the platform with different UX and data access needs. Needed a clean, RLS-compatible way to enforce role separation.

**Decision:**  
Store `role` as a TEXT column on `public.profiles` with a CHECK constraint (`rider` | `shop_owner`). Role is also written to `auth.users.user_metadata.role` at signup time.

**Reasoning:**
- `profiles.role` is the source of truth for all DB-level queries and RLS policies
- `user_metadata.role` is used by the Next.js proxy (middleware) to check roles from the JWT without making a DB call on every request
- Two-source approach: fast for edge routing, accurate for DB
- CHECK constraint prevents invalid values at DB level
- `COALESCE(raw_user_meta_data->>'role', 'rider')` in trigger ensures all users get a default

**Consequences:**
- If role needs to change later, update both `profiles.role` AND `user_metadata` (or strip from metadata and always query DB)

---

## ADR-014: Auth trigger reads role from `user_metadata`

**Status:** Accepted  
**Date:** 2025-05-02

**Decision:**  
The `handle_new_user()` DB trigger (fires on `auth.users` INSERT) reads `raw_user_meta_data->>'role'` to set `profiles.role` automatically. For Google OAuth, the callback route explicitly sets the role via `supabase.auth.updateUser()` before the profile upsert.

**Reasoning:**
- Zero extra API call at signup — role flows through the auth payload
- Works for both email/password and OAuth providers
- `ON CONFLICT DO UPDATE` ensures idempotent operation

---

## ADR-015: Partner dashboard — Server Component + Client island

**Status:** Accepted  
**Date:** 2025-05-02

**Decision:**  
`/partner/dashboard/page.tsx` is a Server Component that fetches shop + scooter data server-side, then passes it as props to `DashboardClient.tsx` (Client Component). Availability toggles use the Supabase browser client directly from the Client Component.

**Reasoning:**
- Server Component = no loading flash for initial data (SSR)
- Client Component needed for toggle interactivity (optimistic UI)
- Same pattern used for `/explore` (proven)
- Avoids prop drilling deep — data boundary is clean at the page level

---

## ADR-016: Role-aware Navbar uses `useProfile` hook

**Status:** Accepted  
**Date:** 2025-05-02

**Decision:**  
The Navbar is a Client Component that reads the current profile via `useProfile` hook. Nav links, CTA button, and user dropdown all adapt based on `profile.role`.

**Consequences:**
- Tiny waterfall: auth → profile query → render (< 200ms on warm session)
- Alternative (Server Component Navbar) would require passing session as prop from every layout — more complex
- Acceptable for v1 given the scale
