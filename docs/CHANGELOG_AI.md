# Koh Ride — AI Implementation Changelog

Records significant AI-assisted implementation work. Most recent first.

---

## 2026-06-21 (session 3)

### Feature: Kathu added as official supported zone (ADR-047)

Business decision following ADR-046's audit: Kathu becomes a first-class Koh Ride zone, not a workaround.

**Audit before implementing :** the project has 3 separate, manually-duplicated canonical zone lists (`PHUKET_ZONES` in `lib/zones.ts`, `AREAS` in `constants/areas.ts`, `LOCATIONS` in `constants/index.ts`) — pre-existing architecture, all 16 existing zones already kept in sync across them by hand. Every consumer (Explore filters, Near Me, map, SEO pages, sitemap, structured data, shop/scooter location pickers) iterates these arrays generically — none hardcode zone names in logic. Near Me uses raw Haversine distance on lat/lng, independent of zone names. SEO pages already handle zero-inventory areas gracefully. No DB constraint limits location to a fixed list. No substring-collision risk with "kathu" against any existing zone key. Conclusion: pure additive change, no STOP condition triggered.

**Fichiers modifiés :**
- `lib/zones.ts` — added `{ key: 'kathu', name: 'Kathu', lat: 7.9106, lng: 98.3382, radiusKm: 2.0 }` to `PHUKET_ZONES`.
- `constants/areas.ts` — added a full `AreaMeta` entry for `slug: 'kathu'` (description, longDescription, highlights, nearbyAttractions, `priceFrom: 250`).
- `constants/index.ts` — added `{ id: 'kathu', label: 'Kathu' }` to `LOCATIONS`.

**Pourquoi :** decided as an official zone expansion, not a one-off fix — every system that already consumes these 3 arrays picks up Kathu automatically with zero logic changes.

**Validation :** `tsc --noEmit` clean. `npm run build` succeeded — static page count went from 62 → 64 (`/phuket/kathu` + its `opengraph-image`), confirmed present in `.next/server/app/phuket/kathu/`. `eslint` clean on all 3 changed files.

**Problèmes rencontrés :** Aucun.

**Risques :** centre de zone approximé (pas calibré visuellement sur Mapbox comme les zones historiques) — ajustable plus tard via l'outil `?debugPins=1` déjà existant, non bloquant.

---

## 2026-06-21 (session 2)

### Fix: scooter location is now derived from the shop (ADR-046)

Testing the admin unclaimed-shops flow (ADR-045) surfaced a real bug: a shop created with location "Kathu" couldn't have scooters added, because the scooter form's location dropdown doesn't include Kathu — exposing that scooter and shop locations were two independently-typed, duplicated lists that could diverge.

**Root cause :** `AdminShopsClient.tsx`'s shop-creation form used a free-text `<input>` for location instead of the canonical zone list used everywhere else — that's the only place "Kathu" could be entered at all in this app.

**Fichiers modifiés :**
- `app/actions/scooter-create.ts` / `scooter-update.ts` — `location`, `lat`, `lng` are now always read from the shop row (already fetched for the ownership/admin check) and written to the scooter; never from user input. Removed `location` from both payload interfaces, removed the now-unused `getZoneForLocation` import.
- `app/partner/scooters/new/NewScooterForm.tsx` / `app/partner/scooters/[id]/edit/EditScooterForm.tsx` — replaced the editable location `<select>` with a read-only display ("Same as your shop — always matches."). Removed the duplicated `LOCATIONS` constant from both files.
- `app/admin/shops/AdminShopsClient.tsx` — replaced the free-text location `<input>` with a `<select>` sourced directly from `PHUKET_ZONES` (`lib/zones.ts`), closing the actual root cause instead of just the symptom.

**Pourquoi :** "A scooter belongs to a shop, therefore it is located where the shop is located" — explicit business rule. Fixing only the scooter dropdown (adding Kathu to it) would have left the underlying two-list inconsistency in place for the next missing zone.

**Problèmes rencontrés :** Aucun — `tsc --noEmit` et `npm run build` étaient déjà propres après les changements ; le seul lint flag rencontré (`EditScooterForm.tsx:51`, `prefer-as-const`) est confirmé pré-existant (commit 2026-06-05, via `git blame`), non introduit par ce changement.

**Build : OK. TypeScript : OK.**

**Follow-up (non automatique) :** la boutique de test "Kathu" doit être corrigée manuellement via `/admin/shops/[shopId]/edit` (sélectionner une zone valide) pour que ses scooters résolvent une zone Explore — pas un blocage, juste un signalement visuel absent tant que non corrigé.

---

## 2026-06-21

### Feature: Admin shop edit UI (ADR-045 follow-up)

Admins could create unclaimed shops and manage their scooters (Phase 1), but had no UI to edit the shop's own details (name, contact, location, branding) after creation, or to toggle public visibility.

**Audit before implementing :** `ShopSettingsClient.tsx` (owner-facing, `/partner/shop`) already covers every field the task asked for — name, description, phone, WhatsApp, Line/Telegram/Instagram/website, location/address/coordinates, Google Maps link, delivery zones, location visibility, opening hours, logo, cover banner, mobile banner, gallery — and already calls `updateShop()`, which already supports the admin bypass added in the previous session. `FullShopRow` already includes `active`. Reusing this component end-to-end was the lowest-risk option, instead of building a second parallel shop form.

**Fichiers modifiés :**
- `app/actions/shop-update.ts` — ajout de `active?: boolean` à `UpdateShopPayload`, écrit uniquement si fourni (`payload.active !== undefined`) pour ne jamais affecter un appelant existant qui ne l'envoie pas.
- `app/actions/profile.ts` — ajout de `getFullShopForAdmin(shopId)` : même requête que `getFullShopForOwner`/`getFullShopForOwner` mais via le client `service_role` après vérification `is_admin`, sans filtre `owner_id` — permet de récupérer une boutique qu'on ne possède pas, y compris non réclamée.
- `app/partner/shop/ShopSettingsClient.tsx` — ajout de props optionnelles `isAdmin`, `backHref`, `backLabel`, `redirectTo` (toutes avec une valeur par défaut identique au comportement existant — zéro changement pour le flow propriétaire). Ajout du champ `active` à l'état du formulaire (round-trip systématique, donc neutre pour les propriétaires qui n'ont pas de contrôle pour le changer). Nouvelle section "Visibility" affichée uniquement quand `isAdmin` — toggle `active` réutilisant le composant `Toggle` déjà présent dans le fichier.
- `app/admin/shops/[shopId]/AdminShopDetailClient.tsx` — ajout d'un lien "Edit shop" + badge "Inactive" quand `!shop.active`.

**Fichiers créés :**
- `app/admin/shops/[shopId]/edit/page.tsx` — vérifie `is_admin` côté serveur (redirect sinon), charge la boutique via `getFullShopForAdmin`, rend `ShopSettingsClient` avec `isAdmin` + navigation admin (`backHref`/`redirectTo` vers `/admin/shops/[shopId]`).

**Pourquoi :** Sans cette UI, un admin pouvait créer une boutique non réclamée mais ne pouvait plus jamais corriger une coquille dans le téléphone/WhatsApp/adresse, ni la rendre publique/invisible à la demande.

**Vérifications :**
- `active = false` est déjà filtré côté public — `lib/supabase/queries.ts` fait `.eq('active', true)` à 3 endroits, en plus de la policy RLS `USING (active = true)` — donc le toggle admin masque immédiatement la boutique sans code supplémentaire.
- Upload logo/bannière (bucket `scooter-images`) — même bucket et même mécanisme client-side que l'upload d'images scooter déjà utilisé par un admin en Phase 1 (`NewScooterForm`/`EditScooterForm`) sans problème signalé — pas de risque nouveau.

**Build : OK. TypeScript : OK.**

**Hors scope (volontairement non implémenté) :** invite/claim propriétaire, plans payants, refonte du dashboard.

---

## 2026-06-20

### Feature: Admin-created unclaimed shops — Phase 1 (ADR-045)

Preceded by a read-only audit (same session) of the ownership model, RLS, and every code path that assumes `shop.owner_id` is non-null and equal to the caller. See ADR-045 for full reasoning.

**Fichiers créés :**
- `supabase/migrations/050_shop_owner_status.sql` — colonnes `owner_status` (`unclaimed|invited|claimed`, défaut `claimed`), `invited_owner_email`, `invited_at`, `claimed_at`, `created_by_admin_id` sur `shops`. Durcissement de la policy RLS INSERT `shops` : suppression du bypass `owner_id IS NULL` pour les utilisateurs authentifiés.
- `app/actions/admin-create-shop.ts` — `adminCreateShop(payload)`, vérifie `is_admin` puis insère via `service_role` avec `owner_id = NULL`, `owner_status = 'unclaimed'`.
- `app/actions/admin-shops.ts` — `adminListShops()`, `adminGetShopDetail(shopId)`, lecture admin-only pour l'UI.
- `app/admin/shops/page.tsx` + `AdminShopsClient.tsx` — liste des boutiques (nom, statut owner, actif) + formulaire de création de boutique non réclamée.
- `app/admin/shops/[shopId]/page.tsx` + `AdminShopDetailClient.tsx` — détail boutique + liste scooters + suppression.
- `app/admin/shops/[shopId]/scooters/new/page.tsx` — réutilise `NewScooterForm` existant.
- `app/admin/shops/[shopId]/scooters/[scooterId]/edit/page.tsx` — réutilise `EditScooterForm` existant, fetch via client admin (pas `getScooterById`, qui est RLS-scopé et bloquerait un scooter `available=false` pour un non-propriétaire).

**Fichiers modifiés :**
- `lib/supabase/admin.ts` — ajout `isAdminUser(admin, userId)`, centralise le lookup `profiles.is_admin` déjà dupliqué dans `adminSetShopOverrides`/`adminSetNewListingBadge`.
- `app/actions/scooter-create.ts`, `scooter-update.ts`, `scooter-delete.ts` — condition d'autorisation étendue de `owner_id !== userId` à `owner_id !== userId && !isAdmin`. Comportement propriétaire existant strictement inchangé (premier branch identique).
- `app/actions/messaging.ts` (`getOrCreateConversation`) et `app/actions/shop-conversation.ts` (`getOrCreateShopConversation`) — message d'erreur remplacé par un fallback lisible quand `owner_id` est NULL ("This shop is not on chat yet — please use WhatsApp or phone to contact them.") au lieu de `'Shop owner not found.'` / `'owner_not_found'`.

**Pourquoi :** Onboarder des opérateurs Facebook sans exiger un compte immédiat. `owner_id` était déjà nullable (jamais de contrainte `NOT NULL`) mais chaque action de mutation boutique/scooter bloquait sans bypass admin — un admin ne pouvait littéralement rien créer/modifier pour une boutique qu'il ne possède pas.

**Problèmes rencontrés :**
1. La policy RLS INSERT `shops` de la migration 003 autorisait déjà `owner_id IS NULL` pour tout utilisateur authentifié — jamais exploité par l'app, mais un vrai trou de sécurité à fermer avant que les boutiques non réclamées deviennent une fonctionnalité réelle. Fermé dans la même migration.
2. `getScooterById` (utilisé par la page d'édition propriétaire) est RLS-scopé et aurait bloqué l'admin sur un scooter `available=false`. Évité en écrivant un fetch admin dédié dans la page d'édition admin plutôt que de réutiliser ce helper.
3. Les composants consommateurs de `getOrCreateShopConversation`/`getOrCreateConversation` (`MessageOwnerButton`, `ShopChatButton`, `ShopQuickQuestions`) traitent déjà toute erreur autre que `sign_in_required`/`own_listing` comme un no-op générique (WhatsApp en fallback) — le changement de texte d'erreur ne casse aucune logique de branchement.

**Build : OK (Next.js 16.2.4, Turbopack, 62 routes incluant les 4 nouvelles routes admin). TypeScript : OK (`tsc --noEmit` clean). Lint : 14 erreurs / 72 warnings préexistants, tous dans des fichiers non touchés par ce changement (vérifié via `git status --short`) — zéro nouveau problème introduit.**

**Hors scope Phase 1 (volontairement non implémenté) :** invitation email, claim token, lien automatique propriétaire, lien de navigation admin dans la Navbar/Profile.

---

### Follow-up (même jour) : admin peut éditer `shop-update.ts`

Avant commit, audit demandé sur `shop-update.ts` pour déterminer si l'extension admin pouvait être incluse en Phase 1 sans risque.

**Audit :** autorisation = un seul check `owner_id !== userId`, structurellement identique au pattern scooter avant le bypass admin. Le write passe déjà par le client `service_role` (RLS jamais impliqué). Validation et `revalidatePath()` ne dépendent pas de `owner_id`. Conclusion : changement simple et sûr, aucune dépendance supplémentaire.

**Fichier modifié :**
- `app/actions/shop-update.ts` — condition étendue de `owner_id !== userId` à `owner_id !== userId && !isAdmin`, exactement le même pattern que `scooter-create.ts`/`scooter-update.ts`/`scooter-delete.ts`. Comportement propriétaire inchangé.

**Build : OK. TypeScript : OK.**

---

## 2026-06-17 (session 3)

### Cleanup: suppression instrumentation debug push notifications

Push notifications fonctionnelles en production (APNS accepte, token enregistré, notification reçue). Suppression de tout le code de diagnostic temporaire ajouté pour déboguer le problème.

**Fichiers modifiés :**
- `app/actions/messaging.ts` — suppression de tous les `console.log` de diagnostic dans `sendMessagePush` (recipientId, token count, token prefixes, env vars log, dispatch count, settled log). Dans `deliverApns` : suppression du `console.log` info "sending to", suppression de `const prefix` (n'était utilisé que pour les logs), changement du log de status pour ne logger **que les erreurs** (`status !== 200`) avec `console.error`. Le `try/catch` autour de `Promise.allSettled` supprimé car `allSettled` ne peut pas throw.
- `components/capacitor/CapacitorProvider.tsx` — suppression de l'import `pushDebug`, suppression des 15+ appels `pushDebug(...)` à travers `init()`. Listener `registrationError` conservé avec `console.error('[APNS] registration error:', ...)` à la place du pushDebug. `init().catch(e => pushDebug(...))` → `init().catch(() => {})`.
- `app/messages/ConversationList.tsx` — suppression de l'import `pushDebug`, suppression de 8 appels `pushDebug(...)` dans `checkPush()` et `handleEnablePush()`. Blocs `catch (e)` → `catch { /* ignored */ }`.

**Fichiers créés :**
- `supabase/migrations/049_drop_push_debug_log.sql` — `DROP TABLE IF EXISTS push_debug_log`

**Fichiers supprimés :**
- `lib/pushDebug.ts` — plus de références dans la codebase

**Pourquoi :** Le flux push iOS fonctionne entièrement : token APNS enregistré, `sendMessagePush` trouve le token, APNS accepte la requête, notification reçue sur iPhone (app ouverte, arrière-plan et fermée). Le code de diagnostic n'est plus utile et alourdirait les logs de production.

**Problèmes rencontrés :** Aucun.

---

## 2026-06-17 (session 2)

### Feature: Native push notifications for in-app messages (Phase 2 — Apple Guideline 4.2)

**Fichiers créés :**
- `supabase/migrations/047_push_tokens_service_role.sql` — `GRANT SELECT ON public.push_tokens TO service_role`
- `app/actions/push.ts` — server action `savePushToken(token, platform)` avec upsert Supabase scopé utilisateur

**Fichiers modifiés :**
- `package.json` / `package-lock.json` — ajout `@capacitor/push-notifications@8`
- `capacitor.config.ts` — ajout `PushNotifications.presentationOptions: ['badge', 'sound', 'alert']`
- `app/actions/messaging.ts` — suppression Expo (filtre `ExponentPushToken[`, API `exp.host`, `EXPO_ACCESS_TOKEN`). Remplacement par APNS HTTP/2 direct. Ajout `import * as http2 from 'node:http2'` et `import { createSign } from 'node:crypto'`. Ajout helpers `buildApnsJwt()` et `deliverApns()`. `sendMessagePush` filtre `platform = 'ios'`, lit tokens admin, construit JWT ES256, délivre en parallèle via `Promise.allSettled`.
- `components/capacitor/CapacitorProvider.tsx` — ajout section push (bloc 3). Listeners `pushNotificationActionPerformed` (tap → `router.push('/messages/{conversationId}')`) et `registration` (token → `savePushToken`). Si permission déjà accordée → `PushNotifications.register()` pour rafraîchir le token à chaque lancement.
- `app/messages/ConversationList.tsx` — warm-up push prompt (bottom sheet orange/blanc). Affiché une seule fois sur iOS natif quand `status.receive === 'prompt'` et `rp_push_prompted` absent. "Turn on notifications" → `requestPermissions()` + `register()`. "Not now" → pose le flag sans demander. Ajout `Bell` lucide-react. Retour unifié via Fragment `<>` incluant le prompt overlay + contenu (empty state ou liste).

**Pourquoi :** Apple Guideline 4.2 — l'app doit avoir une fonctionnalité native réelle. La cause racine du non-fonctionnement des pushes était : (1) code Expo existant filtrait activement les tokens Capacitor ; (2) `GRANT SELECT` manquant sur `push_tokens` pour service_role. Missing a lead because the app did not notify the user is unacceptable (requirement explicite).

**Problèmes rencontrés :**
1. `push.ts` : erreur TypeScript `No overload matches` sur `supabase.from('push_tokens').upsert(...)` — la table n'est pas dans les types Supabase générés. Fix : `(supabase as any).from('push_tokens')` (pattern identique à `messaging.ts`).

**Build : OK. TypeScript : OK. Commit : en attente d'approbation.**

---

## 2026-06-17

### Feature: Native geolocation on Explore map (Phase 1 — Apple Guideline 4.2)

**Fichiers modifiés :**
- `hooks/useGeolocation.ts` — nouveau hook (créé)
- `components/map/ScooterMap.tsx` — prop `userLocation`, marqueur bleu, flyTo, guard fitBounds
- `app/explore/ExploreClient.tsx` — bouton "Near me", tri par distance (Haversine), intégration hook
- `package.json` / `package-lock.json` — ajout `@capacitor/geolocation@8`

**Pourquoi :** Apple a rejeté l'app (Guideline 4.2 — fonctionnalité minimale insuffisante). Phase 1 ajoute la géolocalisation native pour satisfaire l'exigence de fonctionnalité native.

**Ce qui a changé :**

1. **`hooks/useGeolocation.ts`** — hook lazy (ne demande pas au montage). Appelle `Geolocation.requestPermissions()` + `getCurrentPosition()` via `@capacitor/geolocation` sur iOS natif. Sur web, fallback `navigator.geolocation` (wrappé dans une Promise pour que le bloc `finally` fonctionne). Retourne `{ location, loading, error, request }`. Erreurs typées : `'denied' | 'unavailable' | 'timeout' | 'unknown'`.

2. **`ScooterMap.tsx`** — nouvelle prop optionnelle `userLocation?: { lat, lng } | null`. Quand non-nulle : crée un marqueur bleu (`#2563eb`, 20px, bordure blanche) via `mapboxgl.Marker` et appelle `map.flyTo()` vers la position. L'effet `fitBounds` (qui sinon remettrait la vue sur les scooters à chaque changement de filtre) retourne tôt quand `userLocation` est non-nul. Nettoyage correct dans le destructeur du useEffect d'initialisation.

3. **`ExploreClient.tsx`** — bouton "Near me" dans la barre de recherche sticky (icône seule sur mobile, icône + texte sur sm+). Couleur bleue quand la position est active. Clic → `requestLocation()` + `setFilters({ sortBy: 'distance' })`. Fonction `haversineKm()` inline pour le tri. Tri 'distance' dans le `useMemo` `filtered` (guard : seulement si `userLocation` non-nul). Toast d'erreur via `sonner` pour les 4 cas d'erreur. `userLocation` ajouté aux deps du useMemo.

**Problèmes rencontrés :**
- Le tri 'distance' et `FilterState.sortBy: 'distance'` existaient déjà dans le codebase (`types/index.ts`, `constants/index.ts`, `ExploreFilters.tsx`) — il ne manquait que l'implémentation réelle.
- La valeur `userLocation` dans le contexte des deps de `filtered` devait être ajoutée explicitement, sinon le tri ne se mettait pas à jour quand la position changeait.

**Build : OK. TypeScript : OK. Commit : en attente d'approbation.**

---

## 2026-06-16

### Fix: Email/password login redirige vers /auth/login au lieu de /profile

**Fichiers modifiés :**
- `app/auth/login/page.tsx` (2 lignes changées)
- `app/profile/ProfileClient.tsx`, `components/layout/Navbar.tsx`, `components/layout/MobileBottomNav.tsx`, `hooks/useAuth.ts` — logs de debug temporaires ajoutés (commit `08f9999`), non retirés à ce stade

**Symptôme :** Après login email/password, les riders voyaient la page Sign In au lieu du profil. Le bug se résolvait seul après ~30 secondes. Les comptes shop owner n'étaient pas affectés. Le login Google fonctionnait immédiatement.

**Investigation :**
1. Ajout de logs serveur (`[PROFILE]`, `[getServerProfile]`) → GET /profile retourne 200, ProfileClient rendu côté serveur. Élimine tout problème serveur.
2. Ajout de logs client (`[useAuth]`, `[Navbar]`, `[ProfileClient]`) → révèle que `pathname=/auth/login` alors que `user=65b78...` est authentifié. La navigation vers `/auth/login` est **cliente**, pas serveur.
3. Analyse de la séquence : SIGNED_IN à t=29376ms → pathname=/ à t=31663ms → pathname=/auth/login à t=34272ms (2,6s après le login).
4. Comparaison OAuth vs email/password : OAuth utilise `NextResponse.redirect` (hard navigation HTTP 302, vide le router cache). Email/password utilisait `router.replace` (soft navigation, préserve le router cache).

**Root cause :** Next.js App Router précharge `/profile` via `<Link>` pendant que l'utilisateur est sur `/auth/login` (non authentifié). Le serveur retourne une redirection vers `/auth/login?redirect=/profile` qui est mise en cache dans le **router cache client**. Après login, `router.replace('/')` (soft nav) préserve ce cache. Le clic sur Profile sert la redirection en cache → boucle jusqu'à expiration (~30s pour routes `force-dynamic`).

**Fix :** Dans `app/auth/login/page.tsx`, remplacement de `router.replace(redirect)` par `window.location.replace(redirect)` aux deux endroits (ligne 39 dans `useEffect`, ligne 86 dans `handleSubmit`). Hard navigation identique au callback OAuth → router cache vidé → requête fraîche avec cookies de session.

**Problèmes rencontrés :** Longue investigation en plusieurs sessions. Plusieurs théories invalidées : rendu serveur (prouvé OK), RLS (prouvé OK), href nav (prouvé corrects), timing cookies. La clé a été les logs client qui ont révélé `user` authentifié sur `pathname=/auth/login`.

**Build : OK. Commits : `08f9999` (logs debug), `07121a4` (fix).**

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
