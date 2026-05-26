'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Error({
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
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-[#fff4f0] rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-[#FF6B35]" strokeWidth={1.5} />
        </div>
        <h1 className="text-[20px] font-bold text-[#0f0f0e] mb-2">Something went wrong</h1>
        <p className="text-[#9c9c98] text-sm mb-6 leading-relaxed">
          This page ran into an unexpected error. Try refreshing, or go back to exploring scooters.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/explore"
            className="px-6 py-3 bg-white border border-[#e8e8e4] text-[#5c5c58] text-sm font-semibold rounded-full hover:bg-[#f8f8f6] transition-colors"
          >
            Back to explore
          </Link>
        </div>
      </div>
    </div>
  )
}
