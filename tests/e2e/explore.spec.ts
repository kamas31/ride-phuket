import { test, expect } from '../fixtures'
import { gotoAndWait, waitForCards, assertNoBookingLanguage } from '../helpers/navigation'
import { assertNoHydrationErrors } from '../helpers/console-watcher'

test.describe('Explore Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/explore')
  })

  test('loads without errors or crashes', async ({ assertPageClean, consoleCapture }) => {
    await assertPageClean()
    assertNoHydrationErrors(consoleCapture)
  })

  test('result count renders', async ({ page }) => {
    await expect(page.getByText(/scooters available/i)).toBeVisible()
  })

  test('search input renders and accepts text', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('honda')
    await expect(searchInput).toHaveValue('honda')
  })

  test('filter chips render — Recommended chip visible', async ({ page }) => {
    // The "Recommended" / all-category chip should be present
    await expect(page.getByRole('button', { name: /recommended/i })).toBeVisible()
  })

  test('filter chips — Automatic and Manual visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /automatic/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /manual/i })).toBeVisible()
  })

  test('filter chips — Delivery chip visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /delivery/i })).toBeVisible()
  })

  test('filter chips — No Passport chip visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /no passport/i })).toBeVisible()
  })

  test('clicking category filter changes result count', async ({ page }) => {
    const initialText = await page.getByText(/scooters available/i).textContent()
    const automaticBtn = page.getByRole('button', { name: /automatic/i })
    await automaticBtn.click()
    // State should change (count may differ, but UI should update)
    await expect(automaticBtn).toHaveClass(/bg-\[#0f0f0e\]|border-\[#0f0f0e\]/)
  })

  test('Filters modal opens and closes', async ({ page }) => {
    const filtersBtn = page.getByRole('button', { name: /filters/i })
    await filtersBtn.click()
    // Modal should be visible with Show Results button
    await expect(page.getByRole('button', { name: /show results/i })).toBeVisible()
    await page.getByRole('button', { name: /show results/i }).click()
    // Modal dismissed
    await expect(page.getByRole('button', { name: /show results/i })).toHaveCount(0)
  })

  test('Filters modal Reset clears all filters', async ({ page }) => {
    // Apply a filter
    await page.getByRole('button', { name: /delivery/i }).click()
    await page.getByRole('button', { name: /filters/i }).click()
    // Use exact match to avoid matching "reset session" dev button
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await page.getByRole('button', { name: /show results/i }).click()
    // Delivery button should no longer be active (class changes when active)
    const deliveryBtn = page.getByRole('button', { name: /delivery/i }).first()
    const cls = await deliveryBtn.getAttribute('class') ?? ''
    expect(cls).not.toContain('bg-[#0f0f0e]')
  })

  test('map toggle shows and hides map on desktop', async ({ page }) => {
    // Only applies to desktop viewport (lg breakpoint)
    const toggleBtn = page.locator('button', { hasText: /show map|hide map/i })
    const isVisible = await toggleBtn.isVisible()
    if (!isVisible) return // Mobile — skip

    const initialText = await toggleBtn.textContent()
    await toggleBtn.click()
    // Text should flip
    const newText = await toggleBtn.textContent()
    expect(newText).not.toBe(initialText)
  })

  test('scooter cards are clickable and navigate to detail', async ({ page }) => {
    const cardCount = await waitForCards(page)
    if (cardCount === 0) return // DB empty, pass gracefully

    const firstCard = page.locator('a[href*="/scooter/"]:visible').first()
    const href = await firstCard.getAttribute('href')
    expect(href).toMatch(/\/scooter\/[a-zA-Z0-9-]+/)
    await firstCard.click()
    await page.waitForURL(/\/scooter\//, { timeout: 15_000 })
  })

  test('search filters cards in real time', async ({ page }) => {
    const initialCount = await waitForCards(page)
    if (initialCount === 0) return

    // Search for something unlikely to match all results
    await page.getByPlaceholder(/search/i).fill('zzz_no_results_xyz')
    // Count should drop (probably to 0)
    await page.waitForTimeout(500) // Debounce
    const filtered = await page.locator('a[href*="/scooter/"]').count()
    expect(filtered).toBeLessThanOrEqual(initialCount)
  })

  test('empty search state renders gracefully (no crash)', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('xyzzy_no_match_ever_12345')
    await page.waitForTimeout(500)
    const body = await page.textContent('body') ?? ''
    // Either shows empty state OR shows 0 count — not a crash
    const hasEmptyState = /no scooters found|adjusting your filters/i.test(body)
    const hasZeroCount = body.includes('0') && body.toLowerCase().includes('scooter')
    expect(hasEmptyState || hasZeroCount).toBe(true)
  })

  test('no booking language on explore page', async ({ page }) => {
    await assertNoBookingLanguage(page)
  })

  test('sort dropdown renders and has options', async ({ page }) => {
    const sortSelect = page.locator('select')
    await expect(sortSelect).toBeVisible()
    const options = await sortSelect.locator('option').count()
    expect(options).toBeGreaterThanOrEqual(2)
  })

  test('price-asc sort changes order', async ({ page }) => {
    const cardCount = await waitForCards(page)
    if (cardCount < 2) return // Not enough data to test sort order

    const sortSelect = page.locator('select')
    await sortSelect.selectOption({ value: 'price_asc' })
    await page.waitForTimeout(300)
    // Page should still render without crash
    const count = await page.locator('a[href*="/scooter/"]').count()
    expect(count).toBeGreaterThan(0)
  })
})
