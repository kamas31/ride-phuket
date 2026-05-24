import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { eventType, sessionId, shopId, scooterId, metadata } = await req.json()
    if (!eventType) return NextResponse.json({ error: 'missing eventType' }, { status: 400 })

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('events').insert({
      event_type:  eventType,
      session_id:  sessionId  ?? null,
      shop_id:     shopId     ?? null,
      scooter_id:  scooterId  ?? null,
      metadata:    metadata   ?? {},
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Silent: tracking must never break the user experience
    return NextResponse.json({ ok: true })
  }
}
