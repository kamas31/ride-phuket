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

---

## ADR-037: Hero CTA — root cause investigation (statusBarStyle)

**Status:** Accepted (investigation, pas encore résolu)
**Date:** 2026-06-11

**Problème rencontré :**
Le CTA du hero apparaît ~44px plus bas sur iPhone réel que dans Chrome DevTools (émulation iPhone 13 Mini).

**Première hypothèse (incorrecte) :**
La cause était `pt-safe` sur `<main>` (`padding-top: env(safe-area-inset-top, 0px)`). Fix appliqué : `marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))'` sur la section hero.

**Résultat : aucun changement visible.**

**Cause racine réelle (confirmée via HeroDiagnostics overlay) :**
L'utilisateur teste via **Safari "Add to Home Screen"** (PWA), pas via l'app Capacitor native.

Mesures sur iPhone réel :
- `innerHeight` = 762px (pas 812px)
- `env(safe-area-inset-top)` = 0px
- `100dvh` = 762px

Avec `apple-mobile-web-app-status-bar-style: 'default'` dans les metadata Next.js :
- Le WebView Safari PWA démarre à physical y=44 (sous la status bar)
- La status bar (44px) est exclue du viewport
- `100dvh` = 812 − 44 = **768px** (pas 812px)
- `env(safe-area-inset-top)` = **0px** (pas de safe area — le WebView est déjà sous la barre)
- Le fix CSS `calc(-1 * env(...))` = `calc(-1 * 0px)` = **zéro effet**

**Conséquence :**
Le CTA est à WebView y=288px, mais physiquement à y=44+288=**332px** sur l'écran.
Chrome DevTools simule un viewport 375×812 sans offset de status bar → CTA à y=288px.
**Écart = 44px = hauteur de la status bar.**

**Fix permanent prévu :**
Changer `statusBarStyle: 'default'` → `'black-translucent'` dans `layout.tsx` (metadata). Cela étendrait le WebView derrière la status bar, activerait `env(sat-top) = 44px`, et le fix CSS existant fonctionnerait.

**Pourquoi pas encore appliqué :**
Risque de status bar icons blancs non lisibles sur pages à fond blanc. À tester sur iPhone avant de valider.

**Solution intermédiaire appliquée :**
`marginTop: 'clamp(16px, 4vh, 48px)'` — espacement CTA responsive basé sur la hauteur viewport (voir ADR-035).

**File:** `app/layout.tsx` (changement `statusBarStyle` à venir)

---

## ADR-038: Swipe-to-delete conversations — root cause iOS PWA

**Status:** Accepted
**Date:** 2026-06-12

**Problème rencontré :**
Le swipe-to-delete des conversations ne fonctionnait pas sur iPhone (PWA Safari).

**Cause racine :**
React's `onTouchMove` synthetic handler est **passif** (passive event listener). Sur iOS Safari, les listeners passifs ne peuvent pas appeler `e.preventDefault()`. Résultat : iOS interprète le geste horizontal comme un scroll de page avant que le JS puisse réagir.

De plus, sans `touch-action: pan-y`, iOS ne sait pas en avance que l'élément gère les gestes horizontaux, et peut locker le scroll vertical dès le début du toucher.

**Erreur commise pendant le fix :**
Lors du passage au listener DOM direct, `touch-action: pan-y` a été **accidentellement retiré** du style. Sans ce CSS hint, même avec `{ passive: false }`, iOS pouvait encore intercepter le geste. Corrigé dans le commit suivant.

**Solution finale (deux éléments nécessaires ensemble) :**

```tsx
// 1. CSS hint — dit à iOS EN AVANCE que l'élément gère l'horizontal
style={{ touchAction: 'pan-y', willChange: 'transform' }}

// 2. Listener DOM direct (non-passif) — permet e.preventDefault()
useEffect(() => {
  el.addEventListener('touchmove', onMove, { passive: false })
  return () => el.removeEventListener('touchmove', onMove)
}, [])
```

`touch-action: pan-y` seul : iOS ignore parfois le hint et scroll quand même.
`{ passive: false }` seul (sans le CSS hint) : iOS a déjà décidé du scroll avant que le listener s'exécute.
**Les deux ensemble : fiable sur iOS Safari PWA et WKWebView natif.**

**Autre problème résolu :**
`isOpen` state ne peut pas être lu dans la closure du DOM listener (valeur capturée au moment du `useEffect`). Solution : `isOpenRef` (useRef) miroir du state, mis à jour à chaque render via `useEffect(() => { isOpenRef.current = isOpen }, [isOpen])`.

**File:** `app/messages/ConversationList.tsx`

---

## ADR-040: SEO — canonical manquant sur /terms et /privacy + noindex /contact

**Status:** Accepted
**Date:** 2026-06-12

**Problème rencontré :**
Google Search Console signale "Discovered — currently not indexed" pour la majorité des pages du site. Audit technique révèle deux bugs canoniques actifs :

1. `app/terms/page.tsx` et `app/privacy/page.tsx` exportaient `metadata` sans `alternates.canonical`. En Next.js App Router, un champ non défini dans la metadata d'une page est hérité du layout parent le plus proche. Le root layout (`app/layout.tsx:24`) déclare `alternates: { canonical: SITE_URL }` (`https://kohride.com`). Résultat : Google voyait `<link rel="canonical" href="https://kohride.com" />` sur `/terms` et `/privacy` — les traitant comme des duplicates de la homepage, refusant de les indexer malgré leur présence dans le sitemap.

2. La route `/contact` (page "Contact the Shop") est un client component sans export `metadata`. Les client components ne peuvent pas exporter de metadata en App Router. Sans `noindex` dans le HTML, la seule protection était `robots.txt disallow` — une seule couche. Google Search Console avait signalé `kohride.com/day` en 404 ; l'investigation de la route a révélé ce gap de protection.

**Ce qui a été essayé d'abord et rejeté :**

- Redirect 301 `/contact` → `/contact-us` envisagé pour le SEO. **Rejeté** : investigation a montré que `/contact` est une page fonctionnelle recevant `?scooterId=xxx` depuis le flow `/checkout` et affichant image + prix du scooter + boutons WhatsApp/téléphone. Redirect casserait ce parcours utilisateur.
- Modification directe de `app/contact/page.tsx` pour ajouter metadata. **Impossible** : fichier est `'use client'`, les client components ne peuvent pas exporter `metadata` en Next.js App Router.

**Décisions prises :**

1. `app/terms/page.tsx` : ajout de `import type { Metadata }`, `import { SITE_URL }`, et `alternates: { canonical: '${SITE_URL}/terms' }` dans l'objet metadata.
2. `app/privacy/page.tsx` : même fix, canonical `'${SITE_URL}/privacy'`.
3. Création de `app/contact/layout.tsx` — server component wrapper exportant `metadata: { robots: { index: false, follow: false } }`. S'applique à toute la route `/contact` et ses variantes (`?scooterId=xxx`) sans modifier la logique de la page.

**Pourquoi ces solutions et pas d'autres :**
- Le canonical page-level override est le pattern correct documenté par Next.js — les champs metadata sont fusionnés, le niveau le plus proche l'emporte.
- Le layout route-segment pour noindex est la seule façon d'injecter metadata sur un client component en App Router sans transformer la page en server component (ce qui nécessiterait de refactoriser la logique Suspense/useSearchParams).

**Conséquences et risques :**
- Google corrige la canonical pour `/terms` et `/privacy` au prochain crawl → débloque l'indexation.
- `/contact` est protégé par deux couches indépendantes (robots.txt + HTML noindex) — si l'une échoue, l'autre tient.
- Aucun risque fonctionnel : les pages existantes sont inchangées, seule la metadata HTML change.
- Surveiller Google Search Console 2-3 semaines post-déploiement pour confirmer l'indexation de `/terms` et `/privacy`.

---

## ADR-041: Homepage — lien /locations dans l'état vide

**Status:** Accepted
**Date:** 2026-06-12

**Problème rencontré :**
La section "By Location" de la homepage utilise le ternaire `{liveAreas.length > 0 ? <grid zones> : <message vide>}`. Dans la branche vide (marketplace sans inventaire, phase pre-launch), le message "New scooter listings are being added" n'avait aucun lien vers `/locations` ou les pages area. Le lien "View all locations" existant dans cette section est `className="hidden md:flex"` — invisible sur mobile. Les utilisateurs mobiles en pre-launch n'avaient aucun chemin direct vers les area pages depuis le body de la homepage.

**Ce qui a été essayé d'abord :**
Modification du footer pour passer de 6 zones à 16. **Rejeté** : le footer utilise un grid `md:grid-cols-6` entièrement occupé. Ajouter 10 zones dans la colonne "Popular Locations" (déjà 6 liens + "View all") créerait une colonne de ~560px contre ~140px pour les autres — déséquilibre visuel sévère. Changer le grid nécessiterait une refonte du layout footer global.

**Décision :**
Ajout d'un bouton `<Link href="/locations">Browse all Phuket areas</Link>` exclusivement dans la branche `) : (` du ternaire. 4 lignes de JSX. Utilise `ArrowRight` et `Link` déjà importés — aucun nouvel import. Style identique au bouton "View all Phuket locations" de la branche live.

**Pourquoi ce changement améliore le SEO :**
Google peut suivre ce lien depuis la homepage → `/locations` → 16 pages area. PageRank distribué vers toutes les zones même en pre-launch. Sans ce lien, les area pages ne recevaient aucun PageRank depuis la homepage pendant la phase vide.

**Conséquences et risques :**
- Disparaît automatiquement dès que `liveAreas.length > 0` — zéro impact sur la homepage avec inventaire.
- Aucun routing, canonical, sitemap, ni SEO config modifié.
- Risque : nul.

---

## ADR-042: Email/password login — hard navigation post-login pour vider le router cache Next.js

**Status:** Accepted
**Date:** 2026-06-16

**Problème rencontré :**
Après un login email/password réussi, les riders arrivaient sur `/auth/login` au lieu de `/profile`. L'utilisateur était authentifié côté client (`SIGNED_IN` confirmé par les logs), mais le pathname passait de `/` à `/auth/login` ~2,6 secondes après le login. Le problème était spécifique aux comptes rider (non aux shop owners) et se résolvait seul après ~30 secondes.

**Root cause identifiée :**
Next.js App Router maintient un **router cache côté client** (RSC payload cache). Quand l'utilisateur est sur `/auth/login` (non authentifié), le composant `<Link href="/profile">` dans MobileBottomNav et Navbar **précharge automatiquement** `/profile`. Le serveur voit une requête sans session et retourne une redirection vers `/auth/login?redirect=/profile`. Cette réponse est mise en cache dans le router cache.

Après le login email/password, `handleSubmit` appelait `router.replace(redirect)` — une **soft navigation** qui préserve le router cache. L'utilisateur cliquait sur Profile → Next.js servait la réponse en cache (redirection vers `/auth/login`) → la page login voyait l'utilisateur authentifié → `useEffect` appelait `router.replace('/profile')` (encore une soft navigation) → boucle jusqu'à l'expiration du cache (~30 secondes pour les routes `force-dynamic`).

**Pourquoi le login Google ne souffrait pas du même problème :**
Le callback OAuth (`/auth/callback`) retourne `NextResponse.redirect(destination)` — une **redirection HTTP 302**. Le navigateur effectue une rechargement complet de la page (hard navigation), ce qui vide intégralement le router cache. Toutes les navigations suivantes font de vraies requêtes serveur avec les cookies frais.

**Ce qui a été investigué avant de trouver la cause :**
1. Rendu serveur de `/profile` → prouvé OK (logs Vercel : GET /profile → 200, ProfileClient rendu).
2. RLS et absence de ligne de profil → prouvé OK (getServerProfile retourne role=rider).
3. Navbar/MobileBottomNav href → prouvés corrects (`/profile` dans tous les cas).
4. Timing des cookies après `signInWithPassword` → les cookies `document.cookie` sont bien écrits avant la navigation.
5. Logs client (useAuth, Navbar, ProfileClient) ajoutés → ont révélé que `pathname=/auth/login` alors que `user=65b78...` (authentifié), prouvant que la navigation vers `/auth/login` était cliente, pas serveur.

**Décision :**
Remplacer les deux appels `router.replace(redirect)` dans `app/auth/login/page.tsx` par `window.location.replace(redirect)` :
- Ligne 39 : dans le `useEffect` qui redirige les utilisateurs déjà authentifiés
- Ligne 86 : dans `handleSubmit` après `signInWithEmail` réussi

**Pourquoi cette solution et pas une autre :**
- `window.location.replace()` = hard navigation = rechargement complet = router cache vidé = identique au comportement OAuth.
- Alternative `router.refresh()` rejetée : ne vide que le cache de la page courante, pas les entrées préchargées pour d'autres routes.
- Alternative middleware.ts rejetée : résoudrait le problème de refresh de session mais pas le cache de préchargement.
- Aucune régression : `router` reste utilisé pour Apple Sign In et le mode "no account" (ces flows ne sont pas affectés).

**Conséquences et risques :**
- Hard navigation = légèrement plus lente qu'une soft nav (rechargement JS), mais acceptable pour un flow de login (event unique, pas répété).
- Le `useLayoutEffect` / singleton Supabase se réinitialise correctement après le rechargement.
- Risque : nul sur les autres flows (Apple Sign In, Google OAuth non modifiés).

---

## ADR-039: Legal pages — approche startup

**Status:** Accepted
**Date:** 2026-06-13

**Contexte :**
Koh Ride prépare le lancement App Store. Les pages Terms et Privacy existantes étaient trop légères pour un lancement public, mais on ne voulait pas de documents juridiques corporate de 10 pages.

**Décision :**
Approche "startup-friendly" : termes concis, lisibles, en anglais simple. Chaque clause doit être vraie, précise, et protéger Koh Ride sans alienner les utilisateurs.

**Points clés documentés :**
- Koh Ride est un **marketplace** (jamais une société de location)
- Les shops **auto-publient** leurs listings (Koh Ride ne "vérifie" pas)
- Paiements entièrement hors plateforme — Koh Ride n'est pas partie à la transaction
- Responsabilité licence/assurance : 100% à l'utilisateur (droit thaïlandais)
- Age minimum : 18 ans
- Governing law : Thaïlande
- "As is / as available" : protège contre les garanties implicites

**Erreur évitée :**
Phrase initiale "Koh Ride verifies partner shops before listing them" — incorrecte car les shops s'inscrivent eux-mêmes. Corrigée en "Koh Ride allows local rental shops to publish listings."

**Approche Privacy :**
- Sentry mentionné comme "technical diagnostics / error reports" (future-compatible sans nommer le vendor)
- Suppression de compte via settings (pas "en nous contactant") — reflète la réalité
- "Scheduled for deletion within 30 days" (pas "removed") — couvre les backups et queues

**Files:** `app/terms/page.tsx`, `app/privacy/page.tsx`

---

## ADR-036: ConversationList partagé rider + shop owner

**Status:** Accepted
**Date:** 2026-06-12

**Decision:**
La page `/partner/messages` utilise le même composant `ConversationList` que `/messages` (rider). Suppression du rendu inline Server Component qui n'avait pas de swipe-to-delete.

**Reasoning:**
- `getOwnerConversations()` et `getAllConversations()` retournent tous les deux `ConversationPreview[]` — types identiques, composant directement réutilisable
- Zéro duplication de code
- Swipe-to-delete automatiquement disponible pour les deux profils
- Realtime (Supabase channel) et suppression de conversation inclus sans effort

**Files:** `app/partner/messages/page.tsx`, `app/messages/ConversationList.tsx`

---

## ADR-035: Hero mobile CTA — design final

**Status:** Accepted
**Date:** 2026-06-11

**Context:**
Le CTA mobile du hero a subi plusieurs itérations depuis sa création. L'état final résulte de décisions successives sur le fond, l'espacement, et les dimensions.

**État final du CTA :**
```tsx
className="flex items-center justify-center gap-2 w-auto mx-auto px-8 py-[8px]
           rounded-full text-white text-[14px] font-bold tracking-wide
           bg-[#FF6B35] hover:bg-[#e85d29]
           shadow-[0_4px_28px_rgba(255,107,53,0.5),0_2px_8px_rgba(0,0,0,0.3)]
           active:scale-[0.97] transition-all duration-200"
style={{
  opacity: 0,
  animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.25s',
  marginTop: 'calc(clamp(16px, 4vh, 48px) + 12px)',
}}
```

**Historique des décisions :**
1. **ADR-029 (2026-06-08)** : Glassmorphism (`rgba(255,150,60,0.18)` + `backdrop-blur`) — remplacé
2. **2026-06-11** : Retour au fond orange solide `#FF6B35` (design identique au bouton desktop)
3. **2026-06-11** : `mt-20` (80px fixe) → `clamp(16px, 4vh, 48px)` — espacement responsive basé sur la hauteur viewport. À ~768px : 31px. À ~932px : 37px.
4. **2026-06-11** : `w-full` → `w-auto mx-auto px-8` — largeur réduite, pill centré sur le contenu
5. **2026-06-11** : `py-[8px]` symétrique + compensation marginTop (+12px total) — texte centré verticalement, bord bas du bouton ancré

**Mécanique d'ancrage du bas :**
Pour réduire la hauteur depuis le haut sans bouger le bas :
`new_marginTop = old_marginTop + (old_pt - new_pt)`
Chaque px retiré du `pt` est ajouté au `marginTop` → le bord bas reste à la même position absolue.

**File modified:** `app/page.tsx`

---

## ADR-034: Desktop map — overlay card identique au mobile

**Status:** Accepted
**Date:** 2026-06-10

**Context:**
Sur desktop, cliquer un pin de map affichait un popup Mapbox natif (`ShopPopupCard`) avec "View shop" → navigation vers `/shop/slug`. Comportement différent du mobile (overlay card avec thumbnails + "View scooters" → filtre la liste).

**Decision:**
Aligner le comportement desktop sur le mobile :
- `showPopup={false}` sur le ScooterMap desktop → supprime le popup Mapbox
- Wrapper `div.relative` autour de `ScooterMap` sur desktop
- Même overlay card que mobile : logo, nom, nb scooters, 3 thumbnails, "View scooters"
- "View scooters" desktop → `setShopIdFilter(selectedId) + setSelectedId(null)` (pas de `setMobileView` — les deux colonnes restent visibles)
- `activeZone` non passé au ScooterMap desktop → supprime le card "X scooters in [zone]" qui s'affichait lors des clics sur cluster (redondant avec la liste filtrée et la barre de filtres)

**File modified:** `app/explore/ExploreClient.tsx`

---

## ADR-043: Native geolocation — Capacitor plugin + web fallback, no Mapbox GeolocateControl

**Status:** Accepted  
**Date:** 2026-06-17

**Problème :** Apple a rejeté l'app (Guideline 4.2 — fonctionnalité minimale insuffisante). L'app chargée dans WKWebView via URL distante (`kohride.com`) n'utilisait aucune API native. La carte Mapbox filtrait par zones nommées (Patong, Kata…) mais ignorait la position GPS réelle de l'utilisateur. Le tri 'distance' dans `FilterState` et `SORT_OPTIONS` existait déjà mais n'était pas implémenté (pas de source de données géolocalisation).

**Alternatives explorées :**
- **Mapbox `GeolocateControl`** : utilise `navigator.geolocation` (API web) directement dans WKWebView — fonctionne mais déclenche sa propre boîte de permission iOS, distincte et non coordonnée avec le plugin Capacitor. Risque de double demande de permission, pas de contrôle côté code sur l'UX. Écarté.
- **`navigator.geolocation` seul** : portable web/native, mais les erreurs iOS via WKWebView sont moins fiables que via le plugin natif, et l'UX de permission n'est pas contrôlable. Écarté comme chemin principal.

**Décision :** `@capacitor/geolocation@8` (aligne avec Capacitor 8.x déjà installé) comme chemin principal sur iOS. `navigator.geolocation` comme fallback web. Le hook `useGeolocation` encapsule les deux chemins et expose une API uniforme. Le plugin Capacitor bridgera les appels natifs `CLLocationManager` via WKWebView → binaires iOS → système iOS, satisfaisant Apple qui exige des API natives réelles, pas seulement du JS.

**Pourquoi pas simplement `navigator.geolocation` ?** Apple ne peut pas distinguer un appel `navigator.geolocation` d'une page web standard dans WKWebView vs un vrai usage natif. Le plugin Capacitor appelle `CLLocationManager` en Swift — c'est une API native iOS à part entière, ce qui est l'objectif pour la Guideline 4.2.

**Conséquences :**
- `NSLocationWhenInUseUsageDescription` doit être ajouté dans `ios/App/App/Info.plist` (fait par le développeur sur Mac, pas dans ce repo Windows).
- `npx cap sync ios` doit être exécuté sur Mac après `npm install @capacitor/geolocation@8`.
- Le garde `if (userLocation) return` dans l'effet `fitBounds` de `ScooterMap` empêche la vue de revenir aux limites des scooters quand l'utilisateur est en mode "Near me". Sans ce garde, chaque changement de filtre remettrait la carte à la vue globale Phuket.
- La permission iOS ne peut être demandée qu'une fois. Si l'utilisateur refuse, le toast d'erreur l'informe d'aller dans Réglages.

---

## ADR-044: Native push notifications — direct APNS HTTP/2, no Expo, warm-up prompt in Messages

**Status:** Accepted  
**Date:** 2026-06-17

**Problème :**
L'app ne notifiait pas les utilisateurs quand un nouveau message arrivait. `sendMessagePush` dans `app/actions/messaging.ts` existait déjà mais était entièrement non-fonctionnel : il filtrait les tokens avec `t.startsWith('ExponentPushToken[')` et appelait `https://exp.host/--/api/v2/push/send` (Expo Push Service). Or, Capacitor génère des tokens APNS bruts (chaînes hex 64 caractères) — le filtre Expo rejetait activement 100% des tokens natifs. Résultat : aucun push depuis le lancement, silencieusement.

Problème secondaire : la table `push_tokens` (migration 019) avait été créée sans `GRANT SELECT TO service_role`. Le client admin (service_role) utilisé dans `sendMessagePush` lisait 0 lignes silencieusement.

Problème de permission : demander la permission de notification au premier lancement réduit drastiquement le taux d'acceptation (l'utilisateur n'a pas encore de contexte).

**Ce qui existait avant et pourquoi ça échouait :**
1. `sendMessagePush` avec filtre `ExponentPushToken[` : Expo est un framework différent de Capacitor. Leurs formats de tokens sont incompatibles. Capacitor enregistre les tokens directement auprès d'APNS — format hex brut, jamais enveloppé dans le préfixe Expo.
2. Migration 019 : `CREATE TABLE push_tokens` sans `GRANT SELECT ON push_tokens TO service_role`. Les autres tables (comme `bookings`, migration 009) avaient ce grant. Son absence rendait la lecture admin silencieusement vide.
3. Aucun mécanisme de demande de permission : `@capacitor/push-notifications` n'était pas installé ; aucun appel à `requestPermissions()` ou `register()` dans le codebase.

**Décision :**
1. **Backend (messaging.ts)** : Suppression complète du code Expo. Remplacement par APNS HTTP/2 direct via `node:http2` et `node:crypto` (built-ins Node.js — zéro nouvelle dépendance npm). JWT ES256 signé avec la clé p8 Apple. Livraison directe à `api.push.apple.com`. Sandbox configuré via `APNS_PRODUCTION=false`.
2. **Token registration (CapacitorProvider.tsx)** : Listeners `registration` et `pushNotificationActionPerformed` enregistrés sur chaque lancement. Si permission déjà accordée : appel `register()` pour rafraîchir le token (les tokens APNS peuvent changer silencieusement).
3. **Permission UX (ConversationList.tsx)** : Warm-up sheet custom (bottom sheet orange/blanc) montré uniquement : sur plateforme native, si `status.receive === 'prompt'`, si la clé localStorage `rp_push_prompted` est absente. Une fois le warm-up vu, `rp_push_prompted=1` est posé — la demande native n'est jamais répétée. La permission native est demandée uniquement sur "Turn on notifications".
4. **Token save (push.ts)** : Server action `savePushToken` — client Supabase scopé à l'utilisateur (RLS permet l'upsert sur ses propres tokens).
5. **Migration 047** : `GRANT SELECT ON public.push_tokens TO service_role`.
6. **capacitor.config.ts** : `PushNotifications.presentationOptions: ['badge', 'sound', 'alert']` pour les notifications foreground.

**Pourquoi APNS direct et pas un service tiers :**
- Expo Push Service : incompatible avec Capacitor (format token différent, validé par l'investigation du bug existant).
- Firebase FCM : ajouterait une dépendance lourde + configuration Xcode + Google Services plist pour un usage iOS uniquement.
- `node:http2` + `node:crypto` : disponibles dans Node.js 18+ sans installation, dans le contexte server action Vercel. Pas de latence de relay, pas de coût additionnel, contrôle total sur les headers APNS.

**Payload APNS et navigation tap :**
```json
{
  "aps": { "alert": { "title": "Koh Ride", "body": "..." }, "sound": "default", "badge": 1 },
  "conversationId": "uuid"
}
```
Le `conversationId` est exposé dans `notification.data` par le plugin Capacitor. Le tap handler navigue vers `/messages/{conversationId}` — identique pour rider et shop owner (route unifiée confirmée dans `ConversationList.tsx:131`).

**Conséquences et risques :**
- **Secrets requis** : `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` (clé p8), `APNS_BUNDLE_ID`, `APNS_PRODUCTION` doivent être configurés dans Vercel. Sans eux, `sendMessagePush` retourne silencieusement (guard `if (!teamId || !keyId || !rawKey) return`).
- **JWT APNS** : expire après 60 minutes. Un nouveau JWT est généré à chaque `sendMessage` — pas de cache. OK pour le volume actuel.
- **iOS seulement** : tokens filtrés par `platform = 'ios'`. Android reste non-supporté (pas de Google Services).
- **Xcode requis** : l'onglet "Push Notifications" capability doit être ajouté dans Xcode (Mac) + `npx cap sync ios`.
- **Token badge** : badge fixé à 1 (pas de comptage des non-lus). Acceptable pour le MVP — le badge n'est pas effacé automatiquement mais disparaît quand l'utilisateur ouvre l'app.
- **`rp_push_prompted`** : si un utilisateur vide son localStorage (rare), le warm-up réapparaît mais `status.receive` sera `'denied'` (s'il avait refusé) → prompt non montré. Comportement correct.

---

## ADR-033: Sentry — state audit and implementation plan

**Status:** Accepted (audit only — implementation pending)
**Date:** 2026-06-10

**Context:**  
Complete 8-part audit of the Sentry integration before App Store launch. SDK is installed and config files are well-written, but Sentry is completely inactive because the DSN is not set.

**Findings:**

SDK: `@sentry/nextjs@^10.54.0`

Files present: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `next.config.ts` (withSentryConfig).

Files missing: `instrumentation-client.ts` (needed for Next.js 15+/turbopack client init).

**What is configured correctly (will work once DSN is set):**
- `replaysOnErrorSampleRate: 1.0` (replay on every error in prod)
- `replaysSessionSampleRate: 0` (no ambient recording — GDPR safe)
- `maskAllText: true`, `blockAllMedia: true` (privacy-correct replay)
- `beforeSend` strips cookies, emails, auth tokens (client + server)
- `ignoreErrors` filters Safari noise
- `sourcemaps: { deleteSourcemapsAfterUpload: true }` (no public exposure)
- `app/error.tsx` and `app/global-error.tsx` call `Sentry.captureException()`

**What is missing:**
1. `NEXT_PUBLIC_SENTRY_DSN` — not set → Sentry completely inactive (all `if (dsn)` guards skip init)
2. `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` — not set → source maps never uploaded → production stack traces are minified/unreadable
3. `instrumentation-client.ts` — missing → client init relies on webpack injection (fails with turbopack)
4. `Sentry.setUser()` — never called → no user identity on errors
5. Server actions (24 files) — catch errors silently, none call `Sentry.captureException()`
6. No tags: `role`, `platform` (web vs ios_native), `scooter_id`, `shop_id`

**Mobile (Capacitor):**  
App loads `https://kohride.com` via remote URL mode. `@sentry/nextjs` runs in WKWebView — JS errors captured once DSN is set. Native iOS crashes not captured (no `@sentry/capacitor` — acceptable for v1).

**Privacy / GDPR / App Store:** Configuration is safe as-is.

**Production readiness score: 2.5/10** (config quality good, nothing active)

**Implementation plan (ordered):**
1. Set env vars in Vercel: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
2. Create `instrumentation-client.ts` at root → import `./sentry.client.config`
3. Add `Sentry.setUser({ id })` + `Sentry.setTag('role', ...)` in `useAuth` on auth state change; `Sentry.setUser(null)` on sign-out
4. Add `Sentry.captureException(e)` in catch blocks of critical server actions: `partner.ts`, `messaging.ts`, `booking-actions.ts`, `auth.ts`
5. Add `Sentry.setTag('platform', isNative ? 'ios_native' : 'web')` in `CapacitorProvider`
6. Post-launch: add `@sentry/capacitor` for native iOS crash reporting

---

## ADR-045: Admin-created unclaimed shops — Phase 1 (no owner account required)

**Status:** Accepted  
**Date:** 2026-06-20

**Problème :**
Les petits opérateurs de location de scooters contactés via Facebook n'acceptaient pas de créer un compte avant que leur boutique soit en ligne — friction d'onboarding trop élevée. Le modèle existant exigeait qu'un `shop_owner` authentifié crée lui-même sa boutique (`createShop()` dans `partner.ts`), avec `owner_id` toujours égal à `auth.uid()`.

Un audit préalable (lecture seule, même session) a confirmé que :
- `shops.owner_id` était déjà nullable depuis le schéma initial (`schema.sql`) — aucune contrainte `NOT NULL` n'a jamais existé.
- Une politique RLS latente (`migration 003`) autorisait déjà `owner_id IS NULL` à l'INSERT pour n'importe quel utilisateur authentifié — jamais exploitée par le code applicatif, mais un vrai trou de sécurité dès que les boutiques non réclamées deviennent une fonctionnalité réelle.
- **Chaque** action serveur de mutation boutique/scooter (`scooter-create.ts`, `scooter-update.ts`, `scooter-delete.ts`, `shop-update.ts`, `reviews.ts`, `inquiry-actions.ts`, `booking-actions.ts`) fait un contrôle strict `if (shop.owner_id !== userId) return Unauthorized` — sans aucun bypass admin. Un admin ne pouvait donc rien créer/modifier pour une boutique qu'il ne possède pas, et personne ne pouvait agir sur une boutique avec `owner_id = NULL`.
- `is_admin` n'est jamais référencé dans une politique RLS — toute l'autorisation admin du projet passe exclusivement par la couche applicative (client `service_role` après vérification `profiles.is_admin`), pattern déjà utilisé par `adminSetShopOverrides`, `adminSetNewListingBadge`.
- L'affichage public (Explore, page boutique, page scooter) et le contact WhatsApp/téléphone ne filtrent jamais sur `owner_id` — une boutique sans propriétaire avec `active = true` s'affiche déjà normalement.
- La messagerie in-app (`getOrCreateConversation`, `getOrCreateShopConversation`) exige un `owner_id` non nul et retournait une erreur brute sinon.

**Ce qui a été essayé/écarté :**
Implémenter directement le flow d'invitation/claim de propriétaire en même temps que la création admin a été écarté — hors scope explicite de la Phase 1, et risquait d'introduire des tokens/emails non testés avant d'avoir validé le modèle de base (boutique sans propriétaire, visible publiquement, gérable par un admin).

**Décision :**
1. **Schéma (migration 050)** : ajout de `shops.owner_status` (`'unclaimed' | 'invited' | 'claimed'`, défaut `'claimed'` — backfill automatique des lignes existantes), `invited_owner_email`, `invited_at`, `claimed_at`, `created_by_admin_id`. `owner_id` reste inchangé (déjà nullable).
2. **RLS durcie (migration 050)** : la policy INSERT `shops` est remplacée — `WITH CHECK (owner_id = auth.uid())` uniquement. Le bypass `OR owner_id IS NULL` est supprimé ; la création de boutique non réclamée passe désormais exclusivement par `adminCreateShop()` via le client `service_role` (qui contourne RLS), jamais par un INSERT authentifié direct.
3. **Nouvelle action admin** : `app/actions/admin-create-shop.ts` — vérifie `is_admin` puis insère avec `owner_id = NULL`, `owner_status = 'unclaimed'`, `created_by_admin_id`.
4. **Nouveau helper** : `isAdminUser(admin, userId)` ajouté à `lib/supabase/admin.ts` — centralise le lookup `profiles.is_admin` déjà dupliqué dans plusieurs admin actions, réutilisé partout où ce changement ajoute un bypass admin.
5. **Bypass admin minimal** : `scooter-create.ts`, `scooter-update.ts`, `scooter-delete.ts` — la condition devient `if (owner_id !== userId && !isAdmin) return Unauthorized`. Le comportement existant pour les propriétaires reste strictement identique (premier branch inchangé) ; `shop-update.ts` et les autres actions n'ont **pas** été touchées (hors scope Phase 1 — pas de besoin de modifier les infos boutique après création admin pour l'instant).
6. **UI admin minimale** : nouvelle section `/admin/shops` (liste + formulaire de création), `/admin/shops/[shopId]` (détail + liste scooters + suppression), `/admin/shops/[shopId]/scooters/new` et `.../scooters/[scooterId]/edit` — ces deux dernières réutilisent directement `NewScooterForm` et `EditScooterForm` existants (aucune duplication de formulaire), car l'autorisation est déjà gérée côté server action. Pages gardées côté serveur avec redirect si `!is_admin` (pas de flash de contenu).
7. **Messagerie — fallback gracieux** : `getOrCreateConversation` et `getOrCreateShopConversation` renvoient désormais un message lisible ("This shop is not on chat yet — please use WhatsApp or phone to contact them.") au lieu de `'Shop owner not found.'` / `'owner_not_found'` quand `owner_id` est NULL. Aucune branche de code consommatrice (`MessageOwnerButton`, `ShopChatButton`, `ShopQuickQuestions`) ne fait de pattern-matching sur l'ancien texte d'erreur — changement sans risque de régression.

**Pourquoi cette solution et pas une autre :**
- Pas de nouvelle colonne `NOT NULL` ni de contrainte changée sur `owner_id` — strictement additif, zéro risque sur les boutiques existantes.
- Réutilisation du pattern d'autorisation déjà éprouvé dans le projet (`service_role` + vérif `is_admin` applicative) plutôt que d'introduire une politique RLS basée sur `is_admin` — cohérent avec l'architecture existante, pas de nouvelle catégorie de risque RLS.
- Réutilisation des formulaires `NewScooterForm`/`EditScooterForm` existants pour l'UI admin plutôt que de dupliquer — l'autorisation vit déjà dans la server action, pas dans le formulaire.

**Conséquences et risques :**
- **Pas de flow d'invitation/claim** : `owner_status` peut passer à `'invited'`/`'claimed'` via colonnes prêtes, mais aucune action ne le fait encore (Phase 2, hors scope).
- ~~`shop-update.ts` non modifié~~ — **résolu le même jour** : `updateShop()` étend désormais la même condition (`owner_id !== userId && !isAdmin`) que les actions scooter. Un admin peut éditer une boutique non réclamée (nom, téléphone, adresse, etc.) après création. Changement d'une seule condition, aucune dépendance supplémentaire (le write passait déjà par `service_role`, aucune policy RLS à toucher) — voir audit dans la session du même jour avant implémentation.
- ~~Pas d'UI d'édition admin~~ — **résolu le 2026-06-21** : `/admin/shops/[shopId]/edit` réutilise directement `ShopSettingsClient.tsx` (le formulaire propriétaire existant) via des props additives (`isAdmin`, `backHref`, `redirectTo`, toutes avec une valeur par défaut identique au comportement propriétaire — zéro changement pour le flow existant). Ajout du champ `active` (toggle visibilité publique, admin-only) à `UpdateShopPayload`, écrit uniquement si fourni.
- **Pas de lien de navigation vers `/admin/shops`** dans l'UI existante (Navbar/Profile) — accès par URL directe uniquement, cohérent avec le pattern existant des outils admin (`?debugPins=1`).
- **Messagerie in-app indisponible pour les boutiques non réclamées** — WhatsApp/téléphone restent le seul canal de contact, conforme à la demande explicite de ne pas construire de solution de messagerie complète en Phase 1.

---

## ADR-046: Scooter location is derived from the shop — no separate scooter location field

**Status:** Accepted  
**Date:** 2026-06-21

**Problème :**
En testant le flow d'onboarding admin (ADR-045), une boutique a été créée avec `location = "Kathu"`. En ajoutant un scooter à cette boutique, le formulaire de création de scooter demande une localisation **séparée** via un `<select>` — et "Kathu" n'y figure pas, bloquant la création cohérente d'un scooter pour cette boutique.

**Audit :**
- `scooters.location` et `shops.location` sont deux colonnes `text` indépendantes, sans contrainte de cohérence entre elles en base.
- Les listes de valeurs utilisées dans les formulaires sont des **copies dupliquées et désynchronisées** d'un même référentiel : `lib/zones.ts` (`PHUKET_ZONES`, 16 zones canoniques) → `ShopSettingsClient.tsx` avait sa propre constante `SHOP_LOCATIONS` (16 noms recopiés à la main) → `NewScooterForm.tsx`/`EditScooterForm.tsx` avaient chacun leur propre constante `LOCATIONS` (les mêmes 16 noms recopiés une 3e et 4e fois). Aucune de ces listes — y compris `PHUKET_ZONES` lui-même — ne contient "Kathu".
- **Cause racine exacte** : le formulaire de création de boutique admin (`AdminShopsClient.tsx`, ADR-045) utilisait un `<input>` texte libre pour la localisation, sans contrainte vers la liste canonique. C'est la seule raison pour laquelle "Kathu" a pu être saisi pour la boutique — nulle part ailleurs dans l'app (formulaire propriétaire, formulaires scooter) la saisie n'est libre.
- `scooters.location` n'est imposé ni par le schéma (colonne nullable, sans `CHECK`), ni par aucune validation serveur — seul le `<select required>` HTML du formulaire contraignait la saisie côté UI. `scooter-create.ts` retombe sur `'Phuket'` si absent.
- Filtrage public : `getScooters()` (`lib/supabase/queries.ts`) filtre directement sur `scooters.location` (`.ilike`). Mais `ExploreClient.tsx` (ligne ~281) a déjà une logique de repli `getZoneForLocation(s.location) ?? getZoneForLocation(s.shop?.location ?? '') ?? getNearestZone(...)` — c'est-à-dire que le code traitait déjà implicitement `shop.location` comme source de vérité secondaire quand `scooter.location` ne résout aucune zone connue. La règle métier demandée (le scooter appartient à la boutique, donc se situe où la boutique se situe) est donc déjà cohérente avec une intention présente dans le code, simplement jamais appliquée à la source (écriture), seulement en lecture de repli.

**Décision :**
1. `scooter-create.ts` / `scooter-update.ts` : `location`, `lat`, `lng` du scooter sont désormais **toujours dérivés de la boutique** (`shops.location/lat/lng`, lus dans la même requête qui vérifie déjà la propriété/l'admin), jamais de l'input utilisateur. Le payload `CreateScooterPayload`/`UpdateScooterPayload` n'a plus de champ `location` du tout.
2. `NewScooterForm.tsx` / `EditScooterForm.tsx` : le `<select>` éditable est remplacé par un encart lecture-seule affichant la localisation de la boutique ("Same as your shop — always matches."). Les constantes `LOCATIONS` dupliquées sont supprimées des deux fichiers.
3. **Cause racine corrigée** : `AdminShopsClient.tsx` — l'`<input>` texte libre pour la localisation de la boutique est remplacé par un `<select>` peuplé directement depuis `PHUKET_ZONES` (la liste canonique de `lib/zones.ts`, plutôt qu'une 5e copie dupliquée). Un admin ne peut désormais plus créer une boutique avec une localisation hors du référentiel commun.

**Pourquoi cette solution et pas une autre :**
- Ne pas simplement ajouter "Kathu" à un dropdown — ça aurait masqué le vrai problème (deux modèles de localisation incohérents) sans le résoudre pour la prochaine zone manquante.
- Dériver côté serveur plutôt que côté client — élimine la classe de bug entièrement (aucune UI ne peut plus jamais désynchroniser scooter et boutique), au lieu de la rendre simplement moins probable.
- Réutiliser `PHUKET_ZONES` comme unique source plutôt que dupliquer une 5e liste — réduit la duplication existante (4 copies) au lieu de l'aggraver.

**Conséquences et risques :**
- Toute boutique déjà créée avec une localisation hors `PHUKET_ZONES` (ex. la boutique "Kathu" de test) reste en l'état tant qu'un admin ne la modifie pas via `/admin/shops/[shopId]/edit` (qui utilise déjà un `<select>` contraint) — ses scooters hériteront de "Kathu" jusqu'à la correction, et n'apparaîtront sous aucun filtre de zone spécifique sur Explore (uniquement sous "All locations"), car `getZoneForLocation('Kathu')` ne résout aucune zone. Pas une régression introduite par ce changement — situation déjà existante, désormais cohérente entre boutique et scooters au lieu d'être incohérente.
- ~~Ajouter "Kathu" comme zone réelle (coordonnées, rayon, page SEO) est une décision produit distincte, volontairement hors scope de ce correctif.~~ — **résolu le 2026-06-21, ADR-047** : Kathu est maintenant une zone officielle.
- `scooters.location`/`lat`/`lng` se resynchronisent automatiquement avec la boutique à chaque édition de scooter — si une boutique change de zone, ses scooters existants ne se mettent à jour qu'au prochain edit individuel (pas de backfill rétroactif en masse, jugé inutile pour le volume actuel).

---

## ADR-047: Kathu added as an official supported zone

**Status:** Accepted  
**Date:** 2026-06-21

**Problème :**
ADR-046 a révélé que "Kathu" n'existe dans aucune des listes de zones du projet. Décision business : Kathu est une zone Phuket importante et doit devenir une zone officielle de premier rang, pas un contournement.

**Audit (avant implémentation) :**
Le projet a en réalité **trois listes canoniques de zones dupliquées**, déjà maintenues manuellement en synchronisation pour les 16 zones existantes — ce n'est pas une dette introduite ici, c'est l'architecture préexistante :
1. `lib/zones.ts` → `PHUKET_ZONES` (`key/name/lat/lng/radiusKm`) — consommé génériquement (`.map/.find/.forEach`, jamais de nom codé en dur) par `ExploreClient.tsx` (filtre de zone, repli Near Me), `ScooterMap.tsx` (dropdown pin-picker, cercles de zone, clustering, outil de calibration `?debugPins=1`), `ShopSettingsClient.tsx`/`AdminShopsClient.tsx` (sélecteurs de localisation boutique), `partner.ts`/`admin-create-shop.ts` (dérivation lat/lng), `normalize-shop.ts`.
2. `constants/areas.ts` → `AREAS` (`slug/name/label/description/longDescription/highlights/nearbyAttractions/priceFrom`) — consommé par `app/phuket/[area]/page.tsx` (`generateStaticParams` + métadonnées + JSON-LD, **toutes les zones sont toujours générées statiquement**, indépendamment de l'inventaire), `opengraph-image.tsx`, `app/sitemap.ts` (**toutes les zones incluses sans condition**), `lib/live-areas.ts` (filtre vers les zones avec inventaire réel, pour les cartes homepage/footer uniquement), `Footer.tsx`, `app/locations/page.tsx`.
3. `constants/index.ts` → `LOCATIONS` (`id/label`) — consommé uniquement par `components/ride/ExploreFilters.tsx` (pastilles de filtre de localisation dans la modale Explore).
- **Near Me** utilise une distance Haversine brute sur `scooter.lat/lng` — totalement indépendant des noms de zone. Fonctionne automatiquement pour Kathu dès que la zone existe dans `PHUKET_ZONES` (donc dès que `getZoneForLocation('Kathu')` résout des coordonnées).
- Aucune contrainte `CHECK` ou RLS ne limite `shops.location`/`scooters.location` à une liste fixe — colonnes texte libres. Aucune migration nécessaire.
- Aucune collision de sous-chaîne : "kathu" ne contient et n'est contenu dans aucune clé/nom de zone existant (vérifié explicitement, le code a déjà un garde-fou similaire pour "kata noi" vs "kata").
- Les pages SEO `/phuket/[area]` gèrent déjà gracieusement l'absence d'inventaire (`priceRange`/`hasOfferCatalog` omis si `areaScooters.length === 0`) — une page Kathu à zéro scooter ne casse rien.

**Conclusion de l'audit :** aucune complexité ou risque inattendu. Changement purement additif sur les 3 tableaux de données existants, zéro changement de logique.

**Décision :**
Ajout de "Kathu" aux trois listes canoniques, suivant exactement le même format que les 16 zones existantes :
1. `lib/zones.ts` — `{ key: 'kathu', name: 'Kathu', lat: 7.9106, lng: 98.3382, radiusKm: 2.0 }` (coordonnées approximatives du centre du district, même niveau de précision que les zones existantes — le commentaire du fichier indique déjà que ces coordonnées sont "manually calibrated for visual alignment", pas des centroïdes géodésiques exacts).
2. `constants/areas.ts` — entrée `AreaMeta` complète pour `slug: 'kathu'` (description, longDescription, highlights, nearbyAttractions, `priceFrom: 250` — valeur par défaut identique à la majorité des zones existantes ; les vrais prix viennent toujours de `getLiveAreas()` en lecture).
3. `constants/index.ts` — `{ id: 'kathu', label: 'Kathu' }` dans `LOCATIONS`.

**Pourquoi cette solution et pas une autre :**
- Respecte la contrainte explicite "ne pas dupliquer les listes de zones" en n'ajoutant Kathu qu'aux 3 listes déjà existantes, sans en créer une 4e.
- Respecte "pas de refactor" — aucune tentative de fusionner les 3 systèmes en un seul (ce qui serait un changement architectural plus large et plus risqué) ; ADR-047 ajoute des données, ADR-046 avait déjà résolu le problème de cohérence scooter↔boutique séparément.
- Tout le reste du système (Explore, Near Me, SEO, sitemap, structured data, recherche) consomme déjà ces listes de façon générique — aucune ligne de logique modifiée nulle part en dehors des 3 fichiers de données.

**Conséquences et risques :**
- Le centre de zone (lat/lng) est une approximation raisonnable, pas calibrée visuellement sur Mapbox comme les 16 autres zones (calibrées à la main historiquement). L'outil de calibration existant (`?debugPins=1` dans `ScooterMap.tsx`) permet un ajustement visuel ultérieur si nécessaire — non bloquant.
- La copie marketing de `/phuket/kathu` (description, points forts, attractions) a été rédigée de façon conservatrice, limitée à des faits géographiques/culturels largement établis (Kathu Waterfall, proximité de Patong) — aucune affirmation spécifique sur l'inventaire ou les prix qui ne soit déjà gérée dynamiquement par `getLiveAreas()`.
- La boutique de test déjà créée avec `location = "Kathu"` (ADR-046) résout maintenant correctement une zone — `getZoneForLocation('Kathu')` retourne désormais la nouvelle entrée. Aucune action manuelle supplémentaire n'est requise pour cette boutique : ses scooters résoudront automatiquement la zone Kathu sur Explore dès le prochain rendu.

---

## ADR-048: Correction — 2 listes de zones dupliquées supplémentaires trouvées + affichage scooter périmé

**Status:** Accepted
**Date:** 2026-06-21

**Problème :**
Tests admin post-ADR-047 : (1) Kathu absent du dropdown "Main Area" en édition boutique, (2) déplacer le pin carte ne semblait pas mettre à jour Main Area de façon fiable, (3) l'édition scooter affiche "Same as your shop" mais montre une valeur périmée (`scooter.location` enregistrée à la création, ex. "Thalang", alors que la boutique est maintenant "Kathu").

**Audit — correction d'une erreur dans ADR-047 :**
ADR-047 affirmait que `ShopSettingsClient.tsx` consommait `PHUKET_ZONES` génériquement pour son sélecteur de zone boutique. C'était **faux** — l'audit ADR-047 a confondu l'usage de `PHUKET_ZONES` pour les "Delivery Zones" (correct) avec le dropdown "Main Area", qui utilisait en réalité un **4e tableau codé en dur** (`SHOP_LOCATIONS`, local au composant) sans Kathu. Un **5e tableau dupliqué** (`LOCATIONS`, local à `CreateShopForm.tsx` — formulaire d'inscription self-service propriétaire) avait le même problème. Ni l'un ni l'autre n'avait été détecté lors de l'audit ADR-047 car la recherche initiale n'avait inspecté que les 3 fichiers de constantes partagées, pas les composants clients eux-mêmes.

Root cause #1 (Kathu absent du dropdown) : `SHOP_LOCATIONS`/`LOCATIONS` codés en dur, jamais mis à jour avec les 3 listes canoniques.

Root cause #2 (pin carte vs Main Area) : en réalité déjà cohérent dans le code — le dropdown met à jour `lat/lng` vers le centre de zone (`getZoneForLocation`), et faire glisser le pin met à jour `location` vers la zone la plus proche (`getNearestZone`). Le symptôme observé ("Main Area reste Patong") venait du bug #1 : Kathu n'étant pas une `<option>` valide du `<select>`, un `<select>` contrôlé dont la valeur ne correspond à aucune option retombe visuellement sur la première option (`Patong`) dans la plupart des navigateurs, même si l'état React sous-jacent contenait correctement `"Kathu"`. Une fois Kathu ajouté comme option valide, ce symptôme disparaît sans changement de logique de synchronisation.

Root cause #3 (affichage scooter périmé) : `EditScooterForm.tsx` affichait `scooter.location` (valeur DB persistée à la dernière sauvegarde du scooter) au lieu de la valeur courante de la boutique. Le mécanisme de resynchronisation côté serveur (ADR-046, dans `scooter-update.ts`) ne se déclenche qu'à la sauvegarde du scooter — donc tout scooter non resauvegardé après un changement de zone boutique affiche une valeur obsolète, alors que le texte "Same as your shop — always matches" affirme à tort une synchronisation permanente.

**Décision :**
1. `ShopSettingsClient.tsx` : suppression de `SHOP_LOCATIONS`, le dropdown "Main Area" utilise désormais directement `PHUKET_ZONES` (déjà importé pour les Delivery Zones). Ajout d'un texte d'aide clarifiant la relation pin/zone.
2. `CreateShopForm.tsx` : suppression de `LOCATIONS`, les boutons de sélection de zone utilisent désormais `PHUKET_ZONES`.
3. `EditScooterForm.tsx` : nouvelle prop `shopLocation` (valeur boutique en direct, passée depuis la page serveur) remplace `scooter.location` pour l'affichage en lecture seule et le résumé. Les deux pages consommatrices (`app/partner/scooters/[id]/edit/page.tsx`, `app/admin/shops/[shopId]/scooters/[scooterId]/edit/page.tsx`) passent désormais `shop.location` au composant.
4. Scooters existants déjà périmés en base : pas de migration en masse. Conformément à ADR-046, `scooter-update.ts` réécrit déjà `location` depuis la boutique à chaque sauvegarde — et l'affichage lit maintenant la valeur boutique en direct, donc l'UI ne ment plus même avant toute resauvegarde.

**Pourquoi cette solution et pas une autre :**
- Élimine la classe d'erreur (encore) au lieu de corriger un symptôme : remplacer les 2 tableaux dupliqués restants par la même source canonique (`PHUKET_ZONES`) déjà utilisée par `AdminShopsClient.tsx` et `partner.ts`/`admin-create-shop.ts`, au lieu d'ajouter Kathu à chacun individuellement.
- Pas de migration de données : conforme à la contrainte explicite "ne pas faire de migration en masse à moins que ce soit clairement nécessaire" — la resynchronisation à la sauvegarde (déjà en place) plus la lecture en direct côté affichage suffisent.
- Aucun changement de comportement de synchronisation pin↔zone : ce mécanisme existant n'était pas cassé, seulement masqué par le bug du dropdown.

**Conséquences et risques :**
- Avec `PHUKET_ZONES` comme unique source pour ces 2 formulaires, toute future zone ajoutée à `lib/zones.ts` apparaîtra automatiquement dans les dropdowns boutique (propriétaire et admin) — réduit le risque de récidive de ce bug.
- Tout scooter dont la boutique a changé de zone depuis sa dernière sauvegarde aura encore `scooters.location` périmé en base jusqu'à la prochaine sauvegarde de ce scooter — n'affecte que des usages internes (aucun usage public identifié lit `scooters.location` directement pour le filtrage de zone ; le filtre Explore/zone utilise la même colonne mais elle est resynchronisée à chaque sauvegarde scooter, donc en pratique tout scooter créé ou modifié après le changement de zone boutique est déjà correct).
- `npx tsc --noEmit` et `npm run build` passent sans erreur (64 pages statiques générées, y compris Kathu). 2 erreurs ESLint pré-existantes restent dans `EditScooterForm.tsx:52` et `ShopSettingsClient.tsx:747` — confirmées via `git blame` comme antérieures à cette session, hors scope.

---

## ADR-049: Resync scooters.location/lat/lng quand la boutique change de zone

**Status:** Accepted
**Date:** 2026-06-21

**Problème :**
Après ADR-048, l'édition boutique et l'édition scooter affichent correctement Kathu, mais Explore (liste, cartes, carte/map, filtre de zone) continue d'afficher "Thalang" pour les scooters d'une boutique repassée à "Kathu". Les scooters existants ont un `scooters.location` figé en base, jamais mis à jour rétroactivement.

**Audit :**
- `app/actions/shop-update.ts` (`updateShop()`) ne touchait que la table `shops` — aucune propagation vers `scooters`.
- `ScooterCard.tsx:141` affiche `scooter.location` directement, sans repli vers `shop.location`.
- `ExploreClient.tsx:281` et `ScooterMap.tsx:202` résolvent la zone via `getZoneForLocation(s.location)` **en priorité** sur `s.shop?.location` — comme "Thalang" est lui-même une zone valide, le repli vers la boutique ne se déclenche jamais : le filtre de zone et le clustering carte font confiance à la valeur scooter périmée.
- `lib/normalize/normalize-scooter.ts` priorise déjà `shops.lat/lng` sur `scooter.lat/lng` pour les coordonnées (donc la position du point sur la carte était déjà correcte une fois la boutique déplacée) — mais le **texte** de zone affiché/filtré ne suit pas cette même priorité nulle part.
- `scooter-create.ts`/`scooter-update.ts` (ADR-046) ne dérivent `scooters.location` depuis la boutique qu'à la sauvegarde du **scooter** — jamais déclenché par une sauvegarde **boutique**.

**Décision :**
Dans `updateShop()`, après la mise à jour réussie de `shops`, si `payload.location` est fourni et diffère de l'ancienne valeur (`shopRow.location`, récupérée avant l'update), propager immédiatement à tous les scooters de cette boutique : `update scooters set location = payload.location, lat = payload.lat, lng = payload.lng where shop_id = shopId`. `lat`/`lng` ne sont écrasés que s'ils sont non-null dans le payload.

**Pourquoi cette solution et pas une autre :**
- Source unique de vérité appliquée au niveau donnée, pas au niveau affichage : corrige Explore, ScooterCard, ScooterMap, le filtre de zone et tout futur consommateur de `scooters.location` en un seul point, sans toucher à la logique de chacun des 4+ composants qui lisent cette colonne.
- `updateShop()` est le seul chemin d'écriture partagé par le flux propriétaire (`ShopSettingsClient.tsx`) et le flux admin (même composant, `isAdmin` prop) — un seul changement couvre les deux sans dupliquer la logique de resync.
- Pas de migration en masse : la résolution se fait à la prochaine sauvegarde de la boutique concernée, exactement comme demandé ("no risky global bulk migration required"). Combiné à ADR-046 (resync à la sauvegarde scooter), toute boutique ou scooter resauvegardé est désormais cohérent.
- Garde conditionnelle (`payload.location !== shopRow.location`) évite une écriture `scooters` inutile à chaque sauvegarde boutique où la zone n'a pas changé.

**Conséquences et risques :**
- Une boutique avec beaucoup de scooters déclenche un `UPDATE` multi-lignes à chaque changement de zone — volumétrie actuelle du projet (marketplace local, pas des milliers de scooters par boutique) rend ce coût négligeable.
- Si l'update `scooters` échoue (erreur réseau/DB), l'update `shops` reste déjà commité — la boutique affichera la nouvelle zone, mais ses scooters resteront périmés jusqu'à la prochaine sauvegarde boutique ou scooter ; l'erreur est loguée (`console.error`) mais ne fait pas échouer la requête globale (cohérent avec ADR-046 : la prochaine sauvegarde scooter individuelle corrige aussi ce cas).
- `npx tsc --noEmit` et `npm run build` passent sans erreur ; `eslint app/actions/shop-update.ts` propre.

---

## ADR-050: Numéro de téléphone optionnel à la création et à l'édition de boutique — repli sur la messagerie in-app

**Status:** Accepted
**Date:** 2026-06-21

**Problème :**
Le téléphone était obligatoire pour créer une boutique, à la fois pour le flux self-service propriétaire (`CreateShopForm.tsx`) et pour le flux admin (`AdminShopsClient.tsx`), bloquant l'onboarding d'opérateurs qui n'ont pas encore communiqué de numéro. Demande explicite : rendre le téléphone optionnel partout (création + cohérence en édition), et afficher un CTA de contact in-app à la place quand il est absent.

**Audit :**
- Validation obligatoire trouvée à 4 endroits : `app/actions/partner.ts` (`createShop`), `app/actions/admin-create-shop.ts` (`adminCreateShop`), `app/actions/shop-update.ts` (`updateShop`), plus les contraintes UI correspondantes dans `CreateShopForm.tsx` et `ShopSettingsClient.tsx` (`AdminShopsClient.tsx` n'avait qu'un placeholder "Phone *" trompeur, pas de blocage réel).
- DB (`supabase/migrations/017_production_hardening.sql`) : `shops.phone` est `NOT NULL DEFAULT ''` — accepte déjà une chaîne vide, donc aucune migration nécessaire.
- CTA de contact déjà robustes sans changement : la page boutique (`app/shop/[slug]/page.tsx`) affiche `ShopChatButton`/`ShopQuickQuestions` (chat in-app, via `getOrCreateShopConversation`) **sans condition** sur phone/whatsapp ; la page scooter (`app/scooter/[id]/page.tsx`) affiche `MessageOwnerButton` (via `getOrCreateConversation`) **sans condition** également. Seul `app/contact/page.tsx` (page d'atterrissage pré-réservation) retombait sur un lien "Browse other scooters" au lieu d'un contact in-app quand ni WhatsApp ni téléphone n'étaient renseignés.
- Edge case identifié : une boutique admin **non revendiquée** (`owner_id IS NULL`) n'a pas accès au chat in-app — `getOrCreateShopConversation` retourne une erreur explicite pour ce cas (`shop-conversation.ts`). Si un admin crée une boutique non revendiquée sans téléphone ni WhatsApp, elle se retrouve sans aucun canal de contact fonctionnel. Pas bloqué ici (la demande couvre explicitement le flux admin), mais signalé comme risque ci-dessous plutôt que silencieusement ignoré.

**Décision :**
1. Téléphone passe en optionnel (`phone?: string`) dans les payloads et validations de `partner.ts`, `admin-create-shop.ts`, `shop-update.ts` — la valeur stockée reste `''` si absente (cohérent avec la colonne `NOT NULL DEFAULT ''`).
2. UI : suppression des astérisques/`required`/conditions de bouton désactivé sur le champ téléphone dans `CreateShopForm.tsx`, `ShopSettingsClient.tsx`, `AdminShopsClient.tsx` ; ajout d'un texte d'aide indiquant que le contact reste possible via la messagerie in-app.
3. `app/contact/page.tsx` : remplacement du repli "Browse other scooters" par `MessageOwnerButton` (réutilisation du composant existant, même mécanisme que la page scooter) quand ni WhatsApp ni téléphone ne sont disponibles.
4. Édition de boutique (`shop-update.ts`/`ShopSettingsClient.tsx`) alignée sur la même règle, même si la demande portait explicitement sur la création — sans ce changement, une boutique créée sans téléphone aurait été bloquée à la première sauvegarde d'édition (incohérence immédiate avec l'objectif).

**Pourquoi cette solution et pas une autre :**
- Réutilise l'infrastructure de messagerie in-app déjà présente et déjà inconditionnelle sur les pages boutique/scooter (`ShopChatButton`, `MessageOwnerButton`) plutôt que d'inventer un nouveau composant de repli.
- Pas de nouvelle contrainte bloquante ajoutée pour les boutiques non revendiquées sans aucun contact — respecte la demande explicite incluant le flux admin, au prix d'un risque documenté plutôt que d'une règle non demandée.
- Aucune migration DB : la colonne accepte déjà `''`, conforme à la contrainte « pas de changement de schéma ».

**Conséquences et risques :**
- Une boutique admin non revendiquée, créée sans téléphone ni WhatsApp, n'a aucun canal de contact fonctionnel jusqu'à sa revendication (le chat in-app refuse les boutiques `owner_id IS NULL`). Recommandation opérationnelle (non implémentée, hors scope demandé) : encourager les admins à renseigner au moins un canal pour ce cas précis.
- `npx tsc --noEmit` et `npm run build` passent sans erreur. `eslint` propre sur tous les fichiers modifiés sauf une erreur pré-existante déjà documentée (`ShopSettingsClient.tsx:747`, antérieure à cette session).

---

## ADR-051: scooter.location normalisé depuis shop.location à la lecture — repli d'ADR-049 pour les données déjà périmées

**Status:** Accepted
**Date:** 2026-06-21

**Problème :**
Malgré ADR-049 (resync à la sauvegarde boutique), Explore (liste, cartes, carte, filtre de zone) affichait toujours "Thalang" pour une boutique passée à "Kathu". Boutique confirmée à jour (`shops.location = 'Kathu'`, `lat/lng` corrects), mais ses 3 scooters avaient encore `location = 'Thalang'` et `lat/lng` de Thalang en base.

**Audit (lecture directe en base via le client service_role) :**
- Boutique `5ed39c0f-dfbe-4b07-a176-8720e6ffff19` ("Даниил Ивлев") : `location = 'Kathu'`, `updated_at = 2026-06-21T14:27`. Ses 3 scooters : `location = 'Thalang'`, `lat/lng` de Thalang, `updated_at` entre 09:33 et 09:38 — **antérieur** à la dernière sauvegarde boutique.
- Cause précise : la boutique avait déjà été changée à "Kathu" **avant** le déploiement d'ADR-049. Les sauvegardes boutique suivantes n'ont pas re-déclenché le resync car la condition d'ADR-049 (`payload.location !== shopRow.location`) ne se déclenche que sur un changement réel — une boutique déjà à "Kathu" resauvegardée sans toucher à la zone ne propage plus rien. ADR-049 corrige toute *future* transition de zone, mais pas l'état figé avant son déploiement.
- Recherche globale (10 scooters, toutes boutiques) : seuls ces 3 scooters, sur cette seule boutique, présentaient une incohérence `scooter.location ≠ shop.location` — confirme que le problème est isolé à cette boutique de test, pas une corruption généralisée.
- Root cause secondaire, plus profonde qu'ADR-049 : `lib/normalize/normalize-scooter.ts` retournait `location: row.location ?? ''` — la valeur scooter brute, sans aucun repli vers `row.shops?.location`. Tous les consommateurs publics (`ScooterCard.tsx`, le filtre de zone d'`ExploreClient.tsx`, le clustering de `ScooterMap.tsx`) lisent ce champ normalisé en confiance ; une seule colonne périmée en base se propageait silencieusement partout, sans qu'aucun de ces composants n'ait de défaut individuel. `lat`/`lng` étaient déjà protégés par une priorité similaire (`row.shops?.lat || row.lat`, ADR-046) — seul le champ texte `location` ne l'était pas.

**Décision :**
1. `lib/normalize/normalize-scooter.ts` : `location: row.shops?.location || row.location || ''` — même pattern de priorité « boutique avant scooter » déjà utilisé pour `lat`/`lng`. Corrige tous les consommateurs en un seul point (`ScooterCard`, filtre de zone, clustering carte, pages scooter/contact), sans toucher à leur logique individuelle.
2. Réparation ciblée des données déjà périmées : `UPDATE scooters SET location = shops.location, lat = shops.lat, lng = shops.lng WHERE shop_id = '5ed39c0f-dfbe-4b07-a176-8720e6ffff19'` (exécutée via le client `service_role`, script jetable, supprimé après usage). Recherche globale préalable confirmant qu'aucune autre boutique n'a de scooters incohérents — la réparation reste strictement ciblée sur la boutique concernée, pas une migration globale.

**Pourquoi cette solution et pas une autre :**
- Corrige la classe d'erreur à la racine (priorité boutique-sur-scooter appliquée à la lecture, comme `lat`/`lng` l'étaient déjà) plutôt que de rajouter un repli dans chaque composant consommateur — cohérent avec la stratégie déjà choisie en ADR-048/049.
- La réparation de données reste ciblée par `shop_id`, pas une `UPDATE` globale sans condition — conforme à la contrainte explicite, et justifiée par l'audit global qui montre qu'aucune autre ligne n'est concernée.
- N'annule pas ADR-049 : le resync à la sauvegarde boutique reste nécessaire pour que `scooters.location` en base ne reste pas durablement faux (ADR-051 corrige l'affichage immédiatement, ADR-049 maintient la cohérence des données dans le temps).

**Conséquences et risques :**
- Si une future boutique change de zone DB sans jamais resauvegarder via `updateShop()` (improbable, mais possible via un accès direct à la base), `scooters.location` resterait périmé en base — sans impact utilisateur grâce à ADR-051 (l'affichage prend toujours le dessus côté boutique), mais à corriger si un jour un export ou rapport lit `scooters.location` directement sans jointure boutique.
- `npx tsc --noEmit`, `npm run build` et `eslint lib/normalize/normalize-scooter.ts` passent sans erreur.
- Scripts d'audit/réparation (`scripts/_tmp-*.mjs`) étaient temporaires, exécutés une fois en local avec le service role, puis supprimés — non committés.

---

## ADR-052: Phase 2A — admin lie manuellement un compte existant à une boutique non revendiquée

**Status:** Accepted
**Date:** 2026-06-21

**Problème :**
Phase 1 (ADR-045) permet à un admin de créer/gérer des boutiques sans propriétaire (`owner_status = 'unclaimed'`), mais aucun mécanisme n'existe encore pour qu'un admin relie cette boutique à un compte réel une fois que son propriétaire s'inscrit sur Koh Ride. Demande explicite : flux manuel admin-only par email, sans invitation automatique ni token de claim (reportés à une phase future).

**Audit :**
- `profiles` n'a pas de colonne `email` — l'email vit uniquement dans `auth.users` (`profiles.id` référence `auth.users.id` en FK). Toute résolution "boutique → compte par email" doit donc lire `auth.users`, pas `profiles`.
- `role` n'accepte que `'rider'` / `'shop_owner'` (`admin` est un booléen séparé `is_admin`, pas une valeur de `role` — migration 041 a annulé une tentative antérieure d'ajouter `'admin'` comme valeur de rôle).
- Aucune contrainte `UNIQUE` sur `shops.owner_id` ni `profiles.shop_id` — rien n'empêche en base qu'un profil référence une boutique pendant qu'une autre boutique a aussi son `owner_id`. Toute invariance "un compte ne peut posséder qu'une boutique" doit être appliquée en code, pas en DB.
- Aucune fonction RPC ni pattern de transaction multi-tables existant dans le projet. Le seul précédent d'écriture liée `shops` + `profiles` (`createShop()` dans `partner.ts`) le fait via deux appels séquentiels avec gestion d'erreur **non bloquante** sur le second (`profiles`) — si l'update du profil échoue, la fonction retourne quand même un succès, laissant la boutique créée mais non reliée.
- Pas de précédent pour chercher un profil par email ; le plus proche est la fonction `check_email_registered(p_email)` (migration 025, SECURITY DEFINER sur `auth.users`), mais elle renvoie un booléen, pas un id.

**Décision :**
1. Migration 051 (`find_profile_id_by_email`) : nouvelle fonction SQL SECURITY DEFINER, même pattern que `check_email_registered`, renvoie l'`id` (= `profiles.id`) correspondant à un email, ou `NULL`. Pas de `GRANT` à `anon`/`authenticated` — appelée uniquement via le client `service_role` depuis une server action déjà admin-gated.
2. Nouvelle server action `adminClaimShopByEmail(shopId, email)` dans `app/actions/admin-shops.ts` :
   - Authentification + `isAdminUser()` avant toute lecture/écriture.
   - Rejette si la boutique n'existe pas, est déjà `owner_id` non-null ou `owner_status = 'claimed'`.
   - Résout le compte cible par email via la RPC ; rejette si aucun compte, ou si l'admin tente de se lier sa propre boutique par erreur.
   - Rejette si `profiles.shop_id` du compte cible est déjà renseigné, **et** vérifie défensivement qu'aucune autre ligne `shops` n'a déjà `owner_id` = ce compte (protection contre une dérive `shop_id`/`owner_id` non détectée par la première vérification, puisqu'aucune contrainte DB ne la garantit).
   - Écrit `shops` (owner_id, owner_status='claimed', claimed_at, invited_owner_email) **puis** `profiles` (shop_id, role='shop_owner'), dans cet ordre.
3. Stratégie de cohérence sans transaction réelle : contrairement à `createShop()`, l'échec du second write (`profiles`) ici est **fatal** — la fonction retente immédiatement un rollback explicite de l'écriture `shops` (remise à `unclaimed`/`owner_id = null`). Si le rollback lui-même échoue, retourne une erreur `ROLLBACK_FAILED` explicite plutôt que de prétendre un succès, et logue le cas pour intervention manuelle.
4. UI (`AdminShopDetailClient.tsx`) : nouvelle section `ClaimShopSection` — formulaire email + bouton si `ownerStatus !== 'claimed'` ; sinon bandeau lecture seule "Claimed by {email}" (email résolu via `admin.auth.admin.getUserById()` dans `adminGetShopDetail`, nouveau champ `ownerEmail` sur `AdminShopDetail`).

**Pourquoi cette solution et pas une autre :**
- Réutilise le pattern SECURITY DEFINER déjà établi (migration 025) plutôt que d'introduire une nouvelle façon d'accéder à `auth.users`.
- Diverge intentionnellement du précédent "non-fatal" de `createShop()` : ce dernier lie une boutique flambant neuve qu'aucun autre flux ne dépend encore ; ici, le claim active immédiatement l'accès dashboard, l'édition boutique et la messagerie in-app pour un compte existant — un état à moitié appliqué serait silencieusement dangereux (boutique marquée "claimed" sans propriétaire réellement capable d'y accéder, ou compte marqué `shop_owner` sans boutique). Rollback explicite plutôt que log-and-continue.
- Vérifications de conflit en code applicatif (pas en DB) car aucune contrainte `UNIQUE` n'existe et qu'en ajouter une sortirait du cadre minimal demandé (pas de migration de schéma au-delà de la fonction de lookup).

**Conséquences et risques :**
- Pas de vraie transaction DB : entre l'écriture `shops` et l'écriture `profiles`, il existe une fenêtre où la boutique est `claimed` mais le profil pas encore lié. Risque résiduel mais minimal (deux appels Postgres séquentiels sur le même service, latence de l'ordre de la dizaine de ms) ; en cas d'échec du second appel, rollback automatique immédiat.
- Si le rollback lui-même échoue (panne réseau/DB entre les deux appels), la boutique reste `claimed` sans profil lié — erreur explicite retournée (`ROLLBACK_FAILED`) avec instruction de vérification manuelle, pas de fausse confirmation de succès.
- `find_profile_id_by_email` (migration 051) n'est pas encore appliquée en base — **migration à exécuter manuellement par l'utilisateur** avant que le claim ne fonctionne (suit le flux établi du projet où l'utilisateur applique les migrations lui-même).
- `npx tsc --noEmit` et `npm run build` passent sans erreur ; `eslint` propre sur tous les fichiers modifiés.
- Hors scope (explicitement demandé pour une phase ultérieure) : invitation email automatique, token de claim, claim self-service par le propriétaire, multi-boutiques par propriétaire.

---

## ADR-053: SEO V1.1 — model landing pages (`/models/[slug]`) for PCX, NMAX, ADV

**Status:** Accepted
**Date:** 2026-06-21

**What was the problem?**
The SEO audit (external `seo-agent` project, `SEO_AUDIT.md`/`SEO_OPPORTUNITIES.md`) found two issues: (1) `app/robots.ts` disallows `/contact`, which matches by prefix and accidentally blocks the public `/contact-us` page alongside the intended private `/contact/[id]` thread route; (2) zero pages exist for high commercial-intent model searches ("PCX rental Phuket", "NMAX rental Phuket", "ADV rental Phuket") — the only path to that traffic was an individual `/scooter/[id]` listing, which disappears the moment that specific scooter is rented out.

**What was tried first and why it failed?**
Before writing any model-matching code, the real `scooters.model` column was queried directly (read-only script against the live Supabase instance, 19 rows). This surfaced a real risk the SEO plan had flagged but not confirmed: model values are free text with inconsistent casing (`"NMAX"` vs `"Nmax"`), and critically, a separate `"XADV"` model exists alongside `"ADV"` (Honda X-ADV 750, a different bike). A naive `ilike('%ADV%')` substring filter — the obvious first approach — would have silently pulled X-ADV listings into the ADV page, misrepresenting inventory.

**What decision was made?**
1. `getScooters()` gained an optional `model` filter using `ilike('model', filters.model)` with **no `%` wildcards** — Postgres `ILIKE` without wildcards is an exact, case-insensitive match. This catches `"NMAX"`/`"Nmax"` casing variants while correctly excluding `"XADV"` from an `"ADV"` query.
2. `constants/models.ts` (mirrors `constants/areas.ts`): static copy for exactly 3 models (pcx, nmax, adv) — slug, exact `modelQuery` DB value, brand, copy, FAQ, related-model slugs. ADV additionally carries an optional `subModels` field (regex patterns over the scooter `name` field) used to render an honest "ADV 160 vs ADV 350" section computed live from real inventory at every request, rather than a static claim — the live DB has only 1 ADV 350 listing and 0 ADV 160 listings, and the brief explicitly required not overstating availability.
3. `lib/live-models.ts` / `lib/schema/model-page.ts`: mirror `lib/live-areas.ts`'s pattern of deriving price ranges only from real fetched data (no price shown if there's no inventory), and a shared `Product`+`AggregateOffer`+`BreadcrumbList`+`FAQPage` JSON-LD builder so all 3 pages emit the same schema shape instead of each page improvising its own.
4. `app/models/[slug]/page.tsx`: one dynamic route, `generateStaticParams()` from `constants/models.ts`, architecture copied from `app/phuket/[area]/page.tsx` (same hero/grid/empty-state/CTA structure, `revalidate = 60`).
5. Breadcrumb is 2-level (Home → Model), not the 3-level "Home → Models → PCX" the original SEO brief suggested — there is no `/models` hub page in this round's scope, and linking to a non-existent route in `BreadcrumbList` JSON-LD would be a dead link.
6. `app/robots.ts`: `'/contact'` → `'/contact/'` (trailing slash scopes the rule to the private thread route only).
7. `app/sitemap.ts` and `components/layout/Footer.tsx` ("Popular Models" column, footer grid widened from 6 to 7 columns) updated for the new routes, matching the existing area-page patterns exactly.

**Why this solution and not another?**
- Exact-match `ilike` over substring `ilike` because the live data proved substring matching unsafe (XADV/ADV collision) — verified before writing filter logic, not after, per the SEO plan's own flagged risk.
- `AggregateOffer` over a single `Offer` because a model page represents many shops' listings, not one — copying the per-listing `Product` schema from `app/scooter/[id]/page.tsx` would misrepresent the page as a single offer.
- Live-computed sub-model counts over static "ADV 350 is more common" copy because inventory changes; a static claim would go stale and risks failing the project's own content-quality bar ("asserts data the platform doesn't have").
- Static + `revalidate = 60` (not full SSR) to match the proven `/phuket/[area]` pattern exactly, since that page type already works correctly in production.

**What are the consequences or risks?**
- Only 3 models (pcx/nmax/adv) are covered. Other real `model` values in the DB (Lead, Tmax, Xmax, XADV, CLICK, FORZA) have no dedicated page yet — intentional, matches the explicit Tier-1-only scope of this round.
- `getScooters({ model })` is case-sensitive-safe but not alias-safe — if a shop owner later enters `"PCX160"` or `"Honda PCX"` as the model value instead of `"PCX"`, that listing would not appear on `/models/pcx`. No alias-mapping layer (like `LOCATION_ALIASES` in `constants/areas.ts`) was added since current live data didn't need it — flagged here for whoever extends this to Tier 2 models.
- No `/models` hub/index page exists; the footer "Popular Models" column and reciprocal PCX↔NMAX/ADV links are the only entry points until a hub is built (out of scope, not requested this round).
- `npx tsc --noEmit`, `npm run build`, and `npm run lint` all pass; 21/21 Playwright tests pass (new `tests/e2e/model-pages.spec.ts` plus full re-run of the existing `tests/e2e/area-pages.spec.ts` as a regression check) against a real dev server, verified against live DB data (PCX: 4 listings, NMAX: 1, ADV: 1 — ADV 350 only, 0 ADV 160).

---

## ADR-054: Security remediation — profile privilege escalation, analytics ownership, RPC over-permissioning (P0-1, P0-2, P1-1, P1-2)

**Status:** Accepted
**Date:** 2026-06-21

**What was the problem?**
A full read-only security audit of the app found four issues fixed in this round:
- **P0-1 / P0-2:** `public.profiles` has `GRANT ALL` to `authenticated` (migration 003) plus an UPDATE policy scoped only by row (`auth.uid() = id`), not by column. RLS restricts which *row* a user may write, never which *columns* — so any authenticated client could call `supabase.from('profiles').update({ is_admin: true, shop_id: '<any-shop>' }).eq('id', auth.uid())` directly and self-promote to admin and/or hijack any shop's dashboard. A second, independent path existed on INSERT: the `"Service can insert profile"` policy (`FOR INSERT WITH CHECK (true)`) has no `TO` clause, so by Postgres default it applies to `PUBLIC` — a client could insert a fresh profile row with `is_admin`/`shop_id` already set, bypassing the normal signup trigger entirely.
- **P1-1:** `getActivityFeed(shopId)` and `getShopAnalytics(shopId)` (`app/actions/activity-feed.ts`, `app/actions/shop-analytics.ts`) used `createAdminClient()` (service_role, bypasses RLS) and trusted the `shopId` argument with zero `auth.getUser()` call and zero ownership check. Any authenticated user could call either function with an arbitrary `shopId` and read another shop's WhatsApp/phone leads, view counts, and revenue-adjacent analytics.
- **P1-2:** `public.find_profile_id_by_email` (migration 051, SECURITY DEFINER, reads `auth.users`) was written and intended to be called only from the service_role admin client inside `adminClaimShopByEmail()`, but had no `REVOKE EXECUTE` statement. Postgres grants `EXECUTE` on newly created functions to `PUBLIC` by default, so any authenticated (or anonymous) client could call the RPC directly to enumerate which email addresses have an account and recover the matching profile id — migration 051's own comment incorrectly asserted it was "not granted to anon/authenticated."

**What was tried first and why it failed?**
For P0-1/P0-2, a column-level `REVOKE UPDATE (is_admin, shop_id) ON public.profiles FROM authenticated` was considered first. Rejected: it hard-fails the entire UPDATE statement (Postgres error) if a client payload includes those columns at all, even unchanged — riskier than necessary given the explicit "do not lock owners out" constraint, and harder to reason about across every existing call site without exhaustively proving none ever sends those fields incidentally.

**What decision was made?**
- **P0-1/P0-2:** `supabase/migrations/052_protect_profile_privileged_columns.sql` — a `BEFORE INSERT OR UPDATE` trigger (`protect_profile_privileged_columns`) on `public.profiles`. For any write where `auth.role() <> 'service_role'`, it silently forces `NEW.is_admin := false, NEW.shop_id := NULL` on INSERT, and `NEW.is_admin := OLD.is_admin, NEW.shop_id := OLD.shop_id` on UPDATE (i.e. those two columns are always reverted to their pre-write value, ignoring whatever the client sent). Writes from `service_role` pass through untouched.
- **P1-1:** Both `getShopAnalytics()` and `getActivityFeed()` now call `createClient()` (user-scoped) first, require `auth.getUser()` to succeed, fetch the target shop's `owner_id` via the admin client, and return the existing "no data" fallback (`empty` / `[]`) unless `shopRow.owner_id === user.id` or `isAdminUser(admin, user.id)` — the exact pattern already used in `shop-update.ts`/`scooter-update.ts`.
- **P1-2:** Added `REVOKE EXECUTE ON FUNCTION public.find_profile_id_by_email(text) FROM PUBLIC, anon, authenticated;` and `GRANT EXECUTE ... TO service_role;` directly into migration 051 (edited in place, not a new migration — 051 has not yet been applied by the user per `docs/ROADMAP.md`, so there is no production state to migrate away from).

**Why this solution and not another?**
- Trigger over column REVOKE for P0-1/P0-2: silently reverting is a no-op for every legitimate flow, never a hard failure — verified by exhaustive grep that the *only* two write call-sites for `profiles.is_admin`/`shop_id` in the entire codebase (`createShop()` in `partner.ts`, `adminClaimShopByEmail()` in `admin-shops.ts`) already go through `createAdminClient()` (service_role), so the trigger's exemption covers both with zero behavior change. The signup trigger (`handle_new_user()`, migration 029) never sets `is_admin`/`shop_id` at all, so forcing them to their defaults on INSERT for a non-service_role writer matches what already happens — also a no-op.
- Reusing the `shop-update.ts` ownership pattern for P1-1 instead of inventing a new check: the codebase already has one correct, proven pattern for "owner sees own, admin sees any, others denied" — introducing a second implementation would be the kind of unrequested refactor/abstraction this task explicitly forbade.
- Editing migration 051 in place over a new migration 053 for P1-2: 051 is unapplied, so there is no live function definition to ALTER; appending a near-duplicate migration just to add two `REVOKE`/`GRANT` lines would be unnecessary scope expansion for a file the user hasn't run yet.

**What are the consequences or risks?**
- `supabase/migrations/052_...sql` and the edited `051_find_profile_by_email.sql` are **not yet applied** — user must run both manually in the Supabase Dashboard → SQL Editor before the fixes take effect in production (051 was already pending per the roadmap; 052 is new).
- Scope was deliberately limited to P0-1, P0-2, P1-1, P1-2 only, per explicit instruction. **Not touched, audit-only, no changes this phase:** P1-3 (scooter-images storage policies), P1-4 (`verified` flag), and all P2/P3 findings from the original audit remain open.
- `npx tsc --noEmit` and `npm run build` both pass clean with these changes.
- If a future legitimate flow needs to write `is_admin`/`shop_id` from a non-service_role context, it will silently no-op rather than error — anyone adding such a flow must be aware of this trigger and route the write through the admin client instead.

---

## ADR-055: SEO V1.2 — extend model pages to XADV, Forza, XMAX, Click, Lead

**Status:** Accepted
**Date:** 2026-06-21

**What was the problem?**
SEO V1.1 (ADR-053) shipped /models/[slug] infrastructure for only 3 of the 12 distinct real model values already live in the scooters table: PCX, NMAX, ADV. Five more real, currently-rented models (XADV, FORZA, XMAX, CLICK, LEAD) had inventory but no dedicated SEO page, same volatile-listing-only problem ADR-053 already solved for the first three.

**What was tried first and why it failed?**
Nothing was tried and discarded here — the V1.1 infrastructure (constants/models.ts, app/models/[slug]/page.tsx, getScooters({ model }), lib/live-models.ts, lib/schema/model-page.ts) was built generically enough that extending it required no architecture change. The only investigation needed was re-verifying live DB data before writing copy, per the same discipline ADR-053 established: queried scooters directly (19 rows) and confirmed exact model values (XADV, FORZA, XMAX/Xmax, CLICK, LEAD/Lead) and inventory counts (XADV 2/2 available, FORZA 1/1, XMAX 1/2, CLICK 1/1, LEAD 3/3 available) before adding any entries.

**What decision was made?**
1. Added 5 new ModelMeta entries to constants/models.ts (xadv, forza, xmax, click, lead) — same shape as the existing 3, no interface changes.
2. No changes to app/models/[slug]/page.tsx, lib/live-models.ts, lib/schema/model-page.ts, lib/supabase/queries.ts, or app/sitemap.ts — all already iterate generically over the MODELS array and required zero modification.
3. components/layout/Footer.tsx — capped the "Popular Models" column to a new POPULAR_MODEL_SLUGS allowlist (pcx, nmax, adv only), mirroring the existing POPULAR_SLUGS pattern already used for locations in the same file, instead of letting the column grow to 8 entries.
4. Cross-links (relatedModelSlugs) wired by genuine category adjacency rather than arbitrary order: X-ADV<->ADV (same family, X-ADV is the upgrade), Forza<->XMAX (both maxi-scooters), Click<->Lead (both small commuters), Lead/Click also link back to PCX as the natural next step up. Existing PCX/NMAX/ADV relatedModelSlugs were left untouched to avoid altering already-shipped, already-tested page output.
5. tests/e2e/model-pages.spec.ts — extended the generic MODELS slug array to all 8 slugs, and added two new targeted tests: one asserting /models/adv never renders "XADV" text (collision regression guard) and /models/xadv does render "X-ADV", and one confirming /models/xmax and /models/lead render real listing cards despite the DBs casing inconsistencies (Xmax/XMAX, Lead/LEAD).

**Why this solution and not another?**
- Reused the existing exact-match (no-wildcard) ilike filter from ADR-053 rather than adding any new matching logic — the live cross-collision matrix (every target model string checked as a substring of every other distinct DB model value) found zero new collision risks, so there was nothing to fix in the filter itself.
- Capped the footer column instead of letting it grow unbounded, because an 8-row footer column was judged to hurt usability for marginal internal-linking benefit at this inventory size — the explicit instruction also asked to keep it clean rather than overcrowd it.
- Did not touch existing PCX/NMAX/ADV relatedModelSlugs, even though XADV could arguably belong in ADVs list too, to keep this change strictly additive and avoid re-testing already-verified content for no required reason.

**What are the consequences or risks?**
- FORZA, XMAX, and CLICK each currently have exactly 1 live available listing — thin inventory. Copy was written feature/use-case-focused (not "wide selection" claims) specifically to avoid overstating availability, consistent with the projects content-quality bar.
- Same casing-variance caveat as NMAX in ADR-053 applies to XMAX (Xmax/XMAX) and LEAD (Lead/LEAD) — already handled correctly by the existing exact-match ilike, no new risk introduced.
- No /models hub page still exists (same gap noted in ADR-053) — with 8 models now live, this gap is more visible; flagged again in docs/ROADMAP.md.
- npx tsc --noEmit and npm run build both pass clean (72 routes generated, up from 67). 28/28 Playwright tests pass (tests/e2e/model-pages.spec.ts expanded to 8 models plus 2 new collision/casing tests, tests/e2e/area-pages.spec.ts re-run in full as a regression check). Manually verified via curl against a live dev server: XADV shows 2 real listings, FORZA/XMAX/CLICK show 1 each, LEAD shows 3 — all matching DB counts exactly; sitemap.xml lists all 8 model routes; homepage footer links to exactly 3 models (pcx/nmax/adv), confirmed by counting actual href="/models/..." links rather than incidental model-name text elsewhere on the page.
