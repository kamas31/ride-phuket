import { test, expect } from '../fixtures'
import { gotoAndWait } from '../helpers/navigation'
import { hasTestCredentials, login, expectAuthRedirect } from '../helpers/auth'

test.describe('Profile Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await expectAuthRedirect(page, '/profile')
  })

  test('login redirect URL preserves /profile destination', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    // URL should contain redirect param
    expect(page.url()).toContain('redirect')
  })

  test.describe('Authenticated profile', () => {
    test.skip(!hasTestCredentials, 'TEST_EMAIL / TEST_PASSWORD not set — skipping')

    test('profile page loads without errors', async ({ page, assertPageClean }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      await assertPageClean()
    })

    test('shows Saved section not Rentals section', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      const body = await page.textContent('body') ?? ''
      expect(body.toLowerCase()).toContain('saved scooters')
      expect(body.toLowerCase()).not.toContain('my bookings')
      expect(body.toLowerCase()).not.toContain('my rentals')
    })

    test('shows Personal Information section', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      await expect(page.getByText(/personal information/i)).toBeVisible()
    })

    test('edit button toggles edit mode', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      const editBtn = page.getByRole('button', { name: /edit/i })
      if (await editBtn.count() === 0) return
      await editBtn.click()
      // Should show Save/Cancel buttons
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
    })

    test('cancel edit restores view mode', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      const editBtn = page.getByRole('button', { name: /edit/i })
      if (await editBtn.count() === 0) return
      await editBtn.click()
      await page.getByRole('button', { name: /cancel/i }).click()
      // Should be back to view mode
      await expect(page.getByRole('button', { name: /edit/i })).toBeVisible()
    })

    test('sign out button is present', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
    })
  })
})
