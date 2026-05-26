'use client'

import { useState, useEffect, useCallback } from 'react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'

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
  } catch { /* storage full */ }
}

function clearStorage(): void {
  try { window.localStorage.removeItem(STORAGE_KEY) } catch {}
}

export function useSaved() {
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    setSaved(readFromStorage())
    setHydrated(true)
  }, [])

  // Clear saved state on SIGNED_OUT so User B never sees User A's saves.
  // On SIGNED_IN, initFromIds (called by SavedRidesContent) re-hydrates
  // from the server for the newly signed-in user.
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearStorage()
        setSaved(new Set())
        setHydrated(true)
      }
    })

    return () => subscription.unsubscribe()
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

  const initFromIds = useCallback((ids: string[]) => {
    if (!ids.length) return
    setSaved(prev => {
      const merged = new Set([...prev, ...ids])
      writeToStorage(merged)
      return merged
    })
  }, [])

  const pruneOrphanIds = useCallback((validIds: string[]) => {
    const valid = new Set(validIds)
    setSaved(prev => {
      const pruned = new Set([...prev].filter(id => valid.has(id)))
      if (pruned.size !== prev.size) writeToStorage(pruned)
      return pruned
    })
  }, [])

  const isSaved = useCallback((id: string) => saved.has(id), [saved])

  return {
    savedIds: [...saved],
    count: saved.size,
    isSaved,
    toggle,
    initFromIds,
    pruneOrphanIds,
    hydrated,
  }
}
