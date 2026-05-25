import type { Page } from 'playwright'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? ''
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? ''

export const hasTestCredentials = !!(TEST_EMAIL && TEST_PASSWORD)

/**
 * Log in via the UI login form.
 * Resolves once the user is redirected away from /auth/login.
 */
export async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/auth/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  // Wait for redirect away from login page
  await page.waitForURL(url => !url.pathname.startsWith('/auth/login'), { timeout: 15_000 })
}

/**
 * Log out via the UI (clicks Sign Out from the user menu).
 */
export async function logout(page: Page) {
  // Desktop: user menu button
  const userMenuBtn = page.locator('button').filter({ hasText: /sign out/i }).first()
  if (await userMenuBtn.isVisible()) {
    await userMenuBtn.click()
    return
  }
  // Try opening user dropdown first
  const avatarBtn = page.locator('button').filter({ hasNotText: /explore|saved|profile|filters/i }).first()
  if (await avatarBtn.isVisible()) {
    await avatarBtn.click()
    await page.getByRole('button', { name: /sign out/i }).click()
  }
}

/**
 * Navigate to a protected route. If not logged in, should redirect to /auth/login.
 */
export async function expectAuthRedirect(page: Page, path: string) {
  await page.goto(path)
  await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
}
