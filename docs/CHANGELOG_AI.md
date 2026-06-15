# Koh Ride — AI Implementation Changelog

Records significant AI-assisted implementation work. Most recent first.

---

## 2026-06-15

### Fix: /auth/select-role redirecting to login instead of showing role form

**Files:** `app/auth/select-role/page.tsx` (+1 line)

**Problème root cause :** Même problème que `/profile` : `/auth/select-role/page.tsx` manquait de `export const dynamic = 'force-dynamic'`. Next.js pouvait mettre en cache une version statique rendue sans cookies → `getUser()` = null → redirection vers `/auth/login` baked dans le cache. Les sessions email/password sans profil (ex. : compte Google OAuth auquel un mot de passe a été ajouté via "Forgot Password" avec des identités non liées dans Supabase) étaient redirigées de `/profile` vers `/auth/select-role`, qui les renvoyait silencieusement vers `/auth/login` au lieu d'afficher le formulaire de sélection de rôle.

**Chaîne de redirections identifiée :** `/profile` → `getServerProfile()` retourne null → `/auth/select-role` (statique) → `/auth/login`. L'utilisateur voyait la page de login alors que `getUser()` fonctionnait correctement — la vraie cause était dans la chaîne en aval.

**Preuve clé :** `getAllConversations()` (Messages) utilise le client admin pour les requêtes DB, contournant RLS. `getServerProfile()` (Profile) utilise le client user → RLS appliqué → 0 lignes si l'ID de l'utilisateur email/password ne correspond pas à une ligne de profil existante.

**Fix :** Ajout de `export const dynamic = 'force-dynamic'` dans `app/auth/select-role/page.tsx`. Route passe de `○ (Static)` à `ƒ (Dynamic)`.

**Cause profonde restante à investiguer :** Vérifier dans Supabase Dashboard → Authentication → Users si deux utilisateurs distincts partagent le même email (un Google OAuth, un email/password). Si oui, la session email/password correspond à un user_id sans ligne de profil → `getServerProfile()` retourne null (PGRST116). Solution : lier les identités ou activer "Automatically link identities" dans les settings Supabase Auth.

**Build : OK. Commit : `fb29d5b`.**

---

### Fix: /profile redirecting authenticated users to login

**Files:** `app/profile/page.tsx` (+1 line)

**Problème root cause :** `/profile/page.tsx` manquait de `export const dynamic = 'force-dynamic'`. Next.js ne peut pas détecter statiquement que `cookies()` est appelé transitivement via `createClient()` → `lib/supabase/server.ts`. Sans cette export explicite, Next.js peut produire et mettre en cache une version statique de la page au build time, sans contexte de request ni cookies. Dans ce cas, `getUser()` retourne `null` → la redirection vers `/auth/login` est baked dans le cache → tous les utilisateurs authentifiés qui accèdent à `/profile` reçoivent la redirection, indépendamment de leur session réelle.

**Pourquoi `/messages` fonctionnait :** `app/messages/page.tsx` a `export const dynamic = 'force-dynamic'` (ligne 9), ce qui force un rendu dynamique par request avec les vrais cookies.

**Fix :** Ajout d'une seule ligne `export const dynamic = 'force-dynamic'` dans `app/profile/page.tsx`. Route passe de `○ (Static)` à `ƒ (Dynamic)` dans le build output.

**Build : OK. Commit : `bfff60c`.**

---

## 2026-06-12 (session 2)

### Chore: remove dev screenshot tooling (pre-launch cleanup)
**Files deleted:** `app/dev/create-shop/page.tsx`, `app/dev/create-shop/DevShopCreator.tsx`, `app/dev/create-shop/actions.ts`, `app/actions/admin-dev-shops.ts`, `components/admin/AdminDevShopsPanel.tsx`
**Files modified:** `app/explore/ExploreClient.tsx` (removed import + render of AdminDevShopsPanel)

**Problème root cause :** Le répertoire `app/dev/` contenait un outil de création de shops dev protégé par `DEV_SCREENSHOT_MODE=true`. La variable était présente dans `.env.local` et risquait d'être accidentellement laissée dans Vercel production. `AdminDevShopsPanel` était importé dans `ExploreClient` avec retour null pour les non-admins, mais le code restait compilé dans le bundle production.

**Vérification effectuée :** grep exhaustif confirme zéro référence restante à `AdminDevShopsPanel`, `admin-dev-shops`, `DEV_SCREENSHOT_MODE`, `DevShopCreator`, `createDevShop`, `DevShopRow`. Aucun changement utilisateur final.

---

## 2026-06-12

### Fix: SEO — canonical URLs manquants sur /terms et /privacy
**Files:** `app/terms/page.tsx`, `app/privacy/page.tsx`

**Problème root cause :** Les deux pages exportaient `metadata` sans `alternates.canonical`. En Next.js App Router, les pages qui n'overrident pas ce champ héritent du canonical du root layout (`app/layout.tsx:24` : `alternates: { canonical: SITE_URL }`), soit `https://kohride.com`. Google voyait `/terms` et `/privacy` comme des duplicates de la homepage — bloquant leur indexation malgré leur présence dans le sitemap.

**Fix :** Ajout de `import type { Metadata } from 'next'`, `import { SITE_URL } from '@/constants'`, et `alternates: { canonical: '${SITE_URL}/terms' }` (resp. `/privacy`) dans chaque page. Le HTML généré passe de `<link rel="canonical" href="https://kohride.com" />` à `<link rel="canonical" href="https://kohride.com/terms" />`.

**Aucun problème rencontré.**

### Fix: SEO — noindex explicite pour la route /contact
**Files:** `app/contact/layout.tsx` (nouveau fichier)

**Problème root cause :** La route `/contact` (page "Contact the Shop" utilisée dans le flow checkout legacy) est un client component sans export `metadata`. Sans directive noindex dans le HTML, la protection reposait uniquement sur `robots.txt disallow` — une seule couche de défense. Google Search Console avait signalé `https://kohride.com/day` en 404, dont l'investigation a révélé l'existence de cette route orpheline sans protection HTML.

**Investigation préalable :** Redirect `/contact` → `/contact-us` rejeté — `/contact` est une page fonctionnelle qui reçoit `?scooterId=xxx` depuis `/checkout` et affiche les CTA WhatsApp/téléphone spécifiques au scooter. Redirect casserait ce flow.

**Fix :** Création de `app/contact/layout.tsx` (server component, 7 lignes) exportant `metadata: { robots: { index: false, follow: false } }`. Applique `<meta name="robots" content="noindex, nofollow">` sur toutes les URLs sous `/contact` sans modifier la page ni le checkout flow. Défense en profondeur : robots.txt + HTML noindex.

**Aucun problème rencontré.**

### Feat: Homepage — lien /locations dans l'état vide (marketplace sans inventaire)
**Files:** `app/page.tsx`

**Problème root cause :** La section "By Location" de la homepage (`liveAreas.length > 0 ? ... : ...`) affichait un message "New scooter listings are being added" sans aucun lien vers `/locations`. Le lien "View all locations" existant dans cette section est `hidden md:flex` (invisible sur mobile). Les utilisateurs mobiles arrivant sur la homepage pendant la phase pre-launch (marketplace vide) n'avaient aucun chemin direct vers les pages area depuis le body de la homepage.

**Fix :** Ajout d'un bouton `<Link href="/locations">Browse all Phuket areas</Link>` dans la branche `) : (` du ternaire. S'affiche uniquement quand `liveAreas.length === 0`. Disparaît dès le premier scooter actif. Style identique au bouton "View all Phuket locations" existant. `ArrowRight` et `Link` déjà importés — aucun nouvel import.

**Aucun problème rencontré.**

### Investigation: SEO audit complet — "Discovered, currently not indexed"
**Files:** lecture seule

Audit technique de 30 points sur 4 types de pages (`/explore`, `/faq`, `/locations`, `/partner`, `/contact-us`, `/terms`, `/privacy`, `/phuket/*`, `/shop/*`, `/scooter/*`). Cause principale identifiée : **domaine jeune / autorité quasi-nulle (85%)**, bugs techniques secondaires (15%). 

Deux bugs canoniques confirmés et corrigés (terms/privacy). Redirect `/contact` → `/contact-us` rejeté (page fonctionnelle, flow checkout). Changement liens area page `/explore?location=slug` → `/explore` implémenté puis **revert** après vérification : le canonical de `/explore?location=patong` pointe vers `https://kohride.com/explore` côté serveur (searchParams ne lit pas `location`) — les liens de navigation UX préservés, aucun risque SEO.

Top 10 fixes identifiés dont fix footer (6→16 zones) rejeté pour raison de layout, et `/locations` homepage accepté.

---

## 2026-06-13

### Chore: remove HeroDiagnostics overlay
**Files:** `app/page.tsx`, `components/home/HeroDiagnostics.tsx` (deleted)

Suppression du panneau de diagnostics temporaire. Import, composant, et IDs temporaires (`hero-section`, `hero-cta`) retirés de `page.tsx`.

### Copy: home page CTA card — in-app chat vs WhatsApp
**Files:** `app/page.tsx`

Texte de la carte CTA finale : "Local scooters, direct WhatsApp contact…" → "Browse local scooters, chat directly with shops in the app — the simplest way to rent in Phuket."

### Legal: Terms of Service — v2 (startup-ready)
**Files:** `app/terms/page.tsx`

6 additions : âge minimum 18 ans (section 2), règles d'utilisation/abus (section 2), nouvelle section 3 Licences & Legal Compliance (responsabilité sole de l'utilisateur pour permis/assurance thaïlandais), disclaimer As Is/As Available (section 6), suspension/termination de compte étendue (section 7), nouvelle section 8 Governing Law (Thaïlande). 10 sections au total.

Puis 2 correctifs ciblés : section 4 Shop Listings (shops auto-publient, Koh Ride ne "vérifie" plus), section 10 Contact (lien direct vers Contact page).

### Legal: Privacy Policy — v2 (public launch ready)
**Files:** `app/privacy/page.tsx`

6 additions : account security data + user ID (section 2), messages in-app (section 2), uploaded content — photos/logos shops (section 2), technical diagnostics/Sentry-compatible (section 2), nouvelle section 5 International Data Processing, suppression account via settings (section 7), data retention — exceptions sécurité/fraude/légal (section 8), contact via Contact page (section 9).

Puis 2 correctifs ciblés : data sharing — wording plus précis (section 4), "scheduled for deletion" vs "removed" (section 8).

### Feat: bottom nav shop owner — "Live" → "Listings"
**Files:** `components/layout/MobileBottomNav.tsx`

Label du tab de gestion des scooters renommé "Listings". Icône, route, active state inchangés. Strings "Live in search", "X live" (statuts fonctionnels) préservées.

### Feat: bottom nav rider — Saved icon Bookmark → Heart
**Files:** `components/layout/MobileBottomNav.tsx`

Icône "Saved" alignée avec le cœur utilisé dans le profil rider.

---

## 2026-06-12

### Fix: Messages headers — BackButton + titre centré (rider + shop owner)
**Files:** `app/messages/page.tsx`, `app/partner/messages/page.tsx`

Les deux pages messages ont maintenant un header sticky `top-16` avec :
- BackButton orange pill à gauche (`router.back()`)
- Titre "Messages" centré en absolu (`absolute left-1/2 -translate-x-1/2`)
- Badge unread / compteur conversations à droite
- "Inbox" renommé en "Messages" sur la page shop owner

### Fix: Swipe-to-delete conversations — iOS PWA
**Files:** `app/messages/ConversationList.tsx`

Correction en deux étapes :
1. Remplacement de `onTouchMove` React (passif) par `addEventListener('touchmove', fn, { passive: false })` direct sur le DOM → permet `e.preventDefault()` pour bloquer le scroll iOS lors d'un swipe horizontal
2. Restauration de `touch-action: pan-y` sur le div swipeable (retiré par erreur dans l'étape 1) — les deux sont nécessaires ensemble : le CSS hint indique à iOS que l'élément gère les gestes horizontaux, le listener non-passif bloque le scroll JS

### Feat: Swipe-to-delete — shop owner (ADR-036)
**Files:** `app/partner/messages/page.tsx`

La page shop owner utilisait un rendu inline Server Component sans swipe. Remplacée par le composant partagé `ConversationList`. Les deux profils (rider + shop owner) bénéficient du swipe-to-delete via un seul composant. `getOwnerConversations()` et `getAllConversations()` retournent le même type `ConversationPreview[]` — aucune adaptation nécessaire.

---

## 2026-06-11

### Debug: Hero diagnostics overlay (TEMPORAIRE)
**Files:** `app/page.tsx`, `components/home/HeroDiagnostics.tsx`

Overlay fixe en bas à gauche du hero mesurant : `window.innerHeight`, `visualViewport.height`, `env(safe-area-inset-top)` (via probe DOM), `100dvh`, `section.top`, `section.height`, `cta.top`. Déployé pour comparer Chrome DevTools vs iPhone PWA et valider le diagnostic avant toute correction du statusBarStyle. À retirer avant App Store submission.

### Audit niveau 2 — Hero CTA positioning (diagnostic)

Découverte clé : l'utilisateur teste via **Safari "Add to Home Screen"** (PWA), pas via l'app Capacitor native. Avec `statusBarStyle: 'default'` dans le metadata Next.js, le WebView Safari PWA démarre à physical y=44 (sous la status bar), `100dvh` = 768px (pas 812px), et `env(safe-area-inset-top)` = 0. Le fix précédent (`marginTop: -env()`) avait 0 effet car `env()` = 0. La cause racine réelle : `apple-mobile-web-app-status-bar-style: 'default'` → fix correct = passer à `'black-translucent'` (en attente de validation via diagnostics).

### Feat: Hero CTA — design final (ADR-035)
**Files:** `app/page.tsx`

Série de 4 changements successifs sur le CTA mobile du hero :
1. Revert glassmorphism → fond orange solide `#FF6B35` (retour au design d'origine)
2. `mt-20` (80px fixe) → `marginTop: clamp(16px, 4vh, 48px)` (responsive viewport-height)
3. `w-full py-[14px]` → `w-auto mx-auto px-8 pb-[14px]` + `pt: 8px` (plus court, plus étroit, bas fixe)
4. `py-[8px]` symétrique + `marginTop: calc(clamp(...) + 12px)` (texte centré verticalement, bas toujours fixe)

---

## 2026-06-10 (suite)

### Fix: zone count card supprimé sur desktop map (cluster click)
**Files:** `app/explore/ExploreClient.tsx`

Sur desktop, cliquer un cluster de zone affichait le card "X scooters available in [zone]" en bas à droite de la map (`activeZone` prop). Ce card est conçu pour mobile (où l'utilisateur bascule en vue liste). Sur desktop les deux colonnes sont toujours visibles — le feedback est la liste filtrée + la barre de filtres. Suppression de la prop `activeZone` sur le ScooterMap desktop uniquement.

### Feat: overlay card sur desktop map (match comportement mobile) — ADR-034
**Files:** `app/explore/ExploreClient.tsx`

Desktop map : même overlay card que mobile quand on clique un pin (shop logo, nom, nb scooters, 3 thumbnails, bouton "View scooters"). `showPopup={false}` sur la map desktop pour désactiver le popup Mapbox natif. Wrapper `div.relative` autour de la map desktop pour ancrer l'overlay card. "View scooters" → `setShopIdFilter + setSelectedId(null)` sans `setMobileView` (les deux colonnes restent visibles sur desktop).

### Fix: CLAUDE.md — mise à jour docs/ après chaque changement
**Files:** `CLAUDE.md`

Ajout d'une règle explicite : mettre à jour docs/ après chaque commit, sans attendre le compactage.

---

## 2026-06-10

### Audit: Sentry — full production readiness audit (ADR-033)
**Files:** read-only audit

Complete 8-part audit of the Sentry setup. Findings:
- SDK `@sentry/nextjs@^10.54.0` installed, config files present and well-written
- **Sentry completely inactive**: `NEXT_PUBLIC_SENTRY_DSN` not set in `.env.local` or confirmed in Vercel → `if (dsn)` guard skips all `Sentry.init()` calls
- `SENTRY_AUTH_TOKEN` / `ORG` / `PROJECT` missing → source maps never uploaded → stack traces unreadable in production
- `instrumentation-client.ts` absent (needed for Next.js 15+/turbopack client init)
- Zero user context: no `Sentry.setUser()`, no `Sentry.setTag()` anywhere in app code
- 24 server action files catch errors silently — none call `Sentry.captureException()`
- Privacy config is good: `maskAllText`, `blockAllMedia`, `beforeSend` strips cookies/emails/tokens
- Session replay: `replaysOnErrorSampleRate: 1.0`, `replaysSessionSampleRate: 0` — privacy-correct
- Capacitor: JS errors in WKWebView captured (remote URL mode), native iOS crashes not captured (no `@sentry/capacitor`)
- Production readiness score: **2.5/10** (config quality good, but nothing is active)
- Implementation plan established — 6 steps ordered by priority (see ADR-033)

### Fix: Filters modal sticky header/footer z-index
**Files:** `components/ride/ExploreFilters.tsx`

Sticky header and footer inside `overflow-y-auto` modal had no `z-index` — scrolling content rendered on top of the close button and "Show Results" bar. Added `z-10` to both sticky elements. Audited entire codebase: no other instances of this bug found.

### Fix: Remove redundant deposit hints from scooter detail page
**Files:** `components/ride/DepositInfo.tsx`

Removed "Passport optional — cash deposit accepted" green line (case `both`) and the "No Passport" TrustBadge (cases `cash` and `both`). The deposit options listed above already make this self-evident. Also removed unused `noPassportNeeded` variable.

### Docs: Create docs/ folder structure (CLAUDE.md requirement)
**Files:** `docs/PROJECT_CONTEXT.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/CHANGELOG_AI.md`

Migrated context.md + decisions.md + PROJECT_CONTEXT_COMPLETE.md into the structured `docs/` layout required by CLAUDE.md. Corrected project start dates (2025 → 2026). Added ADR-032 (hero mobile fix).

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

## 2026-05-02

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

## 2026-05-01

### Init: Project scaffold
Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui + Radix, Supabase schema, Vercel config, PWA manifest.

Core pages: Home, Explore, Scooter detail, Checkout, Bookings, Profile.

Design system: tokens in `globals.css`, component library, animations.
