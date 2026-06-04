'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitize, containsContactInfo } from '@/lib/moderation'
import type { ShopReview, ReviewReportReason } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDisplayName(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Anonymous'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

function toInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeReview(r: any): ShopReview {
  const name: string = r.profiles?.name ?? ''
  return {
    id:                   r.id,
    userId:               r.user_id,
    displayName:          toDisplayName(name),
    initials:             toInitials(name),
    avatarUrl:            r.profiles?.avatar_url ?? null,
    shopLogoUrl:          r.shops?.logo_url ?? null,
    rating:               r.rating,
    comment:              r.comment ?? '',
    createdAt:            r.created_at,
    updatedAt:            r.updated_at ?? r.created_at,
    verified:             Boolean(r.verified),
    ownerReply:           r.owner_reply ?? null,
    ownerReplyCreatedAt:  r.owner_reply_created_at ?? null,
  }
}

// ── getShopReviews ─────────────────────────────────────────────────────────────

export async function getShopReviews(shopId: string): Promise<{
  reviews: ShopReview[]
  userReview: ShopReview | null
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let admin: any
  try {
    admin = createAdminClient()
  } catch {
    return { reviews: [], userReview: null }
  }

  const { data, error } = await admin
    .from('reviews')
    .select('id, user_id, rating, comment, created_at, updated_at, verified, owner_reply, owner_reply_created_at, profiles(name, avatar_url), shops(logo_url)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error || !data) return { reviews: [], userReview: null }

  const reviews: ShopReview[] = (data as unknown[]).map(normalizeReview)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userReview = user ? (reviews.find(r => r.userId === user.id) ?? null) : null

  return { reviews, userReview }
}

// ── submitReview ───────────────────────────────────────────────────────────────

export async function submitReview(
  shopId: string,
  rating: number,
  comment: string,
): Promise<{ success: boolean; error?: string; reviewId?: string }> {
  if (!shopId) return { success: false, error: 'Shop not found.' }
  if (rating < 1 || rating > 5) return { success: false, error: 'Rating must be 1–5.' }

  const trimmed = comment.trim()
  if (trimmed.length < 10) return { success: false, error: 'Comment must be at least 10 characters.' }
  if (trimmed.length > 1000) return { success: false, error: 'Comment too long (max 1000 characters).' }
  if (containsContactInfo(trimmed)) return { success: false, error: 'Please keep reviews on-topic. Contact info is not allowed.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'sign_in_required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Guard: cannot review your own shop
  const { data: shopRow } = await admin.from('shops').select('owner_id').eq('id', shopId).single()
  if (shopRow?.owner_id === user.id) return { success: false, error: 'You cannot review your own shop.' }

  const clean = sanitize(trimmed)

  const { data, error } = await admin
    .from('reviews')
    .insert({
      shop_id:   shopId,
      user_id:   user.id,
      rating,
      comment:   clean,
      verified:  false,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'You have already reviewed this shop.' }
    console.error('[submitReview]', error.message)
    return { success: false, error: 'Failed to submit review.' }
  }

  return { success: true, reviewId: (data as { id: string }).id }
}

// ── updateReview ───────────────────────────────────────────────────────────────

export async function updateReview(
  reviewId: string,
  rating: number,
  comment: string,
): Promise<{ success: boolean; error?: string }> {
  if (rating < 1 || rating > 5) return { success: false, error: 'Rating must be 1–5.' }

  const trimmed = comment.trim()
  if (trimmed.length < 10) return { success: false, error: 'Comment must be at least 10 characters.' }
  if (trimmed.length > 1000) return { success: false, error: 'Comment too long (max 1000 characters).' }
  if (containsContactInfo(trimmed)) return { success: false, error: 'Contact info is not allowed in reviews.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'sign_in_required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: existing } = await admin
    .from('reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single()

  if (!existing) return { success: false, error: 'Review not found.' }
  if (existing.user_id !== user.id) return { success: false, error: 'Not your review.' }

  const clean = sanitize(trimmed)

  const { error } = await admin
    .from('reviews')
    .update({ rating, comment: clean, updated_at: new Date().toISOString() })
    .eq('id', reviewId)

  if (error) {
    console.error('[updateReview]', error.message)
    return { success: false, error: 'Failed to update review.' }
  }

  return { success: true }
}

// ── submitOwnerReply ───────────────────────────────────────────────────────────

export async function submitOwnerReply(
  reviewId: string,
  reply: string,
): Promise<{ success: boolean; error?: string }> {
  const trimmed = reply.trim()
  if (trimmed.length < 2) return { success: false, error: 'Reply is too short.' }
  if (trimmed.length > 1000) return { success: false, error: 'Reply too long (max 1000 characters).' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'sign_in_required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Verify the review belongs to a shop this user owns
  const { data: reviewRow } = await admin
    .from('reviews')
    .select('shop_id, shops(owner_id)')
    .eq('id', reviewId)
    .single() as { data: { shop_id: string; shops: { owner_id: string } | null } | null }

  if (!reviewRow) return { success: false, error: 'Review not found.' }
  if (reviewRow.shops?.owner_id !== user.id) return { success: false, error: 'Not your shop.' }

  const { error } = await admin
    .from('reviews')
    .update({
      owner_reply:             trimmed,
      owner_reply_created_at:  new Date().toISOString(),
    })
    .eq('id', reviewId)

  if (error) {
    console.error('[submitOwnerReply]', error.message)
    return { success: false, error: 'Failed to save reply.' }
  }

  return { success: true }
}

// ── getUnreadReviewCount ───────────────────────────────────────────────────────

export async function getUnreadReviewCount(shopId: string): Promise<number> {
  if (!shopId) return 0

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: shop } = await admin
    .from('shops')
    .select('owner_id, reviews_last_seen_at')
    .eq('id', shopId)
    .single()

  if (!shop || shop.owner_id !== user.id) return 0

  const { count } = await admin
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .gt('created_at', shop.reviews_last_seen_at ?? '1970-01-01T00:00:00Z')

  return count ?? 0
}

// ── markReviewsSeen ────────────────────────────────────────────────────────────

export async function markReviewsSeen(shopId: string): Promise<void> {
  if (!shopId) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: shop } = await admin
    .from('shops')
    .select('owner_id')
    .eq('id', shopId)
    .single()

  if (!shop || shop.owner_id !== user.id) return

  await admin
    .from('shops')
    .update({ reviews_last_seen_at: new Date().toISOString() })
    .eq('id', shopId)
}

// ── reportReview ───────────────────────────────────────────────────────────────

export async function reportReview(
  reviewId: string,
  reason: ReviewReportReason,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'sign_in_required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Verify the review belongs to a shop this user owns
  const { data: reviewRow } = await admin
    .from('reviews')
    .select('shop_id, shops(owner_id)')
    .eq('id', reviewId)
    .single() as { data: { shop_id: string; shops: { owner_id: string } | null } | null }

  if (!reviewRow) return { success: false, error: 'Review not found.' }
  if (reviewRow.shops?.owner_id !== user.id) return { success: false, error: 'Not your shop.' }

  const { error } = await admin
    .from('review_reports')
    .insert({
      review_id:   reviewId,
      shop_id:     reviewRow.shop_id,
      reporter_id: user.id,
      reason,
      details:     details?.trim() || null,
    })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'You already reported this review.' }
    console.error('[reportReview]', error.message)
    return { success: false, error: 'Failed to submit report.' }
  }

  return { success: true }
}
