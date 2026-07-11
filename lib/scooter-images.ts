// Centralized resolver for scooter photo variants.
//
// New uploads write 3 pre-generated WebP variants per photo to Supabase Storage:
//   scooter-images/{shopId}/{imageId}/thumbnail.webp   (~320px)
//   scooter-images/{shopId}/{imageId}/card.webp        (~800px)
//   scooter-images/{shopId}/{imageId}/detail.webp      (~1600px)
//
// scooters.images stores exactly one URL per photo — the `detail` variant —
// as the canonical URL. Every other variant is derived from it at read time
// by this module, never duplicated in components.
//
// Legacy photos (uploaded before this pipeline existed) live at a flat path —
// scooter-images/{shopId}/{timestamp}-{random}.webp — with no siblings. Every
// function here falls back to returning that same URL unchanged for any
// variant request, so old photos keep working with zero migration.
//
// Pure, dependency-free (only the global `URL`) — safe to import from client
// components, Server Actions, and plain `node --test` unit tests alike.

export type ScooterImageVariant = 'thumbnail' | 'card' | 'detail' | 'original'

const BUCKET_MARKER = '/scooter-images/'
const VARIANT_FILENAMES = ['thumbnail', 'card', 'detail'] as const

interface ParsedVariantUrl {
  /** Everything up to and including the bucket marker, e.g. ".../object/public/scooter-images/" */
  prefix: string
  shopId: string
  imageId: string
}

/**
 * Parses a URL as the new `{shopId}/{imageId}/{variant}.webp` shape.
 * Returns null for anything else (legacy URLs, non-scooter-images URLs,
 * malformed URLs) — callers treat null as "cannot derive, pass through".
 */
function parseVariantUrl(u: URL): ParsedVariantUrl | null {
  const idx = u.pathname.indexOf(BUCKET_MARKER)
  if (idx === -1) return null

  const prefix = u.pathname.slice(0, idx + BUCKET_MARKER.length)
  const rest = u.pathname.slice(idx + BUCKET_MARKER.length)
  const segments = rest.split('/').filter(Boolean)
  if (segments.length !== 3) return null

  const [shopId, imageId, filename] = segments
  if (!shopId || !imageId) return null
  const match = filename.match(/^(thumbnail|card|detail)\.webp$/)
  if (!match) return null

  return { prefix, shopId, imageId }
}

function tryParseUrl(url: string): URL | null {
  if (!url) return null
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/** True if `url` matches the new `{shopId}/{imageId}/{variant}.webp` pipeline shape. */
export function isVariantScooterImageUrl(url: string): boolean {
  const u = tryParseUrl(url)
  if (!u) return false
  return parseVariantUrl(u) !== null
}

/**
 * Returns the URL for the requested variant. If `url` doesn't match the new
 * pipeline shape (legacy photo, non-Supabase URL, invalid URL), returns `url`
 * unchanged for every variant — the entire backward-compatibility strategy
 * lives in this one fallback.
 *
 * Manipulates the URL via `pathname` only (never a raw string replace), so
 * query parameters and hash are preserved automatically.
 */
export function getScooterImageUrl(url: string, variant: ScooterImageVariant): string {
  const u = tryParseUrl(url)
  if (!u) return url

  const parsed = parseVariantUrl(u)
  if (!parsed) return url

  // We don't store a true original — `original` means "the canonical URL as-is".
  if (variant === 'original') return url

  u.pathname = `${parsed.prefix}${parsed.shopId}/${parsed.imageId}/${variant}.webp`
  return u.toString()
}

/**
 * Returns the bucket-relative storage object path(s) backing `url`:
 * - new format → all 3 variant paths (thumbnail/card/detail), so callers can
 *   delete a photo's full variant set in one `.remove()` call
 * - legacy format → a single-element array with that one file's path
 * - unparseable / not a scooter-images URL → null
 */
export function getScooterImageStoragePaths(url: string): string[] | null {
  const u = tryParseUrl(url)
  if (!u) return null

  const idx = u.pathname.indexOf(BUCKET_MARKER)
  if (idx === -1) return null

  const rest = u.pathname.slice(idx + BUCKET_MARKER.length)
  const segments = rest.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const parsed = parseVariantUrl(u)
  if (parsed) {
    return VARIANT_FILENAMES.map(v => `${parsed.shopId}/${parsed.imageId}/${v}.webp`)
  }

  // Legacy: single flat file — path is the full remaining segment chain, decoded.
  return [segments.map(decodeURIComponent).join('/')]
}

/**
 * Resolves which URL should be scooters.cover_image, given every candidate
 * photo (existing + newly-uploaded, in display order) and which one (if any)
 * was explicitly starred as cover. Falls back to the first candidate when
 * nothing was explicitly starred.
 *
 * Single source of truth for both NewScooterForm and EditScooterForm — the
 * two forms previously computed this independently, and EditScooterForm's
 * version never looked at new photos' own isCover flag (set via the
 * ImageUploader star button), so starring a newly-added photo as cover
 * during an edit was silently ignored. Both forms now build one combined
 * candidate list (existing photos + newly-uploaded ones, each carrying
 * their own isCover) and call this instead.
 */
export function resolveCoverUrl(candidates: { url: string; isCover: boolean }[]): string | null {
  const explicit = candidates.find(c => c.isCover)
  return explicit?.url ?? candidates[0]?.url ?? null
}

// ── Security-boundary helpers ────────────────────────────────────────────
// Used only by app/actions/scooter-image-cleanup.ts, the one place that
// actually deletes Storage objects with admin privileges. Deliberately
// stricter than getScooterImageStoragePaths above (which is fine to be
// lenient — it only ever *derives a URL to display*, worst case a bad input
// produces a URL that 404s). These reject anything ambiguous rather than
// guessing, because a false positive here means deleting the wrong file.

const IMAGE_ID_RE = /^[A-Za-z0-9_-]+$/

/**
 * Pure authorization decision for scooter-image-cleanup.ts's Server
 * Actions — given already-resolved user/shop data (the I/O happens in the
 * caller, which can't be unit-tested without mocking Next.js/Supabase),
 * decides whether this user may delete this shop's Storage objects.
 * Exported (and actually called by the real action, not duplicated) so the
 * decision itself — not authenticated, not the owner, is the owner, is an
 * admin — is directly unit-testable.
 */
export function isAuthorizedForShopCleanup(
  user: { id: string } | null,
  shop: { owner_id: string | null } | null,
  isAdmin: boolean,
): boolean {
  if (!user) return false
  if (!shop) return false
  if (shop.owner_id === user.id) return true
  return isAdmin
}

/** The 3 deterministic Storage paths for one photo. Pure string construction — no I/O. */
export function getDeterministicVariantPaths(shopId: string, imageId: string): string[] {
  if (!shopId || !imageId || !IMAGE_ID_RE.test(imageId)) return []
  return VARIANT_FILENAMES.map(v => `${shopId}/${imageId}/${v}.webp`)
}

/**
 * Strict variant of getScooterImageStoragePaths for the deletion security
 * boundary. A path is only ever returned if ALL of the following hold:
 *  - the URL parses at all
 *  - its host is exactly `expectedHost` (no subdomain/lookalike tricks)
 *  - its pathname is exactly the Supabase Storage object-URL shape for the
 *    `scooter-images` bucket (anchored regex, not a "contains" check)
 *  - none of its path segments are empty, ".", "..", or contain a NUL byte
 *  - the shop-id segment equals `allowedShopId` — the one thing the caller
 *    has already verified the current user actually owns
 *
 * Anything that fails any check contributes zero paths — never throws,
 * never falls back to "delete anyway". For a new-format URL, all 3 variant
 * paths are returned regardless of which single variant the URL named,
 * since deleting a photo always means deleting its full variant set.
 */
export function resolveSafeDeletionPaths(
  urls: string[],
  allowedShopId: string,
  expectedHost: string,
): string[] {
  if (!allowedShopId || !expectedHost) return []
  const out = new Set<string>()

  for (const url of urls) {
    const u = tryParseUrl(url)
    if (!u) continue
    if (u.host !== expectedHost) continue

    const match = u.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/scooter-images\/(.+)$/)
    if (!match) continue

    const rawSegments = match[1].split('/')
    if (rawSegments.some(s => s.length === 0)) continue

    // Decode BEFORE checking for traversal-looking segments — a raw ".."
    // in the pathname is already collapsed by the URL parser itself before
    // we ever see it, but a percent-encoded "%2e%2e" survives parsing as a
    // literal segment and only becomes ".." after decoding. Checking the
    // still-encoded form would miss it. Supabase object keys aren't
    // filesystem paths so ".." has no special meaning to it either way —
    // this is pure defense in depth, not relied on to stop a real attack.
    let segments: string[]
    try {
      segments = rawSegments.map(decodeURIComponent)
    } catch {
      continue // malformed percent-encoding
    }
    if (segments.some(s => s === '.' || s === '..' || s.includes('\0'))) continue

    if (segments.length === 3) {
      const [shopId, imageId, filename] = segments
      if (shopId !== allowedShopId) continue
      if (!IMAGE_ID_RE.test(imageId)) continue
      if (!/^(thumbnail|card|detail)\.webp$/.test(filename)) continue
      for (const v of VARIANT_FILENAMES) out.add(`${shopId}/${imageId}/${v}.webp`)
    } else if (segments.length === 2) {
      const [shopId, filename] = segments
      if (shopId !== allowedShopId) continue
      if (!filename) continue
      out.add(`${shopId}/${filename}`)
    }
    // Any other segment count doesn't match a shape this pipeline ever
    // produces — rejected, not guessed at.
  }

  return [...out]
}
