'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { SlidersHorizontal, X, Truck, HardHat, Shield, IdCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LOCATIONS, SORT_OPTIONS } from '@/constants'
import type { FilterState } from '@/types'

interface ExploreFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  showRecommended?: boolean
  maxPrice?: number
}

export function ExploreFilters({ filters, onChange, showRecommended = true, maxPrice = 2000 }: ExploreFiltersProps) {
  const [showPanel, setShowPanel] = useState(false)

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  const activeFilterCount = [
    filters.category !== 'all',
    filters.deliveryNow,
    filters.helmetIncluded,
    filters.location !== 'all',
    filters.priceMax < maxPrice,
    filters.depositProtected,
    filters.noPassport,
    filters.requiredFeatures.length > 0,
    filters.requiredAccessories.length > 0,
    filters.depositTypeFilter !== '',
  ].filter(Boolean).length

  return (
    <>
      {/* ── Quick filter bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {/* All filters toggle */}
        <button
          onClick={() => setShowPanel(true)}
          className={cn(
            'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors active:scale-[0.96]',
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

        {/* Delivery */}
        <button
          onClick={() => update({ deliveryNow: !filters.deliveryNow })}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap active:scale-[0.96]',
            filters.deliveryNow
              ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
              : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
          )}
        >
          <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
          Delivery
        </button>

        {/* No Passport */}
        <button
          onClick={() => update({ noPassport: !filters.noPassport })}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap active:scale-[0.96]',
            filters.noPassport
              ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
              : 'bg-white text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
          )}
        >
          <IdCard className="w-3.5 h-3.5" strokeWidth={1.5} />
          No Passport
        </button>

        {/* Sort — hidden by admin toggle when showRecommended=false */}
        {showRecommended && (
          <div className="flex-shrink-0 ml-auto">
            <select
              value={filters.sortBy}
              onChange={e => update({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="px-4 py-2 rounded-full border border-[#e8e8e4] bg-white text-sm font-medium text-[#5c5c58] cursor-pointer hover:border-[#d0d0cc] transition-colors appearance-none pr-8"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Filter modal — portalled to document.body to escape sticky z-30 stacking context ── */}
      {showPanel && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPanel(false)} />

          {/* Panel — bottom sheet on mobile, centered dialog on desktop */}
          <div className="relative w-full md:max-w-[520px] bg-white rounded-t-[24px] md:rounded-[20px] shadow-xl max-h-[88vh] md:max-h-[78vh] overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white px-6 pt-5 pb-4 flex items-center justify-between border-b border-[#f0f0ec]">
              <h3 className="text-[16px] font-bold text-[#0f0f0e]">Filters</h3>
              <button
                onClick={() => setShowPanel(false)}
                className="w-8 h-8 rounded-full bg-[#f0f0ec] flex items-center justify-center hover:bg-[#e8e8e4] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Price range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#0f0f0e]">Max daily price</p>
                  <span className="text-sm font-bold text-[#FF6B35]">฿{filters.priceMax}</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={maxPrice}
                  step={50}
                  value={filters.priceMax}
                  onChange={e => update({ priceMax: Number(e.target.value) })}
                  className="w-full accent-[#FF6B35]"
                />
                <div className="flex justify-between text-xs text-[#9c9c98] mt-1.5">
                  <span>฿150</span>
                  <span>฿{maxPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-sm font-semibold text-[#0f0f0e] mb-3">Location</p>
                <div className="grid grid-cols-3 gap-2">
                  {LOCATIONS.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => update({ location: loc.id })}
                      className={cn(
                        'px-3 py-2 rounded-[10px] text-sm font-medium border transition-colors text-center truncate',
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
              <div>
                <p className="text-sm font-semibold text-[#0f0f0e] mb-3">Services</p>
                <div className="space-y-2">
                  {([
                    { key: 'deliveryNow',      label: 'Delivery available',         icon: Truck   },
                    { key: 'helmetIncluded',   label: 'Helmet included',            icon: HardHat },
                    { key: 'depositProtected', label: 'Deposit Protected',          icon: Shield  },
                    { key: 'noPassport',       label: 'No passport required',       icon: IdCard  },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => update({ [key]: !filters[key as keyof FilterState] } as Partial<FilterState>)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-[12px] border border-[#e8e8e4] hover:border-[#d0d0cc] transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-sm font-medium text-[#0f0f0e]">
                        <Icon className="w-4 h-4 text-[#9c9c98]" strokeWidth={1.5} />
                        {label}
                      </span>
                      <div className={cn(
                        'w-10 h-[22px] rounded-full transition-colors relative flex-shrink-0',
                        filters[key as keyof FilterState] ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]'
                      )}>
                        <div className={cn(
                          'absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform',
                          filters[key as keyof FilterState] ? 'translate-x-[22px]' : 'translate-x-0.5'
                        )} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scooter features */}
              <div>
                <p className="text-sm font-semibold text-[#0f0f0e] mb-3">Scooter Features</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Smart key / keyless', 'LED lights', 'Traction control', 'ABS brakes', 'USB charging'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        const next = filters.requiredFeatures.includes(f)
                          ? filters.requiredFeatures.filter(x => x !== f)
                          : [...filters.requiredFeatures, f]
                        update({ requiredFeatures: next })
                      }}
                      className={cn(
                        'px-3 py-2 rounded-[10px] text-sm font-medium border transition-colors text-left',
                        filters.requiredFeatures.includes(f)
                          ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
                          : 'bg-[#f8f8f6] text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessories */}
              <div>
                <p className="text-sm font-semibold text-[#0f0f0e] mb-3">Accessories</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Back rest', 'Top case', 'Crash bar', 'Windshield / Wind visor', 'Electric windshield', 'Phone charger', 'Phone holder'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => {
                        const next = filters.requiredAccessories.includes(a)
                          ? filters.requiredAccessories.filter(x => x !== a)
                          : [...filters.requiredAccessories, a]
                        update({ requiredAccessories: next })
                      }}
                      className={cn(
                        'px-3 py-2 rounded-[10px] text-sm font-medium border transition-colors text-left',
                        filters.requiredAccessories.includes(a)
                          ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
                          : 'bg-[#f8f8f6] text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deposit type */}
              <div>
                <p className="text-sm font-semibold text-[#0f0f0e] mb-3">Deposit Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {([['cash', 'Cash'], ['passport', 'Passport']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => update({ depositTypeFilter: filters.depositTypeFilter === val ? '' : val })}
                      className={cn(
                        'py-2 rounded-[10px] text-sm font-medium border transition-colors text-center',
                        filters.depositTypeFilter === val
                          ? 'bg-[#0f0f0e] text-white border-[#0f0f0e]'
                          : 'bg-[#f8f8f6] text-[#5c5c58] border-[#e8e8e4] hover:border-[#d0d0cc]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-[#f0f0ec] px-6 py-4 flex gap-3">
              <button
                onClick={() => onChange({ priceMin: 150, priceMax: maxPrice, category: 'all', deliveryNow: false, helmetIncluded: false, location: 'all', sortBy: 'recommended', depositProtected: false, noPassport: false, requiredFeatures: [], requiredAccessories: [], depositTypeFilter: '' })}
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
        </div>,
        document.body
      )}
    </>
  )
}
