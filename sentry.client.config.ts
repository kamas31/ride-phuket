import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Sample 10% of sessions for performance — avoids cost/noise at low traffic
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    // Replay only on actual errors — no ambient recording
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
    replaysSessionSampleRate: 0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Strip PII from events before they leave the browser
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies
      if (event.user?.email) event.user.email = '[redacted]'
      if (event.user?.username) event.user.username = '[redacted]'
      return event
    },

    // Silence known noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /^Network request failed$/,
      /^Load failed$/,          // Safari image/fetch aborts on navigation
      /^AbortError/,
    ],
  })
}
