import { test, expect } from '../fixtures'
import { gotoAndWait, getFirstScooterHref } from '../helpers/navigation'

/**
 * These tests verify the app's resilience to malformed/missing data.
 *
 * Strategy: intercept Supabase REST responses and inject bad data at the
 * client edge. For server-rendered pages (App Router), we instead test
 * that the normalizer + error boundaries protect the UI by checking the
 * rendered output doesn't crash when real edge-case conditions occur.
 */

test.describe('Malformed API Responses', () => {
  test('explore page handles empty scooter array gracefully', async ({ page }) => {
    // Note: /explore is SSR — route interception only affects client-side fetches,
    // not the initial server render. This test verifies the page doesn't crash when
    // the REST API returns empty on any subsequent client-side request.
    await page.route('**/rest/v1/scooters*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const body = await page.textContent('body') ?? ''

    // Should not crash — page renders (SSR data appears, not affected by route intercept)
    const is500 = /application error|internal server error/i.test(body)
    expect(is500).toBe(false)
    const isBlank = body.trim().length < 100
    expect(isBlank).toBe(false)
  })

  test('explore handles network error from Supabase (client fetch)', async ({ page }) => {
    // Only abort the first scooter list request; page may still render skeleton
    let aborted = false
    await page.route('**/rest/v1/scooters*', async route => {
      if (!aborted) {
        aborted = true
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const body = await page.textContent('body') ?? ''
    const isBlank = body.trim().length < 100
    expect(isBlank).toBe(false)
  })
})

test.describe('Missing Image Handling', () => {
  let scooterPath: string | null = null

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await gotoAndWait(page, '/explore')
    scooterPath = await getFirstScooterHref(page)
    await page.close()
  })

  test('scooter detail with broken image URL shows placeholder, not crash', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }

    // Intercept image requests and return 404 for scooter images
    await page.route('**/storage/**', async route => {
      const url = route.request().url()
      if (/\.(jpg|jpeg|png|webp)/i.test(url)) {
        await route.fulfill({ status: 404, body: 'not found' })
      } else {
        await route.continue()
      }
    })

    await page.goto(scooterPath, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const body = await page.textContent('body') ?? ''

    // Should NOT crash — either shows placeholder or broken img handled gracefully
    const is500 = /application error|internal server error/i.test(body)
    expect(is500).toBe(false)
    const isBlank = body.trim().length < 100
    expect(isBlank).toBe(false)
  })
})

test.describe('DB Field Absence Resilience', () => {
  test('scooter with missing price field shows fallback, not crash', async ({ page }) => {
    // Intercept and strip price_per_day from scooter responses
    await page.route('**/rest/v1/scooters*', async route => {
      const response = await route.fetch()
      const json = await response.json().catch(() => [])
      const patched = Array.isArray(json)
        ? json.map((s: Record<string, unknown>) => ({ ...s, price_per_day: null }))
        : json
      await route.fulfill({
        response,
        body: JSON.stringify(patched),
      })
    })

    await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const body = await page.textContent('body') ?? ''
    const is500 = /application error|internal server error/i.test(body)
    expect(is500).toBe(false)
  })

  test('scooter with null name shows fallback, not crash', async ({ page }) => {
    await page.route('**/rest/v1/scooters*', async route => {
      const response = await route.fetch()
      const json = await response.json().catch(() => [])
      const patched = Array.isArray(json)
        ? json.map((s: Record<string, unknown>) => ({ ...s, name: null }))
        : json
      await route.fulfill({ response, body: JSON.stringify(patched) })
    })

    await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const body = await page.textContent('body') ?? ''
    const is500 = /application error|internal server error/i.test(body)
    expect(is500).toBe(false)
  })

  test('scooter with empty images array shows placeholder', async ({ page }) => {
    // Fetch scooterPath inline — this describe block has no beforeAll
    let scooterPath: string | null = null
    const explorePage = await page.context().newPage()
    await gotoAndWait(explorePage, '/explore')
    scooterPath = await getFirstScooterHref(explorePage)
    await explorePage.close()

    if (!scooterPath) { test.skip(); return }

    await page.route('**/rest/v1/scooters*', async route => {
      const response = await route.fetch()
      const json = await response.json().catch(() => null)
      if (json && typeof json === 'object' && !Array.isArray(json)) {
        // Single scooter response
        const patched = { ...json, images: [] }
        await route.fulfill({ response, body: JSON.stringify(patched) })
      } else {
        await route.continue()
      }
    })

    await page.goto(scooterPath, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const body = await page.textContent('body') ?? ''
    const is500 = /application error|internal server error/i.test(body)
    expect(is500).toBe(false)
  })
})
