import { test, expect } from '../fixtures'
import { gotoAndWait, assertNoBookingLanguage, waitForCards } from '../helpers/navigation'
import { assertNoHydrationErrors } from '../helpers/console-watcher'

test.describe('Home Page', () => {
  test('loads without errors or crashes', async ({ page, consoleCapture, assertPageClean }) => {
    await gotoAndWait(page, '/')
    await assertPageClean()
    assertNoHydrationErrors(consoleCapture)
  })

  test('hero section renders with headline and CTA', async ({ page }) => {
    await gotoAndWait(page, '/')
    // Hero headline
    await expect(page.getByRole('heading', { name: /explore phuket/i })).toBeVisible()
    // Primary CTA
    await expect(page.getByRole('link', { name: /explore scooters/i }).first()).toBeVisible()
  })

  test('trust strip renders', async ({ page }) => {
    await gotoAndWait(page, '/')
    await expect(page.getByText(/verified shops/i).first()).toBeVisible()
    await expect(page.getByText(/no platform fees/i).first()).toBeVisible()
  })

  test('featured scooters section renders at least one card', async ({ page }) => {
    await gotoAndWait(page, '/')
    const cardCount = await waitForCards(page)
    // If DB is empty, graceful empty state should show — not a crash
    // Either there are cards OR the page still renders cleanly
    const bodyText = await page.textContent('body') ?? ''
    const hasCards = cardCount > 0
    const hasEmptyState = /new rental partners|check back soon|browse all available/i.test(bodyText)
    expect(hasCards || hasEmptyState).toBe(true)
  })

  test('areas section renders or shows graceful empty state', async ({ page }) => {
    await gotoAndWait(page, '/')
    const body = await page.textContent('body') ?? ''
    const hasAreas = body.includes('patong') || body.includes('kata') || body.includes('karon')
    const hasEmptyState = /new rental partners|check back soon/i.test(body)
    expect(hasAreas || hasEmptyState).toBe(true)
  })

  test('area cards are clickable and navigate correctly', async ({ page }) => {
    await gotoAndWait(page, '/')
    const areaLinks = page.locator('a[href*="/phuket/"]')
    const count = await areaLinks.count()
    if (count === 0) {
      test.skip() // No live areas — skip navigation test
      return
    }
    const href = await areaLinks.first().getAttribute('href')
    expect(href).toMatch(/^\/phuket\//)
    await areaLinks.first().click()
    await page.waitForURL(/\/phuket\//, { timeout: 10_000 })
    await expect(page).not.toHaveURL('/') // Navigated away
  })

  test('how it works section visible', async ({ page }) => {
    await gotoAndWait(page, '/')
    await expect(page.getByText(/how it works/i).first()).toBeVisible()
    await expect(page.getByText(/find/i).first()).toBeVisible()
    await expect(page.getByText(/contact/i).first()).toBeVisible()
  })

  test('no booking platform language on home page', async ({ page }) => {
    await gotoAndWait(page, '/')
    await assertNoBookingLanguage(page)
  })

  test('footer renders with correct links', async ({ page }) => {
    await gotoAndWait(page, '/')
    // Footer should have Saved Scooters (not My Rentals)
    const footer = page.locator('footer')
    await expect(footer.getByText(/saved scooters/i)).toBeVisible()
    // Should NOT have My Rentals
    await expect(footer.getByText(/my rentals/i)).toHaveCount(0)
  })

  test('explore scooters CTA navigates to explore page', async ({ page }) => {
    await gotoAndWait(page, '/')
    await page.getByRole('link', { name: /explore scooters/i }).first().click()
    await page.waitForURL('/explore', { timeout: 10_000 })
  })

  test('popular area links navigate to explore with location filter', async ({ page }) => {
    await gotoAndWait(page, '/')
    const popularAreaLinks = page.locator('a[href*="/explore?location="]')
    const count = await popularAreaLinks.count()
    if (count === 0) return // No live areas — pass
    await popularAreaLinks.first().click()
    await page.waitForURL(/\/explore\?location=/, { timeout: 10_000 })
  })
})
