'use client'

// CSS loaded via <link href="/mapbox-gl.css"> in app/layout.tsx
// mapbox-gl v3 has exports: { '.': { default: '...' } } — Turbopack resolves it correctly
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import Link from 'next/link'
import { Star, MapPin, X, ArrowRight, Zap, Shield } from 'lucide-react'
import { getScooterCover } from '@/lib/utils'
import { cn, formatPrice } from '@/lib/utils'
import { ScooterImage } from '@/components/ride/ScooterImage'
import type { Scooter } from '@/types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// ── Area coordinate fallbacks ──────────────────────────────────
const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  patong:         { lat: 7.8956, lng: 98.2966 },
  kata:           { lat: 7.8203, lng: 98.2986 },
  karon:          { lat: 7.8347, lng: 98.2987 },
  rawai:          { lat: 7.7781, lng: 98.3281 },
  'bang tao':     { lat: 8.0000, lng: 98.2900 },
  'phuket town':  { lat: 7.8804, lng: 98.3881 },
  kamala:         { lat: 7.9476, lng: 98.2734 },
  surin:          { lat: 7.9714, lng: 98.2800 },
}

function resolveCoords(scooter: Scooter, index: number) {
  const isDefault = Math.abs(scooter.lat - 7.95) < 0.01 && Math.abs(scooter.lng - 98.34) < 0.01
  if (!isDefault) return { lat: scooter.lat, lng: scooter.lng }
  const loc = scooter.location.toLowerCase()
  for (const [key, coords] of Object.entries(AREA_COORDS)) {
    if (loc.includes(key)) {
      const jitter = (index % 5) * 0.003
      return { lat: coords.lat + jitter, lng: coords.lng + jitter }
    }
  }
  return { lat: 7.9519 + (index % 8) * 0.008, lng: 98.3381 + (index % 8) * 0.006 }
}

// ── Price Pin React component (rendered into Mapbox marker element) ──
function PricePin({
  price, active, onClick, onEnter, onLeave
}: {
  price: number; active: boolean
  onClick: () => void; onEnter: () => void; onLeave: () => void
}) {
  return (
    <div className="flex flex-col items-center cursor-pointer select-none" onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className={cn(
        'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200',
        active
          ? 'bg-[#FF6B35] text-white shadow-[0_0_0_3px_rgba(255,107,53,0.25),0_4px_20px_rgba(255,107,53,0.5)] scale-110'
          : 'bg-[#0f0f0e]/85 backdrop-blur-md text-white border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.5)] hover:scale-105'
      )}>
        {formatPrice(price)}
      </div>
      <div className={cn(
        'w-2 h-2 rounded-full mt-0.5 transition-all duration-200',
        active ? 'bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.6)]' : 'bg-white/60'
      )} />
    </div>
  )
}

// ── Popup card ─────────────────────────────────────────────────
function ScooterPopupCard({ scooter, onClose }: { scooter: Scooter; onClose: () => void }) {
  return (
    <div className="relative w-[240px] bg-[#0c0e12]/90 backdrop-blur-xl border border-white/10 rounded-[18px] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
      <button onClick={onClose} className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors">
        <X className="w-3.5 h-3.5 text-white/80" />
      </button>
      <ScooterImage
        src={getScooterCover(scooter)}
        alt={scooter.name}
        className="h-28"
        overlay
        sizes="240px"
      />
      <div className="px-3.5 pb-3.5 pt-2.5">
        <p className="font-bold text-[13px] text-white leading-tight truncate pr-6">{scooter.name}</p>
        <div className="flex items-center gap-2 mt-1.5 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
            <span className="text-[11px] font-semibold text-white/80">{scooter.rating}</span>
          </div>
          <span className="text-white/20">·</span>
          <div className="flex items-center gap-1 text-[11px] text-white/50">
            <MapPin className="w-2.5 h-2.5" />{scooter.location}
          </div>
          {scooter.deliveryAvailable && (
            <><span className="text-white/20">·</span>
            <span className="text-[10px] text-[#FF6B35] font-medium flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />Del
            </span></>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[20px] font-bold text-white leading-none">{formatPrice(scooter.pricePerDay)}</span>
            <span className="text-white/40 text-[11px] ml-1">/day</span>
          </div>
          <Link href={`/scooter/${scooter.id}`} className="flex items-center gap-1 px-3.5 py-2 bg-[#FF6B35] text-white text-[11px] font-bold rounded-full hover:bg-[#e85d29] transition-colors shadow-[0_2px_12px_rgba(255,107,53,0.4)]">
            Book <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5">
          {scooter.insuranceIncluded && <span className="text-[10px] text-white/50 flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-[#22c55e]" />Insured</span>}
          {scooter.helmetIncluded && <span className="text-[10px] text-white/50">🪖 Helmet</span>}
        </div>
      </div>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────
function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-[20px] overflow-hidden bg-[#0a0c10] flex items-center justify-center', className)}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="flex flex-col items-center gap-3 relative">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        <span className="text-white/40 text-xs font-medium">Loading map…</span>
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
  className?: string
}

export default function ScooterMap({ scooters, selectedId, hoveredId, onSelect, onHover, className }: ScooterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady] = useState(false)

  // Marker roots: id → { marker, root, container }
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root; container: HTMLDivElement }>>(new Map())
  // Popup root
  const popupRef = useRef<{ popup: mapboxgl.Popup; root: Root; container: HTMLDivElement } | null>(null)

  // ── Init map (once) ──────────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    mapboxgl.accessToken = TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [98.3381, 7.9519],
      zoom: 11,
      attributionControl: false,
    })

    map.on('load', () => {
      try {
        map.setFog({ range: [0.5, 10], color: '#0a0c10', 'high-color': '#0d1520', 'space-color': '#030507', 'star-intensity': 0.1 } as Parameters<typeof map.setFog>[0])
        map.setPaintProperty('water', 'fill-color', '#0d1d2e')
      } catch { /* ignore if layer not available */ }
      setReady(true)
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    // Click on map canvas → deselect
    map.on('click', () => onSelect(null))

    mapRef.current = map
    return () => {
      markersRef.current.forEach(({ marker, root }) => { root.unmount(); marker.remove() })
      markersRef.current.clear()
      popupRef.current?.root.unmount()
      popupRef.current?.popup.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync markers whenever scooters / selected / hovered change ──
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    // Remove markers no longer in scooters list
    const currentIds = new Set(scooters.map(s => s.id))
    markersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.root.unmount()
        entry.marker.remove()
        markersRef.current.delete(id)
      }
    })

    // Add / update markers
    scooters.forEach((scooter, i) => {
      const coords = resolveCoords(scooter, i)
      const active = scooter.id === selectedId || scooter.id === hoveredId

      if (!markersRef.current.has(scooter.id)) {
        // Create new marker
        const container = document.createElement('div')
        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map)
        const root = createRoot(container)
        markersRef.current.set(scooter.id, { marker, root, container })
        // Prevent map click from firing when clicking a marker
        container.addEventListener('click', e => e.stopPropagation())
      }

      // Re-render pin with latest state
      const { root } = markersRef.current.get(scooter.id)!
      root.render(
        <PricePin
          price={scooter.pricePerDay}
          active={active}
          onClick={() => onSelect(scooter.id === selectedId ? null : scooter.id)}
          onEnter={() => onHover?.(scooter.id)}
          onLeave={() => onHover?.(null)}
        />
      )

      // Update z-index via marker element
      const el = markersRef.current.get(scooter.id)!.marker.getElement()
      el.style.zIndex = active ? '20' : '10'
    })

    // ── fitBounds when scooters change ──────────────────────────
    if (scooters.length === 1) {
      const c = resolveCoords(scooters[0], 0)
      map.flyTo({ center: [c.lng, c.lat], zoom: 14, duration: 900 })
    } else if (scooters.length > 1) {
      const coords = scooters.map((s, i) => resolveCoords(s, i))
      const lngs = coords.map(c => c.lng)
      const lats = coords.map(c => c.lat)
      const sw: [number, number] = [Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01]
      const ne: [number, number] = [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]
      map.fitBounds([sw, ne], { padding: { top: 80, bottom: 80, left: 60, right: 60 }, maxZoom: 14, duration: 900 })
    }
  }, [scooters, selectedId, hoveredId, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Popup for selected scooter ─────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.root.unmount()
      popupRef.current.popup.remove()
      popupRef.current = null
    }

    if (!selectedId) return
    const scooter = scooters.find(s => s.id === selectedId)
    if (!scooter) return
    const coords = resolveCoords(scooter, scooters.indexOf(scooter))

    const container = document.createElement('div')
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -8],
      anchor: 'top',
      className: 'scooter-popup',
    })
      .setLngLat([coords.lng, coords.lat])
      .setDOMContent(container)
      .addTo(map)

    const root = createRoot(container)
    root.render(
      <ScooterPopupCard
        scooter={scooter}
        onClose={() => onSelect(null)}
      />
    )

    popupRef.current = { popup, root, container }
  }, [selectedId, scooters, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!TOKEN) {
    return (
      <div className={cn('flex items-center justify-center bg-[#0a0c10] rounded-[20px] border border-white/5', className)}>
        <div className="text-center px-6">
          <p className="text-white/60 text-sm font-medium">Map unavailable</p>
          <code className="text-[10px] text-white/30 mt-1 block">Set NEXT_PUBLIC_MAPBOX_TOKEN</code>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-[20px] overflow-hidden', className)}>
      {!ready && <MapSkeleton className="absolute inset-0 z-10" />}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
