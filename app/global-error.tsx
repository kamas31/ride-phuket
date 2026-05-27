'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8f8f6' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛵</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f0f0e', marginBottom: 8 }}>
              Koh Ride
            </h1>
            <p style={{ color: '#9c9c98', fontSize: 14, marginBottom: 24 }}>
              A critical error occurred. Please reload the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 32px', background: '#FF6B35', color: '#fff',
                border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
