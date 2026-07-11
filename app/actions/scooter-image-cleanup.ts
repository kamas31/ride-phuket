'use server'

// Deletes scooter-photo Storage objects on behalf of the authenticated shop
// owner, using the admin client.
//
// Why this exists (found via live browser testing, not theoretical): the
// `scooter-images` bucket's Storage RLS has an INSERT policy but no DELETE
// policy for the `authenticated` role. A browser-side `.storage.remove()`
// call (using the user's own session) returns HTTP 200 with an EMPTY
// result array — Postgres RLS silently matches zero rows rather than
// erroring, so the Supabase JS client sees no `error` and the app believes
// cleanup succeeded while the files remain orphaned forever. Confirmed by
// replaying the identical request with the service-role key, which deletes
// the file for real. This mirrors why app/actions/scooter-delete.ts already
// used the admin client for its own storage cleanup — this action extends
// that same pattern to the new atomic-upload-rollback and edit-removal
// cleanup paths, instead of adding a new Storage RLS policy.
//
// Because this runs with admin privileges (RLS bypassed), every path it is
// ever allowed to delete is re-derived and re-validated here, server-side,
// against a shopId the caller has just been proven to own — never trusted
// from client input beyond that.
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { resolveSafeDeletionPaths, getDeterministicVariantPaths, isAuthorizedForShopCleanup } from '@/lib/scooter-images'

const BUCKET = 'scooter-images'
// Never trust a host from client input — this is the only host any
// deletion path is ever allowed to have come from, read from the server's
// own environment.
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host
  } catch {
    return ''
  }
})()

export interface CleanupResult {
  success: boolean
  error?: string
}

/**
 * Confirms the caller is authenticated AND owns `shopId`. Every exported
 * action in this file calls this before touching Storage. Errors are
 * intentionally generic — "Not authenticated." / "You do not own this
 * shop." never leak whether a shopId exists, belongs to someone else, or
 * any Supabase-internal detail.
 */
async function verifyShopOwnership(shopId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const userClient = await createClient()
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Not authenticated.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (admin as any).from('shops').select('id,owner_id').eq('id', shopId).single()
  const isAdmin = await isAdminUser(admin, user.id)

  // The actual authorization decision is a pure function (lib/scooter-images.ts)
  // so it's unit-tested directly, not just exercised through this I/O path.
  if (!isAuthorizedForShopCleanup(user, shop ?? null, isAdmin)) {
    return { ok: false, error: 'You do not own this shop.' }
  }
  return { ok: true }
}

/**
 * Removes `paths` from Storage, resistant to the following race (observed
 * live, not theoretical): a browser-side upload request the client sees as
 * failed/aborted can still land server-side a moment later. A single
 * `.remove()` call can't distinguish "already gone" from "not there yet,
 * about to be written by a phantom in-flight request" — both look like a
 * successful, empty-ish removal. So this always sweeps twice: once
 * immediately, once after a short fixed delay, regardless of whether the
 * first sweep reported an error. Exactly two attempts, never a loop.
 * "Already absent" is a success on either sweep — Supabase's `.remove()`
 * only ever returns an `error` for a real failure (auth/network/etc.), not
 * for paths that simply don't exist, so no special-casing is needed for
 * that specifically.
 */
async function removeWithRaceGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  paths: string[],
): Promise<CleanupResult> {
  if (paths.length === 0) return { success: true }

  const first = await admin.storage.from(BUCKET).remove(paths)
  if (!first.error) return { success: true }

  await new Promise(resolve => setTimeout(resolve, 1500))

  const second = await admin.storage.from(BUCKET).remove(paths)
  if (!second.error) return { success: true }

  // Detailed error server-side only — never forwarded to the client.
  console.error('[scooter-image-cleanup] final removal failure for paths', paths, second.error)
  return { success: false, error: 'Storage cleanup failed.' }
}

/**
 * Deletes every Storage object backing `urls` — all 3 variants for a
 * new-format photo, the single file for a legacy one. Used when the
 * caller only has canonical photo URLs in hand (removing an existing photo
 * during edit, cleaning up after a downstream DB write failed).
 *
 * Every URL is re-validated against the Supabase host, the exact
 * `scooter-images` object-URL shape, and `shopId` — see
 * resolveSafeDeletionPaths for the full guarantee. A URL pointing at a
 * different bucket, a different shop, an external host, or anything
 * malformed contributes zero paths rather than being deleted or erroring.
 */
export async function deleteScooterImageUrlsAction(shopId: string, urls: string[]): Promise<CleanupResult> {
  try {
    if (!shopId || urls.length === 0) return { success: true }

    const ownership = await verifyShopOwnership(shopId)
    if (!ownership.ok) return { success: false, error: ownership.error }

    const paths = resolveSafeDeletionPaths(urls, shopId, SUPABASE_HOST)
    if (paths.length === 0) return { success: true }

    const admin = createAdminClient()
    return await removeWithRaceGuard(admin, paths)
  } catch (e) {
    console.error('[deleteScooterImageUrlsAction] unexpected error:', e)
    return { success: false, error: 'Cleanup failed.' }
  }
}

/**
 * Deletes the 3 deterministic variant paths for one photo, given its
 * shopId + client-generated imageId directly — used for the atomic
 * upload-rollback path, where the caller already knows exactly which
 * imageId it just tried to upload and doesn't need to round-trip through a
 * constructed URL. Sweeps all 3 possible paths unconditionally (thumbnail/
 * card/detail), not just the ones the client believes actually uploaded —
 * see removeWithRaceGuard for why that matters.
 */
export async function deleteScooterImageVariantsAction(shopId: string, imageId: string): Promise<CleanupResult> {
  try {
    if (!shopId || !imageId) return { success: true }

    const ownership = await verifyShopOwnership(shopId)
    if (!ownership.ok) return { success: false, error: ownership.error }

    const paths = getDeterministicVariantPaths(shopId, imageId)
    if (paths.length === 0) return { success: true }

    const admin = createAdminClient()
    return await removeWithRaceGuard(admin, paths)
  } catch (e) {
    console.error('[deleteScooterImageVariantsAction] unexpected error:', e)
    return { success: false, error: 'Cleanup failed.' }
  }
}
