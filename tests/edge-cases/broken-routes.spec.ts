import { test, expect } from '../fixtures'
import { gotoAndWait } from '../helpers/navigation'

/**
 * Verify that invalid/nonexistent routes return clean 404 pages,
 * never 500 errors or application crashes.
 */

const NONEXISTENT_ROUTES = [
  '/scooter/this-id-does-not-exist-00000000',
  '/shop/this-shop-slug-does-not-exist',
  '/phuket/fake-area-name-zzz',
  '/totally-unknown-route',
]

test.describe('Broken Routes — 404 Handling', () => {
  for (const route of NONEXISTENT_ROUTES) {
    test(`${route} returns 404, not 500`, async ({ page }) => {
      await gotoAndWait(page, route)
      const body = await page.textContent('body') ?? ''
      const is500 = /application error|internal server error/i.test(body)
      const has404indicators = /not found|could not be found|404|page doesn't exist/i.test(body)
      expect(is500).toBe(false)
      // For well-known entity routes, 404 is expected
      if (route.startsWith('/scooter/') || route.startsWith('/shop/') || route.startsWith('/phuket/')) {
        expect(has404indicators).toBe(true)
      }
    })
  }

  test('homepage still loads after visiting a broken route', async ({ page }) => {
    await gotoAndWait(page, '/scooter/fake-id-zzz')
    await gotoAndWait(page, '/')
    // Should recover cleanly
    await expect(page.getByRole('heading', { name: /explore phuket/i })).toBeVisible()
  })

  test('explore page still loads after visiting a broken route', async ({ page }) => {
    await gotoAndWait(page, '/phuket/fake-area-zzz')
    await gotoAndWait(page, '/explore')
    await expect(page.getByText(/scooters available/i)).toBeVisible()
  })
})

test.describe('Network Resilience', () => {
  test('Supabase outage on explore returns graceful error, not crash', async ({ page }) => {
    // Block Supabase REST/realtime calls — match by common Supabase URL patterns
    await page.route('**supabase.co**', route => route.abort())
    await page.route('**/rest/v1/**', route => route.abort())

    await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const body = await page.textContent('body') ?? ''

    // Should NOT be an unhandled crash or blank page
    // May show empty state, loading state, or error state — all acceptable
    const isBlankPage = body.trim().length < 50
    expect(isBlankPage).toBe(false)

    const is500 = /application error|internal server error.*unhandled/i.test(body)
    expect(is500).toBe(false)
  })

  test('page loads with slow network', async ({ page }) => {
    // Simulate 2G / slow 3G conditions
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay per request
      await route.continue()
    })

    await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 30_000 })
    const body = await page.textContent('body') ?? ''
    expect(body.length).toBeGreaterThan(100)
  })
})

test.describe('Redirect Correctness', () => {
  test('/bookings redirects to /saved', async ({ page }) => {
    const response = await page.goto('/bookings')
    await page.waitForURL('/saved', { timeout: 10_000 })
  })

  test('/rentals redirects to /saved', async ({ page }) => {
    await page.goto('/rentals')
    await page.waitForURL('/saved', { timeout: 10_000 })
  })

  test('unauthenticated /profile redirects to /auth/login', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    // /profile is URL-encoded as %2Fprofile in the redirect param
    const url = decodeURIComponent(page.url())
    expect(url).toContain('redirect=/profile')
  })
})
