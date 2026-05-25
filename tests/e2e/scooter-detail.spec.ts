import { test, expect } from '../fixtures'
import {
  gotoAndWait,
  getFirstScooterHref,
  assertNoBookingLanguage,
} from '../helpers/navigation'
import { assertNoHydrationErrors } from '../helpers/console-watcher'

/**
 * We discover the real scooter URL dynamically from /explore rather than
 * hardcoding IDs, so tests work regardless of which data is in the DB.
 */

test.describe('Scooter Detail Page', () => {
  let scooterPath: string | null = null

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await gotoAndWait(page, '/explore')
    scooterPath = await getFirstScooterHref(page)
    await page.close()
  })

  test('detail page loads without errors (real scooter)', async ({ page, consoleCapture, assertPageClean }) => {
    if (!scooterPath) {
      test.skip() // No scooters in DB — skip
      return
    }
    await gotoAndWait(page, scooterPath)
    await assertPageClean()
    assertNoHydrationErrors(consoleCapture)
  })

  test('scooter name renders as heading', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()
    const text = await h1.first().textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test('price is visible', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    // Price should contain ฿ symbol — use first() since multiple price elements exist
    await expect(page.getByText(/฿/).first()).toBeVisible()
  })

  test('image gallery renders (even if no images)', async ({ page, consoleCapture }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    // Either an image renders OR the "No photos yet" placeholder renders — never a crash
    const hasImages = await page.locator('img[alt*="photo"]').count() > 0
    const hasPlaceholder = await page.getByText(/no photos yet/i).count() > 0
    expect(hasImages || hasPlaceholder).toBe(true)
  })

  test('WhatsApp CTA is visible', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    // WhatsApp contact should be visible without login
    const whatsappLink = page.locator('a[href*="wa.me"], a[href*="whatsapp"]')
    const hasWhatsApp = await whatsappLink.count() > 0
    const hasContactBtn = await page.getByRole('link', { name: /whatsapp/i }).count() > 0
    expect(hasWhatsApp || hasContactBtn).toBe(true)
  })

  test('shop info is visible without auth', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    // Shop section — name should be visible somewhere on the page
    // It appears in the trust block / shop card area
    const body = await page.textContent('body') ?? ''
    // At minimum, there should be some shop-related text visible
    const hasShopInfo = /shop|rental|contact/i.test(body)
    expect(hasShopInfo).toBe(true)
  })

  test('engine spec appends cc for numeric values', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    const body = await page.textContent('body') ?? ''
    // If page has engine spec, it should not show a bare number like "125" without "cc"
    // Regex: a bare number surrounded by whitespace/punctuation — should not exist for engine
    // This is a soft check: look for common engine sizes and ensure they have "cc"
    const bareEnginePattern = /\b(125|150|155|250|300|400)\b(?!cc|%)/
    if (bareEnginePattern.test(body)) {
      // Only fail if it's in the specs section context
      const engineLabel = page.getByText(/^engine$/i)
      if (await engineLabel.count() > 0) {
        const parent = engineLabel.locator('..').locator('..')
        const engineValue = await parent.textContent() ?? ''
        // If a number exists in engine value, it must have 'cc'
        if (/\d+/.test(engineValue)) {
          expect(engineValue).toMatch(/\d+cc/i)
        }
      }
    }
  })

  test('back navigation from detail page works', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    await page.goBack()
    // Should be back at a previous page without crashing
    await page.waitForLoadState('domcontentloaded')
  })

  test('invalid scooter ID returns 404 not crash', async ({ page }) => {
    await gotoAndWait(page, '/scooter/this-id-does-not-exist-at-all-zzzz')
    const body = await page.textContent('body') ?? ''
    // Should show 404 or "not found" — NOT a 500 or application error
    const is404 = /not found|could not be found|404/i.test(body)
    const is500 = /application error|internal server error/i.test(body)
    expect(is404).toBe(true)
    expect(is500).toBe(false)
  })

  test('no booking language on detail page', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    await assertNoBookingLanguage(page)
  })
})
