'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Search, Map, List } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ExploreFilters } from '@/components/ride/ExploreFilters'
import { ImageMetricsOverlay } from '@/components/debug/ImageMetricsOverlay'
import { cn } from '@/lib/utils'
import type { Scooter, FilterState } from '@/types'

// Dynamic import — keeps mapbox-gl out of the SSR bundle entirely
const ScooterMap = dynamic(() => import('@/components/map/ScooterMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-[20px] bg-[#0a0c10] border border-white/5 flex items-center justify-center" style={{ height: '100%' }}>
      <div className="w-7 h-7 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

const DEFAULT_FILTERS: FilterState = {
  priceMin: 150,
  priceMax: 2000,
  category: 'all',
  deliveryNow: false,
  helmetIncluded: false,
  location: 'all',
  sortBy: 'rating',
}

type MobileView = 'list' | 'map'

export default function ExploreClient({ initialScooters }: { initialScooters: Scooter[] }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [search, setSearch]           = useState('')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [hoveredId, setHoveredId]     = useState<string | null>(null)
  const [showMap, setShowMap]         = useState(true)
  const [mobileView, setMobileView]   = useState<MobileView>('list')

  // Scroll the matching card into view when map pin is clicked
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    cardRefs.current[id] = el
  }, [])

  const handleSelectFromMap = useCallback((id: string | null) => {
    setSelectedId(id)
    if (id && cardRefs.current[id]) {
      cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [])

  const filtered = useMemo(() => {
    let list = initialScooters.filter(s => {
      if (filters.category !== 'all' && s.category !== filters.category) return false
      if (s.pricePerDay > filters.priceMax) return false
      if (filters.deliveryNow && !s.deliveryAvailable) return false
      if (filters.helmetIncluded && !s.helmetIncluded) return false
      if (filters.location !== 'all' && !s.location.toLowerCase().includes(filters.location)) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.location.toLowerCase().includes(q) && !s.brand.toLowerCase().includes(q)) return false
      }
      return true
    })

    if (filters.sortBy === 'price_asc')  list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay)
    if (filters.sortBy === 'price_desc') list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay)
    if (filters.sortBy === 'rating')     list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [filters, search, initialScooters])

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Sticky top bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#e8e8e4] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
            <input
              type="text"
              placeholder="Search scooters, brands, locations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-full text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
            />
          </div>
          <ExploreFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Count + Desktop toggle */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[#5c5c58]">
            <span className="font-bold text-[#0f0f0e]">{filtered.length}</span> scooters available
          </p>
          {/* Desktop: toggle map sidebar */}
          <button
            onClick={() => setShowMap(!showMap)}
            className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-[#FF6B35] hover:text-[#e85d29] transition-colors"
          >
            <Map className="w-4 h-4" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          {/* Mobile: List / Map toggle pills */}
          <div className="flex lg:hidden items-center gap-1 bg-[#f0f0ec] rounded-full p-1">
            <button
              onClick={() => setMobileView('list')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                mobileView === 'list'
                  ? 'bg-white text-[#0f0f0e] shadow-sm'
                  : 'text-[#9c9c98] hover:text-[#5c5c58]'
              )}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                mobileView === 'map'
                  ? 'bg-[#0f0f0e] text-white shadow-sm'
                  : 'text-[#9c9c98] hover:text-[#5c5c58]'
              )}
            >
              <Map className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden lg:flex gap-6">
          {/* List */}
          <div className={showMap ? 'w-full lg:w-[48%]' : 'w-full'}>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🛵</div>
                <h3 className="text-lg font-bold text-[#0f0f0e] mb-2">No scooters found</h3>
                <p className="text-[#5c5c58] text-sm">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {filtered.map(scooter => (
                  <div
                    key={scooter.id}
                    ref={setCardRef(scooter.id)}
                    onClick={() => setSelectedId(prev => prev === scooter.id ? null : scooter.id)}
                    onMouseEnter={() => setHoveredId(scooter.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      'transition-all duration-150',
                      selectedId === scooter.id ? 'ring-2 ring-[#FF6B35] rounded-[20px]' : '',
                      hoveredId === scooter.id && selectedId !== scooter.id ? 'ring-1 ring-[#FF6B35]/40 rounded-[20px]' : ''
                    )}
                  >
                    <ScooterCard scooter={scooter} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map — sticky */}
          {showMap && (
            <div className="w-full lg:w-[52%]">
              <div className="sticky top-36">
                <ScooterMap
                  scooters={filtered}
                  selectedId={selectedId ?? undefined}
                  hoveredId={hoveredId ?? undefined}
                  onSelect={handleSelectFromMap}
                  onHover={setHoveredId}
                  className="h-[calc(100vh-10rem)] min-h-[480px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── MOBILE LAYOUT ── */}
        <div className="lg:hidden">
          {mobileView === 'list' ? (
            filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🛵</div>
                <h3 className="text-lg font-bold text-[#0f0f0e] mb-2">No scooters found</h3>
                <p className="text-[#5c5c58] text-sm">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(scooter => (
                  <div
                    key={scooter.id}
                    onClick={() => setSelectedId(prev => prev === scooter.id ? null : scooter.id)}
                    className={selectedId === scooter.id ? 'ring-2 ring-[#FF6B35] rounded-[20px]' : ''}
                  >
                    <ScooterCard scooter={scooter} />
                  </div>
                ))}
              </div>
            )
          ) : (
            <ScooterMap
              scooters={filtered}
              selectedId={selectedId ?? undefined}
              hoveredId={hoveredId ?? undefined}
              onSelect={(id) => {
                setSelectedId(id)
                if (id) setMobileView('list')
              }}
              onHover={setHoveredId}
              className="h-[calc(100svh-14rem)] min-h-[400px]"
            />
          )}
        </div>
      </div>
      {process.env.NODE_ENV === 'development' && <ImageMetricsOverlay />}
    </div>
  )
}
