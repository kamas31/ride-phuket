import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    beforeSend(event) {
      // Never forward auth tokens or service-role keys
      if (event.extra) {
        const safe = { ...event.extra }
        for (const key of Object.keys(safe)) {
          if (/key|token|secret|password|role/i.test(key)) delete safe[key]
        }
        event.extra = safe
      }
      return event
    },
  })
}
