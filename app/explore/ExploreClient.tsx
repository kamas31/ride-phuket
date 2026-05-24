'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, Map, List } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ExploreFilters } from '@/components/ride/ExploreFilters'
import { ImageMetricsOverlay } from '@/components/debug/ImageMetricsOverlay'
import { cn } from '@/lib/utils'
import type { Scooter, FilterState } from '@/types'

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
  depositProtected: false,
  noPassport: false,
}

type MobileView = 'list' | 'map'

export default function ExploreClient({ initialScooters }: { initialScooters: Scooter[] }) {
  const router = useRouter()

  const [filters, setFilters]         = useState<FilterState>(DEFAULT_FILTERS)
  const [search, setSearch]           = useState('')
  const [selectedId, setSelectedId]   = useState<string | null>(null) // shop ID
  const [hoveredId, setHoveredId]     = useState<string | null>(null) // shop ID
  const [showMap, setShowMap]         = useState(true)
  const [mobileView, setMobileView]   = useState<MobileView>('list')
  const [mapBounds, setMapBounds]     = useState<{ sw: [number, number]; ne: [number, number] } | null>(null)

  const handleZoneClick = useCallback((key: string | null) => {
    setFilters(prev => ({ ...prev, location: key ?? 'all' }))
  }, [])

  const cardRefs   = useRef<Record<string, HTMLDivElement | null>>({})
  const filteredRef = useRef<Scooter[]>([])
  // Debounce timer for hover — prevents cascade re-renders on fast mouse movement
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track which scooter pages have been prefetched to avoid duplicate prefetches
  const prefetched = useRef<Set<string>>(new Set())

  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    cardRefs.current[id] = el
  }, [])

  // Receive shop ID from map, scroll to first scooter card of that shop
  const handleSelectFromMap = useCallback((shopId: string | null) => {
    setSelectedId(shopId)
    if (shopId) {
      const firstScooter = filteredRef.current.find(s => s.shopId === shopId)
      if (firstScooter && cardRefs.current[firstScooter.id]) {
        cardRefs.current[firstScooter.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [])

  // ── Debounced hover — avoids thrashing ScooterMap marker updates ─
  // 40ms debounce: imperceptible to the user, cuts re-renders by ~10× on fast mousing.
  const handleHoverEnter = useCallback((shopId: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHoveredId(shopId), 40)
  }, [])

  const handleHoverLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHoveredId(null), 40)
  }, [])

  // ── Prefetch on first hover (desktop) or touchstart (mobile) ────
  // On mobile: touchstart fires ~100-200ms before the click event,
  // giving Next.js time to start fetching the page before navigation.
  const prefetchScooter = useCallback((id: string) => {
    if (prefetched.current.has(id)) return
    prefetched.current.add(id)
    router.prefetch(`/scooter/${id}`)
  }, [router])

  const filtered = useMemo(() => {
    let list = initialScooters.filter(s => {
      if (filters.category !== 'all' && s.category !== filters.category) return false
      if (s.pricePerDay > filters.priceMax) return false
      if (filters.deliveryNow && !s.deliveryAvailable) return false
      if (filters.helmetIncluded && !s.helmetIncluded) return false
      if (filters.location !== 'all' && !s.location.toLowerCase().includes(filters.location)) return false
      if (filters.depositProtected && !s.shop?.depositProtectedMember) return false
      if (filters.noPassport && s.passportRequired) return false
      // Map bounds filter (when "Search this area" is clicked)
      if (mapBounds) {
        const { lat, lng } = { lat: s.lat, lng: s.lng }
        if (lng < mapBounds.sw[0] || lng > mapBounds.ne[0]) return false
        if (lat < mapBounds.sw[1] || lat > mapBounds.ne[1]) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.location.toLowerCase().includes(q) && !s.brand.toLowerCase().includes(q)) return false
      }
      return true
    })

    if (filters.sortBy === 'price_asc')  list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay)
    if (filters.sortBy === 'price_desc') list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay)
    if (filters.sortBy === 'rating')     list = [...list].sort((a, b) => b.rating - a.rating)
    filteredRef.current = list
    return list
  }, [filters, search, initialScooters, mapBounds])

  // Shared card wrapper — rings compare by shopId so the whole shop highlights together
  const CardWrapper = useCallback(({ scooter, className }: { scooter: Scooter; className?: string }) => (
    <div
      ref={setCardRef(scooter.id)}
      onClick={() => setSelectedId(prev => prev === scooter.shopId ? null : scooter.shopId)}
      onMouseEnter={() => {
        if (scooter.shopId) handleHoverEnter(scooter.shopId)
        prefetchScooter(scooter.id)
      }}
      onMouseLeave={handleHoverLeave}
      onTouchStart={() => prefetchScooter(scooter.id)}
      className={cn(
        'transition-all duration-150',
        selectedId === scooter.shopId ? 'ring-2 ring-[#FF6B35] rounded-[20px]' : '',
        hoveredId === scooter.shopId && selectedId !== scooter.shopId ? 'ring-1 ring-[#FF6B35]/40 rounded-[20px]' : '',
        className
      )}
    >
      <ScooterCard scooter={scooter} compact />
    </div>
  ), [setCardRef, handleHoverEnter, handleHoverLeave, prefetchScooter, selectedId, hoveredId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-white">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Search row — includes mobile List/Map toggle */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98] pointer-events-none" />
              <input
                type="text"
                placeholder="Search scooters, brands, locations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-full text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
              />
            </div>

            {/* Mobile toggle — inside sticky bar, always accessible */}
            <div className="flex lg:hidden items-center gap-0.5 bg-[#f0f0ec] rounded-full p-1 flex-shrink-0">
              <button
                onClick={() => setMobileView('list')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  mobileView === 'list'
                    ? 'bg-white text-[#0f0f0e] shadow-sm'
                    : 'text-[#9c9c98] hover:text-[#5c5c58]'
                )}
              >
                <List className="w-3 h-3" />
                List
              </button>
              <button
                onClick={() => setMobileView('map')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  mobileView === 'map'
                    ? 'bg-[#0f0f0e] text-white shadow-sm'
                    : 'text-[#9c9c98] hover:text-[#5c5c58]'
                )}
              >
                <Map className="w-3 h-3" />
                Map
              </button>
            </div>
          </div>

          <ExploreFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* Count + Desktop map toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#5c5c58]">
            <span className="font-bold text-[#0f0f0e]">{filtered.length}</span> scooters available
          </p>
          <button
            onClick={() => setShowMap(!showMap)}
            className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-[#FF6B35] hover:text-[#e85d29] transition-colors"
          >
            <Map className="w-4 h-4" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden lg:flex gap-5">
          <div className={showMap ? 'w-full lg:w-[42%]' : 'w-full'}>
            {filtered.length === 0 ? <EmptyState /> : (
              <div className={`grid gap-3 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {filtered.map(scooter => (
                  <CardWrapper key={scooter.id} scooter={scooter} />
                ))}
              </div>
            )}
          </div>

          {showMap && (
            <div className="w-full lg:w-[58%]">
              <div className="sticky top-36">
                <ScooterMap
                  scooters={filtered}
                  selectedId={selectedId ?? undefined}
                  hoveredId={hoveredId ?? undefined}
                  onSelect={handleSelectFromMap}
                  onHover={setHoveredId}
                  onBoundsChange={setMapBounds}
                  onZoneClick={handleZoneClick}
                  activeZone={filters.location === 'all' ? null : filters.location}
                  className="h-[calc(100vh-10rem)] min-h-[480px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── MOBILE LAYOUT ── */}
        <div className="lg:hidden">
          {mobileView === 'list' ? (
            filtered.length === 0 ? <EmptyState /> : (
              // xs 2-column: 4+ cards visible without scroll on iPhone
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map(scooter => (
                  <div
                    key={scooter.id}
                    onTouchStart={() => prefetchScooter(scooter.id)}
                    onClick={() => setSelectedId(prev => prev === scooter.shopId ? null : scooter.shopId)}
                  >
                    <ScooterCard scooter={scooter} xs />
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
              onZoneClick={handleZoneClick}
              activeZone={filters.location === 'all' ? null : filters.location}
              className="h-[calc(100svh-13rem)] min-h-[420px]"
            />
          )}
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && <ImageMetricsOverlay />}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🛵</div>
      <h3 className="text-lg font-bold text-[#0f0f0e] mb-2">No scooters found</h3>
      <p className="text-[#5c5c58] text-sm">Try adjusting your filters or search terms.</p>
    </div>
  )
}
