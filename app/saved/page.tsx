'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { getScootersByIdsAction } from '@/app/actions/scooter-actions'
import { useSaved } from '@/hooks/useSaved'
import type { Scooter } from '@/types'

export default function SavedPage() {
  const { savedIds, count, hydrated } = useSaved()
  const [scooters, setScooters] = useState<Scooter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    if (savedIds.length === 0) { setLoading(false); return }

    setLoading(true)
    getScootersByIdsAction(savedIds).then(data => {
      setScooters(data)
      setLoading(false)
    })
  }, [hydrated, savedIds.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-6">
          <Link href="/explore" className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Explore
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[26px] font-bold text-[#0f0f0e] tracking-tight flex items-center gap-2.5">
                <Heart className="w-6 h-6 text-[#ef4444] fill-[#ef4444]" />
                Saved
              </h1>
              <p className="text-[#9c9c98] text-sm mt-0.5">
                {hydrated ? `${count} scooter${count !== 1 ? 's' : ''}` : '…'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {!hydrated || loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] overflow-hidden border border-[#e8e8e4]">
                <div className="h-44 bg-[#f0f0ec] animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#f0f0ec] rounded animate-pulse" />
                  <div className="h-3 bg-[#f0f0ec] rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : count === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-5">
              <Heart className="w-9 h-9 text-[#fca5a5]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-2">No saved scooters yet</h2>
            <p className="text-[#5c5c58] text-sm mb-7 max-w-xs mx-auto">
              Tap the heart on any scooter to save it for later.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
            >
              Explore Scooters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scooters.map(scooter => (
              <ScooterCard key={scooter.id} scooter={scooter} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
