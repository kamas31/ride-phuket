'use client'

import { MapPin, Navigation, Plus, Minus } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { Scooter } from '@/types'

interface MapPlaceholderProps {
  scooters: Scooter[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}

// Approximate Phuket island pin layout (matches real lat/lng distribution)
const PIN_POSITIONS = [
  { x: 40, y: 22 },  // Patong / north-west
  { x: 46, y: 28 },  // Patong center
  { x: 62, y: 38 },  // Phuket Town / east
  { x: 38, y: 52 },  // Kata / Karon
  { x: 44, y: 60 },  // Rawai
  { x: 50, y: 66 },  // Rawai south
]

export function MapPlaceholder({ scooters, selectedId, onSelect, className }: MapPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative rounded-[20px] overflow-hidden border border-[#e0ece6]',
        className
      )}
      style={{
        background: 'linear-gradient(165deg, #e4f0eb 0%, #d4e8df 35%, #c6e0d8 60%, #b8d8d0 100%)',
      }}
    >
      {/* Satellite-style SVG map of Phuket island silhouette */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {/* Sea / ocean base */}
        <rect width="100%" height="100%" fill="#a8d4e8" opacity="0.25" />

        {/* Phuket island shape (approximate) */}
        <path
          d="M 200,30 C 240,25 280,40 300,80 C 320,120 310,160 290,200 C 270,240 260,280 250,320 C 240,360 245,400 230,440 C 215,480 190,500 170,490 C 150,480 140,450 145,420 C 150,390 160,370 155,340 C 150,310 130,290 125,260 C 120,230 130,200 140,170 C 150,140 160,110 155,80 C 150,50 175,35 200,30 Z"
          fill="#c8ddd6"
          opacity="0.6"
          transform="scale(0.55) translate(160, 20)"
        />

        {/* Roads */}
        <line x1="24%" y1="0" x2="28%" y2="100%" stroke="#b8cfc8" strokeWidth="3" opacity="0.6" />
        <line x1="48%" y1="5%" x2="52%" y2="95%" stroke="#b8cfc8" strokeWidth="2.5" opacity="0.5" />
        <line x1="0" y1="38%" x2="100%" y2="42%" stroke="#b8cfc8" strokeWidth="2" opacity="0.45" />
        <line x1="0" y1="62%" x2="100%" y2="65%" stroke="#b8cfc8" strokeWidth="2" opacity="0.4" />
        <line x1="30%" y1="25%" x2="55%" y2="55%" stroke="#b8cfc8" strokeWidth="1.5" opacity="0.4" />

        {/* Sea left */}
        <ellipse cx="10%" cy="50%" rx="14%" ry="35%" fill="#7eb8d4" opacity="0.3" />
        {/* Andaman sea label area (subtle) */}
        <ellipse cx="88%" cy="35%" rx="16%" ry="25%" fill="#7eb8d4" opacity="0.2" />
      </svg>

      {/* Location text watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <p className="text-[#a0bcb4]/40 font-bold text-[11px] uppercase tracking-[0.3em] rotate-[-8deg]">
          Phuket · Thailand
        </p>
      </div>

      {/* Price pins */}
      {scooters.slice(0, 6).map((scooter, i) => {
        const pos = PIN_POSITIONS[i] ?? { x: 50 + i * 5, y: 50 }
        const isSelected = scooter.id === selectedId
        return (
          <button
            key={scooter.id}
            onClick={() => onSelect?.(scooter.id)}
            className={cn(
              'absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 z-10 group/pin',
              isSelected ? 'scale-110 z-20' : 'hover:scale-[1.08] hover:z-20'
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            aria-label={`${scooter.name} — ${formatPrice(scooter.pricePerDay)}/day`}
          >
            <div
              className={cn(
                'px-2.5 py-1.5 rounded-full text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-2 whitespace-nowrap transition-all',
                isSelected
                  ? 'bg-[#FF6B35] text-white border-white shadow-[0_4px_16px_rgba(255,107,53,0.45)]'
                  : 'bg-white text-[#0f0f0e] border-white group-hover/pin:bg-[#FF6B35] group-hover/pin:text-white'
              )}
            >
              {formatPrice(scooter.pricePerDay)}
            </div>
            {/* Pin tail */}
            <div
              className={cn(
                'w-2 h-2 rounded-full mx-auto -mt-0.5 shadow-sm',
                isSelected ? 'bg-[#FF6B35]' : 'bg-[#0f0f0e]'
              )}
            />
          </button>
        )
      })}

      {/* Top-left: location label */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-[#0f0f0e] shadow-sm border border-white/50">
        <MapPin className="w-3 h-3 text-[#FF6B35]" />
        Phuket Island
      </div>

      {/* Zoom controls (cosmetic) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm hover:bg-white transition-colors border border-white/50">
          <Plus className="w-3.5 h-3.5 text-[#0f0f0e]" />
        </button>
        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm hover:bg-white transition-colors border border-white/50">
          <Minus className="w-3.5 h-3.5 text-[#0f0f0e]" />
        </button>
      </div>

      {/* My location button */}
      <button className="absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center hover:bg-white transition-colors border border-white/50">
        <Navigation className="w-4 h-4 text-[#FF6B35]" />
      </button>

      {/* "Mapbox coming" subtle label */}
      <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/70 backdrop-blur-sm rounded-full text-[10px] font-medium text-[#9c9c98] border border-white/30">
        Full map coming soon
      </div>
    </div>
  )
}
