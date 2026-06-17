'use client'

import { useState, useCallback } from 'react'

export type GeoLocation = { lat: number; lng: number }
export type GeoError = 'denied' | 'unavailable' | 'timeout' | 'unknown'

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<GeoError | null>(null)

  const request = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { Capacitor } = await import('@capacitor/core')

      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation')
        const perm = await Geolocation.requestPermissions()
        if (perm.location !== 'granted') {
          setError('denied')
          return
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      } else {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          setError('unavailable')
          return
        }
        // Wrap callback API in a Promise so the finally block fires correctly.
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
              resolve()
            },
            (err) => {
              if (err.code === 1)      setError('denied')
              else if (err.code === 2) setError('unavailable')
              else if (err.code === 3) setError('timeout')
              else                     setError('unknown')
              resolve()
            },
            { enableHighAccuracy: true, timeout: 10000 },
          )
        })
      }
    } catch {
      setError('unknown')
    } finally {
      setLoading(false)
    }
  }, [])

  return { location, loading, error, request }
}
