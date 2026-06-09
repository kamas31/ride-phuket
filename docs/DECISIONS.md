# Koh Ride — Architecture Decision Records

---

## ADR-001: Next.js App Router

**Status:** Accepted  
**Date:** 2026-05-01

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
**Date:** 2026-05-01

**Decision:**  
Supabase as the BaaS layer.

**Reasoning:**
- PostgreSQL = powerful, battle-tested, supports PostGIS for geo queries
- Supabase Auth = built-in email, OAuth, magic links
- Row Level Security = data access enforced at DB level
- Storage = built-in S3-compatible for images and documents
- Realtime = booking status updates without polling

**Alternatives considered:**  
Firebase (NoSQL — poor for relational marketplace data), PlanetScale (no auth/storage), custom Postgres + Prisma (too much infra work).

---

## ADR-003: Tailwind CSS v4 (no separate config file)

**Status:** Accepted  
**Date:** 2026-05-01

**Decision:**  
Use Tailwind v4 CSS-first configuration. All design tokens in `globals.css`.

**Reasoning:**
- Simpler setup, faster builds
- All tokens colocated in CSS
- CSS custom properties work everywhere (including inline styles)

**Tradeoff:**  
Less familiar for devs used to v3. Some plugins may not be compatible yet.

---

## ADR-004: shadcn/ui + Radix UI for components

**Status:** Accepted  
**Date:** 2026-05-01

**Decision:**  
Use Radix UI primitives with custom Tailwind styling, following the shadcn/ui pattern.

**Reasoning:**
- Full control over styling
- Accessibility built-in (keyboard nav, ARIA)
- No class conflicts with Tailwind

**Alternatives considered:**  
Material UI (too opinionated), Chakra (v3 breaking changes), Ant Design (too corporate).

---

## ADR-005: Client-side filtering on Explore page

**Status:** Accepted  
**Date:** 2026-05-01

**Decision:**  
Use `useMemo` with local state for filtering on the client. Data fetched once from Supabase, filtered in-browser.

**Reasoning:**
- MVP has < 500 scooters — client-side is fast enough
- Avoids round-trips to server on each filter change

**Future:**  
When fleet grows to 1000+ scooters, move to server-side filtering with URL params.

---

## ADR-006: Map strategy — placeholder first, Mapbox later

**Status:** Accepted  
**Date:** 2026-05-01

**Decision:**  
Build a visual map placeholder with pinned price markers. Replace with real Mapbox implementation in Phase 2.

**Reasoning:**
- Unblocks UI development without map API setup
- Mapbox GL JS adds ~250KB — defer until needed

---

## ADR-007: Mobile-first, no dark mode in v1

**Status:** Accepted  
**Date:** 2026-05-01

**Decision:**  
Mobile-first responsive design. No dark mode in v1.

**Reasoning:**
- 80%+ of traffic will be mobile
- Dark mode doubles the style surface area
- Can add dark mode in v2 once design is stable

---

## ADR-008: Routing structure

**Status:** Accepted  
**Date:** 2026-05-01

**Decision:**
```
/                → Home (landing)
/explore         → Map + grid + filters
/scooter/[id]   → Scooter detail + booking CTA
/checkout        → 2-step booking form
/bookings        → User booking history
/profile         → User account
/shop/[slug]     → Shop profile
/partner         → Shop owner dashboard
```

---

## ADR-009: TypeScript strict mode

**Status:** Accepted  
**Date:** 2026-05-01

**Decision:**  
`strict: true` in tsconfig.

**Reasoning:**
- Catches null/undefined bugs at compile time
- Critical for marketplace where data from external sources (Supabase) is always `T | null`

---

## ADR-010: Vercel region — Singapore (sin1)

**Status:** Accepted  
**Date:** 2026-05-01

**Reasoning:**
- Closest Vercel region to Thailand
- Reduces latency for Thai users and Supabase (also Singapore)

---

## ADR-011: Payment strategy — cash first, Stripe later

**Status:** Accepted  
**Date:** 2026-05-01

**Reasoning:**
- Stripe requires business registration in Thailand
- Tourists often prefer to pay on delivery
- Cash/bank transfer is the Thai norm for scooter rentals
- PromptPay integration for local riders in Phase 2

---

## ADR-012: State management — React useState, no global store

**Status:** Accepted  
**Date:** 2026-05-01

**Reasoning:**
- v1 has no complex shared state
- Context API sufficient for auth
- Adding Zustand/Redux is premature optimization

---

## ADR-013: Multi-role auth — `rider` / `shop_owner` stored in `profiles.role`

**Status:** Accepted  
**Date:** 2026-05-02

**Decision:**  
Store `role` as a TEXT column on `public.profiles` with a CHECK constraint (`rider` | `shop_owner`). Role is also written to `auth.users.user_metadata.role` at signup time.

**Reasoning:**
- `profiles.role` is the source of truth for all DB-level queries and RLS policies
- `user_metadata.role` is used by the Next.js proxy (middleware) to check roles from the JWT without a DB call
- Two-source approach: fast for edge routing, accurate for DB
- `COALESCE(raw_user_meta_data->>'role', 'rider')` in trigger ensures all users get a default

**Consequences:**
- If role needs to change later, update both `profiles.role` AND `user_metadata`

---

## ADR-014: Auth trigger reads role from `user_metadata`

**Status:** Accepted  
**Date:** 2026-05-02

**Decision:**  
The `handle_new_user()` DB trigger reads `raw_user_meta_data->>'role'` to set `profiles.role` automatically. For Google OAuth, the callback route explicitly sets the role via `supabase.auth.updateUser()` before the profile upsert.

**Reasoning:**
- Zero extra API call at signup — role flows through the auth payload
- `ON CONFLICT DO UPDATE` ensures idempotent operation

---

## ADR-015: Partner dashboard — Server Component + Client island

**Status:** Accepted  
**Date:** 2026-05-02

**Decision:**  
`/partner/dashboard/page.tsx` is a Server Component that fetches shop + scooter data server-side, then passes it as props to `DashboardClient.tsx` (Client Component). Availability toggles use the Supabase browser client directly from the Client Component.

**Reasoning:**
- Server Component = no loading flash for initial data (SSR)
- Client Component needed for toggle interactivity (optimistic UI)

---

## ADR-016: Role-aware Navbar uses `useProfile` hook

**Status:** Accepted  
**Date:** 2026-05-02

**Decision:**  
The Navbar is a Client Component that reads the current profile via `useProfile` hook. Nav links, CTA button, and user dropdown all adapt based on `profile.role`.

**Consequences:**
- Tiny waterfall: auth → profile query → render (< 200ms on warm session)

---

## ADR-017: Sign in with Apple — native id_token flow via Capacitor

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
Use `@capacitor-community/apple-sign-in` (v7.1.0) to trigger the native iOS sheet, receive an `identityToken` JWT, pass it to `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })`.

**Architecture:**
```
Native Apple sheet
→ identityToken + givenName/familyName (first login only)
→ supabase.signInWithIdToken() — establishes session client-side
→ updateUser({ full_name }) — saves name (Apple sends it only once)
→ profile check: new user → /auth/select-role or completeOAuthProfile()
→ returning user → route by existingRole
```

**Key implementation details:**
- Cryptographic nonce (SHA-256) generated per request to prevent replay attacks
- Apple only sends `givenName`/`familyName` on first sign-in; subsequent logins return null
- `skipAutoRedirect` ref in login page prevents `onAuthStateChange` from racing with explicit navigation
- `isIOS()` guard: Apple button only shown on native iOS

**Remaining manual steps (before App Store submission):**
1. `npx cap sync ios` on Mac
2. Xcode: add "Sign in with Apple" capability
3. Apple Developer Console: enable for App ID `com.kohride.app`, create Service ID + `.p8` key
4. Supabase Dashboard → Auth → Providers → Apple → configure

---

## ADR-018: Map mobile UX — zone clusters vs shop pins

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**
- Zone cluster (count > 1): fires `onZoneClick` → `setFilters(location)` + `setMobileView('list')`
- Single-shop zone cluster (count = 1): fires `onSelect(shopId)` — stays on map, shows overlay card
- Shop overlay card: `absolute bottom-24 right-4 z-20` positioned outside ScooterMap's `overflow-hidden`
- `showPopup={false}` on mobile ScooterMap — disables Mapbox popup, overlay card handles display
- `clusterShopIds: string[]` added to `ZoneClusterData` for TYPE 2/3 shops without precise pins

---

## ADR-019: Zone detection — coordinates vs location text

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
Mirror the `buildZoneClusters` logic in the explore filter: for shops with `hasPrecisePin = true` and `locationVisibility = 'exact'`, use `getNearestZone(s.lat, s.lng)` for zone detection. Others fall back to text. When a shop owner moves their map pin, `getNearestZone` auto-syncs the `location` dropdown.

---

## ADR-020: Supabase Realtime — unique channel names per hook instance

**Status:** Accepted  
**Date:** 2026-06-08

**Decision:**  
Each hook instance generates a unique channel name via `useRef(\`unread-count-${Math.random().toString(36).slice(2)}\`)`. Added a `cancelled` ref to prevent state updates after unmount.

**Reason:** Hardcoded channel name caused `cannot add postgres_changes callbacks after subscribe()` errors when mounted in multiple components simultaneously.

**Files:** `hooks/useUnreadCount.ts`, `hooks/useUnreadReviewCount.ts`

---

## ADR-021: useProfile — keep profile during same-user navigation

**Status:** Accepted  
**Date:** 2026-06-08

**Decision:**  
Change `setProfile(null)` to `setProfile(prev => prev?.id === user.id ? prev : null)`. Keeps the existing profile if the same user is navigating (no flash). Only clears when switching to a different account.

**File:** `hooks/useProfile.ts`

---

## ADR-022: Page layout — pt-16 offset for fixed navbar

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
The global Navbar is `fixed top-0 z-50`. The `<main>` wrapper in `layout.tsx` has `pt-safe` (iOS safe-area inset only, NOT navbar height). Pages must account for the 64px navbar themselves.

**Correct patterns:**
1. `pt-16` on the page root div → content starts at y=64
2. `sticky top-16` as first child → self-positions at y=64 automatically

Note: The Hero section does NOT use `pt-16` — it handles its own top spacing via internal padding.

---

## ADR-023: Back button design — orange pill

**Status:** Accepted  
**Date:** 2026-06-08

**Decision:**  
All `ArrowLeft` back buttons use the same pill style:
```
flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
bg-[#FF6B35] text-white hover:bg-[#e85d29] transition-all active:scale-95
```

**`BackButton` component:** `components/ui/BackButton.tsx` — a client component wrapper for `router.back()`, used by server component pages (terms, privacy) that cannot use `useRouter` directly.

---

## ADR-024: Messaging — delete conversation

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
"Delete conversation" in the 3-dot ThreadMenu with a confirmation modal. Server action `deleteConversation` in `app/actions/moderation.ts` verifies the user is a participant before hard-deleting the `conversations` row. Cascades to messages via FK.

---

## ADR-025: Opening hours — expandable dropdown component

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
`OpeningHoursDropdown` component (`components/shop/OpeningHoursDropdown.tsx`). Two variants:
- `variant="default"`: clock icon + today's status (shop contact card)
- `variant="dot"`: colored dot (scooter card)

Bangkok timezone (`Asia/Bangkok`). Today's day highlighted in bold. Monday-first like Google Maps.

---

## ADR-026: i18n — defer to post-launch

**Status:** Deferred  
**Date:** 2026-06-08

**Decision:**  
Submit App Store in English only. Add Thai first as v1.1 post-launch. French and Russian in v1.2+ if demand justifies.

**Reasoning:**  
~1,500-2,000 strings, 10-17 days of work. i18n maintenance during active development adds ~30-40% overhead per feature. Better to ship English → validate → localize.

---

## ADR-027: Admin panel — thread/explore controls

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
Admin-only floating panels (guarded by `useProfile().isAdmin + useAdminPanelVisible()`) for App Store screenshot controls. Session-only overrides (not persisted).

Panels are `fixed bottom-24 right-4 z-[9000]`.

---

## ADR-028: Apple Sign In — security audit findings

**Status:** Accepted  
**Date:** 2026-06-08

**Key findings (all verified correct):**
- Name persistence: `updateUser({ full_name })` awaited before profile check. Only called when non-null (Apple sends name on first sign-in only).
- Shop owner onboarding: signup page calls `completeOAuthProfile('shop_owner')` directly.
- Deduplication: Supabase auto-links same email across providers. Requires "Link accounts to existing user" setting in Supabase dashboard.

**Production readiness: 8.5/10.**  
Two pre-submission requirements: (1) test on physical iPhone, (2) verify Supabase duplicate email policy.

---

## ADR-029: Hero mobile CTA — glassmorphism button

**Status:** Accepted  
**Date:** 2026-06-08

**Decision:**  
Replace solid orange with warm amber-tinted glass button on mobile only (`md:hidden` section).

**Final style:**
```
bg-[rgba(255,150,60,0.18)] backdrop-blur-[4px]
border border-white/25
shadow-[0_2px_20px_rgba(0,0,0,0.3)]
text-white font-bold
```

Desktop button stays solid orange.

---

## ADR-030: Partner dashboard — Support and Account sections

**Status:** Accepted  
**Date:** 2026-06-08

**Decision:**  
Added Support and Account sections at the bottom of `DashboardClient.tsx`.
- Support: Feedback → `/feedback`, Contact Us → `/contact-us`
- Account: Sign Out (inline), Delete Account → `/profile` (existing flow, not duplicated)

---

## ADR-031: Feedback and Contact Us pages — back button and layout fix

**Status:** Accepted  
**Date:** 2026-06-08

**Decision:**
1. Replace `<Link href="/">Home</Link>` with `<button onClick={() => router.back()}>Back</button>`
2. Add `pt-16` to the outer `min-h-screen` div

**Root cause:** `app/layout.tsx` wraps pages in `<main className="pt-safe ...">` — `pt-safe` is iOS safe area inset only (≈0 on non-iOS). Pages must add `pt-16` themselves for the 64px fixed Navbar.

---

## ADR-032: Hero mobile positioning — negate main's pt-safe

**Status:** Accepted  
**Date:** 2026-06-09

**Context:**  
The CTA button appeared ~44px lower on real iPhone than in Chrome DevTools mobile emulation. Root cause: `<main>` in `layout.tsx` has `pt-safe` = `padding-top: env(safe-area-inset-top, 0px)`. On iPhone this is ~44px; Chrome DevTools returns 0px by default.

This pushed the hero `<section>` down by 44px on iPhone, shifting the CTA down by the same amount.

Secondary finding: the hero image also started 44px below screen top on iPhone, leaving a white gap behind the transparent Navbar.

**Decision:**  
Add `style={{ marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))' }}` to the hero `<section>`. This cancels the main's offset for the hero only.

**Result:**
- Chrome DevTools: `calc(-1 * 0px)` = 0 → no change
- iPhone real: `calc(-1 * 44px)` = -44px → section at screen y=0
- CTA at same visual position on all environments
- Hero image fills full screen including behind status bar (correct native app behavior)

**Note:** On iPhone, the inner div's `pt-24` (96px) places the text block at y=96, while the Navbar (44px safe area + 64px content) extends to y=108 — 12px overlap. Visually invisible because the Navbar is transparent in hero mode.

**File modified:** `app/page.tsx`
