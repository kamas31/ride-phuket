import { test, expect } from '../fixtures'
import { gotoAndWait, waitForCards } from '../helpers/navigation'
import { assertNoHydrationErrors } from '../helpers/console-watcher'

const AREAS = ['patong', 'kata', 'karon', 'rawai', 'bang-tao', 'phuket-town']

test.describe('Area Pages (/phuket/[area])', () => {
  // Test each known area
  for (const area of AREAS) {
    test(`/phuket/${area} loads without crash`, async ({ page, consoleCapture, assertPageClean }) => {
      await gotoAndWait(page, `/phuket/${area}`)
      await assertPageClean()
      assertNoHydrationErrors(consoleCapture)
    })
  }

  test('/phuket/patong renders area name', async ({ page }) => {
    await gotoAndWait(page, '/phuket/patong')
    const body = await page.textContent('body') ?? ''
    expect(body.toLowerCase()).toContain('patong')
  })

  test('/phuket/patong shows scooters or empty state (not a crash)', async ({ page }) => {
    await gotoAndWait(page, '/phuket/patong')
    const body = await page.textContent('body') ?? ''
    const cardCount = await page.locator('a[href*="/scooter/"]').count()
    // Match any of the possible empty state messages in the area page
    const hasEmptyState = /no listings|no scooters|browse all available|explore all scooters|check back/i.test(body)
    expect(cardCount > 0 || hasEmptyState).toBe(true)
  })

  test('unknown area slug returns 404 not crash', async ({ page }) => {
    await gotoAndWait(page, '/phuket/this-area-does-not-exist-zzzz')
    const body = await page.textContent('body') ?? ''
    const is404 = /not found|could not be found|404/i.test(body)
    const is500 = /application error|internal server error/i.test(body)
    expect(is404).toBe(true)
    expect(is500).toBe(false)
  })

  test('scooter cards on area page are clickable', async ({ page }) => {
    await gotoAndWait(page, '/phuket/patong')
    const cards = page.locator('a[href*="/scooter/"]')
    const count = await cards.count()
    if (count === 0) return // No scooters in area — pass

    const href = await cards.first().getAttribute('href')
    expect(href).toMatch(/\/scooter\//)
    await cards.first().click()
    await page.waitForURL(/\/scooter\//, { timeout: 15_000 })
  })

  test('area page has link back to explore', async ({ page }) => {
    await gotoAndWait(page, '/phuket/kata')
    // Should have an explore/all scooters link
    const exploreLink = page.locator('a[href="/explore"], a[href*="explore"]')
    const hasExplore = await exploreLink.count() > 0
    const body = await page.textContent('body') ?? ''
    const hasExploreText = /explore|browse all|all scooters/i.test(body)
    expect(hasExplore || hasExploreText).toBe(true)
  })
})
