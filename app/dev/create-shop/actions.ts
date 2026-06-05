'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface DevShopResult {
  success: boolean
  shopName?: string
  email?: string
  password?: string
  shopSlug?: string
  error?: string
}

export async function createDevShop(formData: {
  ownerName: string
  shopName: string
  location: string
  phone: string
}): Promise<DevShopResult> {
  if (process.env.DEV_SCREENSHOT_MODE !== 'true') {
    return { success: false, error: 'Not available.' }
  }

  const { ownerName, shopName, location, phone } = formData
  if (!ownerName.trim() || !shopName.trim() || !location.trim() || !phone.trim()) {
    return { success: false, error: 'All fields are required.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Auto-generate credentials — email does not need to be deliverable
  const slugBase = shopName.toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 28)
  const rand4 = () => Math.random().toString(36).slice(2, 6)
  const email    = `${slugBase}-${rand4()}@dev.kohride.com`
  const password = rand4() + rand4() + rand4()   // 12 random chars
  const shopSlug = `${slugBase}-${rand4()}`

  // 1. Create auth user with email pre-confirmed (no verification email sent)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'shop_owner', name: ownerName.trim() },
  })

  if (authError || !authData?.user) {
    return { success: false, error: authError?.message ?? 'Failed to create user.' }
  }

  const userId = authData.user.id

  // 2. Upsert profile (trigger may have already created it)
  await admin.from('profiles').upsert(
    { id: userId, name: ownerName.trim(), role: 'shop_owner' },
    { onConflict: 'id' },
  )

  // 3. Create shop
  const { data: shopRow, error: shopError } = await admin
    .from('shops')
    .insert({
      owner_id:    userId,
      name:        shopName.trim(),
      slug:        shopSlug,
      location:    location.trim(),
      phone:       phone.trim(),
      verified:    true,
      active:      true,
    })
    .select('id')
    .single()

  if (shopError || !shopRow) {
    await admin.auth.admin.deleteUser(userId)
    return { success: false, error: shopError?.message ?? 'Failed to create shop.' }
  }

  // 4. Link shop_id back to profile
  await admin.from('profiles').update({ shop_id: shopRow.id }).eq('id', userId)

  return { success: true, shopName: shopName.trim(), email, password, shopSlug }
}
