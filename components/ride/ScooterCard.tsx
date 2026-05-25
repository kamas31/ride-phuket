'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Star, MapPin, Zap, Shield, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { SaveButton } from '@/components/ride/SaveButton'
import { TrustBadge, isNewListing } from '@/components/ride/TrustBadge'
import { cn, formatPrice, getScooterCover } from '@/lib/utils'
import type { Scooter } from '@/types'

interface ScooterCardProps {
  scooter: Scooter
  className?: string
  compact?: boolean
  xs?: boolean  // 2-column mobile grid: aspect-ratio image, minimal content
}

export const ScooterCard = memo(function ScooterCard({ scooter, className, compact = false, xs = false }: ScooterCardProps) {
  // xs variant: used in 2-column mobile grids. Shows essential info only.
  if (xs) return (
    <Link
      href={`/scooter/${scooter.id}`}
      className={cn(
        'group block bg-white rounded-[16px] overflow-hidden border border-[#e8e8e4] transition-all duration-200',
        'active:scale-[0.97] active:shadow-none',
        className
      )}
    >
      <ScooterImage
        src={getScooterCover(scooter)}
        alt={scooter.name}
        className="aspect-[4/3]"
        objectFit="contain"
        hover
        sizes="(max-width: 640px) 50vw, 33vw"
      />
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-0.5">
          {scooter.reviewCount > 0 ? (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
              <span className="text-[10px] font-bold text-[#0f0f0e]">{scooter.rating.toFixed(1)}</span>
            </div>
          ) : (
            <TrustBadge variant="new_listing" size="xs" />
          )}
          {!scooter.available && (
            <span className="text-[9px] text-[#9c9c98]">Unavail.</span>
          )}
        </div>
        <h3 className="font-bold text-[12px] text-[#0f0f0e] leading-tight truncate mb-0.5 group-hover:text-[#FF6B35] transition-colors">
          {scooter.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-[13px] font-bold text-[#0f0f0e] leading-none">{formatPrice(scooter.pricePerDay)}</span>
          <span className="text-[10px] text-[#9c9c98]">/day</span>
        </div>
      </div>
    </Link>
  )

  return (
    <Link
      href={`/scooter/${scooter.id}`}
      className={cn(
        'group block bg-white rounded-[20px] overflow-hidden border border-[#e8e8e4] transition-all duration-300',
        'hover:border-[#d0d0cc] hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)]',
        'hover:-translate-y-0.5',
        'active:scale-[0.98] active:shadow-none active:translate-y-0',
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

        {/* Top-right: save heart + trust indicators */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <SaveButton scooterId={scooter.id} size="sm" />
          {scooter.shop?.verified && (
            <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-full flex items-center gap-1">
              <Check className="w-2.5 h-2.5 text-[#22c55e]" />
              Verified
            </span>
          )}
          {scooter.insuranceIncluded && !scooter.shop?.verified && (
            <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-full flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-[#22c55e]" />
              Shop insured
            </span>
          )}
        </div>
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
          {/* Only show rating when there are real reviews — never show hardcoded 4.8 */}
          {scooter.reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
              <span className="text-xs font-bold text-[#0f0f0e]">{scooter.rating.toFixed(1)}</span>
              <span className="text-xs text-[#9c9c98]">({scooter.reviewCount})</span>
            </div>
          ) : isNewListing(scooter.createdAt) ? (
            <TrustBadge variant="new_listing" />
          ) : null}
        </div>

        {/* Name */}
        <h3 className="font-bold text-[15px] text-[#0f0f0e] leading-tight mb-2 group-hover:text-[#FF6B35] transition-colors">
          {scooter.name}
        </h3>

        {/* Category + engine */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={scooter.category === 'automatic' ? 'brand' : 'default'}>
            {scooter.category ? scooter.category.charAt(0).toUpperCase() + scooter.category.slice(1) : 'Scooter'}
          </Badge>
          <span className="text-xs text-[#9c9c98]">{scooter.specs?.engine}</span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex-shrink-0">
            <span className="text-[22px] font-bold text-[#0f0f0e] leading-none">
              {formatPrice(scooter.pricePerDay)}
            </span>
            <span className="text-[#9c9c98] text-sm ml-1">/day</span>
          </div>
          {(scooter.pricePerWeek || scooter.pricePerMonth) && (
            <div className="text-right flex-shrink-0 space-y-0.5 pb-0.5">
              {scooter.pricePerWeek && (
                <div className="text-[11px] text-[#9c9c98] leading-tight">
                  {formatPrice(scooter.pricePerWeek)}/wk
                </div>
              )}
              {scooter.pricePerMonth && (
                <div className="text-[11px] text-[#9c9c98] leading-tight">
                  {formatPrice(scooter.pricePerMonth)}/mo
                </div>
              )}
            </div>
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
              Shop insured
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-[#9c9c98] ml-auto">
            <Check className="w-3 h-3 text-[#22c55e]" />
            Flexible terms
          </span>
        </div>
      </div>
    </Link>
  )
})
