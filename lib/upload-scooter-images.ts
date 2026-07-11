'use client'

// Shared upload orchestration for scooter photos — used by both
// NewScooterForm and EditScooterForm so the atomic-3-variants-or-none
// behavior lives in exactly one place.
//
// Uploads go straight from the browser to Supabase Storage (the bucket's
// INSERT policy allows it). Deletes do NOT — see scooter-image-cleanup.ts
// for why every deletion routes through a Server Action using the admin
// client instead of calling `.storage.remove()` from here directly.

import type { createClient } from '@/lib/supabase/client'
import { deleteScooterImageUrlsAction, deleteScooterImageVariantsAction } from '@/app/actions/scooter-image-cleanup'

type SupabaseBrowserClient = ReturnType<typeof createClient>

const BUCKET = 'scooter-images'
const VARIANTS = ['thumbnail', 'card', 'detail'] as const

export interface ScooterImageVariantBlobs {
  /** Client-generated id shared by all 3 variants of one photo. */
  id: string
  thumbnailBlob: Blob
  cardBlob: Blob
  detailBlob: Blob
}

export interface UploadScooterImageResult {
  ok: boolean
  /** Canonical URL to store in scooters.images — the `detail` variant. */
  detailUrl?: string
  error?: string
}

/**
 * Uploads all 3 variants of one photo to `{shopId}/{imageId}/{variant}.webp`.
 * Never returns ok:true unless all 3 succeeded. If any fails, whichever
 * variants DID upload are deleted (via the admin Server Action — see module
 * doc) before returning — no partial photo is ever left in Storage.
 */
export async function uploadScooterImageVariants(
  supabase: SupabaseBrowserClient,
  shopId: string,
  img: ScooterImageVariantBlobs,
): Promise<UploadScooterImageResult> {
  const blobs = { thumbnail: img.thumbnailBlob, card: img.cardBlob, detail: img.detailBlob }
  const paths = VARIANTS.map(v => `${shopId}/${img.id}/${v}.webp`)

  const settled = await Promise.allSettled(
    VARIANTS.map((v, i) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).storage
        .from(BUCKET)
        .upload(paths[i], blobs[v], { contentType: 'image/webp', upsert: false })
    )
  )

  const succeededPaths: string[] = []
  let firstError: string | null = null

  settled.forEach((result, i) => {
    if (result.status === 'fulfilled' && !result.value?.error) {
      succeededPaths.push(paths[i])
    } else {
      const message = result.status === 'fulfilled'
        ? result.value?.error?.message
        : (result.reason instanceof Error ? result.reason.message : String(result.reason))
      if (!firstError) firstError = message ?? 'Upload failed.'
    }
  })

  if (firstError || succeededPaths.length !== VARIANTS.length) {
    // Sweep all 3 deterministic paths for this imageId unconditionally —
    // not just the ones this client believes succeeded. A request the
    // browser sees as failed/aborted can still land server-side a moment
    // later (observed live), so limiting cleanup to "known succeeded"
    // paths can leave that late arrival orphaned. The action itself
    // double-sweeps with a short delay to catch it either way.
    const cleanup = await deleteScooterImageVariantsAction(shopId, img.id)
    if (!cleanup.success) {
      console.error('[uploadScooterImageVariants] cleanup failed for imageId', img.id, cleanup.error)
    }
    return { ok: false, error: firstError ?? 'One or more image variants failed to upload.' }
  }

  const detailPath = paths[VARIANTS.indexOf('detail')]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (supabase as any).storage.from(BUCKET).getPublicUrl(detailPath)
  return { ok: true, detailUrl: data.publicUrl }
}

/**
 * Deletes every Storage object backing the given canonical photo URLs —
 * all 3 variants for a new-format URL, the single legacy file for an old
 * one. Best-effort: logs and continues on failure rather than throwing,
 * matching the existing scooter-delete.ts convention (a lingering orphaned
 * file is a minor cleanup issue, not worth failing a save/delete over).
 */
export async function deleteScooterImageUrls(shopId: string, urls: string[]): Promise<void> {
  if (urls.length === 0) return
  const result = await deleteScooterImageUrlsAction(shopId, urls)
  if (!result.success) {
    console.warn('[deleteScooterImageUrls] Storage cleanup failed (non-fatal):', result.error)
  }
}
