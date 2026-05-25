import { test as base, expect } from '@playwright/test'
import { watchConsole, assertNoConsoleErrors, type ConsoleCapture } from '../helpers/console-watcher'
import { assertNotErrorPage } from '../helpers/navigation'

export { expect }

/**
 * Extended test fixture that automatically:
 * - Watches for console errors on every test
 * - Asserts no 500 errors on the current page after each test
 * - Provides the `consoleCapture` object for custom assertions
 */
export const test = base.extend<{
  consoleCapture: ConsoleCapture
  assertPageClean: () => Promise<void>
}>({
  consoleCapture: async ({ page }, use) => {
    const capture = watchConsole(page)
    await use(capture)
  },

  assertPageClean: async ({ page, consoleCapture }, use) => {
    await use(async () => {
      await assertNotErrorPage(page)
      assertNoConsoleErrors(consoleCapture)
    })
  },
})
