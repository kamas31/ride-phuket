'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, X, ArrowRight, Zap, Shield } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { Scooter } from '@/types'

// ── Mapbox config ──────────────────────────────────────────────
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
const PHUKET = { longitude: 98.3381, latitude: 7.9519, zoom: 11 }

// ── Area coordinate fallbacks (when scooter has default 7.95/98.34) ──
const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  'patong':       { lat: 7.8956, lng: 98.2966 },
  'kata':         { lat: 7.8203, lng: 98.2986 },
  'karon':        { lat: 7.8347, lng: 98.2987 },
  'rawai':        { lat: 7.7781, lng: 98.3281 },
  'bang tao':     { lat: 8.0000, lng: 98.2900 },
  'phuket town':  { lat: 7.8804, lng: 98.3881 },
  'kamala':       { lat: 7.9476, lng: 98.2734 },
  'surin':        { lat: 7.9714, lng: 98.2800 },
}

function resolveCoords(scooter: Scooter, index: number): { lat: number; lng: number } {
  const isDefault = Math.abs(scooter.lat - 7.95) < 0.01 && Math.abs(scooter.lng - 98.34) < 0.01
  if (!isDefault) return { lat: scooter.lat, lng: scooter.lng }

  // Try area-based fallback
  const loc = scooter.location.toLowerCase()
  for (const [key, coords] of Object.entries(AREA_COORDS)) {
    if (loc.includes(key)) {
      // Spread nearby pins so they don't overlap
      const jitter = (index % 5) * 0.003
      return { lat: coords.lat + jitter, lng: coords.lng + jitter }
    }
  }
  // Final fallback: scatter around Phuket center
  const jitter = (index % 8) * 0.015
  return { lat: 7.9519 + jitter * 0.3, lng: 98.3381 + jitter }
}

// ── Price Pin ──────────────────────────────────────────────────
function PricePin({
  price, isSelected, isHovered, onClick, onEnter, onLeave
}: {
  price: number
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onEnter: () => void
  onLeave: () => void
}) {
  const active = isSelected || isHovered
  return (
    <div
      className="relative flex flex-col items-center select-none"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Pill */}
      <div
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200',
          active
            ? 'bg-[#FF6B35] text-white shadow-[0_0_0_3px_rgba(255,107,53,0.25),0_4px_20px_rgba(255,107,53,0.5)] scale-110'
            : 'bg-[#0f0f0e]/85 backdrop-blur-md text-white border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.5)] hover:bg-[#1a1a18] hover:scale-105'
        )}
      >
        {formatPrice(price)}
      </div>
      {/* Tail dot */}
      <div className={cn(
        'w-2 h-2 rounded-full mt-0.5 transition-all duration-200',
        active ? 'bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.6)]' : 'bg-white/60'
      )} />
    </div>
  )
}

// ── Scooter Popup ──────────────────────────────────────────────
function ScooterPopup({ scooter, onClose }: { scooter: Scooter; onClose: () => void }) {
  return (
    <div className="relative w-[240px] bg-[#0c0e12]/90 backdrop-blur-xl border border-white/10 rounded-[18px] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
      >
        <X className="w-3.5 h-3.5 text-white/80" />
      </button>

      {/* Image */}
      {scooter.images?.[0] ? (
        <div className="relative h-28 bg-[#1a1c20]">
          <Image
            src={scooter.images[0]}
            alt={scooter.name}
            fill
            className="object-cover opacity-90"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e12]/60 to-transparent" />
        </div>
      ) : (
        <div className="h-16 bg-[#1a1c20] flex items-center justify-center text-2xl">🛵</div>
      )}

      {/* Content */}
      <div className="px-3.5 pb-3.5 pt-2.5">
        {/* Name */}
        <p className="font-bold text-[13px] text-white leading-tight truncate pr-6">{scooter.name}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
            <span className="text-[11px] font-semibold text-white/80">{scooter.rating}</span>
          </div>
          <span className="text-white/20">·</span>
          <div className="flex items-center gap-1 text-[11px] text-white/50">
            <MapPin className="w-2.5 h-2.5" />
            {scooter.location}
          </div>
          {scooter.deliveryAvailable && (
            <>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-0.5 text-[10px] text-[#FF6B35] font-medium">
                <Zap className="w-2.5 h-2.5" />
                Delivery
              </div>
            </>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[20px] font-bold text-white leading-none">
              {formatPrice(scooter.pricePerDay)}
            </span>
            <span className="text-white/40 text-[11px] ml-1">/day</span>
          </div>
          <Link
            href={`/scooter/${scooter.id}`}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#FF6B35] text-white text-[11px] font-bold rounded-full hover:bg-[#e85d29] transition-colors shadow-[0_2px_12px_rgba(255,107,53,0.4)]"
          >
            Book <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {scooter.insuranceIncluded && (
            <span className="flex items-center gap-1 text-[10px] text-white/50">
              <Shield className="w-2.5 h-2.5 text-[#22c55e]" />Insured
            </span>
          )}
          {scooter.helmetIncluded && (
            <span className="text-[10px] text-white/50">🪖 Helmet</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────
function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-[20px] overflow-hidden bg-[#0a0c10]', className)}>
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Pulsing roads */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-xs font-medium">Loading map…</span>
        </div>
      </div>
      {/* Fake pins skeleton */}
      {[
        { left: '35%', top: '30%' }, { left: '55%', top: '45%' },
        { left: '45%', top: '60%' }, { left: '28%', top: '55%' },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute bg-white/10 rounded-full animate-pulse"
          style={{ ...pos, width: 60, height: 24, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
interface ScooterMapProps {
  scooters: Scooter[]
  selectedId?: string
  hoveredId?: string
  onSelect: (id: string | null) => void
  onHover?: (id: string | null) => void
  className?: string
}

export default function ScooterMap({
  scooters, selectedId, hoveredId, onSelect, onHover, className
}: ScooterMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [ready, setReady] = useState(false)
  const [popupScooter, setPopupScooter] = useState<Scooter | null>(null)

  // Resolve coordinates once
  const scooterCoords = scooters.map((s, i) => ({
    scooter: s,
    ...resolveCoords(s, i),
  }))

  // Cinematic fog on map load
  const handleLoad = useCallback(() => {
    setReady(true)
    const map = mapRef.current?.getMap()
    if (!map) return
    try {
      map.setFog({
        range: [0.5, 10],
        color: '#0a0c10',
        'high-color': '#0d1520',
        'space-color': '#030507',
        'star-intensity': 0.1,
        'horizon-blend': 0.03,
      })
      // Subtle warm tint on water
      map.setPaintProperty('water', 'fill-color', '#0d1d2e')
    } catch { /* ignore */ }
  }, [])

  // fitBounds whenever filtered scooters change
  useEffect(() => {
    if (!ready || !mapRef.current || scooterCoords.length === 0) return
    if (scooterCoords.length === 1) {
      mapRef.current.flyTo({
        center: [scooterCoords[0].lng, scooterCoords[0].lat],
        zoom: 13, duration: 1000,
      })
      return
    }
    const lngs = scooterCoords.map(s => s.lng)
    const lats = scooterCoords.map(s => s.lat)
    const sw: [number, number] = [Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01]
    const ne: [number, number] = [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]
    mapRef.current.fitBounds([sw, ne], {
      padding: { top: 80, bottom: 80, left: 60, right: 60 },
      maxZoom: 14,
      duration: 900,
    })
  }, [scooters, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync popup with selectedId
  useEffect(() => {
    if (!selectedId) { setPopupScooter(null); return }
    const s = scooters.find(s => s.id === selectedId)
    setPopupScooter(s ?? null)
  }, [selectedId, scooters])

  if (!TOKEN) {
    return (
      <div className={cn('flex items-center justify-center bg-[#0a0c10] rounded-[20px] border border-white/5', className)}>
        <div className="text-center px-6">
          <div className="text-3xl mb-3">🗺️</div>
          <p className="text-white/60 text-sm font-medium">Map unavailable</p>
          <code className="text-[10px] text-white/30 mt-1 block">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-[20px] overflow-hidden', className)}>
      {/* Loading overlay */}
      {!ready && <MapSkeleton className="absolute inset-0 z-10" />}

      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        initialViewState={PHUKET}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={handleLoad}
        reuseMaps
        style={{ width: '100%', height: '100%' }}
        onClick={(e: MapMouseEvent) => {
          // Click on empty map area → deselect
          if ((e.originalEvent.target as HTMLElement).closest('.mapboxgl-marker') === null) {
            onSelect(null)
          }
        }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Markers */}
        {scooterCoords.map(({ scooter, lat, lng }) => (
          <Marker
            key={scooter.id}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            style={{ zIndex: scooter.id === selectedId || scooter.id === hoveredId ? 20 : 10 }}
          >
            <PricePin
              price={scooter.pricePerDay}
              isSelected={scooter.id === selectedId}
              isHovered={scooter.id === hoveredId}
              onClick={() => {
                onSelect(scooter.id === selectedId ? null : scooter.id)
              }}
              onEnter={() => onHover?.(scooter.id)}
              onLeave={() => onHover?.(null)}
            />
          </Marker>
        ))}

        {/* Popup */}
        {popupScooter && (() => {
          const coords = scooterCoords.find(s => s.scooter.id === popupScooter.id)
          if (!coords) return null
          return (
            <Popup
              longitude={coords.lng}
              latitude={coords.lat}
              anchor="top"
              offset={[0, -4] as [number, number]}
              closeOnClick={false}
              closeButton={false}
              onClose={() => { onSelect(null); setPopupScooter(null) }}
            >
              <ScooterPopup
                scooter={popupScooter}
                onClose={() => { onSelect(null); setPopupScooter(null) }}
              />
            </Popup>
          )
        })()}
      </Map>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[10px] text-white/30 pointer-events-none">
        © Mapbox
      </div>
    </div>
  )
}
