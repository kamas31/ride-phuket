'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ExploreFilters } from '@/components/ride/ExploreFilters'
import { MapPlaceholder } from '@/components/map/MapPlaceholder'
import type { Scooter, FilterState } from '@/types'

const DEFAULT_FILTERS: FilterState = {
  priceMin: 150,
  priceMax: 2000,
  category: 'all',
  deliveryNow: false,
  helmetIncluded: false,
  location: 'all',
  sortBy: 'rating',
}

export default function ExploreClient({ initialScooters }: { initialScooters: Scooter[] }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showMap, setShowMap] = useState(true)

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
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[#5c5c58]">
            <span className="font-bold text-[#0f0f0e]">{filtered.length}</span> scooters available
          </p>
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-sm font-semibold text-[#FF6B35] hover:text-[#e85d29] transition-colors"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        <div className="flex gap-6">
          <div className={showMap ? 'w-full lg:w-1/2' : 'w-full'}>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🛵</div>
                <h3 className="text-lg font-bold text-[#0f0f0e] mb-2">No scooters found</h3>
                <p className="text-[#5c5c58] text-sm">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${showMap ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {filtered.map(scooter => (
                  <div
                    key={scooter.id}
                    onClick={() => setSelectedId(scooter.id)}
                    className={selectedId === scooter.id ? 'ring-2 ring-[#FF6B35] rounded-[20px]' : ''}
                  >
                    <ScooterCard scooter={scooter} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {showMap && (
            <div className="hidden lg:block w-1/2">
              <div className="sticky top-48">
                <MapPlaceholder
                  scooters={filtered}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  className="h-[calc(100vh-14rem)]"
                />
              </div>
            </div>
          )}
        </div>

        {showMap && (
          <div className="lg:hidden mt-6">
            <MapPlaceholder
              scooters={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              className="h-72"
            />
          </div>
        )}
      </div>
    </div>
  )
}
