// Run with: node --test lib/analytics/tiktok.test.ts
// No test framework dependency — Node's built-in test runner + assert.
//
// Node's test environment has no `window` by default, so the SSR no-op path
// is exercised naturally whenever a test doesn't install a fake one. Every
// exported function reads process.env live on each call (not a frozen
// module-scope const), so toggling process.env between tests is enough —
// no module re-import trickery needed.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  trackTikTokPageView,
  trackTikTokViewContent,
  trackTikTokContact,
  type TtqObject,
} from './tiktok.ts'

const PIXEL_ID = 'D9JOV4BC77U820ARNJK0'

function installFakeWindow(ttq?: Partial<TtqObject>) {
  ;(globalThis as unknown as { window?: unknown }).window = ttq === undefined
    ? {}
    : { ttq: ttq as TtqObject }
}

function removeFakeWindow() {
  delete (globalThis as unknown as { window?: unknown }).window
}

test('trackTikTokPageView: no-ops server-side (no window global at all)', () => {
  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
  assert.doesNotThrow(() => trackTikTokPageView())
})

test('trackTikTokViewContent: no-ops when NEXT_PUBLIC_TIKTOK_PIXEL_ID is unset, even with window.ttq present', () => {
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
  let calls = 0
  installFakeWindow({ track: () => { calls++ } })

  trackTikTokViewContent({ content_id: 'scooter_1', content_name: 'Honda PCX' })

  assert.equal(calls, 0)
  removeFakeWindow()
})

test('trackTikTokContact: no-ops when window.ttq is absent, even with pixel ID set', () => {
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = PIXEL_ID
  installFakeWindow(undefined) // window exists, but window.ttq does not

  assert.doesNotThrow(() => trackTikTokContact({ shop_id: 'shop_1' }))

  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
})

test('trackTikTokViewContent: calls ttq.track("ViewContent", ...) with content_type always "scooter" and no PII', () => {
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = PIXEL_ID
  let received: [string, Record<string, unknown> | undefined] | null = null
  installFakeWindow({ track: (event, props) => { received = [event, props] } })

  trackTikTokViewContent({ content_id: 'scooter_42', content_name: 'Yamaha NMAX' })

  assert.ok(received)
  const [event, props] = received as unknown as [string, Record<string, unknown>]
  assert.equal(event, 'ViewContent')
  assert.deepEqual(props, {
    content_id: 'scooter_42',
    content_name: 'Yamaha NMAX',
    content_type: 'scooter',
  })
  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
})

test('trackTikTokContact: forwards only scooter_id/shop_id/placement — never a phone/email/name field', () => {
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = PIXEL_ID
  let received: [string, Record<string, unknown> | undefined] | null = null
  installFakeWindow({ track: (event, props) => { received = [event, props] } })

  trackTikTokContact({ scooter_id: 'scooter_42', shop_id: 'shop_7', placement: 'sticky_bar' })

  assert.ok(received)
  const [event, props] = received as unknown as [string, Record<string, unknown>]
  assert.equal(event, 'Contact')
  assert.deepEqual(props, { scooter_id: 'scooter_42', shop_id: 'shop_7', placement: 'sticky_bar' })
  assert.ok(!('phone' in (props ?? {})))
  assert.ok(!('email' in (props ?? {})))
  assert.ok(!('name' in (props ?? {})))
  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
})

test('trackTikTokContact: called with no args does not throw and sends an empty properties object', () => {
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = PIXEL_ID
  let received: Record<string, unknown> | undefined
  installFakeWindow({ track: (_event, props) => { received = props } })

  assert.doesNotThrow(() => trackTikTokContact())

  assert.deepEqual(received, {})
  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
})

test('trackTikTokPageView: swallows a throwing ttq.page() instead of propagating', () => {
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = PIXEL_ID
  installFakeWindow({ page: () => { throw new Error('blocked by an extension') } })

  assert.doesNotThrow(() => trackTikTokPageView())

  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
})

test('trackTikTokViewContent: swallows a throwing ttq.track() instead of propagating', () => {
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = PIXEL_ID
  installFakeWindow({ track: () => { throw new Error('network error') } })

  assert.doesNotThrow(() => trackTikTokViewContent({ content_id: 'x', content_name: 'y' }))

  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
})

test('trackTikTokPageView: calls ttq.page() exactly once per call — no internal retry/duplicate', () => {
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = PIXEL_ID
  let calls = 0
  installFakeWindow({ page: () => { calls++ } })

  trackTikTokPageView()

  assert.equal(calls, 1)
  removeFakeWindow()
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
})
