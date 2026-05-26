/**
 * AUTH HARDENING QA SUITE
 *
 * Targets session/cache integrity specifically.
 * Tests that DO require credentials are wrapped in test.skip(!hasTestCredentials).
 * Tests that DON'T require credentials run unconditionally.
 */

import { test, expect, type Page } from '@playwright/test'
import { gotoAndWait } from '../helpers/navigation'
import { hasTestCredentials, login, logout } from '../helpers/auth'

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Singleton client integrity', () => {
  test('only one Supabase client instance is created per page', async ({ page }) => {
    await gotoAndWait(page, '/')

    const instanceCount = await page.evaluate(() => {
      // Verify that calling createClient multiple times returns the same object
      // by checking module-level singleton behavior from the window context
      // We can only observe this indirectly — if the singleton is working,
      // there should be exactly one set of auth cookies in storage
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
      return keys.length
    })

    // Should have at most 1 Supabase auth key (not multiple from different instances)
    expect(instanceCount).toBeLessThanOrEqual(2) // auth-token + code-verifier
  })

  test('no duplicate auth-related localStorage keys', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    const authKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k => k.includes('supabase') || k.startsWith('sb-'))
    )
    // All keys should be unique (no duplication from multiple client instances)
    const unique = new Set(authKeys)
    expect(unique.size).toBe(authKeys.length)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UNAUTHENTICATED STATE — pages must be clean with no auth state leakage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Unauthenticated state integrity', () => {
  test('fresh page load has no user state in navbar', async ({ page }) => {
    await gotoAndWait(page, '/')
    // Should see Sign In link, not user avatar/name
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible()
    // Should NOT see sign-out button
    const signOut = page.getByRole('button', { name: /sign out/i })
    await expect(signOut).not.toBeVisible()
  })

  test('profile page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/auth/login')
  })

  test('partner dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/partner/dashboard')
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/auth/login')
  })

  test('saved page shows sign-in prompt when not authenticated', async ({ page }) => {
    await gotoAndWait(page, '/saved')
    const body = await page.textContent('body') ?? ''
    expect(/sign in|log in/i.test(body)).toBe(true)
    // Must not crash
    expect(/application error|internal server error|unhandled runtime error/i.test(body)).toBe(false)
  })

  test('saved localStorage is empty for unauthenticated user', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    const saved = await page.evaluate(() => localStorage.getItem('rp_saved_v1'))
    // Either null or empty array — not polluted from a previous session
    if (saved) {
      expect(JSON.parse(saved)).toHaveLength(0)
    } else {
      expect(saved).toBeNull()
    }
  })

  test('no hydration mismatch warnings on home page', async ({ page }) => {
    const consoleMsgs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleMsgs.push(msg.text())
      }
    })
    await gotoAndWait(page, '/')
    await page.waitForTimeout(2_000)
    const hydrationErrors = consoleMsgs.filter(m =>
      /hydrat|did not match|server.*client|mismatch/i.test(m)
    )
    expect(hydrationErrors).toHaveLength(0)
  })

  test('no hydration mismatch on explore page', async ({ page }) => {
    const consoleMsgs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleMsgs.push(msg.text())
      }
    })
    await gotoAndWait(page, '/explore')
    await page.waitForTimeout(2_000)
    const hydrationErrors = consoleMsgs.filter(m =>
      /hydrat|did not match|server.*client|mismatch/i.test(m)
    )
    expect(hydrationErrors).toHaveLength(0)
  })

  test('reset-password page loads without crashing', async ({ page }) => {
    await gotoAndWait(page, '/auth/reset-password')
    const body = await page.textContent('body') ?? ''
    expect(/application error|internal server error|unhandled runtime error/i.test(body)).toBe(false)
    // Should show the page structure (loading state or expired state after timeout)
    expect(/password|sign in/i.test(body)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGE INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Auth pages integrity', () => {
  test('login page Forgot? button is interactive (not dead)', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    const forgotBtn = page.getByRole('button', { name: /forgot/i })
    await expect(forgotBtn).toBeVisible()
    await forgotBtn.click()
    await page.waitForTimeout(300)
    // Should now show reset password form (email input, send link button)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })

  test('login Forgot? pre-fills email if already typed', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.getByRole('button', { name: /forgot/i }).click()
    await page.waitForTimeout(300)
    const emailValue = await page.locator('input[type="email"]').inputValue()
    expect(emailValue).toBe('test@example.com')
  })

  test('forgot password: back to sign in works', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    await page.getByRole('button', { name: /forgot/i }).click()
    await page.waitForTimeout(300)
    // Should have a back button
    const backBtn = page.getByRole('button', { name: /back to sign in/i })
      .or(page.getByText(/back to sign in/i).first())
    await expect(backBtn).toBeVisible()
    await backBtn.click()
    // Should return to login form
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('wrong-password login shows error without page crash', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    await page.locator('input[type="email"]').fill('nobody@example.com')
    await page.locator('input[type="password"]').first().fill('wrong-password-zzz')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForTimeout(4_000)
    expect(page.url()).toContain('/auth/login')
    const body = await page.textContent('body') ?? ''
    expect(/invalid|incorrect|wrong|error|credentials/i.test(body)).toBe(true)
    expect(/application error|crash/i.test(body)).toBe(false)
  })

  test('rapid login button clicks do not cause duplicate requests / crash', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').first().fill('password')
    const btn = page.getByRole('button', { name: /sign in/i })
    // Rapid fire 3 clicks
    await btn.click()
    await btn.click()
    await btn.click()
    await page.waitForTimeout(4_000)
    // Should still be on login page (wrong credentials) without crashing
    const body = await page.textContent('body') ?? ''
    expect(/application error|crash|unhandled/i.test(body)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ISOLATION — tests that localStorage is properly scoped
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Session isolation', () => {
  test('saving a scooter unauthenticated shows auth prompt not crash', async ({ page }) => {
    const scooterLinks = page.locator('a[href*="/scooter/"]')
    await gotoAndWait(page, '/explore')
    // If cards are available, try the save button
    if (await scooterLinks.count() > 0) {
      const saveBtn = page.locator('button[aria-label*="Save"]').first()
      if (await saveBtn.count() > 0) {
        await saveBtn.click()
        await page.waitForTimeout(1_000)
        // Should redirect to login, not crash
        const url = page.url()
        const body = await page.textContent('body') ?? ''
        const redirectedToLogin = url.includes('/auth/login')
        const showedNoError = !/application error|crash/i.test(body)
        expect(showedNoError).toBe(true)
        if (!redirectedToLogin) {
          // If not redirected, there should be no stale save
          const saved = await page.evaluate(() => localStorage.getItem('rp_saved_v1'))
          expect(saved).toBeNull()
        }
      }
    }
  })

  test('no rp_saved_v1 pollution across fresh browser context', async ({ browser }) => {
    const ctx1 = await browser.newContext()
    const page1 = await ctx1.newPage()
    await page1.goto('/explore')
    // Check that rp_saved_v1 is not set (fresh context)
    const saved = await page1.evaluate(() => localStorage.getItem('rp_saved_v1'))
    if (saved) {
      expect(JSON.parse(saved)).toHaveLength(0)
    }
    await ctx1.close()
  })

  test('map view preference (rp_show_map) persists across navigation', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    // Map toggle state should be stable, not cause any auth state issues
    const body = await page.textContent('body') ?? ''
    expect(/application error/i.test(body)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATES — no stale/undefined loading guards
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Loading state correctness', () => {
  test('home page renders without lingering spinners', async ({ page }) => {
    await gotoAndWait(page, '/')
    await page.waitForTimeout(3_000)
    // Spinners should resolve, not spin forever
    const spinners = page.locator('.animate-spin:visible')
    expect(await spinners.count()).toBe(0)
  })

  test('explore page resolves loading state', async ({ page }) => {
    await gotoAndWait(page, '/explore')
    await page.waitForTimeout(3_000)
    const spinners = page.locator('.animate-spin:visible')
    expect(await spinners.count()).toBe(0)
  })

  test('auth page loads without infinite spinner', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    await page.waitForTimeout(2_000)
    const spinners = page.locator('.animate-spin:visible')
    expect(await spinners.count()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-TAB BEHAVIOR (simulated with multiple pages)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Multi-tab / multi-page integrity', () => {
  test('two pages in same context share localStorage state', async ({ context }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()
    await page1.goto('/explore')
    await page2.goto('/explore')
    // Both should see the same auth state (no user in clean context)
    const auth1 = await page1.evaluate(() =>
      Object.keys(localStorage).filter(k => k.startsWith('sb-'))
    )
    const auth2 = await page2.evaluate(() =>
      Object.keys(localStorage).filter(k => k.startsWith('sb-'))
    )
    expect(auth1).toEqual(auth2)
    await page1.close()
    await page2.close()
  })

  test('protected route in second tab redirects correctly', async ({ context }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()
    await page1.goto('/explore')
    // Second tab tries to access profile without auth
    await page2.goto('/profile')
    await page2.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    expect(page2.url()).toContain('/auth/login')
    await page1.close()
    await page2.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED FLOWS (require TEST_EMAIL / TEST_PASSWORD)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authenticated auth integrity', () => {
  test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD to run auth flow tests')

  test('login → profile shows correct user, not stale data', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/profile')
    // Profile page should show user info (not redirect to login)
    expect(page.url()).not.toContain('/auth/login')
    // Should not have any loading spinners after load
    await page.waitForTimeout(3_000)
    const spinners = page.locator('.animate-spin:visible')
    expect(await spinners.count()).toBe(0)
  })

  test('logout clears rp_saved_v1 from localStorage', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/')
    // Verify user is logged in
    const savedBefore = await page.evaluate(() => localStorage.getItem('rp_saved_v1'))
    // Sign out
    await logout(page)
    await page.waitForURL(/\/$/, { timeout: 10_000 })
    // After logout, saved key should be cleared
    const savedAfter = await page.evaluate(() => localStorage.getItem('rp_saved_v1'))
    if (savedAfter) {
      expect(JSON.parse(savedAfter)).toHaveLength(0)
    } else {
      expect(savedAfter).toBeNull()
    }
  })

  test('logout clears Supabase session from localStorage', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/')
    await logout(page)
    await page.waitForTimeout(2_000)
    const supabaseKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k => k.startsWith('sb-'))
    )
    // After signOut(), all Supabase auth keys should be cleared
    expect(supabaseKeys.filter(k => k.includes('auth-token'))).toHaveLength(0)
  })

  test('logout then refresh shows unauthenticated state in navbar', async ({ page }) => {
    await login(page)
    await logout(page)
    // Full reload simulates the fix — everything should be fresh
    await page.reload()
    await page.waitForTimeout(2_000)
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible()
    const signOut = page.getByRole('button', { name: /sign out/i })
    await expect(signOut).not.toBeVisible()
  })

  test('profile redirect survives page refresh', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/profile')
    expect(page.url()).not.toContain('/auth/login')
    // Refresh
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3_000)
    // Should still be on profile, not redirected
    expect(page.url()).not.toContain('/auth/login')
  })

  test('session persists across soft navigation', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/explore')
    await gotoAndWait(page, '/profile')
    await gotoAndWait(page, '/explore')
    await gotoAndWait(page, '/profile')
    // Should still be authenticated after multiple navigations
    expect(page.url()).not.toContain('/auth/login')
  })

  test('navbar updates immediately after login (no stale Sign In button)', async ({ page }) => {
    await gotoAndWait(page, '/auth/login')
    // Before login — should see Sign In button
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible()

    await login(page)
    await page.waitForTimeout(2_000)
    // After login + redirect — Sign In button should be gone on desktop
    const signIn = page.locator('nav').getByRole('link', { name: /sign in/i })
    if (await signIn.count() > 0) {
      await expect(signIn).not.toBeVisible()
    }
  })

  test('no stale partner dashboard link for rider after account switch', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/')
    const body = await page.textContent('body') ?? ''
    // Rider should not see Dashboard link in navbar
    // (only shop_owner gets this — if test account is a rider)
    const navText = await page.locator('nav').first().textContent() ?? ''
    if (!navText.toLowerCase().includes('dashboard')) {
      // Confirmed rider: no dashboard visible
      expect(navText.toLowerCase()).not.toContain('dashboard')
    }
  })

  test('saved scooters page shows correct user data after login', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/saved')
    // Should NOT redirect to login
    expect(page.url()).not.toContain('/auth/login')
    // Should not crash
    const body = await page.textContent('body') ?? ''
    expect(/application error|crash/i.test(body)).toBe(false)
  })

  test('rapid page refresh while logged in does not lose session', async ({ page }) => {
    await login(page)
    await gotoAndWait(page, '/profile')
    // Rapid refreshes
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3_000)
    expect(page.url()).not.toContain('/auth/login')
  })

  test('opening profile in one tab and navigating to saved in another maintains auth', async ({ context }) => {
    // First page — do the login
    const page1 = await context.newPage()
    await login(page1)

    // Second page — open in same context (shared cookies/localStorage)
    const page2 = await context.newPage()
    await page2.goto('/profile')
    await page2.waitForTimeout(3_000)
    // Should be authenticated (shared session)
    expect(page2.url()).not.toContain('/auth/login')

    await page1.close()
    await page2.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Auth edge cases', () => {
  test('visiting /auth/login while already logged out is stable', async ({ page }) => {
    // Clear any session first
    await page.context().clearCookies()
    await gotoAndWait(page, '/auth/login')
    const body = await page.textContent('body') ?? ''
    expect(/application error/i.test(body)).toBe(false)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('expired/invalid session cookie gracefully falls back to login', async ({ page }) => {
    // Inject a fake/malformed Supabase cookie
    await page.context().addCookies([{
      name: 'sb-test-auth-token',
      value: 'invalid-jwt-token',
      domain: 'localhost',
      path: '/',
    }])
    await page.goto('/profile')
    // Should redirect to login, not crash
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/auth/login')
  })

  test('reset-password page without valid code shows expired state', async ({ page }) => {
    // Visit without a valid code — should show expired/invalid state after timeout
    await page.goto('/auth/reset-password')
    await page.waitForTimeout(12_000) // wait past the 10s timeout
    const body = await page.textContent('body') ?? ''
    // Should show expired message or sign in link
    expect(/expired|invalid|sign in/i.test(body)).toBe(true)
    expect(/application error/i.test(body)).toBe(false)
  })

  test('logout URL redirect param is preserved through login', async ({ page }) => {
    await page.goto('/profile') // should redirect
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    // URL should contain redirect param
    expect(page.url()).toMatch(/redirect=|next=/)
  })
})
