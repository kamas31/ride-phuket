'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Bike, ArrowLeft } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { toggleScooterAvailability } from '@/app/actions/scooter-availability'

type Scooter = {
  id: string
  name: string
  available: boolean
  images: string[]
  price_per_day: number
  category: string
  location: string
}

export default function AvailabilityClient({
  scooters: initial,
  shopName,
}: {
  scooters: Scooter[]
  shopName: string
}) {
  const [scooters, setScooters] = useState(initial)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const liveCount = scooters.filter(s => s.available).length

  async function handleToggle(scooterId: string, current: boolean) {
    setScooters(prev =>
      prev.map(s => (s.id === scooterId ? { ...s, available: !current } : s))
    )
    setTogglingId(scooterId)

    const result = await toggleScooterAvailability(scooterId, !current)

    if (result.error) {
      setScooters(prev =>
        prev.map(s => (s.id === scooterId ? { ...s, available: current } : s))
      )
      toast.error('Update failed — please try again')
    } else {
      toast.success(!current ? 'Now live in search' : 'Hidden from search')
    }

    setTogglingId(null)
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-5">
          <Link
            href="/partner/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#FF6B35] text-white hover:bg-[#e85d29] transition-all active:scale-95 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-bold text-[#0f0f0e] tracking-tight leading-tight">
                Availability
              </h1>
              <p className="text-sm text-[#9c9c98] mt-1">
                {shopName} · {liveCount} of {scooters.length} live
              </p>
            </div>
            {/* Quick stats pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] rounded-full flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-xs font-semibold text-[#16a34a]">{liveCount} live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Empty state */}
        {scooters.length === 0 && (
          <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-10 text-center">
            <div className="w-14 h-14 bg-[#f8f8f6] rounded-[18px] flex items-center justify-center mx-auto mb-4">
              <Bike className="w-7 h-7 text-[#9c9c98]" strokeWidth={1.5} />
            </div>
            <p className="font-bold text-[#0f0f0e] mb-1">No scooters yet</p>
            <p className="text-sm text-[#9c9c98] mb-5">Add your first scooter to manage availability here.</p>
            <Link
              href="/partner/scooters/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors"
            >
              Add Scooter
            </Link>
          </div>
        )}

        {/* Scooter list */}
        {scooters.length > 0 && (
          <div className="space-y-3">
            {scooters.map(scooter => {
              const isToggling = togglingId === scooter.id

              return (
                <div
                  key={scooter.id}
                  className={cn(
                    'bg-white rounded-[16px] border transition-all duration-200',
                    scooter.available
                      ? 'border-[#e8e8e4]'
                      : 'border-[#e8e8e4] opacity-70'
                  )}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <ScooterImage
                      src={scooter.images?.[0]}
                      alt={scooter.name}
                      className="w-[72px] h-[60px] rounded-[10px] flex-shrink-0"
                      sizes="72px"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0f0f0e] text-[15px] leading-tight truncate">
                        {scooter.name}
                      </p>
                      <p className="text-[12px] text-[#9c9c98] mt-0.5 capitalize">
                        {scooter.category} · {formatPrice(scooter.price_per_day)}/day
                      </p>
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-semibold mt-1.5',
                        scooter.available ? 'text-[#22c55e]' : 'text-[#9c9c98]'
                      )}>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          scooter.available ? 'bg-[#22c55e]' : 'bg-[#d0d0cc]'
                        )} />
                        {scooter.available ? 'Live in search' : 'Hidden'}
                      </span>
                    </div>

                    {/* Large toggle */}
                    <button
                      onClick={() => handleToggle(scooter.id, scooter.available)}
                      disabled={isToggling}
                      aria-label={scooter.available ? 'Disable scooter' : 'Enable scooter'}
                      className={cn(
                        'relative w-[56px] h-[30px] rounded-full transition-all duration-200 flex-shrink-0',
                        scooter.available ? 'bg-[#22c55e]' : 'bg-[#d0d0cc]',
                        isToggling && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className={cn(
                        'absolute top-[3px] w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200',
                        scooter.available ? 'translate-x-[27px]' : 'translate-x-[3px]'
                      )} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer hint */}
        {scooters.length > 0 && (
          <p className="text-center text-[12px] text-[#9c9c98] mt-6">
            Changes are instant — no need to save
          </p>
        )}
      </div>
    </div>
  )
}

