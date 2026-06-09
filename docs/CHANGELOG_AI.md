# Koh Ride — AI Implementation Changelog

Records significant AI-assisted implementation work. Most recent first.

---

## 2026-06-09

### Fix: Hero mobile CTA positioning (ADR-032)
**Files:** `app/page.tsx`

Identified root cause of CTA appearing ~44px lower on real iPhone vs Chrome DevTools. The `<main>` wrapper in `layout.tsx` has `pt-safe` (`env(safe-area-inset-top)` ≈ 44px on iPhone, 0px in DevTools), which pushed the entire hero section down.

Fix: `style={{ marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))' }}` on the hero `<section>`. Single-line change. Also fixed secondary bug where the hero image had a white gap at the top of the screen on iPhone.

---

## 2026-06-08

### Feat: Partner dashboard — Support and Account sections (ADR-030)
**Files:** `app/partner/dashboard/DashboardClient.tsx`

Added Support (Feedback, Contact Us) and Account (Sign Out, Delete Account) sections at the bottom of the partner dashboard, mirroring the rider profile page. Delete Account links to `/profile` rather than duplicating the multi-step shop deletion flow.

### Fix: Back buttons — orange pill uniform design (ADR-023)
**Files:** Multiple partner and page files

Replaced all `ArrowLeft` back buttons with uniform pill style matching the Save button family. Created `components/ui/BackButton.tsx` client component wrapper for `router.back()` (used by server component pages that can't use `useRouter` directly).

### Fix: Feedback and Contact Us — back button + pt-16 (ADR-031)
**Files:** `app/feedback/page.tsx`, `app/contact-us/page.tsx`

Replaced "Home" links with `router.back()`. Added `pt-16` to outer divs (pages were hidden behind fixed 64px Navbar due to missing offset).

### Feat: Hero mobile CTA — glassmorphism button (ADR-029)
**Files:** `app/page.tsx`

Replaced solid orange CTA with warm amber-tinted glass button on mobile. Final style: `bg-[rgba(255,150,60,0.18)] backdrop-blur-[4px] border border-white/25`. Desktop unchanged.

### Fix: useProfile — no flash during same-user navigation (ADR-021)
**Files:** `hooks/useProfile.ts`

Changed `setProfile(null)` to `setProfile(prev => prev?.id === user.id ? prev : null)`. Eliminated brief `isShopOwner = false` flash on page navigation.

### Fix: Supabase Realtime — unique channel names (ADR-020)
**Files:** `hooks/useUnreadCount.ts`, `hooks/useUnreadReviewCount.ts`

Replaced hardcoded channel name with `useRef(\`channel-${Math.random().toString(36).slice(2)}\`)`. Added `cancelled` ref to prevent post-unmount state updates. Fixed `cannot add postgres_changes callbacks after subscribe()` errors.

### Audit: Apple Sign In security review (ADR-028)
**Files:** Various auth files (read-only audit)

Verified name persistence flow, shop owner onboarding correctness, and account deduplication behavior. Production readiness: 8.5/10. Two pre-submission requirements identified.

---

## 2026-06-07

### Feat: Messaging — delete conversation (ADR-024)
**Files:** Thread UI components, `app/actions/moderation.ts`

Added 3-dot ThreadMenu with confirmation modal. Server action verifies participant membership before hard-deleting `conversations` row (cascades to messages via FK).

### Feat: Map mobile UX — zone clusters and overlay card (ADR-018)
**Files:** Explore page, ScooterMap component, zone clustering logic

Implemented zone cluster behavior: multi-shop clusters → switch to list; single-shop zones → overlay card. Added `clusterShopIds: string[]` to `ZoneClusterData` for TYPE 2/3 shops. Disabled Mapbox popup on mobile (`showPopup={false}`).

### Fix: Zone detection — coordinates vs location text (ADR-019)
**Files:** Explore filter logic, shop settings map

Mirror `buildZoneClusters` logic in the explore filter. Auto-sync `location` dropdown when shop owner moves pin (`getNearestZone`).

### Feat: Opening hours dropdown component (ADR-025)
**Files:** `components/shop/OpeningHoursDropdown.tsx`

Two variants: `default` (clock + today's status) and `dot` (colored indicator). Bangkok timezone. Monday-first. Today's day in bold.

### Feat: Admin panel — screenshot controls (ADR-027)
**Files:** Admin panel components

Admin-only floating panels for App Store screenshot session overrides. Thread controls (context pills, timestamps, price/duration overrides) and Explore controls (screenshot pins, recommended sort).

### Feat: Apple Sign In — native id_token flow (ADR-017)
**Files:** Auth pages, Capacitor plugin integration

`@capacitor-community/apple-sign-in` → native iOS sheet → `supabase.signInWithIdToken()`. SHA-256 nonce, name persistence (first login only), `skipAutoRedirect` ref to prevent auth state race condition.

---

## 2025-05-02

### Feat: Multi-role auth — rider / shop_owner (ADR-013, ADR-014)
**Files:** Auth pages, DB triggers, profiles schema

Role stored in `profiles.role` + `auth.users.user_metadata.role`. Auth trigger reads `raw_user_meta_data->>'role'`. Google OAuth callback sets role explicitly. CHECK constraint at DB level.

### Feat: Partner dashboard — Server Component + Client island (ADR-015)
**Files:** `app/partner/dashboard/page.tsx`, `DashboardClient.tsx`

Server Component fetches shop + scooter data SSR. Client Component handles availability toggles with optimistic UI.

### Feat: Role-aware Navbar (ADR-016)
**Files:** `components/layout/Navbar.tsx`

Client Component reads `useProfile`. Nav links, CTA, and user dropdown adapt based on `profile.role`. Transparent in hero mode, snaps to solid at 96% scroll.

---

## 2025-05-01

### Init: Project scaffold
Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui + Radix, Supabase schema, Vercel config, PWA manifest.

Core pages: Home, Explore, Scooter detail, Checkout, Bookings, Profile.

Design system: tokens in `globals.css`, component library, animations.
