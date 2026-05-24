'use client'

import { useState } from 'react'
import { SlidersHorizontal, X, Truck, HardHat, Shield, IdCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCOOTER_CATEGORIES, LOCATIONS, SORT_OPTIONS } from '@/constants'
import type { FilterState } from '@/types'

interface ExploreFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function ExploreFilters({ filters, onChange }: ExploreFiltersProps) {
  const [showPanel, setShowPanel] = useState(false)

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  const activeFilterCount = [
    filters.category !== 'all',
    filters.deliveryNow,
    filters.helmetIncluded,
    filters.location !== 'all',
    filters.priceMax < 2000,
    filters.depositProtected,
    filters.noPassport,
  ].filter(Boolean).length

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {/* All filters toggle */}
        <button
          onClick={() => setShowPanel(true)}
          className={cn(
            'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors',
            activeFilterCount > 0
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white text-[#0f0f0e] border-[#e8e8e4] hover:border-[#d0d0cc]'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Quick category filters */}
        {SCOOTER_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => update({ category: cat.value as FilterState['category'] })}
            className={cn(
              'flex-shrink-0 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
              filters.category === cat.value
                ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
                : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
            )}
          >
            {cat.label}
          </button>
        ))}

        {/* Quick: Delivery */}
        <button
          onClick={() => update({ deliveryNow: !filters.deliveryNow })}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
            filters.deliveryNow
              ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
              : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
          )}
        >
          <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
          Delivery
        </button>

        {/* Quick: Helmet */}
        <button
          onClick={() => update({ helmetIncluded: !filters.helmetIncluded })}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
            filters.helmetIncluded
              ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
              : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
          )}
        >
          <HardHat className="w-3.5 h-3.5" strokeWidth={1.5} />
          Helmet
        </button>

        {/* Quick: Deposit Protected */}
        <button
          onClick={() => update({ depositProtected: !filters.depositProtected })}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
            filters.depositProtected
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
          )}
        >
          <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
          Protected
        </button>

        {/* Quick: No Passport */}
        <button
          onClick={() => update({ noPassport: !filters.noPassport })}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
            filters.noPassport
              ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
              : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
          )}
        >
          <IdCard className="w-3.5 h-3.5" strokeWidth={1.5} />
          No Passport
        </button>

        {/* Sort */}
        <div className="flex-shrink-0 ml-auto">
          <select
            value={filters.sortBy}
            onChange={e => update({ sortBy: e.target.value as FilterState['sortBy'] })}
            className="px-4 py-2.5 rounded-full border border-[#e8e8e4] bg-white text-sm font-medium text-[#5c5c58] cursor-pointer hover:border-[#d0d0cc] transition-colors appearance-none pr-8"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter drawer */}
      {showPanel && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-bold text-[#0f0f0e]">Filters</h3>
              <button
                onClick={() => setShowPanel(false)}
                className="w-8 h-8 rounded-full bg-[#f0f0ec] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price range */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-[#0f0f0e] mb-3 block">
                Max price: <span className="text-[#FF6B35]">฿{filters.priceMax}/day</span>
              </label>
              <input
                type="range"
                min={150}
                max={2000}
                step={50}
                value={filters.priceMax}
                onChange={e => update({ priceMax: Number(e.target.value) })}
                className="w-full accent-[#FF6B35]"
              />
              <div className="flex justify-between text-xs text-[#9c9c98] mt-1">
                <span>฿150</span>
                <span>฿2,000</span>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-[#0f0f0e] mb-3 block">Location</label>
              <div className="grid grid-cols-3 gap-2">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => update({ location: loc.id })}
                    className={cn(
                      'px-3 py-2 rounded-[10px] text-sm font-medium border transition-colors text-center',
                      filters.location === loc.id
                        ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
                        : 'bg-[#f8f8f6] text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
                    )}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 mb-8">
              {([
                { key: 'deliveryNow',       label: 'Delivery available',         icon: Truck    },
                { key: 'helmetIncluded',    label: 'Helmet included',            icon: HardHat  },
                { key: 'depositProtected',  label: 'Deposit Protected (safest)', icon: Shield   },
                { key: 'noPassport',        label: 'No passport required',       icon: IdCard   },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => update({ [key]: !filters[key as keyof FilterState] } as Partial<FilterState>)}
                  className="w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc] transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-[#0f0f0e]">
                    <Icon className="w-4 h-4 text-[#9c9c98]" strokeWidth={1.5} />
                    {label}
                  </span>
                  <div className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                    filters[key as keyof FilterState] ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]'
                  )}>
                    <div className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      filters[key as keyof FilterState] ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onChange({ priceMin: 150, priceMax: 2000, category: 'all', deliveryNow: false, helmetIncluded: false, location: 'all', sortBy: 'rating', depositProtected: false, noPassport: false })
                }}
                className="flex-1 py-3 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-[#f8f8f6] transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowPanel(false)}
                className="flex-[2] py-3 rounded-full bg-[#FF6B35] text-white text-sm font-semibold hover:bg-[#e85d29] transition-colors"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
