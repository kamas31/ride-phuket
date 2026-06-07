'use client'

// CSS loaded via <link href="/mapbox-gl.css"> in app/layout.tsx
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import Link from 'next/link'
import { X, ArrowRight, Store } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { PHUKET_ZONES, getZoneForLocation, getNearestZone } from '@/lib/zones'
import type { Scooter } from '@/types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// ── Screenshot pins (admin-only, localStorage-backed) ──────────
interface ScreenshotPin {
  id: string
  lat: number
  lng: number
  price: string
}

function ScreenshotPinMarker({ price, onDelete }: { price: string; onDelete: () => void }) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{
        cursor: 'pointer',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.18)) drop-shadow(0 4px 12px rgba(0,0,0,0.14))',
      }}
      onClick={e => { e.stopPropagation(); setShowDelete(v => !v) }}
    >
      <div
        className="relative px-3 h-8 flex items-center rounded-full text-[13px] font-bold whitespace-nowrap border bg-white text-[#1a1a18] border-black/[0.08]"
      >
        ฿{price}
        {showDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            style={{ lineHeight: 1 }}
          >
            ✕
          </button>
        )}
      </div>
      <div
        className="w-0 h-0 -mt-px"
        style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '7px solid white' }}
      />
    </div>
  )
}

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
  const [open, setOpen] = useState(false)
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const currentZone = PHUKET_ZONES.find(z => z.key === pin.zone)

  // Root cause of dropdown bug: the map wrapper has overflow:hidden. Chrome's
  // Blink-rendered <select> popup is clipped by that boundary — it opens but
  // is immediately hidden. Fix: custom inline zone list that expands within
  // the card itself, never needs to overflow the map container.

  return (
    // 12×12 container with anchor:'center' — dot centre = coordinate exactly.
    // Card floats RIGHT via absolute positioning, never covers Mapbox label.
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

      {/* Card — right of dot, vertically centred */}
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

        {/* Inline zone picker — avoids overflow:hidden clipping */}
        {open ? (
          <div style={{ border: '1.5px solid #e8e8e4', borderRadius: 7, marginBottom: 7, overflow: 'hidden' }}>
            <div style={{ maxHeight: 152, overflowY: 'auto' }}>
              {PHUKET_ZONES.map(z => (
                <button
                  key={z.key}
                  onClick={() => { onZoneChange(z.key); setOpen(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '5px 9px', fontSize: 11, border: 'none',
                    background: z.key === pin.zone ? '#fff5f0' : 'white',
                    color: z.key === pin.zone ? '#FF6B35' : '#0f0f0e',
                    fontWeight: z.key === pin.zone ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            style={{
              width: '100%', textAlign: 'left', fontSize: 11,
              padding: '5px 9px', borderRadius: 7,
              border: '1.5px solid #e8e8e4', marginBottom: 7,
              background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>{currentZone?.name ?? pin.zone}</span>
            <span style={{ fontSize: 9, color: '#9c9c98', marginLeft: 6 }}>▾</span>
          </button>
        )}

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

// ── Zone cluster data (hybrid zoom-based system) ───────────────
const BREAKOUT_ZOOM = 12

interface ZoneClusterData {
  zoneKey: string
  zoneName: string
  lat: number
  lng: number
  exactAggregates: ShopAggregate[]  // TYPE 1 shops — break out above BREAKOUT_ZOOM
  clusterShopCount: number           // TYPE 2+3 shop count — permanent residual cluster
  clusterMinPrice: number | null     // min price across TYPE 2+3 scooters (for single-shop label)
  totalCount: number                 // exactAggregates.length + clusterShopCount
}

function buildZoneClusters(scooters: Scooter[]): ZoneClusterData[] {
  const exactAggsByZone     = new Map<string, Map<string, ShopAggregate>>()
  const clusterShopsByZone  = new Map<string, Set<string>>()
  const clusterMinPriceByZone = new Map<string, number>()
  const zoneMeta            = new Map<string, { zoneName: string; lat: number; lng: number }>()

  for (const s of scooters) {
    if (!s.shopId) continue

    const isExact = (s.shop?.locationVisibility ?? 'exact') === 'exact' && (s.shop?.hasPrecisePin ?? false)

    // TYPE 1 (precise pin): zone from actual coords — prevents mismatch when the owner
    // placed a pin in a different area than their stored location text (e.g. pinned in
    // Chalong but location says "kata").
    // TYPE 2/3: zone from location text; fall back to nearest zone by coords.
    const zone = isExact
      ? getNearestZone(s.lat, s.lng)
      : (getZoneForLocation(s.location) ?? getZoneForLocation(s.shop?.location ?? '') ?? getNearestZone(s.lat, s.lng))

    if (!zoneMeta.has(zone.key)) {
      zoneMeta.set(zone.key, { zoneName: zone.name, lat: zone.lat, lng: zone.lng })
      exactAggsByZone.set(zone.key, new Map())
      clusterShopsByZone.set(zone.key, new Set())
    }

    if (isExact) {
      const aggs = exactAggsByZone.get(zone.key)!
      if (!aggs.has(s.shopId)) {
        aggs.set(s.shopId, {
          shopId:   s.shopId,
          slug:     s.shop?.slug     ?? '',
          name:     s.shop?.name     ?? '',
          logo:     s.shop?.logo     ?? '',
          verified: s.shop?.verified ?? false,
          count:    0,
          minPrice: s.pricePerDay,
          maxPrice: s.pricePerDay,
          minCc:    null,
          maxCc:    null,
          lat:      s.lat,
          lng:      s.lng,
        })
      }
      const agg = aggs.get(s.shopId)!
      agg.count++
      agg.minPrice = Math.min(agg.minPrice, s.pricePerDay)
      agg.maxPrice = Math.max(agg.maxPrice, s.pricePerDay)
      const cc = parseCc(s.specs?.engine ?? '')
      if (cc !== null) {
        agg.minCc = agg.minCc === null ? cc : Math.min(agg.minCc, cc)
        agg.maxCc = agg.maxCc === null ? cc : Math.max(agg.maxCc, cc)
      }
    } else {
      clusterShopsByZone.get(zone.key)!.add(s.shopId)
      const prev = clusterMinPriceByZone.get(zone.key)
      clusterMinPriceByZone.set(zone.key, prev === undefined ? s.pricePerDay : Math.min(prev, s.pricePerDay))
    }
  }

  return Array.from(zoneMeta.entries()).map(([zoneKey, meta]) => {
    const exactAggregates  = Array.from(exactAggsByZone.get(zoneKey)!.values())
    const clusterShopCount = clusterShopsByZone.get(zoneKey)!.size
    return {
      zoneKey,
      zoneName:        meta.zoneName,
      lat:             meta.lat,
      lng:             meta.lng,
      exactAggregates,
      clusterShopCount,
      clusterMinPrice: clusterMinPriceByZone.get(zoneKey) ?? null,
      totalCount:      exactAggregates.length + clusterShopCount,
    }
  })
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


// ── Shop Pin — Airbnb-inspired price pill ─────────────────────
function ShopPin({
  minPrice, count, active, onClick, onEnter, onLeave,
}: {
  minPrice: number; count: number; active: boolean
  onClick: () => void; onEnter: () => void; onLeave: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    // Scale applied to whole marker (pill + caret together).
    // anchor:'bottom' on the Mapbox Marker pins the bottom of this div —
    // i.e. the caret tip — to the exact coordinate. scale() is a visual
    // transform only and does not affect layout, so the anchor is preserved.
    <div
      className={cn(
        'flex flex-col items-center cursor-pointer select-none',
        'transition-transform duration-150 ease-out',
        active || hovered ? 'scale-[1.08]' : 'scale-100',
      )}
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onEnter() }}
      onMouseLeave={() => { setHovered(false); onLeave() }}
    >
      <div
        className={cn(
          'px-3 h-8 flex items-center rounded-full text-[13px] font-bold whitespace-nowrap',
          'border transition duration-150',
          active
            ? 'bg-[#E05A1A] text-white border-[#E05A1A]/25'
            : 'bg-white text-[#1a1a18] border-black/[0.08]',
        )}
        style={{
          boxShadow: active
            ? '0 4px 12px rgba(224,90,26,0.25), 0 10px 24px rgba(224,90,26,0.20)'
            : hovered
            ? '0 2px 6px rgba(0,0,0,0.16), 0 12px 28px rgba(0,0,0,0.18)'
            : '0 1px 3px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.12)',
        }}
      >
        {formatPrice(minPrice)}{count > 1 ? '+' : ''}
      </div>
      {/* Caret — 45% larger than original (4/4/5px → 6/6/7px).
          Color always matches pill background so they read as one shape. */}
      <div
        className="w-0 h-0 -mt-px transition-[border-top-color] duration-150"
        style={{
          borderLeft:  '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop:   `7px solid ${active ? '#E05A1A' : 'white'}`,
        }}
      />
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

// ── Zone Cluster Pin (same pill design as ShopPin) ──
// count=1 + minPrice → shows price ("200B"); count>1 → shows "N shops"
function ZoneClusterPin({ count, minPrice, onClick }: { count: number; minPrice: number | null; onClick: () => void }) {
  const label = count === 1 && minPrice !== null
    ? formatPrice(minPrice)
    : `${count} shop${count !== 1 ? 's' : ''}`

  return (
    <div
      className="flex flex-col items-center cursor-pointer select-none"
      onClick={onClick}
    >
      <div
        className="px-3 h-8 flex items-center rounded-full text-[13px] font-bold whitespace-nowrap border bg-white text-[#1a1a18] border-black/[0.08]"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.12)' }}
      >
        {label}
      </div>
      <div
        className="w-0 h-0 -mt-px"
        style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '7px solid white' }}
      />
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
  screenshotPins?: ScreenshotPin[]
  screenshotMode?: boolean
  onScreenshotPinAdd?: (lat: number, lng: number) => void
  onScreenshotPinDelete?: (id: string) => void
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
  screenshotPins,
  screenshotMode = false,
  onScreenshotPinAdd,
  onScreenshotPinDelete,
}: ScooterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady]             = useState(false)
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [showZoneCenters, setShowZoneCenters] = useState(false)

  // Calibration tool state (debug mode only)
  const [calibPins, setCalibPins] = useState<CalibrationPin[]>([])
  const [copied, setCopied] = useState(false)

  const zoneClusters = useMemo(() => buildZoneClusters(scooters), [scooters])
  const [aboveBreakout, setAboveBreakout] = useState(false)

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
  const markersRef     = useRef<Map<string, { marker: mapboxgl.Marker; root: Root; container: HTMLDivElement }>>(new Map())
  const aggregatesById = useRef<Map<string, ShopAggregate>>(new Map())
  const popupRef       = useRef<{ popup: mapboxgl.Popup; root: Root; container: HTMLDivElement } | null>(null)

  // Zone marker refs (kept for cleanup safety, no longer rendered)
  const zoneMarkersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root }>>(new Map())
  // Zone cluster markers — one per zone; shows totalCount at low zoom, clusterShopCount at high zoom
  const zoneClusterMarkersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root; container: HTMLDivElement }>>(new Map())

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

  // Screenshot pin refs
  const screenshotMarkersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root; container: HTMLDivElement }>>(new Map())
  const screenshotModeRef        = useRef(screenshotMode)
  const onScreenshotPinAddRef    = useRef(onScreenshotPinAdd)
  const onScreenshotPinDeleteRef = useRef(onScreenshotPinDelete)
  useEffect(() => { screenshotModeRef.current        = screenshotMode        }, [screenshotMode])
  useEffect(() => { onScreenshotPinAddRef.current    = onScreenshotPinAdd    }, [onScreenshotPinAdd])
  useEffect(() => { onScreenshotPinDeleteRef.current = onScreenshotPinDelete }, [onScreenshotPinDelete])

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

    map.on('load', () => {
      map.resize()

      // ── Layer cleanup: remove maritime noise + vegetation fills ──────────
      // Ferry route lines and their outlines (blue dashed sea routes)
      for (const id of ['ferry', 'ferry-case']) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
      }
      if (map.getLayer('landcover')) map.setLayoutProperty('landcover', 'visibility', 'none')
      // Terrain shading: hillshade is the sole layer producing mountain shadow/relief.
      // Hiding it flattens the map visually without touching roads, water, or labels.
      if (map.getLayer('hillshade')) map.setLayoutProperty('hillshade', 'visibility', 'none')

      setReady(true)
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('zoom', () => { setAboveBreakout(map.getZoom() >= BREAKOUT_ZOOM) })
    map.on('click', (e) => {
      if (screenshotModeRef.current) {
        onScreenshotPinAddRef.current?.(e.lngLat.lat, e.lngLat.lng)
      } else if (addCalibPinRef.current) {
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
      screenshotMarkersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      screenshotMarkersRef.current.clear()
      zoneClusterMarkersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      zoneClusterMarkersRef.current.clear()
      popupRef.current?.root.unmount()
      popupRef.current?.popup.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Unified marker effect: ShopPins + ZoneClusterPins, zoom-aware ──
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    // Populate aggregatesById so the popup effect can look up shop data
    aggregatesById.current.clear()
    zoneClusters.forEach(zc =>
      zc.exactAggregates.forEach(agg => aggregatesById.current.set(agg.shopId, agg))
    )

    // ── ShopPin markers (TYPE 1 — exact, visible above BREAKOUT_ZOOM) ──
    const allExactAggs   = zoneClusters.flatMap(zc => zc.exactAggregates)
    const currentExactIds = new Set(allExactAggs.map(a => a.shopId))

    markersRef.current.forEach((entry, id) => {
      if (!currentExactIds.has(id)) {
        entry.root.unmount()
        entry.marker.remove()
        markersRef.current.delete(id)
      }
    })

    allExactAggs.forEach(agg => {
      if (!markersRef.current.has(agg.shopId)) {
        const container = document.createElement('div')
        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
          .setLngLat([agg.lng, agg.lat])
          .addTo(map)
        const root = createRoot(container)
        container.addEventListener('click', e => e.stopPropagation())
        markersRef.current.set(agg.shopId, { marker, root, container })
      }
      const active = agg.shopId === selectedId || agg.shopId === hoveredId
      const el = markersRef.current.get(agg.shopId)!.marker.getElement()
      el.style.display = aboveBreakout ? '' : 'none'
      el.style.zIndex  = active ? '20' : '10'
      markersRef.current.get(agg.shopId)!.root.render(
        <ShopPin
          minPrice={agg.minPrice}
          count={agg.count}
          active={active}
          onClick={() => onSelectRef.current(agg.shopId === selectedId ? null : agg.shopId)}
          onEnter={() => onHoverRef.current?.(agg.shopId)}
          onLeave={() => onHoverRef.current?.(null)}
        />,
      )
    })

    // ── ZoneClusterPin markers (one per zone) ──────────────────────
    // Low zoom: totalCount (TYPE 1 + TYPE 2 + TYPE 3)
    // High zoom: clusterShopCount (TYPE 2 + TYPE 3 only — TYPE 1 have broken out as ShopPins)
    const currentZoneKeys = new Set(zoneClusters.map(zc => zc.zoneKey))

    zoneClusterMarkersRef.current.forEach((entry, key) => {
      if (!currentZoneKeys.has(key)) {
        entry.root.unmount()
        entry.marker.remove()
        zoneClusterMarkersRef.current.delete(key)
      }
    })

    zoneClusters.forEach(zc => {
      if (!zoneClusterMarkersRef.current.has(zc.zoneKey)) {
        const container = document.createElement('div')
        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
          .setLngLat([zc.lng, zc.lat])
          .addTo(map)
        const root = createRoot(container)
        container.addEventListener('click', e => e.stopPropagation())
        zoneClusterMarkersRef.current.set(zc.zoneKey, { marker, root, container })
      }
      const count = aboveBreakout ? zc.clusterShopCount : zc.totalCount
      // Resolve the single-shop price for the "200B" label when count===1
      let minPrice: number | null = null
      if (count === 1) {
        if (aboveBreakout) {
          minPrice = zc.clusterMinPrice
        } else if (zc.exactAggregates.length === 1) {
          minPrice = zc.exactAggregates[0].minPrice
        } else {
          minPrice = zc.clusterMinPrice
        }
      }
      const el = zoneClusterMarkersRef.current.get(zc.zoneKey)!.marker.getElement()
      if (count === 0) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
        // Single TYPE 1 shop at low zoom: treat as shop pin click (shows card, stays on map)
        const isSingleExact = !aboveBreakout && count === 1 && zc.exactAggregates.length === 1
        zoneClusterMarkersRef.current.get(zc.zoneKey)!.root.render(
          <ZoneClusterPin
            count={count}
            minPrice={minPrice}
            onClick={() => isSingleExact
              ? onSelectRef.current(zc.exactAggregates[0].shopId)
              : onZoneClickRef.current?.(zc.zoneKey)
            }
          />,
        )
      }
    })
  }, [zoneClusters, aboveBreakout, selectedId, hoveredId, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── fitBounds when zone cluster data changes ───────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    const coords: Array<[number, number]> = zoneClusters.flatMap(zc => {
      const pts: Array<[number, number]> = [[zc.lng, zc.lat]]
      zc.exactAggregates.forEach(agg => pts.push([agg.lng, agg.lat]))
      return pts
    })

    if (coords.length === 0) return

    if (coords.length === 1) {
      map.flyTo({ center: coords[0], zoom: 14, duration: 900 })
    } else {
      const lngs = coords.map(c => c[0])
      const lats = coords.map(c => c[1])
      const sw: [number, number] = [Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01]
      const ne: [number, number] = [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]
      map.fitBounds([sw, ne], { padding: { top: 80, bottom: 80, left: 60, right: 60 }, maxZoom: 14, duration: 900 })
    }
  }, [zoneClusters, ready]) // eslint-disable-line react-hooks/exhaustive-deps

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

    // Markers use z-index 10 (inactive) and 20 (active/hovered).
    // Mapbox popup has z-index:auto by default, which paints below any
    // element with a positive z-index in the same stacking context.
    // Setting 25 ensures the popup is always above every marker.
    popup.getElement()?.style.setProperty('z-index', '25')

    const root = createRoot(container)
    root.render(<ShopPopupCard agg={agg} onClose={() => onSelectRef.current(null)} />)
    popupRef.current = { popup, root, container }
  }, [selectedId, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Screenshot pins ────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const pins = screenshotPins ?? []
    const currentIds = new Set(pins.map(p => p.id))
    screenshotMarkersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.root.unmount(); entry.marker.remove()
        screenshotMarkersRef.current.delete(id)
      }
    })
    pins.forEach(pin => {
      if (!screenshotMarkersRef.current.has(pin.id)) {
        const container = document.createElement('div')
        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(mapRef.current!)
        const root = createRoot(container)
        container.addEventListener('click', e => e.stopPropagation())
        screenshotMarkersRef.current.set(pin.id, { marker, root, container })
      }
      const { root } = screenshotMarkersRef.current.get(pin.id)!
      root.render(
        <ScreenshotPinMarker
          price={pin.price}
          onDelete={() => onScreenshotPinDeleteRef.current?.(pin.id)}
        />
      )
    })
  }, [screenshotPins, ready]) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className={cn('relative rounded-[20px] overflow-hidden bg-[#dfe7df]', screenshotMode && '[&_.mapboxgl-canvas]:cursor-crosshair', className)}>
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
