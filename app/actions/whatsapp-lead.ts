'use server'

// Fired when a visitor clicks the WhatsApp contact button on a listing. Records
// the lead and emails the shop owner so a shop that lives on the web (no app,
// no push) still learns a Koh Ride visitor is about to contact them — even if
// the visitor edits the pre-filled WhatsApp message before sending.
//
// Entirely best-effort and fire-and-forget: the WhatsApp link opens regardless,
// and nothing here ever throws back to the client.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppLeadEmail } from '@/lib/email/notifications'
import { isEmailNotifEnabled } from '@/lib/notifications/prefs'

// One lead email per shop at most every N minutes, so a visitor tapping the
// button repeatedly (or comparing several scooters from the same shop) can't
// flood the owner's inbox.
const DEDUP_WINDOW_MINUTES = 30

export async function notifyWhatsAppLead(shopId: string, scooterId: string): Promise<void> {
  try {
    if (!shopId) return
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()  // may be null (anonymous visitor)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Resolve the shop's owner. Unclaimed shops have no owner account → no one
    // to email → skip silently (the lead is still recorded below for later).
    const { data: shop } = await admin
      .from('shops')
      .select('owner_id')
      .eq('id', shopId)
      .single()
    const ownerId = shop?.owner_id as string | null | undefined

    // Record the lead (always, even for unclaimed shops — useful history).
    await admin.from('whatsapp_leads').insert({
      shop_id: shopId,
      scooter_id: scooterId || null,
      rider_id: user?.id ?? null,
    })

    if (!ownerId) return  // unclaimed shop — infra ready, just no recipient yet

    // Dedup: skip the email if this shop already got one within the window.
    const since = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString()
    const { count } = await admin
      .from('whatsapp_leads')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .gte('created_at', since)
    // The row we just inserted is included in the count, so >1 means a prior
    // lead already fell inside the window.
    if ((count ?? 0) > 1) return

    if (!(await isEmailNotifEnabled(admin, ownerId, 'email_notif_whatsapp_leads'))) return

    const { data: ownerUser } = await admin.auth.admin.getUserById(ownerId)
    const toEmail = ownerUser?.user?.email as string | undefined
    if (!toEmail) return

    let scooterName: string | null = null
    if (scooterId) {
      const { data: scooter } = await admin.from('scooters').select('name').eq('id', scooterId).single()
      scooterName = scooter?.name ?? null
    }

    await sendWhatsAppLeadEmail({ toEmail, scooterName })
  } catch (err) {
    console.error('[notifyWhatsAppLead]', err)
  }
}
