import { test, expect } from '../fixtures'
import { gotoAndWait } from '../helpers/navigation'
import { hasTestCredentials, login, logout, expectAuthRedirect } from '../helpers/auth'

test.describe('Auth Pages', () => {
  test('login page loads without errors', async ({ page, assertPageClean }) => {
    await gotoAndWait(page, '/auth/login')
    await assertPageClean()
  })

  test('login page has email and password fields', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('signup page loads without errors', async ({ page, assertPageClean }) => {
    await gotoAndWait(page, '/auth/signup')
    await assertPageClean()
  })

  test('signup page step 1 shows role selection', async ({ page }) => {
    await gotoAndWait(page, '/auth/signup')
    // Step 1: role selection cards (Rider / Shop Owner)
    const body = await page.textContent('body') ?? ''
    expect(/rider|shop owner/i.test(body)).toBe(true)
    // Should have a continue/next button or role cards
    await expect(page.getByRole('button', { name: /continue|next|sign up|create/i }).first()).toBeVisible()
  })

  test('signup page step 2 has email and password fields', async ({ page }) => {
    await gotoAndWait(page, '/auth/signup')
    // Step 1 → Step 2: click "Continue as Rider" button
    await page.getByRole('button', { name: /continue as/i }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('login with wrong password shows error (not crash)', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').first().fill('wrong-password-zzz')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Should show error message, not crash or navigate away
    await page.waitForTimeout(3_000)
    expect(page.url()).toContain('/auth/login') // Still on login page
    const body = await page.textContent('body') ?? ''
    const hasError = /invalid|incorrect|wrong|error|credentials/i.test(body)
    expect(hasError).toBe(true)
  })

  test('profile page redirects to login when unauthenticated', async ({ page }) => {
    await expectAuthRedirect(page, '/profile')
  })

  test('saved page handles unauthenticated state gracefully', async ({ page }) => {
    // /saved should show a sign-in prompt, not crash
    await gotoAndWait(page, '/saved')
    const body = await page.textContent('body') ?? ''
    // Either shows sign-in prompt or a valid page
    const hasSignIn = /sign in|log in|create account|saved/i.test(body)
    const is500 = /application error|internal server error/i.test(body)
    expect(hasSignIn).toBe(true)
    expect(is500).toBe(false)
  })

  test.describe('Authenticated flows', () => {
    test.skip(!hasTestCredentials, 'TEST_EMAIL / TEST_PASSWORD env vars not set — skipping auth flow tests')

    test('login and access profile', async ({ page, assertPageClean }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      await assertPageClean()
      // Profile should show user info, not redirect to login
      expect(page.url()).not.toContain('/auth/login')
    })

    test('profile shows Saved section, not Rentals/Bookings', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/profile')
      const body = await page.textContent('body') ?? ''
      expect(body.toLowerCase()).toContain('saved')
      // Must not have booking language
      expect(body.toLowerCase()).not.toContain('my bookings')
      expect(body.toLowerCase()).not.toContain('my rentals')
    })

    test('logout works', async ({ page }) => {
      await login(page)
      await logout(page)
      // After logout, visiting /profile should redirect to login
      await page.goto('/profile')
      await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    })

    test('session persists across navigation', async ({ page }) => {
      await login(page)
      await gotoAndWait(page, '/explore')
      await gotoAndWait(page, '/profile')
      // Should still be logged in
      expect(page.url()).not.toContain('/auth/login')
    })
  })
})
