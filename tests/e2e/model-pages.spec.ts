import { test, expect } from '../fixtures'
import { gotoAndWait } from '../helpers/navigation'
import { assertNoHydrationErrors } from '../helpers/console-watcher'

const MODELS = ['pcx', 'nmax', 'adv']

test.describe('Model Pages (/models/[slug])', () => {
  for (const slug of MODELS) {
    test(`/models/${slug} loads without crash`, async ({ page, consoleCapture, assertPageClean }) => {
      await gotoAndWait(page, `/models/${slug}`)
      await assertPageClean()
      assertNoHydrationErrors(consoleCapture)
    })
  }

  test('/models/pcx renders model name', async ({ page }) => {
    await gotoAndWait(page, '/models/pcx')
    const body = await page.textContent('body') ?? ''
    expect(body.toLowerCase()).toContain('pcx')
  })

  test('/models/pcx shows scooters or empty state (not a crash)', async ({ page }) => {
    await gotoAndWait(page, '/models/pcx')
    const body = await page.textContent('body') ?? ''
    const cardCount = await page.locator('a[href*="/scooter/"]').count()
    const hasEmptyState = /no .* listings right now|browse all available|explore all scooters/i.test(body)
    expect(cardCount > 0 || hasEmptyState).toBe(true)
  })

  test('unknown model slug returns 404 not crash', async ({ page }) => {
    await gotoAndWait(page, '/models/this-model-does-not-exist-zzzz')
    const body = await page.textContent('body') ?? ''
    const is404 = /not found|could not be found|404/i.test(body)
    const is500 = /application error|internal server error/i.test(body)
    expect(is404).toBe(true)
    expect(is500).toBe(false)
  })

  test('scooter cards on model page are clickable', async ({ page }) => {
    await gotoAndWait(page, '/models/pcx')
    const cards = page.locator('a[href*="/scooter/"]')
    const count = await cards.count()
    if (count === 0) return // No live PCX inventory — pass

    const href = await cards.first().getAttribute('href')
    expect(href).toMatch(/\/scooter\//)
    await cards.first().click()
    await page.waitForURL(/\/scooter\//, { timeout: 15_000 })
  })

  test('model page has link back to explore', async ({ page }) => {
    await gotoAndWait(page, '/models/nmax')
    const exploreLink = page.locator('a[href="/explore"], a[href*="explore"]')
    const hasExplore = await exploreLink.count() > 0
    const body = await page.textContent('body') ?? ''
    const hasExploreText = /explore|browse all|all scooters/i.test(body)
    expect(hasExplore || hasExploreText).toBe(true)
  })

  test('PCX and NMAX pages cross-link reciprocally', async ({ page }) => {
    await gotoAndWait(page, '/models/pcx')
    const toNmax = page.locator('a[href="/models/nmax"]')
    expect(await toNmax.count()).toBeGreaterThan(0)

    await gotoAndWait(page, '/models/nmax')
    const toPcx = page.locator('a[href="/models/pcx"]')
    expect(await toPcx.count()).toBeGreaterThan(0)
  })

  test('/models/adv renders the ADV 160 vs 350 section', async ({ page }) => {
    await gotoAndWait(page, '/models/adv')
    const body = await page.textContent('body') ?? ''
    expect(body).toContain('ADV 160')
    expect(body).toContain('ADV 350')
  })
})
