'use client'

// CSS loaded via <link href="/mapbox-gl.css"> in app/layout.tsx
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import Link from 'next/link'
import { X, Zap, Check } from 'lucide-react'
import { getScooterCover } from '@/lib/utils'
import { cn, formatPrice } from '@/lib/utils'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { PHUKET_ZONES, getZoneForLocation, type PhuketZone } from '@/lib/zones'
import type { Scooter } from '@/types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// ── Coordinate resolution ─────────────────────────────────────
// Base coords come from scooter.lat/lng (already resolved to shop coords
// in mapDbScooter). This function just makes the call site explicit.
function baseCoords(scooter: Scooter): [number, number] {
  return [scooter.lng, scooter.lat] // [lng, lat] as Mapbox expects
}

// For multiple scooters sharing the same location, spread them in a small
// circle at render time only — source data is untouched.
function buildSpreadMap(scooters: Scooter[]): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>()

  // Group by rounded position (4 decimal places ≈ 11m precision)
  const byPos = new Map<string, string[]>()
  for (const s of scooters) {
    const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`
    if (!byPos.has(key)) byPos.set(key, [])
    byPos.get(key)!.push(s.id)
  }

  for (const s of scooters) {
    const key   = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`
    const group = byPos.get(key)!
    const idx   = group.indexOf(s.id)

    if (group.length === 1) {
      result.set(s.id, [s.lng, s.lat])
    } else {
      const angle  = (idx / group.length) * 2 * Math.PI
      const r      = 0.00035 // ~35 m visual spread radius
      const cosLat = Math.cos(s.lat * (Math.PI / 180))
      result.set(s.id, [
        s.lng + (Math.cos(angle) * r) / cosLat,
        s.lat + Math.sin(angle) * r,
      ])
    }
  }
  return result
}

// ── Zone Label — white floating pill ──────────────────────────
function ZoneLabel({
  zone, count, hovered, active, onClick, onEnter, onLeave,
}: {
  zone: PhuketZone
  count: number
  hovered: boolean
  active: boolean
  onClick: () => void
  onEnter: () => void
  onLeave: () => void
}) {
  const isHighlit = hovered || active
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] md:text-[13px] font-semibold select-none transition-all duration-200 whitespace-nowrap',
        isHighlit
          ? 'bg-[#FF6B35] text-white shadow-[0_4px_16px_rgba(255,107,53,0.45),0_0_0_2px_rgba(255,107,53,0.2)] scale-105'
          : 'bg-white text-[#0f172a] shadow-[0_2px_12px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.22)] hover:scale-[1.03]',
      )}
    >
      {zone.name}
      {count > 0 && (
        <span
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
            isHighlit ? 'bg-white/25 text-white' : 'bg-[#f0f0ec] text-[#5c5c58]',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ── Price Pin — premium Airbnb-style ──────────────────────────
function PricePin({
  price, active, onClick, onEnter, onLeave,
}: {
  price: number; active: boolean
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
          'px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border-2 border-white transition-all duration-200',
          active
            ? 'bg-[#FF6B35] text-white shadow-[0_4px_14px_rgba(255,107,53,0.5),0_0_0_3px_rgba(255,107,53,0.2)] scale-[1.12]'
            : 'bg-white text-[#0f0f0e] shadow-[0_2px_8px_rgba(0,0,0,0.20)] group-hover:shadow-[0_4px_14px_rgba(0,0,0,0.28)] group-hover:scale-105',
        )}
      >
        {formatPrice(price)}
      </div>
      {/* Pin tail */}
      <div
        className={cn(
          'w-0 h-0 -mt-[1px] border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent transition-all',
          active ? 'border-t-[6px] border-t-[#FF6B35]' : 'border-t-[6px] border-t-white',
        )}
      />
    </div>
  )
}

// ── Popup card — bright white premium ─────────────────────────
function ScooterPopupCard({ scooter, onClose }: { scooter: Scooter; onClose: () => void }) {
  const year = scooter.year ?? new Date().getFullYear()
  const cat  = scooter.category.charAt(0).toUpperCase() + scooter.category.slice(1)

  return (
    <div className="relative w-[280px] bg-white rounded-[20px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]">
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-[#f8f8f6] transition-colors"
      >
        <X className="w-3.5 h-3.5 text-[#5c5c58]" />
      </button>

      <ScooterImage
        src={getScooterCover(scooter)}
        alt={scooter.name}
        className="h-40"
        objectFit="contain"
        sizes="280px"
      />

      <div className="p-4">
        <h3 className="font-bold text-[15px] text-[#0f0f0e] mb-0.5 pr-6 leading-tight">{scooter.name}</h3>
        <p className="text-[12px] text-[#9c9c98] mb-3">{year} · {cat}</p>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {scooter.shop?.verified && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-full">
              <Check className="w-2.5 h-2.5" />Verified
            </span>
          )}
          {scooter.deliveryAvailable && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#FF6B35] bg-[#fff4f0] px-2 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" />Delivery
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[22px] font-bold text-[#0f0f0e] leading-none">{formatPrice(scooter.pricePerDay)}</span>
            <span className="text-[#9c9c98] text-[12px] ml-1">/day</span>
          </div>
          <Link
            href={`/scooter/${scooter.id}`}
            className="px-4 py-2.5 bg-[#FF6B35] text-white text-[11px] font-bold rounded-full hover:bg-[#e85d29] transition-colors shadow-[0_2px_8px_rgba(255,107,53,0.35)]"
          >
            View →
          </Link>
        </div>
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
  selectedId?: string
  hoveredId?: string
  onSelect: (id: string | null) => void
  onHover?: (id: string | null) => void
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
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [showSearchHere, setShowSearchHere] = useState(false)

  // Visual-only spread: multiple scooters at same shop → tiny circle layout
  const spreadMap = useMemo(() => buildSpreadMap(scooters), [scooters])

  // Stable callback refs
  const onBoundsChangeRef = useRef(onBoundsChange)
  const onZoneClickRef    = useRef(onZoneClick)
  const onSelectRef       = useRef(onSelect)
  const onHoverRef        = useRef(onHover)
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange }, [onBoundsChange])
  useEffect(() => { onZoneClickRef.current    = onZoneClick    }, [onZoneClick])
  useEffect(() => { onSelectRef.current       = onSelect       }, [onSelect])
  useEffect(() => { onHoverRef.current        = onHover        }, [onHover])

  // Scooter marker refs
  const markersRef    = useRef<Map<string, { marker: mapboxgl.Marker; root: Root; container: HTMLDivElement }>>(new Map())
  const scootersById  = useRef<Map<string, Scooter>>(new Map())
  const prevActiveIds = useRef(new Set<string>())
  const popupRef      = useRef<{ popup: mapboxgl.Popup; root: Root; container: HTMLDivElement } | null>(null)

  // Zone label marker refs
  const zoneMarkersRef    = useRef<Map<string, { marker: mapboxgl.Marker; root: Root }>>(new Map())
  const hoveredZoneKeyRef = useRef<string | null>(null)

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

      // ── Zone label markers (created once) ──────────────────────
      PHUKET_ZONES.forEach(zone => {
        const container = document.createElement('div')
        container.style.zIndex = '5'
        const marker = new mapboxgl.Marker({ element: container, anchor: 'center' })
          .setLngLat([zone.lng, zone.lat])
          .addTo(map)
        const root = createRoot(container)
        zoneMarkersRef.current.set(zone.key, { marker, root })
        container.addEventListener('click', e => e.stopPropagation())
      })

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

  // ── Zone labels: re-render on state change ────────────────────
  useEffect(() => {
    if (!ready) return
    PHUKET_ZONES.forEach(zone => {
      const entry = zoneMarkersRef.current.get(zone.key)
      if (!entry) return
      const count = zoneCounts[zone.key] ?? 0
      entry.root.render(
        <ZoneLabel
          zone={zone}
          count={count}
          hovered={hoveredZone === zone.key}
          active={activeZone === zone.key}
          onClick={() => {
            const newKey = zone.key === activeZone ? null : zone.key
            onZoneClickRef.current?.(newKey)
          }}
          onEnter={() => {
            hoveredZoneKeyRef.current = zone.key
            setHoveredZone(zone.key)
          }}
          onLeave={() => {
            hoveredZoneKeyRef.current = null
            setHoveredZone(null)
          }}
        />,
      )
    })
  }, [ready, hoveredZone, activeZone, zoneCounts]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 1: Create/remove scooter markers + fitBounds ───────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    scootersById.current.clear()
    scooters.forEach(s => scootersById.current.set(s.id, s))

    const currentIds = new Set(scooters.map(s => s.id))
    markersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.root.unmount()
        entry.marker.remove()
        markersRef.current.delete(id)
        prevActiveIds.current.delete(id)
      }
    })

    scooters.forEach(scooter => {
      const lngLat = spreadMap.get(scooter.id) ?? baseCoords(scooter)
      if (!markersRef.current.has(scooter.id)) {
        const container = document.createElement('div')
        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
          .setLngLat(lngLat)
          .addTo(map)
        const root = createRoot(container)
        markersRef.current.set(scooter.id, { marker, root, container })
        container.addEventListener('click', e => e.stopPropagation())
      }
      const active = scooter.id === selectedId || scooter.id === hoveredId
      const { root } = markersRef.current.get(scooter.id)!
      root.render(
        <PricePin
          price={scooter.pricePerDay}
          active={active}
          onClick={() => onSelectRef.current(scooter.id === selectedId ? null : scooter.id)}
          onEnter={() => onHoverRef.current?.(scooter.id)}
          onLeave={() => onHoverRef.current?.(null)}
        />,
      )
      markersRef.current.get(scooter.id)!.marker.getElement().style.zIndex = active ? '20' : '10'
    })

    if (scooters.length === 1) {
      const [lng, lat] = baseCoords(scooters[0])
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 900 })
    } else if (scooters.length > 1) {
      // Use base (un-spread) coords for bounds so fitBounds is accurate
      const lngs = scooters.map(s => s.lng)
      const lats = scooters.map(s => s.lat)
      const sw: [number, number] = [Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01]
      const ne: [number, number] = [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]
      map.fitBounds([sw, ne], { padding: { top: 80, bottom: 80, left: 60, right: 60 }, maxZoom: 14, duration: 900 })
    }
  }, [scooters, spreadMap, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: Update marker appearance on hover/select ────────
  useEffect(() => {
    if (!ready) return
    const newActiveIds = new Set<string>(
      [selectedId, hoveredId].filter((id): id is string => Boolean(id)),
    )
    const updateMarker = (id: string, active: boolean) => {
      const entry   = markersRef.current.get(id)
      const scooter = scootersById.current.get(id)
      if (!entry || !scooter) return
      entry.root.render(
        <PricePin
          price={scooter.pricePerDay}
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

  // ── Popup for selected scooter ─────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    if (popupRef.current) {
      popupRef.current.root.unmount()
      popupRef.current.popup.remove()
      popupRef.current = null
    }
    if (!selectedId) return

    const scooter = scooters.find(s => s.id === selectedId)
    if (!scooter) return
    const lngLat = spreadMap.get(scooter.id) ?? baseCoords(scooter)

    const container = document.createElement('div')
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -10],
      anchor: 'bottom',
      className: 'scooter-popup',
    })
      .setLngLat(lngLat)
      .setDOMContent(container)
      .addTo(map)

    const root = createRoot(container)
    root.render(<ScooterPopupCard scooter={scooter} onClose={() => onSelectRef.current(null)} />)
    popupRef.current = { popup, root, container }
  }, [selectedId, scooters, spreadMap, ready]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const activeZoneName = activeZone ? PHUKET_ZONES.find(z => z.key === activeZone)?.name : null
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
