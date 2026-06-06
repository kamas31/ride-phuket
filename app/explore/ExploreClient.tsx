'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, Map, List, Bike } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ExploreFilters } from '@/components/ride/ExploreFilters'
import { ImageMetricsOverlay } from '@/components/debug/ImageMetricsOverlay'
import { cn } from '@/lib/utils'
import { sortByRecommended } from '@/lib/ridescore'
import { trackEvent } from '@/lib/analytics'
import { createExploreFuse } from '@/lib/fuzzy-search'
import { getZoneForLocation } from '@/lib/zones'
import { useProfile } from '@/hooks/useProfile'
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
  sortBy: 'recommended',
  depositProtected: false,
  noPassport: false,
  requiredFeatures: [],
  requiredAccessories: [],
  depositTypeFilter: '',
}

type MobileView = 'list' | 'map'

export default function ExploreClient({
  initialScooters,
  initialSearch = '',
}: {
  initialScooters: Scooter[]
  initialSearch?: string
}) {
  const router = useRouter()
  const { isAdmin, loading: profileLoading } = useProfile()

  // Calibration tool: only available when ?debugPins=1 AND the current user is an admin.
  // Both conditions must be true — URL param alone is not enough.
  const hasDebugParam = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debugPins') === '1'
  const debugMode = !profileLoading && hasDebugParam && isAdmin

  const mapDebugMode = typeof window !== 'undefined' &&
    window.innerWidth >= 1024 &&
    new URLSearchParams(window.location.search).get('mapDebug') === '1'

  const stickyBarRef  = useRef<HTMLDivElement>(null)
  const mapColumnRef  = useRef<HTMLDivElement>(null)

  const [filters, setFilters]         = useState<FilterState>(DEFAULT_FILTERS)
  const [search, setSearch]           = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedId, setSelectedId]   = useState<string | null>(null) // shop ID
  const [hoveredId, setHoveredId]     = useState<string | null>(null) // shop ID
  const [showMap, setShowMap]         = useState(true)

  // Persist map visibility across sessions — read after hydration to avoid SSR mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem('rp_show_map') === 'false') setShowMap(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fuse instance — rebuilt only when the scooter list changes
  const fuse = useMemo(() => createExploreFuse(initialScooters), [initialScooters])

  // Debounce search → debouncedSearch so Fuse runs at most once per 200ms
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(
      () => setDebouncedSearch(search.trim()),
      200,
    )
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  }, [search])

  // Fuse result IDs — null means no search active (pass all through)
  const fuseMatchIds = useMemo((): Set<string> | null => {
    if (!debouncedSearch) return null
    return new Set(fuse.search(debouncedSearch).map(r => r.item.id))
  }, [fuse, debouncedSearch])

  const toggleMap = useCallback(() => {
    setShowMap(prev => {
      const next = !prev
      try { localStorage.setItem('rp_show_map', String(next)) } catch {}
      return next
    })
  }, [])
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
      if (filters.location !== 'all') {
        const zone = getZoneForLocation(s.location)
        if (!zone || zone.key !== filters.location.replace(/-/g, ' ')) return false
      }
      if (filters.depositProtected && !s.shop?.depositProtectedMember) return false
      if (filters.noPassport && s.passportRequired) return false
      if (filters.requiredFeatures.length > 0 && !filters.requiredFeatures.every(f => s.features.includes(f))) return false
      if (filters.requiredAccessories.length > 0 && !filters.requiredAccessories.every(a => s.features.includes(a))) return false
      if (filters.depositTypeFilter) {
        const dt = s.depositType
        if (filters.depositTypeFilter === 'cash'     && dt !== 'cash'     && dt !== 'both') return false
        if (filters.depositTypeFilter === 'passport' && dt !== 'passport' && dt !== 'both') return false
        if (filters.depositTypeFilter === 'both'     && dt !== 'both') return false
      }
      // Map bounds filter (when "Search this area" is clicked)
      if (mapBounds) {
        const { lat, lng } = { lat: s.lat, lng: s.lng }
        if (lng < mapBounds.sw[0] || lng > mapBounds.ne[0]) return false
        if (lat < mapBounds.sw[1] || lat > mapBounds.ne[1]) return false
      }
      if (fuseMatchIds && !fuseMatchIds.has(s.id)) return false
      return true
    })

    if (filters.sortBy === 'recommended') list = sortByRecommended(list)
    if (filters.sortBy === 'price_asc')  list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay)
    if (filters.sortBy === 'price_desc') list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay)
    if (filters.sortBy === 'rating')     list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [filters, fuseMatchIds, initialScooters, mapBounds])

  // Keep ref in sync after render so handleSelectFromMap always sees the latest filtered list
  useEffect(() => { filteredRef.current = filtered }, [filtered])

  // Track empty search results — fires when a real search/filter yields nothing
  useEffect(() => {
    if (filtered.length === 0 && (debouncedSearch || filters.category !== 'all' || filters.location !== 'all')) {
      trackEvent({ eventType: 'empty_search', metadata: { search: debouncedSearch, category: filters.category, location: filters.location } })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length === 0, debouncedSearch, filters.category, filters.location])


  return (
    <div className="min-h-screen bg-white pt-16">
      {/* ── Sticky top bar ── */}
      <div ref={stickyBarRef} className="sticky top-16 z-30 bg-white border-b border-[#e8e8e4]" style={mapDebugMode ? { outline: '2px solid blue' } : undefined}>
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

            {/* Desktop map toggle — pill, stays in sticky bar */}
            <button
              onClick={toggleMap}
              className={cn(
                'hidden lg:flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium flex-shrink-0 transition-colors',
                showMap
                  ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
                  : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
              )}
            >
              <Map className="w-3.5 h-3.5" />
              {showMap ? 'Hide map' : 'Show map'}
            </button>

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

      <div className="max-w-6xl mx-auto px-4 pt-4 pb-5">
        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden lg:flex gap-5">
          <div
            className="min-w-0 transition-all duration-300 ease-in-out"
            style={{ width: showMap ? '42%' : '100%' }}
          >
            {filtered.length === 0 ? <EmptyState /> : (
              <div className={`grid gap-3 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
                {filtered.map(scooter => (
                  <div
                    key={scooter.id}
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
                    )}
                  >
                    <ScooterCard scooter={scooter} compact />
                  </div>
                ))}
              </div>
            )}
          </div>

          {showMap && (
            <div ref={mapColumnRef} className="flex-1 min-w-0" style={mapDebugMode ? { outline: '2px solid red' } : undefined}>
              <div className="relative">
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
                  debugMode={debugMode}
                  mapDebugMode={mapDebugMode}
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
              }}
              onHover={setHoveredId}
              onZoneClick={handleZoneClick}
              activeZone={filters.location === 'all' ? null : filters.location}
              className="h-[calc(100svh-13rem)] min-h-[420px]"
              debugMode={debugMode}
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
      <div className="w-14 h-14 bg-[#f8f8f6] rounded-[18px] flex items-center justify-center mx-auto mb-4">
        <Bike className="w-7 h-7 text-[#9c9c98]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-[#0f0f0e] mb-2">No scooters found</h3>
      <p className="text-[#5c5c58] text-sm">Try adjusting your filters or search terms.</p>
    </div>
  )
}
