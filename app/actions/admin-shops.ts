'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface AdminShopListItem {
  id: string
  name: string
  slug: string
  location: string
  ownerStatus: string
  hasOwner: boolean
  active: boolean
  createdAt: string
}

// Admin-only: lists all shops with ownership/status fields for the admin
// shop management screen. Returns null when the caller is not an admin.
export async function adminListShops(): Promise<AdminShopListItem[] | null> {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('shops')
    .select('id,name,slug,location,owner_id,owner_status,active,created_at')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(row => ({
    id:          row.id,
    name:        row.name,
    slug:        row.slug,
    location:    row.location,
    ownerStatus: row.owner_status ?? 'claimed',
    hasOwner:    row.owner_id != null,
    active:      Boolean(row.active),
    createdAt:   row.created_at,
  }))
}

export interface AdminShopDetail {
  id: string
  name: string
  slug: string
  location: string
  ownerStatus: string
  hasOwner: boolean
  ownerEmail: string | null
  active: boolean
  scooters: {
    id: string
    name: string
    pricePerDay: number
    available: boolean
    images: string[]
  }[]
}

// Admin-only: fetches a single shop plus its scooters for the admin detail
// screen. Returns null when the caller is not an admin or the shop is missing.
export async function adminGetShopDetail(shopId: string): Promise<AdminShopDetail | null> {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (admin as any)
    .from('shops')
    .select('id,name,slug,location,owner_id,owner_status,active')
    .eq('id', shopId)
    .single()

  if (!shop) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scooters } = await (admin as any)
    .from('scooters')
    .select('id,name,price_per_day,available,images')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  let ownerEmail: string | null = null
  if (shop.owner_id) {
    const { data: ownerUser } = await admin.auth.admin.getUserById(shop.owner_id)
    ownerEmail = ownerUser?.user?.email ?? null
  }

  return {
    id:          shop.id,
    name:        shop.name,
    slug:        shop.slug,
    location:    shop.location,
    ownerStatus: shop.owner_status ?? 'claimed',
    hasOwner:    shop.owner_id != null,
    ownerEmail,
    active:      Boolean(shop.active),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scooters: ((scooters ?? []) as any[]).map(s => ({
      id:          s.id,
      name:        s.name,
      pricePerDay: s.price_per_day,
      available:   Boolean(s.available),
      images:      Array.isArray(s.images) ? s.images : [],
    })),
  }
}

export interface AdminClaimShopResult {
  success: boolean
  error?: string
  errorCode?: string
}

// Admin-only: links an existing user account (found by email) to an
// existing unclaimed shop. Phase 2A — manual, admin-controlled only. No
// invite email or claim token is sent; the admin must already know the
// owner's account email.
//
// Writes shops + profiles sequentially (no DB transaction available from
// the app layer in this codebase — see createShop() in partner.ts for the
// existing precedent). Unlike that precedent, a failure on the second write
// here is treated as fatal: the shop claim is rolled back rather than left
// in a half-linked state, since claiming is an explicit admin action with
// real consequences (messaging, dashboard access) rather than a brand-new
// shop nobody depends on yet.
export async function adminClaimShopByEmail(shopId: string, email: string): Promise<AdminClaimShopResult> {
  try {
    if (!shopId) return { success: false, error: 'Shop ID missing.', errorCode: 'VALIDATION' }
    const targetEmail = email?.trim().toLowerCase()
    if (!targetEmail) return { success: false, error: 'Owner email is required.', errorCode: 'VALIDATION' }

    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.', errorCode: 'UNAUTHENTICATED' }

    const admin = createAdminClient()
    if (!(await isAdminUser(admin, user.id))) {
      return { success: false, error: 'Unauthorized.', errorCode: 'UNAUTHORIZED' }
    }

    // 1. Shop must exist and not already be claimed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shop, error: shopErr } = await (admin as any)
      .from('shops')
      .select('id, owner_id, owner_status')
      .eq('id', shopId)
      .single()

    if (shopErr || !shop) return { success: false, error: 'Shop not found.', errorCode: 'NOT_FOUND' }
    if (shop.owner_id || shop.owner_status === 'claimed') {
      return { success: false, error: 'This shop is already claimed.', errorCode: 'ALREADY_CLAIMED' }
    }

    // 2. Resolve the target account by email (profiles has no email column —
    // it lives only in auth.users, hence the RPC; see migration 051).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetUserId, error: lookupErr } = await (admin as any)
      .rpc('find_profile_id_by_email', { p_email: targetEmail })

    if (lookupErr) {
      console.error('[adminClaimShopByEmail] email lookup error:', lookupErr.message)
      return { success: false, error: 'Failed to look up that account.', errorCode: 'LOOKUP_FAILED' }
    }
    if (!targetUserId) {
      return { success: false, error: 'No Koh Ride account found for this email yet.', errorCode: 'NO_ACCOUNT' }
    }
    if (targetUserId === user.id) {
      return { success: false, error: 'You cannot link a shop to your own admin account.', errorCode: 'SELF_LINK' }
    }

    // 3. Target profile must exist and not already own a shop.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetProfile, error: profileErr } = await (admin as any)
      .from('profiles')
      .select('id, shop_id')
      .eq('id', targetUserId)
      .single()

    if (profileErr || !targetProfile) {
      return { success: false, error: 'No Koh Ride account found for this email yet.', errorCode: 'NO_ACCOUNT' }
    }
    if (targetProfile.shop_id) {
      return { success: false, error: 'This account is already linked to a shop.', errorCode: 'PROFILE_HAS_SHOP' }
    }

    // Defensive check for owner_id/shop_id drift: confirm no other shop row
    // already points at this user as owner, even if profiles.shop_id is null.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: otherShop } = await (admin as any)
      .from('shops')
      .select('id')
      .eq('owner_id', targetUserId)
      .maybeSingle()

    if (otherShop) {
      return { success: false, error: 'This account already owns another shop.', errorCode: 'OWNER_HAS_SHOP' }
    }

    // 4. Claim the shop first...
    const claimedAt = new Date().toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: claimErr } = await (admin as any)
      .from('shops')
      .update({
        owner_id:             targetUserId,
        owner_status:         'claimed',
        claimed_at:           claimedAt,
        invited_owner_email:  targetEmail,
      })
      .eq('id', shopId)

    if (claimErr) {
      console.error('[adminClaimShopByEmail] shop claim failed:', claimErr.message)
      return { success: false, error: claimErr.message, errorCode: claimErr.code }
    }

    // 5. ...then link the profile. If this fails, roll back the shop claim
    // rather than leave a claimed shop with no linked profile.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linkErr } = await (admin as any)
      .from('profiles')
      .update({ shop_id: shopId, role: 'shop_owner' })
      .eq('id', targetUserId)

    if (linkErr) {
      console.error('[adminClaimShopByEmail] profile link failed, rolling back shop claim:', linkErr.message)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rollbackErr } = await (admin as any)
        .from('shops')
        .update({ owner_id: null, owner_status: 'unclaimed', claimed_at: null, invited_owner_email: null })
        .eq('id', shopId)

      if (rollbackErr) {
        console.error('[adminClaimShopByEmail] ROLLBACK FAILED — shop may be claimed with no linked profile:', rollbackErr.message)
        return { success: false, error: 'Critical error — shop may be in an inconsistent state. Check manually.', errorCode: 'ROLLBACK_FAILED' }
      }
      return { success: false, error: 'Failed to link the account. No changes were made.', errorCode: 'LINK_FAILED' }
    }

    revalidatePath('/admin/shops')
    revalidatePath(`/admin/shops/${shopId}`)
    revalidatePath('/partner/dashboard')

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[adminClaimShopByEmail] UNHANDLED EXCEPTION:', msg)
    return { success: false, error: `Unexpected error: ${msg.slice(0, 120)}`, errorCode: 'UNHANDLED' }
  }
}
