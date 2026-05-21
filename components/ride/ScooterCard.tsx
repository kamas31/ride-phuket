import { memo } from 'react'
import Link from 'next/link'
import { Star, MapPin, Zap, Shield, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { cn, formatPrice, getScooterCover } from '@/lib/utils'
import type { Scooter } from '@/types'

interface ScooterCardProps {
  scooter: Scooter
  className?: string
  compact?: boolean
}

export const ScooterCard = memo(function ScooterCard({ scooter, className, compact = false }: ScooterCardProps) {
  return (
    <Link
      href={`/scooter/${scooter.id}`}
      className={cn(
        'group block bg-white rounded-[20px] overflow-hidden border border-[#e8e8e4] transition-all duration-300',
        'hover:border-[#d0d0cc] hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)]',
        'hover:-translate-y-0.5',
        className
      )}
    >
      {/* Image */}
      <ScooterImage
        src={getScooterCover(scooter)}
        alt={scooter.name}
        className={compact ? 'h-44' : 'h-52'}
        overlay
        hover
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      >
        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {!scooter.available && (
            <span className="px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium rounded-full">
              Unavailable
            </span>
          )}
          {scooter.deliveryAvailable && scooter.available && (
            <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-full flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-[#FF6B35]" />
              Delivery
            </span>
          )}
        </div>

        {/* Top-right: insurance */}
        {scooter.insuranceIncluded && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-full flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-[#22c55e]" />
              Insured
            </span>
          </div>
        )}
      </ScooterImage>

      {/* Content */}
      <div className="p-4">
        {/* Location & Rating */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-[#9c9c98] text-xs">
            <MapPin className="w-3 h-3" />
            <span>{scooter.location}</span>
            {scooter.shop?.verified && (
              <span className="ml-1 text-[#22c55e] font-medium">· Verified</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
            <span className="text-xs font-bold text-[#0f0f0e]">{scooter.rating}</span>
            <span className="text-xs text-[#9c9c98]">({scooter.reviewCount})</span>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-bold text-[15px] text-[#0f0f0e] leading-tight mb-2 group-hover:text-[#FF6B35] transition-colors">
          {scooter.name}
        </h3>

        {/* Category + engine */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={scooter.category === 'automatic' ? 'brand' : 'default'}>
            {scooter.category.charAt(0).toUpperCase() + scooter.category.slice(1)}
          </Badge>
          <span className="text-xs text-[#9c9c98]">{scooter.specs.engine}</span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[22px] font-bold text-[#0f0f0e] leading-none">
              {formatPrice(scooter.pricePerDay)}
            </span>
            <span className="text-[#9c9c98] text-sm ml-1">/day</span>
          </div>
          {scooter.pricePerWeek && (
            <span className="text-[11px] text-[#9c9c98]">
              {formatPrice(scooter.pricePerWeek)}/wk
            </span>
          )}
        </div>

        {/* Trust micro-row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#f0f0ec]">
          {scooter.helmetIncluded && (
            <span className="flex items-center gap-1 text-[11px] text-[#9c9c98]">
              <Check className="w-3 h-3 text-[#22c55e]" />
              Helmet
            </span>
          )}
          {scooter.insuranceIncluded && (
            <span className="flex items-center gap-1 text-[11px] text-[#9c9c98]">
              <Check className="w-3 h-3 text-[#22c55e]" />
              Insurance
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-[#9c9c98] ml-auto">
            <Check className="w-3 h-3 text-[#22c55e]" />
            Free cancel
          </span>
        </div>
      </div>
    </Link>
  )
})
