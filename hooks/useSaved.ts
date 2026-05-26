'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

  // Track the active user ID so we can detect identity changes.
  // Using a ref avoids re-subscribing every time the ID changes.
  const activeUserIdRef = useRef<string | null>(null)

  // Clear saved state when the user identity changes:
  // - Explicit sign-out (SIGNED_OUT)
  // - Direct account switch: sign-in as a different user without prior sign-out
  //   (SIGNED_IN with a different user ID)
  // On SIGNED_IN after a clear, initFromIds (called by SavedRidesContent)
  // re-hydrates from the server for the correct user.
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const incomingId = session?.user?.id ?? null

      if (event === 'INITIAL_SESSION') {
        // Capture initial identity — never clear on first load
        activeUserIdRef.current = incomingId
        return
      }

      if (event === 'SIGNED_OUT') {
        activeUserIdRef.current = null
        clearStorage()
        setSaved(new Set())
        setHydrated(true)
        return
      }

      if (event === 'SIGNED_IN' && incomingId !== activeUserIdRef.current) {
        // Different user signed in without an explicit sign-out first
        activeUserIdRef.current = incomingId
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
