/**
 * Debug endpoint — tests auth + DB in real Next.js server context.
 * GET /api/debug → returns JSON with each step's result and timing.
 * DELETE THIS FILE before going to production.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const t0 = Date.now()
  const steps: Record<string, unknown> = {}

  // ── Step 1: createClient ─────────────────────────────────
  try {
    const client = await createClient()
    steps['1_createClient'] = { ok: true, ms: Date.now() - t0 }

    // ── Step 2: auth.getUser ─────────────────────────────────
    try {
      const { data: { user }, error } = await client.auth.getUser()
      steps['2_getUser'] = {
        ok: !error,
        ms: Date.now() - t0,
        userId: user?.id?.slice(0, 8) ?? null,
        error: error?.message ?? null,
        status: error?.status ?? null,
      }
    } catch(e) {
      steps['2_getUser'] = { ok: false, threw: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 }
    }
  } catch(e) {
    steps['1_createClient'] = { ok: false, threw: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 }
  }

  // ── Step 3: createAdminClient ────────────────────────────
  try {
    const admin = createAdminClient()
    steps['3_createAdminClient'] = { ok: true, ms: Date.now() - t0 }

    // ── Step 4: query shops ──────────────────────────────────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (admin as any)
        .from('shops')
        .select('*', { count: 'exact', head: true })
      steps['4_shopCount'] = { ok: !error, count, error: error?.message ?? null, code: error?.code ?? null, ms: Date.now() - t0 }
    } catch(e) {
      steps['4_shopCount'] = { ok: false, threw: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 }
    }
  } catch(e) {
    steps['3_createAdminClient'] = { ok: false, threw: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 }
  }

  return NextResponse.json({
    totalMs: Date.now() - t0,
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ missing',
      anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) ?? '❌ missing',
      svc: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ missing',
    },
    steps,
  })
}
