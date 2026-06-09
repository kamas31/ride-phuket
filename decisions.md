# Koh Ride — Architecture Decision Records

---

## ADR-001: Next.js App Router

**Status:** Accepted  
**Date:** 2026-05-01

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
**Date:** 2026-05-01

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
**Date:** 2026-05-01

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
**Date:** 2026-05-01

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
**Date:** 2026-05-01

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
**Date:** 2026-05-01

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
**Date:** 2026-05-01

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
**Date:** 2026-05-01

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
**Date:** 2026-05-01

**Decision:**  
`strict: true` in tsconfig.

**Reasoning:**
- Catches null/undefined bugs at compile time
- Critical for marketplace where data from external sources (Supabase) is always `T | null`
- Small friction now prevents large bugs later

---

## ADR-010: Vercel region — Singapore (sin1)

**Status:** Accepted  
**Date:** 2026-05-01

**Reasoning:**
- Closest Vercel region to Thailand
- Reduces latency for Thai users and Supabase (also Singapore)
- Southeast Asia edge coverage

---

## ADR-011: Payment strategy — cash first, Stripe later

**Status:** Accepted  
**Date:** 2026-05-01

**Reasoning:**
- Stripe requires business registration in Thailand
- Tourists often prefer to pay on delivery
- Cash/bank transfer is the Thai norm for scooter rentals
- Stripe added in Phase 2 once legal entity is set up
- PromptPay integration for local riders

---

## ADR-012: State management — React useState, no global store

**Status:** Accepted  
**Date:** 2026-05-01

**Reasoning:**
- v1 has no complex shared state
- Context API sufficient for auth
- Adding Zustand/Redux is premature optimization
- Re-evaluate when shop dashboard is built

---

## ADR-013: Multi-role auth — `rider` / `shop_owner` stored in `profiles.role`

**Status:** Accepted  
**Date:** 2026-05-02

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
**Date:** 2026-05-02

**Decision:**  
The `handle_new_user()` DB trigger (fires on `auth.users` INSERT) reads `raw_user_meta_data->>'role'` to set `profiles.role` automatically. For Google OAuth, the callback route explicitly sets the role via `supabase.auth.updateUser()` before the profile upsert.

**Reasoning:**
- Zero extra API call at signup — role flows through the auth payload
- Works for both email/password and OAuth providers
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
- Same pattern used for `/explore` (proven)
- Avoids prop drilling deep — data boundary is clean at the page level

---

## ADR-016: Role-aware Navbar uses `useProfile` hook

**Status:** Accepted  
**Date:** 2026-05-02

**Decision:**  
The Navbar is a Client Component that reads the current profile via `useProfile` hook. Nav links, CTA button, and user dropdown all adapt based on `profile.role`.

**Consequences:**
- Tiny waterfall: auth → profile query → render (< 200ms on warm session)
- Alternative (Server Component Navbar) would require passing session as prop from every layout — more complex
- Acceptable for v1 given the scale

---

## ADR-017: Sign in with Apple — native id_token flow via Capacitor

**Status:** Accepted  
**Date:** 2026-06-07

**Context:**  
App Store guideline 4.8 requires Sign in with Apple when any third-party login is offered. Google OAuth uses a browser redirect (`signInWithOAuth`) which is blocked by WKWebView on iOS. Needed a native flow.

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
- Apple only sends `givenName`/`familyName` on **first** sign-in; subsequent logins return null → `updateUser` is only called when non-null
- `completeOAuthProfile()` reads `user.user_metadata.full_name` — works because `updateUser` is awaited before the server action call
- `skipAutoRedirect` ref in login page prevents `onAuthStateChange` from racing with explicit navigation
- Signup page calls `completeOAuthProfile(role)` directly (role already chosen in Step 1) — skips `/auth/select-role`
- `isIOS()` guard: Apple button only shown on native iOS. Google button: web only. Email: all platforms.

**Supabase auto-linking:**  
When Apple email matches an existing Google/email account, Supabase merges identities → single `auth.users` record → no duplicate profile. Requires Supabase dashboard → "Link accounts to existing user" setting.

**Remaining manual steps (before App Store submission):**
1. `npx cap sync ios` on Mac
2. Xcode: add "Sign in with Apple" capability
3. Apple Developer Console: enable for App ID `com.kohride.app`, create Service ID + `.p8` key
4. Supabase Dashboard → Auth → Providers → Apple → configure

---

## ADR-018: Map mobile UX — zone clusters vs shop pins

**Status:** Accepted  
**Date:** 2026-06-07

**Context:**  
On mobile, the Explore page has separate List and Map tabs. Tapping a cluster should navigate to the filtered list; tapping a single shop should show a bottom card and stay on the map.

**Decision:**  
- Zone cluster (count > 1): fires `onZoneClick` → `setFilters(location)` + `setMobileView('list')`
- Single-shop zone cluster (count = 1, any TYPE): fires `onSelect(shopId)` instead of `onZoneClick` — stays on map, shows overlay card
- Shop overlay card: `absolute bottom-24 right-4 z-20` positioned outside ScooterMap's `overflow-hidden`, always visible while panning
- `showPopup={false}` on mobile ScooterMap — disables the Mapbox floating popup, overlay card handles display instead
- Switching back to Map tab: resets `filters.location`, `selectedId`, and `shopIdFilter` to clear all state

**Key fix — TYPE 2/3 shops (no precise pin):**  
`clusterShopIds: string[]` added to `ZoneClusterData` so single-shop zones without a precise pin can resolve their `shopId` and call `onSelect` correctly.

**"View scooters" button:**  
Sets local state (`shopIdFilter`, `mobileView('list')`) instead of navigating to `/explore?shopId=...` via URL. Avoids the stale-prop issue where `useEffect([initialShopId])` wouldn't re-fire for the same shop.

---

## ADR-019: Zone detection — coordinates vs location text

**Status:** Accepted  
**Date:** 2026-06-07

**Context:**  
After a shop owner moves their pin to a different zone (e.g., from Kata to Patong), their `scooter.location` text might still say "Kata". The explore filter used `getZoneForLocation(s.location)` which only reads the text field.

**Decision:**  
Mirror the `buildZoneClusters` logic in the explore filter: for shops with `hasPrecisePin = true` and `locationVisibility = 'exact'`, use `getNearestZone(s.lat, s.lng)` for zone detection. Others fall back to text.

Also: when a shop owner moves their map pin in shop settings, `getNearestZone(lat, lng)` auto-syncs the `location` dropdown to the nearest zone.

---

## ADR-020: Supabase Realtime — unique channel names per hook instance

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
`useUnreadCount` used a hardcoded channel name `'unread-count-shared'`. When mounted in multiple components simultaneously, Supabase returns the same already-subscribed channel object, causing `cannot add postgres_changes callbacks after subscribe()` errors.

**Decision:**  
Each hook instance generates a unique channel name via `useRef(`unread-count-${Math.random().toString(36).slice(2)}`)`. Added a `cancelled` ref to prevent state updates after unmount (async race condition fix).

**Files:** `hooks/useUnreadCount.ts`, `hooks/useUnreadReviewCount.ts`

---

## ADR-021: useProfile — keep profile during same-user navigation

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
`useProfile` started with `profile = null` and called `setProfile(null)` before every fetch. On page navigation, components remounted → brief `isShopOwner = false` → UI flashed rider state before correcting.

**Decision:**  
Change `setProfile(null)` to `setProfile(prev => prev?.id === user.id ? prev : null)`. Keeps the existing profile if the same user is navigating (no flash). Only clears when switching to a different account (security preserved).

**File:** `hooks/useProfile.ts`

---

## ADR-022: Page layout — pt-16 offset for fixed navbar

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
The global Navbar is `fixed top-0 h-16 z-50`. The `<main>` wrapper in `layout.tsx` has `pt-safe` (iOS safe-area inset only, NOT navbar height). Pages must account for the 64px navbar themselves.

**Correct patterns:**
1. `pt-16` on the page root div → content starts at y=64
2. `sticky top-16` as first child → self-positions at y=64 automatically

**Pages with confirmed issues (audit 2026-06-08):**
- `messages/ConversationList` — bare `<div>` no offset (critical)
- `faq/page.tsx` — hero section hidden under navbar
- `partner/page.tsx` — dark hero hidden
- `profile/ProfileClient`, `saved/SavedRidesContent` — header section potentially clipped
- `auth/login`, `auth/signup`, `auth/select-role`, `auth/reset-password` — custom top bar hidden under navbar, card visible by coincidence (top-bar height ≈ navbar height)
- `partner/bookings`, `partner/availability`, `partner/dashboard` — use `pt-20` internal padding which compensates, but is fragile

**Status:** Partially fixed. To be completed.

---

## ADR-023: Back button design — orange pill

**Status:** Accepted  
**Date:** 2026-06-08

**Decision:**  
All `ArrowLeft` back buttons use the same pill style, matching the Save button family:
```
flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
bg-[#FF6B35] text-white hover:bg-[#e85d29] transition-all active:scale-95
```

Back buttons in sticky `top-16` headers are consistent across: shop settings, scooter page, shop page, feedback, contact-us, terms, privacy, partner bookings, availability, new/edit scooter forms.

**`BackButton` component:** `components/ui/BackButton.tsx` — a client component wrapper for `router.back()`, used by server component pages (terms, privacy) that cannot use `useRouter` directly.

---

## ADR-024: Messaging — delete conversation

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
Added "Delete conversation" in the 3-dot ThreadMenu with a confirmation modal. Server action `deleteConversation` in `app/actions/moderation.ts` verifies the user is a participant before hard-deleting the `conversations` row. Cascades to messages via FK.

---

## ADR-025: Opening hours — expandable dropdown component

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
`OpeningHoursDropdown` component (`components/shop/OpeningHoursDropdown.tsx`) replaces static hour display. Two variants:
- `variant="default"`: clock icon + today's status (used in shop contact card)
- `variant="dot"`: colored dot (used in scooter card shop section)

Clicking expands all 7 days (Monday-first, like Google Maps). Bangkok timezone (`Asia/Bangkok`) for "open/closed" state. Today's day highlighted in bold.

---

## ADR-026: i18n — defer to post-launch

**Status:** Deferred  
**Date:** 2026-06-08

**Context:**  
App targets Phuket market with riders from France, Russia, Thailand. Full i18n would require ~1,500-2,000 translatable strings, `next-intl`, URL prefix routing (`/fr/`, `/th/`, `/ru/`), and 10-17 days of work.

**Decision:**  
Submit App Store in English only (Apple does not require multilingual for approval). Add Thai first (primary market, simplest) as a v1.1 post-launch update. French and Russian in v1.2+ if demand justifies.

**Reasoning:**  
App is evolving rapidly. i18n maintenance during active development adds ~30-40% overhead per feature. Better to ship English → validate → localize.

---

## ADR-027: Admin panel — thread/explore controls

**Status:** Accepted  
**Date:** 2026-06-07

**Decision:**  
Admin-only floating panels (guarded by `useProfile().isAdmin + useAdminPanelVisible()`) provide runtime overrides for:
- **Thread page** (`AdminThreadControl`): show/hide context pills, timestamps, price override, duration override (Day/Wk/Mo)
- **Explore page**: screenshot pins, recommended sort toggle

Panels are `fixed bottom-24 right-4 z-[9000]` dark overlays. Used for App Store screenshots. Overrides are session-only (not persisted to DB by default).

**Note:** Resetting DB admin overrides requires running SQL directly in Supabase dashboard — see conversation history for the exact query.

---

## ADR-028: Apple Sign In — security audit findings

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
Deep audit of the Apple Sign In implementation (name persistence, shop owner onboarding, account deduplication) following the initial implementation in ADR-017.

**Name persistence — verified correct:**
- Apple JWT does NOT contain name claims. Name comes separately in the plugin response (`response.givenName`, `response.familyName`), present only on the first sign-in.
- `updateUser({ data: { full_name } })` is called immediately after `signInWithIdToken()` and before the profile check. Because it is `await`-ed, the cookie is updated before `completeOAuthProfile()` runs on the server.
- On subsequent sign-ins: Apple returns null for both name fields → `updateUser` is never called → `profiles.name` is preserved forever.
- `on_auth_user_updated` DB trigger (migration 007): safe because Supabase merges metadata (does not replace), so `role` is preserved in `raw_user_meta_data` across `updateUser` calls.
- **Fix applied:** `updateUser` return value now checked; error logged non-fatally (was silently ignored).

**Shop owner onboarding — verified correct:**
- Signup page: `completeOAuthProfile('shop_owner')` called directly with the chosen role (skips `/auth/select-role`). Profile created with correct role.
- Login page new user: routed to `/auth/select-role` — user picks role there. No hint passed (minor UX: pre-selects 'rider' by default).
- `/partner/dashboard` guarded server-side: `if (!profile || profile.role !== 'shop_owner') redirect('/')`.
- No accidental rider assignment possible. `profiles.id` PRIMARY KEY enforces one profile per auth user.

**Deduplication:**
- Same email across providers (Google → Apple): Supabase auto-links → single `auth.users` → profile found → `isNewUser: false` → no duplicate.
- Apple "Hide My Email" → different email → two accounts by design. Unavoidable; acceptable.
- Email/password → Apple same email: safe IF Supabase dashboard → Auth → "Duplicate email behavior" = **"Link accounts to existing user"** (default). Must be verified before submission.
- `completeOAuthProfile` has idempotency guard (`if (!existing) { insert }`); DB PRIMARY KEY enforces no duplicate profiles.

**Production readiness: 8.5/10.**  
Two pre-submission requirements: (1) test on physical iPhone, (2) verify Supabase duplicate email policy.

---

## ADR-029: Hero mobile CTA — glassmorphism button

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
The original solid orange `#FF6B35` CTA button on the mobile hero was visually too heavy ("tâche") on the scenic sunset background.

**Decision:**  
Replace solid orange with a warm amber-tinted glass button on mobile only (`md:hidden` section). Desktop CTA unchanged.

**Final style:**
```
bg-[rgba(255,150,60,0.18)] backdrop-blur-[4px]
border border-white/25
shadow-[0_2px_20px_rgba(0,0,0,0.3)]
text-white font-bold
```

**Reasoning:**
- Warm amber tint (rgba 255,150,60) matches the sunset hero colors — button feels part of the scene
- 4px blur: gives depth without obscuring the hero image
- White border (25% opacity): defines shape without drawing attention
- Dark drop shadow: anchors the button visually
- Desktop button stays solid orange (correct on white background)

**Position:** `mt-20` below the subtitle text, separated from the text block (`opacity-0` with staggered `fade-up` animation at 0.25s delay vs 0.1s for text).

---

## ADR-030: Partner dashboard — Support and Account sections

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
Shop owners had no way to access Feedback, Contact Us, Sign Out, or Delete Account from the partner dashboard. They had to navigate to the rider profile page.

**Decision:**  
Added Support and Account sections at the bottom of `DashboardClient.tsx`, mirroring the rider profile page sections.

**Structure:**
- **Support:** Feedback → `/feedback`, Contact Us → `/contact-us`
- **Account:** Sign Out (calls `useAuth().signOut()` directly), Delete Account (links to `/profile` where the full shop owner deletion request flow exists)

**Reasoning:**  
Delete Account was not duplicated inline because the shop owner deletion flow (`requestShopAccountDeletion`) has a multi-step confirmation UI that's already fully built on the profile page. Linking there avoids duplication and reduces maintenance risk.

---

## ADR-031: Feedback and Contact Us pages — back button and layout fix

**Status:** Accepted  
**Date:** 2026-06-08

**Context:**  
Both pages had a "Home" link (→ `/`) as the back button. The link was also hidden behind the fixed 64px navbar because the page outer div lacked `pt-16`.

**Decision:**
1. Replace `<Link href="/">Home</Link>` with `<button onClick={() => router.back()}>Back</button>` — returns to the actual previous page (dashboard, profile, etc.)
2. Add `pt-16` to the outer `min-h-screen` div so the back button is visible below the fixed navbar.

**Root cause of invisible top bar:**  
`app/layout.tsx` wraps pages in `<main className="pt-safe ...">` — `pt-safe` is iOS safe area inset only (≈0 on non-iOS). Pages must add `pt-16` themselves to account for the 64px fixed Navbar. The top bar div (approx 40px tall) was hidden under the navbar; the card appeared correctly below the navbar only by coincidence (top bar height ≈ navbar height).
