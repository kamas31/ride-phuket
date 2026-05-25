import type { Page } from 'playwright'

// Patterns we deliberately ignore — third-party noise, known Next.js dev quirks
const IGNORED_PATTERNS = [
  /Download the React DevTools/,
  /ReactDOM.render is no longer supported/,
  /Warning: Each child in a list/,
  /fast refresh/i,
  /\[Fast Refresh\]/,
  /HMR/,
  /@supabase.*warn/i,
  /MapboxGL: Unimplemented/i,
  // Suppress mapbox license warnings in test env
  /mapbox/i,
]

export interface ConsoleCapture {
  errors: string[]
  pageErrors: string[]
  failedRequests: string[]
}

/**
 * Attach console/network watchers to a page.
 * Call `assertClean()` at test end to fail on any captured issues.
 */
export function watchConsole(page: Page): ConsoleCapture {
  const capture: ConsoleCapture = { errors: [], pageErrors: [], failedRequests: [] }

  page.on('console', msg => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (IGNORED_PATTERNS.some(p => p.test(text))) return
    capture.errors.push(text)
  })

  page.on('pageerror', err => {
    const text = err.message
    if (IGNORED_PATTERNS.some(p => p.test(text))) return
    capture.pageErrors.push(text)
  })

  page.on('requestfailed', req => {
    const url = req.url()
    // Ignore analytics, image preloads, and external resources
    if (/posthog|sentry|analytics|beacon|unsplash/i.test(url)) return
    capture.failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText}`)
  })

  return capture
}

export function assertNoConsoleErrors(capture: ConsoleCapture) {
  const issues: string[] = [
    ...capture.errors.map(e => `CONSOLE ERROR: ${e}`),
    ...capture.pageErrors.map(e => `PAGE ERROR: ${e}`),
  ]

  if (issues.length > 0) {
    throw new Error(
      `Page produced ${issues.length} error(s):\n${issues.join('\n')}`
    )
  }
}

/**
 * Check for React hydration errors specifically
 */
export function assertNoHydrationErrors(capture: ConsoleCapture) {
  const hydrationErrors = capture.errors.filter(e =>
    /hydrat/i.test(e) ||
    /did not match/i.test(e) ||
    /server.*client/i.test(e)
  )
  if (hydrationErrors.length > 0) {
    throw new Error(`Hydration error(s):\n${hydrationErrors.join('\n')}`)
  }
}
