'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Star, MapPin, Zap, Check } from 'lucide-react'
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

// Unified glass pill for image overlays
function OverlayBadge({
  icon: Icon,
  label,
  iconCls,
}: {
  icon?: React.ElementType
  label: string
  iconCls?: string
}) {
  return (
    <span className="flex items-center gap-1 px-2 py-[5px] bg-black/45 backdrop-blur-[6px] border border-white/[0.12] rounded-full text-white text-[10px] font-medium leading-none whitespace-nowrap">
      {Icon && <Icon className={cn('w-2.5 h-2.5 flex-shrink-0', iconCls)} />}
      {label}
    </span>
  )
}

export const ScooterCard = memo(function ScooterCard({ scooter, className, compact = false, xs = false }: ScooterCardProps) {
  // xs variant: minimal 2-column mobile grid card
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
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[13px] font-bold text-[#0f0f0e] leading-none tabular-nums">{formatPrice(scooter.pricePerDay)}</span>
            <span className="text-[10px] text-[#9c9c98]">/day</span>
          </div>
          {(scooter.pricePerWeek || scooter.pricePerMonth) && (
            <p className="text-[10px] text-[#9c9c98] leading-tight tabular-nums">
              {[
                scooter.pricePerWeek  && `${formatPrice(scooter.pricePerWeek)}/wk`,
                scooter.pricePerMonth && `${formatPrice(scooter.pricePerMonth)}/mo`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </Link>
  )

  // Build overlay badges: top-left, horizontal, max 2
  // Priority: Unavailable > Delivery > Insured
  const overlayBadges: Array<{ key: string; icon?: React.ElementType; label: string; iconCls?: string }> = []
  if (!scooter.available) {
    overlayBadges.push({ key: 'unavailable', label: 'Unavailable' })
  } else {
    if (scooter.deliveryAvailable) {
      overlayBadges.push({ key: 'delivery', icon: Zap, label: 'Delivery', iconCls: 'text-[#FF6B35]' })
    }
  }
  const visibleBadges = overlayBadges.slice(0, 2)

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
        className={compact ? 'h-40 sm:h-44' : 'h-40 sm:h-52'}
        overlay
        hover
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
      >
        {/* Top-left: badges — horizontal row, max 2 */}
        {visibleBadges.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {visibleBadges.map(b => (
              <OverlayBadge key={b.key} icon={b.icon} label={b.label} iconCls={b.iconCls} />
            ))}
          </div>
        )}

        {/* Top-right: save heart only */}
        <div className="absolute top-2.5 right-2.5">
          <SaveButton scooterId={scooter.id} size="sm" />
        </div>
      </ScooterImage>

      {/* Content */}
      <div className="p-3 sm:p-4">

        {/* Location & Rating */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1 text-[#9c9c98] text-[10px] sm:text-xs min-w-0">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
            <span className="truncate">{scooter.location}</span>
          </div>
          {/* Only show rating when there are real reviews — never show hardcoded 4.8 */}
          {scooter.reviewCount > 0 ? (
            <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
              <Star className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
              <span className="text-[10px] sm:text-xs font-bold text-[#0f0f0e]">{scooter.rating.toFixed(1)}</span>
              <span className="hidden sm:inline text-xs text-[#9c9c98] ml-0.5">({scooter.reviewCount})</span>
            </div>
          ) : isNewListing(scooter.createdAt) ? (
            <TrustBadge variant="new_listing" />
          ) : null}
        </div>

        {/* Name */}
        <h3 className="font-bold text-[13px] sm:text-[15px] text-[#0f0f0e] leading-tight mb-2 group-hover:text-[#FF6B35] transition-colors line-clamp-1">
          {scooter.name}
        </h3>

        {/* Category + engine — hidden on mobile (too cramped in 2-col grid) */}
        <div className="hidden sm:flex items-center gap-2 mb-3">
          <Badge variant={scooter.category === 'automatic' ? 'brand' : 'default'}>
            {scooter.category ? scooter.category.charAt(0).toUpperCase() + scooter.category.slice(1) : 'Scooter'}
          </Badge>
          <span className="text-xs text-[#9c9c98]">{scooter.specs?.engine}</span>
        </div>

        {/* Price — daily anchor, wk/mo secondary */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[16px] sm:text-[18px] font-bold text-[#0f0f0e] leading-none tabular-nums">
              {formatPrice(scooter.pricePerDay)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#9c9c98]">/day</span>
          </div>
          {(scooter.pricePerWeek || scooter.pricePerMonth) && (
            <p className="text-[11px] sm:text-[12px] text-[#9c9c98] leading-tight tabular-nums">
              {[
                scooter.pricePerWeek  && `${formatPrice(scooter.pricePerWeek)}/wk`,
                scooter.pricePerMonth && `${formatPrice(scooter.pricePerMonth)}/mo`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Trust micro-row */}
        <div className="flex items-center gap-1.5 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-[#f0f0ec]">
          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#22c55e] flex-shrink-0" />
          <span className="text-[9px] sm:text-[11px] text-[#9c9c98] truncate">
            {[
              scooter.helmetIncluded && 'Helmet',
              scooter.insuranceIncluded && 'Insured',
              'Flexible terms',
            ].filter(Boolean).join(' · ')}
          </span>
        </div>

      </div>
    </Link>
  )
})
