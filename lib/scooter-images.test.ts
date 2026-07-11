// Run with: node --test lib/scooter-images.test.ts
// No test framework dependency — Node's built-in test runner + assert.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getScooterImageUrl,
  getScooterImageStoragePaths,
  isVariantScooterImageUrl,
  resolveCoverUrl,
  resolveSafeDeletionPaths,
  getDeterministicVariantPaths,
  isAuthorizedForShopCleanup,
} from './scooter-images.ts'

const PROJECT = 'https://xuzmkhwfjissagnygrfb.supabase.co'
const NEW_DETAIL = `${PROJECT}/storage/v1/object/public/scooter-images/shop_abc/img_123/detail.webp`
const LEGACY = `${PROJECT}/storage/v1/object/public/scooter-images/shop_abc/1719999999-x7k2p.webp`

test('isVariantScooterImageUrl: true for new-format detail URL', () => {
  assert.equal(isVariantScooterImageUrl(NEW_DETAIL), true)
})

test('isVariantScooterImageUrl: false for legacy flat URL', () => {
  assert.equal(isVariantScooterImageUrl(LEGACY), false)
})

test('isVariantScooterImageUrl: false for malformed URL', () => {
  assert.equal(isVariantScooterImageUrl('not a url'), false)
  assert.equal(isVariantScooterImageUrl(''), false)
})

test('getScooterImageUrl: derives thumbnail from a detail URL', () => {
  const result = getScooterImageUrl(NEW_DETAIL, 'thumbnail')
  assert.equal(
    result,
    `${PROJECT}/storage/v1/object/public/scooter-images/shop_abc/img_123/thumbnail.webp`
  )
})

test('getScooterImageUrl: derives card from a detail URL', () => {
  const result = getScooterImageUrl(NEW_DETAIL, 'card')
  assert.equal(
    result,
    `${PROJECT}/storage/v1/object/public/scooter-images/shop_abc/img_123/card.webp`
  )
})

test('getScooterImageUrl: derives detail from a thumbnail URL (round trip)', () => {
  const thumb = getScooterImageUrl(NEW_DETAIL, 'thumbnail')
  const backToDetail = getScooterImageUrl(thumb, 'detail')
  assert.equal(backToDetail, NEW_DETAIL)
})

test('getScooterImageUrl: "original" returns the canonical URL unchanged', () => {
  assert.equal(getScooterImageUrl(NEW_DETAIL, 'original'), NEW_DETAIL)
})

test('getScooterImageUrl: legacy URL returned unchanged for every variant', () => {
  assert.equal(getScooterImageUrl(LEGACY, 'thumbnail'), LEGACY)
  assert.equal(getScooterImageUrl(LEGACY, 'card'), LEGACY)
  assert.equal(getScooterImageUrl(LEGACY, 'detail'), LEGACY)
})

test('getScooterImageUrl: preserves query parameters', () => {
  const withQuery = `${NEW_DETAIL}?t=123456`
  const result = getScooterImageUrl(withQuery, 'card')
  assert.equal(
    result,
    `${PROJECT}/storage/v1/object/public/scooter-images/shop_abc/img_123/card.webp?t=123456`
  )
})

test('getScooterImageUrl: invalid URL returned unchanged, never throws', () => {
  assert.equal(getScooterImageUrl('not a url', 'card'), 'not a url')
  assert.equal(getScooterImageUrl('', 'card'), '')
})

test('getScooterImageUrl: third-party fallback URL (Unsplash) passes through unchanged', () => {
  const fallback = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70'
  assert.equal(getScooterImageUrl(fallback, 'thumbnail'), fallback)
})

test('getScooterImageStoragePaths: new-format URL returns all 3 variant paths', () => {
  const paths = getScooterImageStoragePaths(NEW_DETAIL)
  assert.deepEqual(paths, [
    'shop_abc/img_123/thumbnail.webp',
    'shop_abc/img_123/card.webp',
    'shop_abc/img_123/detail.webp',
  ])
})

test('getScooterImageStoragePaths: legacy URL returns a single path', () => {
  const paths = getScooterImageStoragePaths(LEGACY)
  assert.deepEqual(paths, ['shop_abc/1719999999-x7k2p.webp'])
})

test('getScooterImageStoragePaths: malformed URL returns null', () => {
  assert.equal(getScooterImageStoragePaths('not a url'), null)
  assert.equal(getScooterImageStoragePaths(''), null)
})

test('getScooterImageStoragePaths: non-scooter-images URL returns null', () => {
  assert.equal(getScooterImageStoragePaths('https://images.unsplash.com/photo-123'), null)
})

test('getScooterImageUrl: works identically regardless of which variant is the input', () => {
  const card = getScooterImageUrl(NEW_DETAIL, 'card')
  const thumbFromCard = getScooterImageUrl(card, 'thumbnail')
  const thumbFromDetail = getScooterImageUrl(NEW_DETAIL, 'thumbnail')
  assert.equal(thumbFromCard, thumbFromDetail)
})

// ── Deletion path derivation — "suppression legacy" / "suppression des trois variants" ──

test('getScooterImageStoragePaths: deleting a legacy photo removes exactly 1 file', () => {
  const paths = getScooterImageStoragePaths(LEGACY)
  assert.equal(paths?.length, 1)
})

test('getScooterImageStoragePaths: deleting a new-format photo removes exactly 3 files, one per variant', () => {
  const paths = getScooterImageStoragePaths(NEW_DETAIL)
  assert.equal(paths?.length, 3)
  assert.ok(paths?.some(p => p.endsWith('/thumbnail.webp')))
  assert.ok(paths?.some(p => p.endsWith('/card.webp')))
  assert.ok(paths?.some(p => p.endsWith('/detail.webp')))
})

test('getScooterImageStoragePaths: a mixed batch (legacy + new-format) flattens to 1 + 3 = 4 paths', () => {
  const urls = [LEGACY, NEW_DETAIL]
  const allPaths = urls.flatMap(u => getScooterImageStoragePaths(u) ?? [])
  assert.equal(allPaths.length, 4)
})

test('getScooterImageStoragePaths: an empty/invalid URL in a batch contributes zero paths, never throws', () => {
  const urls = [LEGACY, '', 'not a url', NEW_DETAIL]
  const allPaths = urls.flatMap(u => getScooterImageStoragePaths(u) ?? [])
  assert.equal(allPaths.length, 4) // only the 2 valid URLs contribute (1 + 3)
})

// ── Cover derivation ──────────────────────────────────────────────────────

test('resolveCoverUrl: explicit isCover wins over position', () => {
  const result = resolveCoverUrl([
    { url: 'https://x/a.webp', isCover: false },
    { url: 'https://x/b.webp', isCover: true },
    { url: 'https://x/c.webp', isCover: false },
  ])
  assert.equal(result, 'https://x/b.webp')
})

test('resolveCoverUrl: falls back to the first candidate when nothing is starred', () => {
  const result = resolveCoverUrl([
    { url: 'https://x/a.webp', isCover: false },
    { url: 'https://x/b.webp', isCover: false },
  ])
  assert.equal(result, 'https://x/a.webp')
})

test('resolveCoverUrl: a newly-uploaded photo marked isCover wins over an existing photo — the bug this fixes', () => {
  // Reproduces the pre-existing gap: EditScooterForm used to only track
  // cover selection for existing photos, silently ignoring a new photo's
  // own isCover flag from ImageUploader's star button. The combined
  // candidate list this function expects fixes that by construction.
  const existing = [{ url: 'https://x/existing-1.webp', isCover: false }]
  const newlyUploaded = [{ url: 'https://x/new-1.webp', isCover: true }]
  const result = resolveCoverUrl([...existing, ...newlyUploaded])
  assert.equal(result, 'https://x/new-1.webp')
})

test('resolveCoverUrl: empty candidate list returns null, never throws', () => {
  assert.equal(resolveCoverUrl([]), null)
})

// ── Security boundary: app/actions/scooter-image-cleanup.ts ────────────────
// These test the exact pure functions the Server Action calls for its
// authorization decision and its path-derivation — the I/O around them
// (real auth session, real DB lookup) is validated by live browser testing,
// not mockable here, but the DECISIONS made from that data are.

const HOST = 'realproject.supabase.co'
const SHOP = 'shop-abc-123'
const OTHER_SHOP = 'shop-other-999'

function newFormatUrl(host: string, shop: string, imageId = 'img-1') {
  return `https://${host}/storage/v1/object/public/scooter-images/${shop}/${imageId}/detail.webp`
}
function legacyUrl(host: string, shop: string) {
  return `https://${host}/storage/v1/object/public/scooter-images/${shop}/1719999999-x7k2p.webp`
}

test('resolveSafeDeletionPaths: valid variants URL for the allowed shop -> all 3 paths', () => {
  const paths = resolveSafeDeletionPaths([newFormatUrl(HOST, SHOP)], SHOP, HOST)
  assert.deepEqual(paths.sort(), [
    `${SHOP}/img-1/card.webp`,
    `${SHOP}/img-1/detail.webp`,
    `${SHOP}/img-1/thumbnail.webp`,
  ].sort())
})

test('resolveSafeDeletionPaths: valid legacy URL for the allowed shop -> exactly 1 path', () => {
  const paths = resolveSafeDeletionPaths([legacyUrl(HOST, SHOP)], SHOP, HOST)
  assert.equal(paths.length, 1)
  assert.equal(paths[0], `${SHOP}/1719999999-x7k2p.webp`)
})

test('resolveSafeDeletionPaths: a path belonging to a different shop is rejected', () => {
  const paths = resolveSafeDeletionPaths([newFormatUrl(HOST, OTHER_SHOP)], SHOP, HOST)
  assert.deepEqual(paths, [])
})

test('resolveSafeDeletionPaths: an external host is rejected even if the path looks right', () => {
  const paths = resolveSafeDeletionPaths([newFormatUrl('evil.example.com', SHOP)], SHOP, HOST)
  assert.deepEqual(paths, [])
})

test('resolveSafeDeletionPaths: a URL for a different bucket is rejected', () => {
  const url = `https://${HOST}/storage/v1/object/public/some-other-bucket/${SHOP}/img-1/detail.webp`
  const paths = resolveSafeDeletionPaths([url], SHOP, HOST)
  assert.deepEqual(paths, [])
})

test('resolveSafeDeletionPaths: an invalid/malformed URL is rejected, never throws', () => {
  const paths = resolveSafeDeletionPaths(['not a url', '', 'ftp://x'], SHOP, HOST)
  assert.deepEqual(paths, [])
})

test('resolveSafeDeletionPaths: path traversal segments are rejected', () => {
  const url = `https://${HOST}/storage/v1/object/public/scooter-images/${SHOP}/../${OTHER_SHOP}/detail.webp`
  const paths = resolveSafeDeletionPaths([url], SHOP, HOST)
  assert.deepEqual(paths, [])
})

test('resolveSafeDeletionPaths: percent-encoded traversal ("%2e%2e") is rejected after decoding', () => {
  const url = `https://${HOST}/storage/v1/object/public/scooter-images/${SHOP}/%2e%2e/detail.webp`
  const paths = resolveSafeDeletionPaths([url], SHOP, HOST)
  assert.deepEqual(paths, [])
})

test('resolveSafeDeletionPaths: malformed percent-encoding is rejected, never throws', () => {
  const url = `https://${HOST}/storage/v1/object/public/scooter-images/${SHOP}/%/detail.webp`
  assert.doesNotThrow(() => resolveSafeDeletionPaths([url], SHOP, HOST))
  assert.deepEqual(resolveSafeDeletionPaths([url], SHOP, HOST), [])
})

test('resolveSafeDeletionPaths: a mixed batch only yields paths for the owned shop, rest silently dropped', () => {
  const urls = [
    newFormatUrl(HOST, SHOP, 'mine'),
    newFormatUrl(HOST, OTHER_SHOP, 'not-mine'),
    legacyUrl('evil.example.com', SHOP),
    'garbage',
  ]
  const paths = resolveSafeDeletionPaths(urls, SHOP, HOST)
  assert.equal(paths.length, 3) // only the first URL's 3 variants
  assert.ok(paths.every(p => p.startsWith(`${SHOP}/mine/`)))
})

test('resolveSafeDeletionPaths: empty allowedShopId or expectedHost yields nothing, never throws', () => {
  assert.deepEqual(resolveSafeDeletionPaths([newFormatUrl(HOST, SHOP)], '', HOST), [])
  assert.deepEqual(resolveSafeDeletionPaths([newFormatUrl(HOST, SHOP)], SHOP, ''), [])
})

test('getDeterministicVariantPaths: valid shopId + imageId -> 3 paths', () => {
  const paths = getDeterministicVariantPaths(SHOP, 'img-1')
  assert.deepEqual(paths, [
    `${SHOP}/img-1/thumbnail.webp`,
    `${SHOP}/img-1/card.webp`,
    `${SHOP}/img-1/detail.webp`,
  ])
})

test('getDeterministicVariantPaths: an imageId containing a slash (path-shape tampering) is rejected', () => {
  assert.deepEqual(getDeterministicVariantPaths(SHOP, 'a/b'), [])
})

test('getDeterministicVariantPaths: empty shopId or imageId yields nothing', () => {
  assert.deepEqual(getDeterministicVariantPaths('', 'img-1'), [])
  assert.deepEqual(getDeterministicVariantPaths(SHOP, ''), [])
})

// ── Authorization decision — "utilisateur non authentifié" / "shop d'un autre propriétaire" ──

test('isAuthorizedForShopCleanup: unauthenticated user is denied', () => {
  assert.equal(isAuthorizedForShopCleanup(null, { owner_id: 'user-1' }, false), false)
})

test('isAuthorizedForShopCleanup: shop owned by a different user is denied', () => {
  assert.equal(isAuthorizedForShopCleanup({ id: 'user-1' }, { owner_id: 'someone-else' }, false), false)
})

test('isAuthorizedForShopCleanup: shop not found is denied', () => {
  assert.equal(isAuthorizedForShopCleanup({ id: 'user-1' }, null, false), false)
})

test('isAuthorizedForShopCleanup: the actual owner is authorized', () => {
  assert.equal(isAuthorizedForShopCleanup({ id: 'user-1' }, { owner_id: 'user-1' }, false), true)
})

test('isAuthorizedForShopCleanup: an admin is authorized even without owning the shop', () => {
  assert.equal(isAuthorizedForShopCleanup({ id: 'admin-1' }, { owner_id: 'someone-else' }, true), true)
})
