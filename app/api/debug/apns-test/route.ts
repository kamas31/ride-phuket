import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { ApnsClient, Notification, ApnsError } from 'apns2'

// ── TEMPORARY ISOLATED DIAGNOSTIC — NOT part of production push delivery ──
//
// Sole purpose: prove or disprove whether a maintained APNs library (apns2,
// built on undici's HTTP/2 Pool) can succeed where the raw node:http2
// implementation in app/actions/messaging.ts has been observed timing out
// 100% of the time in production. This route is completely independent of
// deliverApns()/sendMessagePush()/sendBadgeRefreshPush() — it shares only
// the same env vars and the same push_tokens lookup pattern, by design, so
// the comparison is apples-to-apples on everything except the transport.
//
// Nothing in the app calls this automatically. Manual GET only, admin-gated,
// and only ever sends to the CALLER's own registered iOS token(s) — never
// to another user's device.
//
// Delete this route entirely once the experiment concludes either way.

export const dynamic = 'force-dynamic'

interface TokenResult {
  tokenPrefix: string
  ok: boolean
  durationMs: number
  // Populated on failure only — never the device token itself.
  errorType?: string
  reason?: string
  statusCode?: number
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
  }

  // Reuse the existing push-token lookup pattern — caller's own iOS tokens only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('push_tokens')
    .select('token')
    .eq('user_id', user.id)
    .eq('platform', 'ios')

  if (!rows?.length) {
    console.log('[apns-test] no iOS push token registered for caller — aborting')
    return NextResponse.json({ ok: false, reason: 'no_ios_token_for_caller' }, { status: 404 })
  }

  // Reuse the existing APNs env vars — same names, same source as production.
  const teamId   = process.env.APNS_TEAM_ID
  const keyId    = process.env.APNS_KEY_ID
  const rawKey   = process.env.APNS_PRIVATE_KEY
  const bundleId = process.env.APNS_BUNDLE_ID ?? 'com.kohride.app'
  const prod     = process.env.APNS_PRODUCTION !== 'false'

  console.log('[apns-test] env presence — teamId:', !!teamId, 'keyId:', !!keyId, 'rawKey:', !!rawKey, 'bundleId:', bundleId, 'prod:', prod)

  if (!teamId || !keyId || !rawKey) {
    console.error('[apns-test] missing APNS env vars — aborting')
    return NextResponse.json({ ok: false, reason: 'apns_env_vars_missing' }, { status: 500 })
  }

  const signingKey = rawKey.replace(/\\n/g, '\n')
  const host = prod ? 'api.push.apple.com' : 'api.sandbox.push.apple.com'

  console.log('[apns-test] connecting — host:', host)

  // One-shot client for this single diagnostic invocation — no persistence
  // across requests, mirroring the connect/send/close lifecycle of the
  // production path so the only real variable being tested is the
  // transport implementation itself.
  const client = new ApnsClient({
    team: teamId,
    keyId,
    signingKey,
    defaultTopic: bundleId,
    host,
    requestTimeout: 8000,
    keepAlive: false,
  })

  const tokens = (rows as { token: string }[]).map(r => r.token)
  const results: TokenResult[] = []

  for (const token of tokens) {
    const tokenPrefix = token.slice(0, 8)
    const startedAt = Date.now()

    try {
      const notification = new Notification(token, {
        alert: { title: 'Koh Ride Test', body: 'APNs library test' },
        badge: 1,
        sound: 'default',
      })

      await client.send(notification)
      const durationMs = Date.now() - startedAt
      console.log(`[apns-test] token:${tokenPrefix} result:success duration_ms:${durationMs}`)
      results.push({ tokenPrefix, ok: true, durationMs })
    } catch (err) {
      const durationMs = Date.now() - startedAt

      // ApnsError = a real, well-formed rejection from Apple (bad token,
      // bad topic, expired provider token, etc.) — the library successfully
      // connected and got a response, it just wasn't a success.
      // Anything else (network/timeout/TLS/JWT-signing errors) never even
      // reached a parsed Apple response.
      if (err instanceof ApnsError) {
        const reason = err.reason ?? 'unknown_reason'
        const statusCode = err.statusCode
        console.error(`[apns-test] token:${tokenPrefix} result:rejected reason:${reason} status:${statusCode} duration_ms:${durationMs}`)
        results.push({ tokenPrefix, ok: false, errorType: 'ApnsError', reason, statusCode, durationMs })
      } else {
        const e = err instanceof Error ? err : new Error(String(err))
        console.error(`[apns-test] token:${tokenPrefix} result:transport_error type:${e.constructor.name} message:${e.message} duration_ms:${durationMs}`)
        results.push({ tokenPrefix, ok: false, errorType: e.constructor.name, reason: e.message, durationMs })
      }
    }
  }

  try {
    await client.close()
    console.log('[apns-test] client closed cleanly')
  } catch (err) {
    console.error('[apns-test] error closing client:', err instanceof Error ? err.message : String(err))
  }

  const allSucceeded = results.every(r => r.ok)
  console.log(`[apns-test] done — ${results.filter(r => r.ok).length}/${results.length} succeeded`)

  return NextResponse.json({ ok: allSucceeded, host, tokenCount: tokens.length, results })
}
