'use client'

// CSS loaded via <link href="/mapbox-gl.css"> in app/layout.tsx
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import Link from 'next/link'
import { X, ArrowRight, Store } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { PHUKET_ZONES, getZoneForLocation } from '@/lib/zones'
import type { Scooter } from '@/types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// ── Shop aggregate ─────────────────────────────────────────────
interface ShopAggregate {
  shopId: string
  slug: string
  name: string
  logo: string
  verified: boolean
  count: number
  minPrice: number
  maxPrice: number
  minCc: number | null
  maxCc: number | null
  lat: number
  lng: number
}

function parseCc(engine: string): number | null {
  const match = engine?.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

function buildShopAggregates(scooters: Scooter[]): ShopAggregate[] {
  const map = new Map<string, ShopAggregate>()
  for (const s of scooters) {
    if (!s.shopId || !s.lat || !s.lng) continue
    if (!map.has(s.shopId)) {
      map.set(s.shopId, {
        shopId: s.shopId,
        slug:     s.shop?.slug     ?? '',
        name:     s.shop?.name     ?? '',
        logo:     s.shop?.logo     ?? '',
        verified: s.shop?.verified ?? false,
        count: 0,
        minPrice: s.pricePerDay,
        maxPrice: s.pricePerDay,
        minCc: null,
        maxCc: null,
        lat: s.lat,
        lng: s.lng,
      })
    }
    const agg = map.get(s.shopId)!
    agg.count++
    agg.minPrice = Math.min(agg.minPrice, s.pricePerDay)
    agg.maxPrice = Math.max(agg.maxPrice, s.pricePerDay)
    const cc = parseCc(s.specs?.engine ?? '')
    if (cc !== null) {
      agg.minCc = agg.minCc === null ? cc : Math.min(agg.minCc, cc)
      agg.maxCc = agg.maxCc === null ? cc : Math.max(agg.maxCc, cc)
    }
  }
  return Array.from(map.values())
}

// ── Shop Pin — clean minimal price marker ─────────────────────
function ShopPin({
  minPrice, active, onClick, onEnter, onLeave,
}: {
  minPrice: number; active: boolean
  onClick: () => void; onEnter: () => void; onLeave: () => void
}) {
  return (
    <div
      className="flex flex-col items-center cursor-pointer select-none group"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        className={cn(
          'px-2.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-200',
          active
            ? 'bg-[#FF6B35] text-white shadow-[0_4px_14px_rgba(255,107,53,0.45)] scale-110'
            : 'bg-white text-[#0f0f0e] shadow-[0_2px_8px_rgba(0,0,0,0.15)] group-hover:shadow-[0_4px_14px_rgba(0,0,0,0.22)] group-hover:scale-105',
        )}
      >
        {formatPrice(minPrice)}+
      </div>
      <div className={cn(
        'w-0 h-0 -mt-px border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent',
        active ? 'border-t-[5px] border-t-[#FF6B35]' : 'border-t-[5px] border-t-white',
      )} />
    </div>
  )
}

// ── Shop Popup Card ────────────────────────────────────────────
function ShopPopupCard({ agg, onClose }: { agg: ShopAggregate; onClose: () => void }) {
  const priceLabel = agg.minPrice === agg.maxPrice
    ? formatPrice(agg.minPrice)
    : `${formatPrice(agg.minPrice)}–${formatPrice(agg.maxPrice)}`

  const ccLabel = (agg.minCc !== null && agg.maxCc !== null)
    ? (agg.minCc === agg.maxCc ? `${agg.minCc}cc` : `${agg.minCc}–${agg.maxCc}cc`)
    : null

  return (
    <div className="relative w-[260px] bg-white rounded-[20px] overflow-hidden shadow-floating">
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-[#f8f8f6] transition-colors"
      >
        <X className="w-3.5 h-3.5 text-[#5c5c58]" />
      </button>

      <div className="p-4">
        {/* Shop identity */}
        <div className="flex items-center gap-3 mb-4">
          {agg.logo ? (
            <img src={agg.logo} alt={agg.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 bg-[#f0ede8] rounded-xl flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-[#a09890]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[14px] text-[#0f0f0e] leading-tight truncate">{agg.name}</h3>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#f8f8f6] rounded-[10px] p-2.5 text-center">
            <p className="text-[20px] font-bold text-[#0f0f0e] leading-none">{agg.count}</p>
            <p className="text-[10px] text-[#9c9c98] mt-0.5">scooter{agg.count !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-[#f8f8f6] rounded-[10px] p-2.5 text-center">
            <p className="text-[13px] font-bold text-[#0f0f0e] leading-tight">{priceLabel}</p>
            <p className="text-[10px] text-[#9c9c98] mt-0.5">/day</p>
          </div>
        </div>

        {ccLabel && (
          <p className="text-[11px] text-[#9c9c98] mb-3 text-center">Engine: {ccLabel}</p>
        )}

        {agg.slug ? (
          <Link
            href={`/shop/${agg.slug}`}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#FF6B35] text-white text-[12px] font-bold rounded-full hover:bg-[#e85d29] transition-colors shadow-[0_2px_8px_rgba(255,107,53,0.35)]"
          >
            View shop
            <ArrowRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────
function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-[20px] overflow-hidden bg-[#e8f4f8] flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#5c5c58] text-xs font-medium">Loading map…</span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
interface ScooterMapProps {
  scooters: Scooter[]
  selectedId?: string   // shop ID
  hoveredId?: string    // shop ID
  onSelect: (shopId: string | null) => void
  onHover?: (shopId: string | null) => void
  onBoundsChange?: (bounds: { sw: [number, number]; ne: [number, number] }) => void
  onZoneClick?: (zoneKey: string | null) => void
  activeZone?: string | null
  className?: string
}

export default function ScooterMap({
  scooters,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onBoundsChange,
  onZoneClick,
  activeZone,
  className,
}: ScooterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady]             = useState(false)
  const [showSearchHere, setShowSearchHere] = useState(false)

  // Group filtered scooters into one aggregate per shop
  const aggregates = useMemo(() => buildShopAggregates(scooters), [scooters])

  // Stable callback refs
  const onBoundsChangeRef = useRef(onBoundsChange)
  const onZoneClickRef    = useRef(onZoneClick)
  const onSelectRef       = useRef(onSelect)
  const onHoverRef        = useRef(onHover)
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange }, [onBoundsChange])
  useEffect(() => { onZoneClickRef.current    = onZoneClick    }, [onZoneClick])
  useEffect(() => { onSelectRef.current       = onSelect       }, [onSelect])
  useEffect(() => { onHoverRef.current        = onHover        }, [onHover])

  // Shop marker refs — keyed by shopId
  const markersRef    = useRef<Map<string, { marker: mapboxgl.Marker; root: Root; container: HTMLDivElement }>>(new Map())
  const aggregatesById = useRef<Map<string, ShopAggregate>>(new Map())
  const prevActiveIds = useRef(new Set<string>())
  const popupRef      = useRef<{ popup: mapboxgl.Popup; root: Root; container: HTMLDivElement } | null>(null)

  // Zone marker refs (kept for cleanup safety, no longer rendered)
  const zoneMarkersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root }>>(new Map())

  // Scooter count per zone from current filtered list
  const zoneCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of scooters) {
      const zone = getZoneForLocation(s.location)
      if (zone) counts[zone.key] = (counts[zone.key] ?? 0) + 1
    }
    return counts
  }, [scooters])

  // ── Init map (once) ───────────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    mapboxgl.accessToken = TOKEN

    containerRef.current.style.background = '#dfe7df'
    containerRef.current.style.transform = 'translateZ(0)'
    containerRef.current.style.willChange = 'transform'

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [98.3381, 7.9019],
      zoom: 10.8,
      attributionControl: false,
      fadeDuration: 0,
      preserveDrawingBuffer: false,
    })

    const canvas = map.getCanvas()
    canvas.style.background = '#dfe7df'
    canvas.style.transform = 'translateZ(0)'

    map.on('load', () => {
      map.resize()

      setReady(true)
    })

    requestAnimationFrame(() => { map.resize() })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('click', () => onSelectRef.current(null))
    map.on('moveend', () => { if (onBoundsChangeRef.current) setShowSearchHere(true) })

    mapRef.current = map
    return () => {
      markersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      markersRef.current.clear()
      zoneMarkersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      zoneMarkersRef.current.clear()
      popupRef.current?.root.unmount()
      popupRef.current?.popup.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 1: Create/remove shop markers + fitBounds ─────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    aggregatesById.current.clear()
    aggregates.forEach(agg => aggregatesById.current.set(agg.shopId, agg))

    const currentIds = new Set(aggregates.map(a => a.shopId))
    markersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.root.unmount()
        entry.marker.remove()
        markersRef.current.delete(id)
        prevActiveIds.current.delete(id)
      }
    })

    aggregates.forEach(agg => {
      if (!markersRef.current.has(agg.shopId)) {
        const container = document.createElement('div')
        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
          .setLngLat([agg.lng, agg.lat])
          .addTo(map)
        const root = createRoot(container)
        markersRef.current.set(agg.shopId, { marker, root, container })
        container.addEventListener('click', e => e.stopPropagation())
      }
      const active = agg.shopId === selectedId || agg.shopId === hoveredId
      const { root } = markersRef.current.get(agg.shopId)!
      root.render(
        <ShopPin
          minPrice={agg.minPrice}
          active={active}
          onClick={() => onSelectRef.current(agg.shopId === selectedId ? null : agg.shopId)}
          onEnter={() => onHoverRef.current?.(agg.shopId)}
          onLeave={() => onHoverRef.current?.(null)}
        />,
      )
      markersRef.current.get(agg.shopId)!.marker.getElement().style.zIndex = active ? '20' : '10'
    })

    if (aggregates.length === 1) {
      map.flyTo({ center: [aggregates[0].lng, aggregates[0].lat], zoom: 14, duration: 900 })
    } else if (aggregates.length > 1) {
      const lngs = aggregates.map(a => a.lng)
      const lats = aggregates.map(a => a.lat)
      const sw: [number, number] = [Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01]
      const ne: [number, number] = [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]
      map.fitBounds([sw, ne], { padding: { top: 80, bottom: 80, left: 60, right: 60 }, maxZoom: 14, duration: 900 })
    }
  }, [aggregates, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: Update marker appearance on hover/select ────────
  useEffect(() => {
    if (!ready) return
    const newActiveIds = new Set<string>(
      [selectedId, hoveredId].filter((id): id is string => Boolean(id)),
    )
    const updateMarker = (id: string, active: boolean) => {
      const entry = markersRef.current.get(id)
      const agg   = aggregatesById.current.get(id)
      if (!entry || !agg) return
      entry.root.render(
        <ShopPin
          minPrice={agg.minPrice}
          active={active}
          onClick={() => onSelectRef.current(id === selectedId ? null : id)}
          onEnter={() => onHoverRef.current?.(id)}
          onLeave={() => onHoverRef.current?.(null)}
        />,
      )
      entry.marker.getElement().style.zIndex = active ? '20' : '10'
    }
    newActiveIds.forEach(id => { if (!prevActiveIds.current.has(id)) updateMarker(id, true) })
    prevActiveIds.current.forEach(id => { if (!newActiveIds.has(id)) updateMarker(id, false) })
    prevActiveIds.current = newActiveIds
  }, [selectedId, hoveredId, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Popup for selected shop ────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    if (popupRef.current) {
      popupRef.current.root.unmount()
      popupRef.current.popup.remove()
      popupRef.current = null
    }
    if (!selectedId) return

    const agg = aggregatesById.current.get(selectedId)
    if (!agg) return

    const container = document.createElement('div')
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -10],
      anchor: 'bottom',
      className: 'scooter-popup',
    })
      .setLngLat([agg.lng, agg.lat])
      .setDOMContent(container)
      .addTo(map)

    const root = createRoot(container)
    root.render(<ShopPopupCard agg={agg} onClose={() => onSelectRef.current(null)} />)
    popupRef.current = { popup, root, container }
  }, [selectedId, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!TOKEN) {
    return (
      <div className={cn('flex items-center justify-center bg-[#e8f4f8] rounded-[20px] border border-[#e8e8e4]', className)}>
        <div className="text-center px-6">
          <p className="text-[#5c5c58] text-sm font-medium">Map unavailable</p>
          <code className="text-[10px] text-[#9c9c98] mt-1 block">Set NEXT_PUBLIC_MAPBOX_TOKEN</code>
        </div>
      </div>
    )
  }

  const handleSearchHere = () => {
    if (!mapRef.current) return
    const bounds = mapRef.current.getBounds()
    if (!bounds) return
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    onBoundsChangeRef.current?.({ sw: [sw.lng, sw.lat], ne: [ne.lng, ne.lat] })
    setShowSearchHere(false)
  }

  const activeZoneName  = activeZone ? PHUKET_ZONES.find(z => z.key === activeZone)?.name : null
  const activeZoneCount = activeZone ? (zoneCounts[activeZone] ?? 0) : 0

  return (
    <div className={cn('relative rounded-[20px] overflow-hidden bg-[#dfe7df]', className)}>
      {!ready && <MapSkeleton className="absolute inset-0 z-10" />}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* "Search this area" — premium floating button */}
      {showSearchHere && onBoundsChange && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-[fade-up_0.2s_ease_forwards]">
          <button
            onClick={handleSearchHere}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0f0f0e] text-[12px] font-bold rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.22)] hover:bg-[#f8f8f6] transition-all active:scale-[0.97]"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Search this area
          </button>
        </div>
      )}

      {/* Active zone count card — bottom right */}
      {activeZone && activeZoneName && (
        <div className="absolute bottom-5 right-5 z-20 bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.16)] p-4 min-w-[190px]">
          <p className="text-[13px] font-bold text-[#0f0f0e] leading-tight">
            {activeZoneCount} scooter{activeZoneCount !== 1 ? 's' : ''} available
          </p>
          <p className="text-[11px] text-[#9c9c98] mt-0.5 mb-3">in {activeZoneName}</p>
          <button
            onClick={() => onZoneClickRef.current?.(null)}
            className="w-full py-2.5 bg-[#FF6B35] text-white text-[11px] font-bold rounded-full hover:bg-[#e85d29] transition-colors"
          >
            View all scooters
          </button>
        </div>
      )}
    </div>
  )
}
