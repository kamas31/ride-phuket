import { test, expect } from '../fixtures'
import { gotoAndWait, getFirstScooterHref } from '../helpers/navigation'
import { hasTestCredentials, login } from '../helpers/auth'

test.describe('Saved Rides', () => {
  test('saved page handles unauthenticated gracefully', async ({ page, assertPageClean }) => {
    await gotoAndWait(page, '/saved')
    await assertPageClean()
    const body = await page.textContent('body') ?? ''
    // Should show prompt to sign in or an empty state — not crash
    const hasContent = /sign in|save|saved|scooter/i.test(body)
    expect(hasContent).toBe(true)
  })

  test('/bookings redirects to /saved', async ({ page }) => {
    await page.goto('/bookings')
    await page.waitForURL('/saved', { timeout: 10_000 })
  })

  test('/rentals redirects to /saved', async ({ page }) => {
    await page.goto('/rentals')
    await page.waitForURL('/saved', { timeout: 10_000 })
  })

  test.describe('Authenticated saved flows', () => {
    test.skip(!hasTestCredentials, 'TEST_EMAIL / TEST_PASSWORD not set — skipping')

    test('save a scooter and see it on saved page', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/explore')
      const scooterHref = await getFirstScooterHref(page)
      if (!scooterHref) { test.skip(); return }

      // Navigate to detail and click save/wishlist button
      await gotoAndWait(page, scooterHref)
      const saveBtn = page.locator('button[aria-label*="save"], button[aria-label*="wish"], button').filter({ hasText: /save/i })
      if (await saveBtn.count() > 0) {
        await saveBtn.first().click()
        // Go to saved page
        await gotoAndWait(page, '/saved')
        // The saved scooter should appear
        const cards = page.locator('a[href*="/scooter/"]')
        await expect(cards.first()).toBeVisible({ timeout: 10_000 })
      }
    })

    test('saved page shows empty state gracefully when nothing saved', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/saved')
      const body = await page.textContent('body') ?? ''
      const is500 = /application error|internal server error/i.test(body)
      expect(is500).toBe(false)
    })
  })
})
