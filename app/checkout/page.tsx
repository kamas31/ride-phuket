'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CheckoutRedirect() {
  const router = useRouter()
  const params = useSearchParams()
  useEffect(() => {
    const scooterId = params.get('scooterId')
    router.replace(scooterId ? `/contact?scooterId=${scooterId}` : '/explore')
  }, [router, params])
  return null
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutRedirect />
    </Suspense>
  )
}
