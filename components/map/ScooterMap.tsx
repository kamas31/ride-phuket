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

// ── Calibration tool ───────────────────────────────────────────
interface CalibrationPin {
  id: string
  lat: number
  lng: number
  zone: string
}

function CalibrationMarker({
  pin,
  onZoneChange,
  onDelete,
}: {
  pin: CalibrationPin
  onZoneChange: (zone: string) => void
  onDelete: () => void
}) {
  // Stop ALL pointer events from reaching Mapbox's gesture handlers.
  // Without this, mousedown bubbles to the map and Mapbox starts its
  // drag detection, which swallows subsequent events and breaks the
  // native <select> open cycle.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    // Container is exactly the dot size (12×12). The marker uses anchor:'center'
    // so the dot centre lands precisely on the clicked coordinate.
    // The card overflows to the RIGHT via absolute positioning so it never
    // covers the native Mapbox area label that sits below the coordinate.
    <div
      style={{ position: 'relative', width: 12, height: 12, userSelect: 'none' }}
      onClick={stop}
      onMouseDown={stop}
      onPointerDown={stop}
      onTouchStart={stop}
    >
      {/* Orange dot */}
      <div style={{
        width: 12, height: 12,
        background: '#FF6B35',
        borderRadius: '50%',
        border: '2.5px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
        boxSizing: 'border-box',
      }} />

      {/* Card — right side, vertically centred on the dot */}
      <div style={{
        position: 'absolute',
        left: 18,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
        padding: '10px 12px',
        minWidth: 190,
        maxWidth: 210,
        zIndex: 200,
      }}>
        <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#5c5c58', lineHeight: 1.6, marginBottom: 8 }}>
          lat: {pin.lat.toFixed(6)}<br />lng: {pin.lng.toFixed(6)}
        </p>
        <select
          value={pin.zone}
          onChange={e => onZoneChange(e.target.value)}
          style={{ width: '100%', fontSize: 11, padding: '5px 6px', borderRadius: 7, border: '1.5px solid #e8e8e4', marginBottom: 7, background: 'white', cursor: 'pointer', outline: 'none' }}
        >
          {PHUKET_ZONES.map(z => (
            <option key={z.key} value={z.key}>{z.name}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          style={{ width: '100%', fontSize: 10, color: '#9c9c98', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0' }}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

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
  debugMode?: boolean
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
  debugMode = false,
}: ScooterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady]             = useState(false)
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [showZoneCenters, setShowZoneCenters] = useState(false)

  // Calibration tool state (debug mode only)
  const [calibPins, setCalibPins] = useState<CalibrationPin[]>([])
  const [copied, setCopied] = useState(false)

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

  // Debug zone-center markers (dev only)
  const dbgMarkersRef = useRef<mapboxgl.Marker[]>([])

  // Calibration tool refs
  const calibMarkersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root; container: HTMLDivElement }>>(new Map())
  const zoneOverlayRef  = useRef<mapboxgl.Marker[]>([])
  const addCalibPinRef  = useRef<((lat: number, lng: number) => void) | null>(null)
  const debugModeRef    = useRef(debugMode)
  useEffect(() => { debugModeRef.current = debugMode }, [debugMode])
  useEffect(() => {
    addCalibPinRef.current = debugMode
      ? (lat, lng) => setCalibPins(prev => [...prev, {
          id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          lat, lng, zone: PHUKET_ZONES[0].key,
        }])
      : null
  }, [debugMode])

  // Scooter count per zone from current filtered list
  const zoneCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of scooters) {
      const zone = getZoneForLocation(s.location)
      if (zone) counts[zone.key] = (counts[zone.key] ?? 0) + 1
    }
    return counts
  }, [scooters])

  // ── Debug: zone centre markers (dev only) ────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    dbgMarkersRef.current.forEach(m => m.remove())
    dbgMarkersRef.current = []
    if (!showZoneCenters) return
    PHUKET_ZONES.forEach(zone => {
      const el = document.createElement('div')
      el.style.cssText = 'position:relative;width:10px;height:10px;pointer-events:none;'
      el.innerHTML = `
        <div style="width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.55);box-sizing:border-box;"></div>
        <div style="position:absolute;top:13px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.82);color:#fff;padding:2px 6px;border-radius:3px;font-size:9px;font-family:monospace;white-space:nowrap;line-height:1.5;">${zone.name}<br>${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}</div>
      `
      const m = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([zone.lng, zone.lat])
        .addTo(mapRef.current!)
      dbgMarkersRef.current.push(m)
    })
  }, [showZoneCenters, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calibration: existing zone overlay (blue dots) ───────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    zoneOverlayRef.current.forEach(m => m.remove())
    zoneOverlayRef.current = []
    if (!debugMode) return
    PHUKET_ZONES.forEach(zone => {
      const el = document.createElement('div')
      el.style.cssText = 'width:8px;height:8px;border-radius:50%;background:rgba(59,130,246,0.55);border:2px solid rgba(59,130,246,0.9);pointer-events:none;box-sizing:border-box;'
      const m = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([zone.lng, zone.lat])
        .addTo(mapRef.current!)
      zoneOverlayRef.current.push(m)
    })
  }, [debugMode, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calibration: manage placed pin markers ────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    // Remove stale markers
    const currentIds = new Set(calibPins.map(p => p.id))
    calibMarkersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.root.unmount(); entry.marker.remove()
        calibMarkersRef.current.delete(id)
      }
    })
    // Create or update
    calibPins.forEach(pin => {
      if (!calibMarkersRef.current.has(pin.id)) {
        const container = document.createElement('div')
        // anchor:'center' on a 12×12 container — dot centre lands on the coordinate
        const marker = new mapboxgl.Marker({ element: container, anchor: 'center' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(mapRef.current!)
        const root = createRoot(container)
        calibMarkersRef.current.set(pin.id, { marker, root, container })
      }
      const { root } = calibMarkersRef.current.get(pin.id)!
      root.render(
        <CalibrationMarker
          pin={pin}
          onZoneChange={zone => setCalibPins(prev => prev.map(p => p.id === pin.id ? { ...p, zone } : p))}
          onDelete={() => setCalibPins(prev => prev.filter(p => p.id !== pin.id))}
        />
      )
    })
  }, [calibPins, ready]) // eslint-disable-line react-hooks/exhaustive-deps

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

      // ── Layer cleanup: remove maritime noise + vegetation clutter ──────────
      // Ferry route lines and their outlines (blue dashed sea routes)
      for (const id of ['ferry', 'ferry-case']) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
      }
      // Natural landcover (green vegetation/habitat polygons) — parks/roads kept
      if (map.getLayer('landcover')) map.setLayoutProperty('landcover', 'visibility', 'none')

      setReady(true)
    })

    requestAnimationFrame(() => { map.resize() })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('click', (e) => {
      if (addCalibPinRef.current) {
        addCalibPinRef.current(e.lngLat.lat, e.lngLat.lng)
      } else {
        onSelectRef.current(null)
      }
    })
    map.on('moveend', () => { if (onBoundsChangeRef.current) setShowSearchHere(true) })

    mapRef.current = map
    return () => {
      markersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      markersRef.current.clear()
      zoneMarkersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      zoneMarkersRef.current.clear()
      dbgMarkersRef.current.forEach(m => m.remove())
      dbgMarkersRef.current = []
      calibMarkersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      calibMarkersRef.current.clear()
      zoneOverlayRef.current.forEach(m => m.remove())
      zoneOverlayRef.current = []
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

  const handleExportCoords = () => {
    const calibMap = new Map(calibPins.map(p => [p.zone, p]))
    const lines = PHUKET_ZONES.map(z => {
      const c = calibMap.get(z.key)
      const lat = c ? c.lat.toFixed(4) : z.lat.toFixed(4)
      const lng = c ? c.lng.toFixed(4) : z.lng.toFixed(4)
      const tag = c ? ' // ✓ calibrated' : ''
      const k = `'${z.key}'`.padEnd(16)
      const n = `'${z.name}'`.padEnd(16)
      return `  { key: ${k}, name: ${n}, lat: ${lat}, lng: ${lng}, radiusKm: ${z.radiusKm} },${tag}`
    })
    const ts = `export const PHUKET_ZONES: PhuketZone[] = [\n${lines.join('\n')}\n]`
    navigator.clipboard.writeText(ts).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => { window.prompt('Copy this into lib/zones.ts:', ts) })
  }

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

      {/* ── Debug calibration panel (debugPins=1) ─────────────────── */}
      {debugMode && (
        <div
          className="absolute top-4 left-4 z-30 bg-white/97 rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,0.22)] overflow-hidden"
          style={{ width: 252, backdropFilter: 'blur(8px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-[#f0f0ec]">
            <p className="text-[11px] font-bold text-[#0f0f0e] tracking-wide uppercase">Zone Calibration</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[9px] text-[#5c5c58]">
                <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'rgba(59,130,246,0.55)', border:'1.5px solid rgba(59,130,246,0.9)' }} />
                current
              </span>
              <span className="flex items-center gap-1 text-[9px] text-[#5c5c58]">
                <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#FF6B35', border:'1.5px solid white' }} />
                new pin
              </span>
            </div>
          </div>

          {/* Instructions / pin list */}
          {calibPins.length === 0 ? (
            <div className="px-4 py-3">
              <p className="text-[10px] text-[#9c9c98] leading-relaxed">
                Click the map to place a pin.<br />
                Assign a zone using the dropdown.<br />
                Blue dots = current PHUKET_ZONES.
              </p>
            </div>
          ) : (
            <div className="px-4 py-2.5 max-h-44 overflow-y-auto space-y-1.5">
              {calibPins.map(p => {
                const zone = PHUKET_ZONES.find(z => z.key === p.zone)
                return (
                  <div key={p.id} className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[#0f0f0e] truncate flex-shrink-0" style={{ maxWidth: 90 }}>{zone?.name ?? p.zone}</span>
                    <span className="text-[9px] font-mono text-[#9c9c98] text-right leading-tight">
                      {p.lat.toFixed(4)}<br />{p.lng.toFixed(4)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          {calibPins.length > 0 && (
            <div className="px-4 pb-3.5 pt-2 border-t border-[#f0f0ec] space-y-2">
              <button
                onClick={handleExportCoords}
                className="w-full py-2 text-[10px] font-bold rounded-full transition-colors text-white"
                style={{ background: copied ? '#22c55e' : '#FF6B35' }}
              >
                {copied ? '✓ Copied to clipboard' : `Export coordinates (${calibPins.length}/${PHUKET_ZONES.length})`}
              </button>
              <button
                onClick={() => setCalibPins([])}
                className="w-full py-1.5 text-[9px] text-[#9c9c98] hover:text-red-400 transition-colors"
              >
                Clear all pins
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dev: zone centre toggle — stripped from production builds */}
      {process.env.NODE_ENV !== 'production' && !debugMode && (
        <button
          onClick={() => setShowZoneCenters(v => !v)}
          className="absolute bottom-5 left-5 z-30 px-3 py-1.5 rounded-full text-[10px] font-mono text-white shadow-md transition-colors"
          style={{ background: showZoneCenters ? '#ef4444' : 'rgba(0,0,0,0.65)' }}
        >
          {showZoneCenters ? '◉ zones on' : '◎ zones'}
        </button>
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
