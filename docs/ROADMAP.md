# Koh Ride — Roadmap
Last updated: 2026-06-10

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

---

## IN PROGRESS

- [ ] Apple Developer account setup
- [ ] Apple Sign In activation (Apple Dev Console + Supabase config)

---

## NEXT (pre-launch)

- [ ] **Sentry: set env vars** in Vercel (DSN, AUTH_TOKEN, ORG, PROJECT) — score goes 2.5→7/10 instantly
- [ ] **Sentry: create `instrumentation-client.ts`** + add `Sentry.setUser()` in useAuth
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

---

## LATER (post-validation)

- [ ] Monetization (subscription tiers)
- [ ] Thai localization (i18n v1.1)
- [ ] French/Russian localization (v1.2+)
- [ ] PromptPay integration
- [ ] Stripe integration
- [ ] PostHog analytics
- [ ] Real Mapbox (currently implemented)
- [ ] WhatsApp Business API notifications
