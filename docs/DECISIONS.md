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
- **Pas de lien de navigation vers `/admin/shops`** dans l'UI existante (Navbar/Profile) — accès par URL directe uniquement, cohérent avec le pattern existant des outils admin (`?debugPins=1`).
- **Messagerie in-app indisponible pour les boutiques non réclamées** — WhatsApp/téléphone restent le seul canal de contact, conforme à la demande explicite de ne pas construire de solution de messagerie complète en Phase 1.
