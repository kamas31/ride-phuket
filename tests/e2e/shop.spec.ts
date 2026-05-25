import { test, expect } from '../fixtures'
import { gotoAndWait, getFirstShopHref } from '../helpers/navigation'
import { assertNoHydrationErrors } from '../helpers/console-watcher'

test.describe('Shop Page', () => {
  let shopPath: string | null = null

  test.beforeAll(async ({ browser }) => {
    // Discover a real shop slug from a scooter detail page
    const page = await browser.newPage()
    await gotoAndWait(page, '/explore')
    const scooterLink = page.locator('a[href*="/scooter/"]').first()
    if (await scooterLink.count() > 0) {
      const href = await scooterLink.getAttribute('href')
      if (href) {
        await gotoAndWait(page, href)
        shopPath = await getFirstShopHref(page)
      }
    }
    await page.close()
  })

  test('shop page loads without errors', async ({ page, consoleCapture, assertPageClean }) => {
    if (!shopPath) { test.skip(); return }
    await gotoAndWait(page, shopPath)
    await assertPageClean()
    assertNoHydrationErrors(consoleCapture)
  })

  test('shop name renders as heading', async ({ page }) => {
    if (!shopPath) { test.skip(); return }
    await gotoAndWait(page, shopPath)
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()
  })

  test('scooters fleet section renders', async ({ page }) => {
    if (!shopPath) { test.skip(); return }
    await gotoAndWait(page, shopPath)
    const body = await page.textContent('body') ?? ''
    // Fleet, scooters, or available should be mentioned
    const hasFleet = /fleet|scooters|available|rental/i.test(body)
    expect(hasFleet).toBe(true)
  })

  test('contact actions visible without auth', async ({ page }) => {
    if (!shopPath) { test.skip(); return }
    await gotoAndWait(page, shopPath)
    // WhatsApp or phone should be accessible without login
    const whatsapp = page.locator('a[href*="wa.me"], a[href*="whatsapp"]')
    const hasContact = await whatsapp.count() > 0
    // At minimum contact info should be on page (phone or whatsapp)
    const body = await page.textContent('body') ?? ''
    const hasContactInfo = hasContact || /\+\d{10,}|whatsapp|contact/i.test(body)
    expect(hasContactInfo).toBe(true)
  })

  test('invalid shop slug returns 404 not crash', async ({ page }) => {
    await gotoAndWait(page, '/shop/this-shop-does-not-exist-zzz-9999')
    const body = await page.textContent('body') ?? ''
    const is404 = /not found|could not be found|404/i.test(body)
    const is500 = /application error|internal server error/i.test(body)
    expect(is404).toBe(true)
    expect(is500).toBe(false)
  })
})
