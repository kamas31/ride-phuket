import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/helpers/**', '**/fixtures/**', '**/support/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    // Generous timeouts for Next.js SSR pages
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/e2e/**', '**/edge-cases/**', '**/desktop/**'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
        // Force touch events for mobile interaction tests
        hasTouch: true,
      },
      testMatch: ['**/mobile/**', '**/e2e/**'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
