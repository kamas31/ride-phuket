import type { Page } from 'playwright'
import { expect } from '@playwright/test'

/**
 * Navigate and wait for the page to be fully idle (network quiet + no spinner).
 */
export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  // Wait for any loading spinners to disappear
  const spinner = page.locator('.animate-spin')
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {})
  }
}

/**
 * Assert the page didn't return a 500/4xx by checking for error indicators.
 * Next.js App Router error pages render very specific text — we match those only.
 * We avoid matching the bare number "500" which appears legitimately in prices/counts.
 */
export async function assertNotErrorPage(page: Page) {
  const body = await page.textContent('body') ?? ''
  // Next.js specific error patterns (not bare "500" — too many false positives)
  const errorPatterns = [
    /application error: a client-side exception has occurred/i,
    /internal server error\s*\n/i,
    /unhandled runtime error/i,
    /this page crashed/i,
    /error digest:/i,
  ]
  const has500 = errorPatterns.some(p => p.test(body))

  if (has500) {
    throw new Error(`Page appears to be a 500 error page. URL: ${page.url()}`)
  }
}

/**
 * Wait for scooter cards to render on the explore/home page.
 * Returns the count of visible cards.
 */
export async function waitForCards(page: Page): Promise<number> {
  // Cards link to /scooter/
  await page.waitForSelector('a[href*="/scooter/"]', { timeout: 15_000 }).catch(() => {})
  const cards = page.locator('a[href*="/scooter/"]')
  return await cards.count()
}

/**
 * Get the href of the first scooter card visible on the current page.
 * Returns null if no cards found.
 */
export async function getFirstScooterHref(page: Page): Promise<string | null> {
  const card = page.locator('a[href*="/scooter/"]').first()
  if (await card.count() === 0) return null
  return await card.getAttribute('href')
}

/**
 * Get the href of the first shop link visible on the current page.
 */
export async function getFirstShopHref(page: Page): Promise<string | null> {
  const link = page.locator('a[href*="/shop/"]').first()
  if (await link.count() === 0) return null
  return await link.getAttribute('href')
}

/**
 * Assert no "My Rentals" / booking-platform language appears on the page.
 * Part of marketplace access philosophy verification.
 */
export async function assertNoBookingLanguage(page: Page) {
  const text = (await page.textContent('body') ?? '').toLowerCase()
  const forbidden = ['my rentals', 'my bookings', 'reservation history', 'booking management']
  for (const phrase of forbidden) {
    if (text.includes(phrase)) {
      throw new Error(`Found booking-platform language on page: "${phrase}" at ${page.url()}`)
    }
  }
}

/**
 * Check that no images on the page have broken src (404s).
 * Captures network failures during navigation separately.
 */
export async function checkImages(page: Page): Promise<string[]> {
  const broken: string[] = []
  const images = page.locator('img:not([aria-hidden="true"])')
  const count = await images.count()

  for (let i = 0; i < Math.min(count, 20); i++) {
    const src = await images.nth(i).getAttribute('src')
    if (!src || src.startsWith('data:')) continue
    // Check naturalWidth — 0 means failed to load
    const loaded = await images.nth(i).evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0
    })
    if (!loaded) broken.push(src)
  }

  return broken
}

/**
 * Expect a 404 page (Next.js renders "This page could not be found" for unknown routes)
 */
export async function expect404(page: Page) {
  await expect(page.locator('body')).toContainText(/could not be found|404|not found/i)
}
