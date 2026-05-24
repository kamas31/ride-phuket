'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft, Bookmark } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { useSaved } from '@/hooks/useSaved'
import type { Scooter } from '@/types'

interface SavedRidesContentProps {
  initialScooters: Scooter[]
  savedIds:        string[]   // server-verified IDs — used to hydrate localStorage
}

export function SavedRidesContent({ initialScooters, savedIds }: SavedRidesContentProps) {
  const { isSaved, initFromIds, count, hydrated } = useSaved()

  // Hydrate localStorage from DB on mount (cross-device sync)
  useEffect(() => {
    initFromIds(savedIds)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Filter out scooters the user just removed (optimistic removes)
  const visible = hydrated
    ? initialScooters.filter(s => isSaved(s.id))
    : initialScooters  // show all before hydration (no flicker)

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-6">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore
          </Link>
          <div>
            <h1 className="text-[26px] font-bold text-[#0f0f0e] tracking-tight">
              Saved rides
            </h1>
            <p className="text-[#9c9c98] text-sm mt-1 leading-relaxed">
              Compare scooters, revisit listings, and contact shops when you&rsquo;re ready.
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="text-xs text-[#9c9c98] mb-4">
              {visible.length} {visible.length === 1 ? 'scooter' : 'scooters'} saved
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visible.map(scooter => (
                <ScooterCard key={scooter.id} scooter={scooter} compact />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-[#f8f8f6] border border-[#e8e8e4] rounded-full flex items-center justify-center mx-auto mb-5">
        <Bookmark className="w-8 h-8 text-[#c8c8c4]" strokeWidth={1.5} />
      </div>
      <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-2">No saved rides yet</h2>
      <p className="text-[#9c9c98] text-sm mb-7 max-w-[280px] mx-auto leading-relaxed">
        Save scooters while exploring Phuket — your saved rides will appear here.
      </p>
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f0f0e] text-white text-sm font-semibold rounded-full hover:bg-[#2a2a28] transition-colors"
      >
        Explore scooters
      </Link>
    </div>
  )
}
