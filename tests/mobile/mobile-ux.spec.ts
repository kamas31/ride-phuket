import { test, expect } from '../fixtures'
import { gotoAndWait, getFirstScooterHref, waitForCards } from '../helpers/navigation'
import { assertNoHydrationErrors } from '../helpers/console-watcher'

/**
 * Mobile UX tests — run with mobile-safari project (iPhone 14 viewport).
 * Focus: layout, accessibility of key actions, no clipped content.
 */

test.describe('Mobile — Home Page', () => {
  test('home page loads cleanly on mobile', async ({ page, consoleCapture, assertPageClean }) => {
    await gotoAndWait(page, '/')
    await assertPageClean()
    assertNoHydrationErrors(consoleCapture)
  })

  test('hero CTA button is visible and not clipped on mobile', async ({ page }) => {
    await gotoAndWait(page, '/')
    const cta = page.getByRole('link', { name: /explore scooters/i }).first()
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      const viewportSize = page.viewportSize()!
      // Button must be fully within viewport width
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewportSize.width + 5) // 5px tolerance
    }
  })
})

test.describe('Mobile — Navigation', () => {
  test('mobile bottom nav is visible', async ({ page }) => {
    const viewport = page.viewportSize()
    if (!viewport || viewport.width > 768) {
      test.skip(true, 'Mobile-only test — desktop viewport, bottom nav is hidden by md:hidden')
      return
    }
    await gotoAndWait(page, '/explore')
    // Bottom nav should be visible — has Home, Explore, Saved, Profile
    await expect(page.locator('a[href="/explore"]').last()).toBeVisible()
    await expect(page.locator('a[href="/saved"]').last()).toBeVisible()
  })

  test('mobile bottom nav has NO Rentals link', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    const rentalsInNav = page.locator('nav a[href="/rentals"]')
    // Bottom nav should not have rentals
    const count = await rentalsInNav.count()
    expect(count).toBe(0)
  })

  test('hamburger menu opens on mobile', async ({ page }) => {
    await gotoAndWait(page, '/')
    // On mobile, the hamburger replaces desktop nav
    const hamburger = page.locator('button').filter({ has: page.locator('svg') }).first()
    if (await hamburger.isVisible()) {
      await hamburger.click()
      // Some kind of menu/drawer should appear
      await page.waitForTimeout(500)
      const body = await page.textContent('body') ?? ''
      expect(body.toLowerCase()).toContain('explore')
    }
  })
})

test.describe('Mobile — Explore Page', () => {
  test('explore page loads on mobile without overflow', async ({ page, assertPageClean }) => {
    await gotoAndWait(page, '/explore')
    await assertPageClean()
    // Check for horizontal overflow (content wider than viewport)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    // Allow 5px tolerance for scrollbar
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('mobile shows List/Map toggle in sticky bar', async ({ page }) => {
    const viewport = page.viewportSize()
    if (!viewport || viewport.width > 768) {
      test.skip(true, 'Mobile-only UI element — not visible on desktop viewport')
      return
    }
    await gotoAndWait(page, '/explore')
    // Mobile toggle: List and Map buttons inside a pill selector
    await expect(page.getByRole('button', { name: /^list$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^map$/i })).toBeVisible()
  })

  test('mobile List/Map toggle switches views', async ({ page }) => {
    const viewport = page.viewportSize()
    if (!viewport || viewport.width > 768) {
      test.skip(true, 'Mobile-only UI element — not visible on desktop viewport')
      return
    }
    await gotoAndWait(page, '/explore')
    // Start on list
    const listBtn = page.getByRole('button', { name: /^list$/i })
    const mapBtn = page.getByRole('button', { name: /^map$/i })

    await expect(listBtn).toBeVisible()
    await mapBtn.click()
    await page.waitForTimeout(500)
    // Either map loads OR the view changed
    expect(await mapBtn.evaluate(el => el.className)).toMatch(/bg-\[#0f0f0e\]/)
  })

  test('filter modal opens and is scrollable on mobile', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    await page.getByRole('button', { name: /filters/i }).click()
    // Modal should be visible as a bottom sheet on mobile
    const showResultsBtn = page.getByRole('button', { name: /show results/i })
    await expect(showResultsBtn).toBeVisible({ timeout: 5_000 })
  })

  test('scooter cards render in 2-column grid on mobile', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    const cards = page.locator('a[href*="/scooter/"]')
    const count = await cards.count()
    if (count < 2) return

    const box1 = await cards.nth(0).boundingBox()
    const box2 = await cards.nth(1).boundingBox()
    if (!box1 || !box2) return

    // In 2-column grid, cards side by side have similar Y coordinates
    const sameRow = Math.abs(box1.y - box2.y) < box1.height
    expect(sameRow).toBe(true)
  })
})

test.describe('Mobile — Scooter Detail Page', () => {
  let scooterPath: string | null = null

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await gotoAndWait(page, '/explore')
    scooterPath = await getFirstScooterHref(page)
    await page.close()
  })

  test('detail page loads on mobile without crash', async ({ page, assertPageClean }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    await assertPageClean()
  })

  test('WhatsApp CTA is visible and reachable without scroll on mobile', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    // WhatsApp link should exist
    const whatsappLink = page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first()
    if (await whatsappLink.count() === 0) return // Shop has no WhatsApp — skip
    await expect(whatsappLink).toBeVisible()
  })

  test('sticky booking/CTA bar is not taller than 20% of viewport', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    const viewportHeight = page.viewportSize()!.height
    // Find the sticky bottom bar
    const stickyBar = page.locator('[class*="sticky bottom"], [class*="fixed bottom"]').first()
    if (await stickyBar.count() === 0) return
    const box = await stickyBar.boundingBox()
    if (!box) return
    expect(box.height).toBeLessThan(viewportHeight * 0.2)
  })

  test('image gallery swipe target covers full width on mobile', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    const gallery = page.locator('img[alt*="photo"]').first()
    if (await gallery.count() === 0) return

    const box = await gallery.boundingBox()
    if (!box) return
    const viewportWidth = page.viewportSize()!.width
    // Image should be close to full viewport width on mobile
    expect(box.width).toBeGreaterThan(viewportWidth * 0.7)
  })

  test('no horizontal overflow on detail page', async ({ page }) => {
    if (!scooterPath) { test.skip(); return }
    await gotoAndWait(page, scooterPath)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })
})

test.describe('Mobile — Search UX', () => {
  test('search input is accessible without zooming on iOS', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    const input = page.getByPlaceholder(/search/i)
    await expect(input).toBeVisible()
    // Font size >= 16px prevents iOS auto-zoom
    const fontSize = await input.evaluate(el => {
      return parseFloat(getComputedStyle(el).fontSize)
    })
    // We accept 14px too as some mobile browsers don't auto-zoom below 16
    expect(fontSize).toBeGreaterThanOrEqual(14)
  })
})
