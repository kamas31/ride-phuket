'use client'

import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// useSaved — localStorage-based wishlist
//
// V1: persisted in localStorage, works without auth.
// V2 (future): sync to DB when user is logged in.
//
// Usage:
//   const { isSaved, toggle, savedIds } = useSaved()
//   isSaved('scooter-id')   → boolean
//   toggle('scooter-id')    → adds or removes
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rp_saved_v1'

function readFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeToStorage(ids: Set<string>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch { /* storage full — silently fail */ }
}

export function useSaved() {
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setSaved(readFromStorage())
    setHydrated(true)
  }, [])

  const toggle = useCallback((id: string) => {
    setSaved(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      writeToStorage(next)
      return next
    })
  }, [])

  const isSaved = useCallback((id: string) => saved.has(id), [saved])

  return {
    savedIds: [...saved],
    count: saved.size,
    isSaved,
    toggle,
    hydrated,
  }
}
