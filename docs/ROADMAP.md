# Koh Ride — Roadmap
Last updated: 2026-06-29 (session 19)

---

## DONE

### Product
- [x] Next.js 15 App Router scaffold
- [x] TypeScript strict mode
- [x] Tailwind CSS v4 (CSS-first, all tokens in globals.css)
- [x] Design system (tokens, components, shadcn/ui + Radix)
- [x] Supabase integration (Auth, DB, Storage, Realtime)
- [x] Singleton Supabase client (fixed major auth incident)

### Pages
- [x] Home page (Hero, How it works, Featured scooters, Areas, Benefits, CTA)
- [x] Explore page (map + list + filters, mobile tabs)
- [x] Scooter detail page
- [x] Shop profile page
- [x] Checkout / booking flow
- [x] Bookings history
- [x] Profile page (rider)
- [x] Partner dashboard (shop owner)
- [x] Partner messages
- [x] Partner availability
- [x] Partner scooter management (add/edit)
- [x] Messages / conversations (rider)
- [x] Saved scooters
- [x] FAQ page
- [x] Contact Us page
- [x] Feedback page
- [x] Terms & Conditions
- [x] Privacy Policy
- [x] Auth pages (login, signup, select-role, reset-password, OAuth callback)
- [x] Admin panel (screenshot controls for App Store)
- [x] Location SEO pages (9 zones)

### Features
- [x] Multi-role auth (rider / shop_owner)
- [x] Google OAuth
- [x] Apple Sign In (code complete, not activated)
- [x] Messaging system (chat-first, context switches)
- [x] Delete conversation
- [x] Map clustering (Airbnb-style, 3 location types)
- [x] Mobile map UX (zone clusters, overlay card, list tab)
- [x] Favorites
- [x] Shop banners (desktop + mobile)
- [x] Opening hours dropdown component
- [x] Unread message badges
- [x] Realtime (unique channel names per hook instance)
- [x] Navbar (transparent hero, role-aware, search overlay)
- [x] Mobile bottom nav
- [x] Back buttons (orange pill, uniform, router.back())
- [x] SEO (metadata, OG, canonical, sitemap, robots, structured data, FAQ schema)
- [x] Email via Resend
- [x] Playwright tests (54 passed, 0 failed)
- [x] Vercel deploy (region: sin1)
- [x] App Store screenshots (5 screens)
- [x] Hero glassmorphism CTA (mobile)
- [x] Hero mobile positioning fix (safe-area offset correction, ADR-032)
- [x] Partner dashboard Support + Account sections
- [x] Deposit section: removed redundant passport hints (DepositInfo.tsx)
- [x] Filters modal: fixed sticky header/footer z-index bug (ExploreFilters.tsx)
- [x] docs/ structure created (PROJECT_CONTEXT, DECISIONS, ROADMAP, CHANGELOG_AI)
- [x] Desktop map: overlay card identique au mobile (ADR-034)
- [x] Desktop map: suppression zone count card sur cluster click
- [x] CLAUDE.md: règle mise à jour docs/ après chaque changement
- [x] Hero CTA design final: orange #FF6B35, clamp spacing, w-auto pill, py-8px centré (ADR-035)
- [x] Hero diagnostics overlay (temporaire, à retirer avant App Store)
- [x] Messages headers: BackButton + titre centré (rider + shop owner)
- [x] Swipe-to-delete conversations: iOS fix (passive:false + touch-action:pan-y)
- [x] Shop owner messages: ConversationList partagé, swipe-to-delete actif (ADR-036)
- [x] Hero diagnostics overlay supprimé
- [x] Terms of Service v2 — 6 additions + 2 correctifs (startup-ready)
- [x] Privacy Policy v2 — 6 additions + 2 correctifs (public launch ready)
- [x] Bottom nav shop owner: "Live" → "Listings"
- [x] Bottom nav rider: icône Saved Bookmark → Heart
- [x] SEO audit: canonical fix /terms et /privacy (ADR-040)
- [x] SEO audit: noindex /contact via route layout (ADR-040)
- [x] SEO audit: lien /locations dans homepage empty state (ADR-041)
- [x] Pre-launch: suppression tooling dev screenshots (app/dev/, admin-dev-shops, AdminDevShopsPanel)
- [x] Apple crash fix: NSCameraUsageDescription + NSPhotoLibraryUsageDescription dans Info.plist
- [x] Fix: email/password login — hard navigation post-login (router cache Next.js, ADR-042)
- [x] Native geolocation Explore — @capacitor/geolocation, "Near me", marqueur bleu, tri Haversine (ADR-043)
- [x] Native push notifications — APNS HTTP/2 direct, warm-up prompt Messages, CapacitorProvider tap handler (ADR-044)
- [x] Admin-created unclaimed shops — Phase 1: migration 050, adminCreateShop, scooter admin bypass, /admin/shops UI, messaging fallback (ADR-045)
- [x] Admin manual shop claim by owner email — Phase 2A: migration 051, adminClaimShopByEmail, ClaimShopSection UI (ADR-052)
- [x] SEO V1.1: robots.txt `/contact-us` indexing fix + model landing pages `/models/pcx`, `/models/nmax`, `/models/adv` (ADR-053)
- [x] SEO V1.2: extended model pages to `/models/xadv`, `/models/forza`, `/models/xmax`, `/models/click`, `/models/lead` (ADR-055)
- [x] Structured brand → model → engine-size dropdowns on scooter create/edit forms (ADR-056)
- [x] PostHog product/marketing analytics — full implementation: wrapper, attribution, session replay/heatmaps/feature-flag scaffolding, dual-dispatch event taxonomy, zero frontend/Capacitor changes (ADR-059)
- [x] iOS push notification delivery fix — production logs proved 100% APNs timeout rate on the raw `node:http2` transport; replaced with the `apns2` library in `app/actions/messaging.ts` (same env vars, same connect/send/close lifecycle), temporary diagnostic endpoint deleted (ADR-060)
- [x] iOS push permission prompt fix — `rp_push_prompted` localStorage flag could permanently block `requestPermissions()` after an app delete/reinstall (remote-URL WKWebView storage can survive uninstall); `checkPush()` in `ConversationList.tsx` now trusts live OS permission state first (ADR-061)
- [x] SEO V1.3: Yamaha TMAX model page (`/models/tmax`), X-ADV + TMAX added to footer Popular Models (ADR-062)
- [x] "Which Scooter Should You Rent?" quiz (`/which-scooter`) — category-based recommendation engine, homepage teaser section, QA-verified against 10 rider profiles (ADR-063)

---

## IN PROGRESS

- [ ] Apple resubmission (Guideline 4.2): Phase 1 (geolocation) + Phase 2 (push) **confirmed working end-to-end**; archive needed
- [ ] **Remaining steps before resubmission:**
  - Run migration 049 in Supabase Dashboard → SQL Editor (drops debug table `push_debug_log`)
  - `npx cap sync ios`
  - Archive for TestFlight then App Store
- [ ] Apple Developer account setup
- [ ] Apple Sign In activation (Apple Dev Console + Supabase config)
- [ ] Run migration 050 in Supabase Dashboard → SQL Editor (admin-created unclaimed shops, ADR-045)
- [ ] Run migration 051 in Supabase Dashboard → SQL Editor (`find_profile_id_by_email`, required for Phase 2A claim to work, ADR-052; now also includes the P1-2 REVOKE EXECUTE fix, ADR-054)
- [ ] Run migration 052 in Supabase Dashboard → SQL Editor (profiles privilege-escalation protection trigger, P0-1/P0-2, ADR-054)
- [ ] Unclaimed shops Phase 2B (not started): owner invite email, claim token, self-serve claim flow

---

## NEXT (pre-launch)

- [ ] **Verify the `apns2` transport fix in production** — watch the new structured `[APNS]` logs (success/rejected/timeout/transport-error) after the next real push to confirm the timeout issue is actually resolved, not just transport-swapped (ADR-060)
- [ ] **Remove `APNS_DEBUG_SECRET` from Vercel's dashboard env vars** if it was ever added during the diagnostic phase — it has zero code consumers now (ADR-060)
- [ ] **Device-test the push permission prompt fix on a real delete/reinstall cycle** — confirm the prompt now appears and Settings → Koh Ride → Notifications gets created (ADR-061); on a Mac session, also verify Xcode's Push Notifications capability/`aps-environment` entitlement are configured (unverifiable from this repo since `ios/` isn't checked in)
- [ ] **Sentry: set env vars** in Vercel (DSN, AUTH_TOKEN, ORG, PROJECT) — score goes 2.5→7/10 instantly
- [ ] **Sentry: create `instrumentation-client.ts`** + add `Sentry.setUser()` in useAuth
- [ ] **PostHog: set `NEXT_PUBLIC_POSTHOG_KEY`/`NEXT_PUBLIC_POSTHOG_HOST` env vars** in Vercel — code ships silently no-op'd until set (ADR-059)
- [ ] Physical iPhone testing (TestFlight)
- [ ] Verify Supabase "Link accounts to existing user" setting
- [ ] TestFlight distribution
- [ ] App Store submission

---

## AFTER LAUNCH

- [ ] Recruit shops (Phuket outreach)
- [ ] Grow scooter inventory
- [ ] SEO growth (more scooters, shops, reviews, backlinks)
- [ ] Shop reviews system
- [ ] SEO V1.1/V1.2 follow-ups (not in either round's scope, see ADR-053/ADR-055):
  - [ ] `/models` hub/index page — 9 model pages now live with no index linking them together; unblocks a real 3-level breadcrumb (Home → Models → X)
  - [ ] `/explore` model filter chips + `CollectionPage`/`ItemList` schema
  - [ ] ADV 160/350 sub-page split once volume justifies it (currently absorbed into `/models/adv`)
  - [ ] Commercial pages (airport, monthly, no-deposit) — blocked on shop-owner validation (airport) and fill-rate decisions (monthly/no-deposit), see `seo-agent/V2_IMPLEMENTATION_PLAN.md`
- [ ] Structured brand/model taxonomy follow-ups (not in this round's scope, see ADR-056):
  - [ ] Historical data cleanup — re-case the pre-existing lowercase brand/model rows and the two `"...cc"`-suffixed engine rows not yet re-saved through the new dropdowns (mostly happens automatically as shop owners re-save listings, per ADR-056)
  - [ ] Manually review and correct the one `brand="Honda"`/`model="XMAX"` data-entry error found in the audit (real model is a Yamaha XMAX)
  - [ ] Authenticated Playwright coverage for `NewScooterForm`/`EditScooterForm` (no test fixture exists yet for the shop-owner auth flow)
  - [ ] Revisit `model_normalized`/`model_slug` columns only if free-text "Other" entries accumulate enough volume to justify the migration risk

---

## LATER (post-validation)

- [ ] Monetization (subscription tiers)
- [ ] Thai localization (i18n v1.1)
- [ ] French/Russian localization (v1.2+)
- [ ] PromptPay integration
- [ ] Stripe integration
- [ ] Real Mapbox (currently implemented)
- [ ] WhatsApp Business API notifications
- [ ] PostHog follow-ups (not in ADR-059's scope, future improvements):
  - [ ] Close the narrow first-paint session-recording window on cold landings on a blocked route (`before_send` interception or future SDK client-side `urlBlocklist` support)
  - [ ] Add a TTL/clear mechanism for scooter/shop session properties so they can't tag an unrelated event if a user navigates away before the next page re-registers context
  - [ ] Use feature flags for actual experiments (scaffolding is live, no flags created yet)
  - [ ] Build founder-facing PostHog dashboards/cohorts now that events are flowing
- [ ] "Which Scooter?" quiz follow-ups (not in ADR-063's scope, future improvements):
  - [ ] Track quiz-completion and recommendation-click PostHog events once the page has real traffic
  - [ ] Personalize the alternates' explanation text the same way the best-match card now does
  - [ ] Link `/which-scooter` from the footer once it has proven traffic (currently only linked from the homepage teaser)
