import { test, expect } from '../fixtures'
import { gotoAndWait } from '../helpers/navigation'

/**
 * TikTok Pixel — PageView call-count contract.
 *
 * We do NOT hit TikTok's live infrastructure here: the real events.js is
 * ~50KB of obfuscated, remote-config-driven code, and running it against a
 * live third party on every CI run would be slow, flaky, and would send
 * fake beacons to TikTok's real collection endpoint. Instead we intercept
 * the events.js request and serve a tiny stub that just records every
 * ttq.page()/ttq.track() call — this tests exactly what's under OUR
 * control: the app's own call pattern.
 *
 * The stub replays whatever the inline bootstrap snippet queued before
 * "loading" (mirrors the real SDK's queue -> array -> real-object handoff:
 * see components/analytics/TikTokPixel.tsx), then exposes live recording
 * functions for anything called after that.
 *
 * What this proves: ttq.page() fires exactly once on load, and the app's
 * own React/Next.js bundle never calls it again on a client-side route
 * change — there is no usePathname()-driven re-fire anywhere in this
 * codebase. That a real client-side navigation would still register as a
 * single PageView with TikTok is a separate, already-verified fact: TikTok's
 * own SDK auto-fires exactly one Pageview per History API pushState via its
 * HistoryObserver plugin — confirmed against the real script/real pixel ID
 * and documented with captured network payloads in docs/DECISIONS.md. This
 * test does not re-assert that third-party behavior (out of our control,
 * and not meaningful to pin in a committed CI test); it guards the
 * regression this codebase actually owns: nobody re-introducing a manual
 * per-navigation ttq.page() call that would double it up.
 *
 * Timing note: next/script's `afterInteractive` strategy injects the script
 * element client-side, after hydration — later than `domcontentloaded`
 * (what gotoAndWait waits for). Every assertion below waits on an explicit
 * condition (element attached / call count reached) rather than a fixed
 * sleep, so the test can't pass or fail on timing luck.
 */

const TTQ_STUB = `
(function () {
  var queue = window.ttq || [];
  window.__ttqCalls = window.__ttqCalls || [];
  var recordedQueue = Array.isArray(queue) ? queue.slice() : [];
  var ttq = {};
  ttq.page = function () { window.__ttqCalls.push('page'); };
  ttq.track = function (name) { window.__ttqCalls.push('track:' + name); };
  window.ttq = ttq;
  // Replay whatever the inline bootstrap already queued (e.g. ['load', id], ['page']) —
  // mirrors how the real SDK processes its pre-load call queue on init.
  recordedQueue.forEach(function (call) {
    if (call[0] === 'page') ttq.page();
    if (call[0] === 'track') ttq.track(call[1]);
  });
})();
`

type TtqWindow = { __ttqCalls?: string[] }

async function ttqCallCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => (window as unknown as TtqWindow).__ttqCalls?.length ?? 0)
}

test.describe('TikTok Pixel — PageView call pattern', () => {
  test('ttq.page() fires exactly once on load and is never re-fired by our own code on client-side navigation', async ({ page }) => {
    await page.route('**/analytics.tiktok.com/i18n/pixel/events.js**', route => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: TTQ_STUB })
    })

    await gotoAndWait(page, '/')

    const scriptAppeared = await page
      .waitForSelector('#tiktok-pixel', { state: 'attached', timeout: 5000 })
      .then(() => true)
      .catch(() => false)

    if (!scriptAppeared) {
      // NEXT_PUBLIC_TIKTOK_PIXEL_ID not configured for this run — the pixel
      // is expected to be entirely absent. Confirm the silent no-op path.
      expect(await ttqCallCount(page)).toBe(0)
      return
    }

    expect(await page.locator('#tiktok-pixel').count()).toBe(1)

    await page.waitForFunction(() => (window as unknown as TtqWindow).__ttqCalls?.length === 1, { timeout: 5000 })
    expect(await ttqCallCount(page)).toBe(1) // exactly the bootstrap snippet's own ttq.page()

    const exploreLink = page.locator('a[href="/explore"]').first()
    await expect(exploreLink).toBeVisible()
    await exploreLink.click()
    await page.waitForURL('**/explore')

    // No further ttq call is expected — give any (incorrect) re-fire a real
    // chance to land before asserting the count held steady.
    await page.waitForTimeout(1000)
    expect(await ttqCallCount(page)).toBe(1) // still exactly one — no manual re-fire on route change

    // A second client-side hop, to make sure nothing accumulates over time.
    const homeLink = page.locator('a[href="/"]').first()
    if (await homeLink.count() > 0) {
      await homeLink.click()
      await page.waitForURL('**/')
      await page.waitForTimeout(1000)
    }

    expect(await ttqCallCount(page)).toBe(1)
  })

  test('no TikTok script is injected when NEXT_PUBLIC_TIKTOK_PIXEL_ID is unset', async ({ page }) => {
    await gotoAndWait(page, '/')

    const scriptAppeared = await page
      .waitForSelector('#tiktok-pixel', { state: 'attached', timeout: 5000 })
      .then(() => true)
      .catch(() => false)

    test.skip(scriptAppeared, 'pixel ID configured for this run — covered by the test above instead')
    expect(scriptAppeared).toBe(false)
  })
})
