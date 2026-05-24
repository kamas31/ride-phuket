'use client'

import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// useSaved — optimistic localStorage wishlist with DB sync support
//
// V1: localStorage-backed, instant, works without auth.
// V2 (active): when authenticated, server actions sync to DB in background.
//   Call initFromIds(serverIds) on mount to merge DB state into local state.
//   SaveButton handles the DB write via saveRide / unsaveRide server actions.
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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      writeToStorage(next)
      return next
    })
  }, [])

  // Merge server-fetched IDs into local state on mount.
  // Used by the saved page to hydrate from DB saves (cross-device sync).
  // Safe to call multiple times — idempotent merge, never overwrites removes.
  const initFromIds = useCallback((ids: string[]) => {
    if (!ids.length) return
    setSaved(prev => {
      const merged = new Set([...prev, ...ids])
      writeToStorage(merged)
      return merged
    })
  }, [])

  const isSaved = useCallback((id: string) => saved.has(id), [saved])

  return {
    savedIds: [...saved],
    count: saved.size,
    isSaved,
    toggle,
    initFromIds,
    hydrated,
  }
}
