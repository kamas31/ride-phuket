'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface ShopOverrides {
  adminRating: number | null
  adminReviewCount: number | null
  adminScooterCount: number | null
  showScooterCount: boolean
}

export async function adminSetShopOverrides(
  shopId: string,
  overrides: ShopOverrides,
): Promise<{ error: string | null }> {
  try {
    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return { error: 'Not authenticated' }

    const admin = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) return { error: 'Unauthorized' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shopRow } = await (admin as any)
      .from('shops')
      .select('slug')
      .eq('id', shopId)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from('shops')
      .update({
        admin_rating:        overrides.adminRating,
        admin_review_count:  overrides.adminReviewCount,
        admin_scooter_count: overrides.adminScooterCount,
        show_scooter_count:  overrides.showScooterCount,
      })
      .eq('id', shopId)

    if (updateErr) return { error: updateErr.message }

    revalidatePath(`/shop/${shopRow?.slug ?? ''}`)
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}
