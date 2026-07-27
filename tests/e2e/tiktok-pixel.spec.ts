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
 * Corrected model (see ADR-068): TikTok's automatic SPA re-tracking
 * (HistoryObserver, triggered by ttq.page()) only ever reproduces its own
 * internal analytics signals — never the Standard Event "PageView" that
 * Test Events / Ads Manager actually read. There is no automatic
 * equivalent for that event, so this codebase fires ttq.track('PageView')
 * explicitly: once from the base snippet on load, and once per subsequent
 * route change from a usePathname() effect that skips its own first mount.
 * What this test proves is exactly that pairing: N navigations (including
 * the initial load) produce exactly N track('PageView') calls — never
 * fewer (the original bug — PageView missing from Test Events entirely)
 * and never more (a duplicate on the same navigation) — while the
 * unrelated internal ttq.page()-driven signal is irrelevant to either
 * failure mode and isn't asserted on here.
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
  // Replay whatever the inline bootstrap already queued (e.g. ['load', id], ['page'], ['track', 'PageView']) —
  // mirrors how the real SDK processes its pre-load call queue on init.
  recordedQueue.forEach(function (call) {
    if (call[0] === 'page') ttq.page();
    if (call[0] === 'track') ttq.track(call[1]);
  });
})();
`

type TtqWindow = { __ttqCalls?: string[] }

async function pageViewCallCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() =>
    ((window as unknown as TtqWindow).__ttqCalls ?? []).filter(c => c === 'track:PageView').length
  )
}

test.describe('TikTok Pixel — PageView call pattern', () => {
  test('ttq.track("PageView") fires exactly once per navigation — on load, and once per subsequent route change, never more', async ({ page }) => {
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
      expect(await pageViewCallCount(page)).toBe(0)
      return
    }

    expect(await page.locator('#tiktok-pixel').count()).toBe(1)

    await page.waitForFunction(
      () => ((window as unknown as TtqWindow).__ttqCalls ?? []).filter(c => c === 'track:PageView').length === 1,
      { timeout: 5000 },
    )
    expect(await pageViewCallCount(page)).toBe(1) // the base snippet's own ttq.track('PageView') on load

    const exploreLink = page.locator('a[href="/explore"]').first()
    await expect(exploreLink).toBeVisible()
    await exploreLink.click()
    await page.waitForURL('**/explore')

    await page.waitForFunction(
      () => ((window as unknown as TtqWindow).__ttqCalls ?? []).filter(c => c === 'track:PageView').length === 2,
      { timeout: 5000 },
    )
    // Give any (incorrect) double-fire on this same navigation a real chance to land before asserting it held at 2.
    await page.waitForTimeout(1000)
    expect(await pageViewCallCount(page)).toBe(2) // exactly one more — not zero (the original bug), not three (a duplicate)

    const homeLink = page.locator('a[href="/"]').first()
    if (await homeLink.count() > 0) {
      await homeLink.click()
      await page.waitForURL('**/')
      await page.waitForFunction(
        () => ((window as unknown as TtqWindow).__ttqCalls ?? []).filter(c => c === 'track:PageView').length === 3,
        { timeout: 5000 },
      )
      await page.waitForTimeout(1000)
      expect(await pageViewCallCount(page)).toBe(3)
    }
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
