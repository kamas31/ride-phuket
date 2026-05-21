import { Shield, Zap, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// TrustBadge — real trust signals only, no fake metrics
//
// Every variant maps to a concrete DB field or verifiable fact:
//   verified     → shop.verified (manually reviewed by operator)
//   insurance    → scooter.insuranceIncluded
//   delivery     → scooter.deliveryAvailable
//   helmet       → scooter.helmetIncluded
//   new_listing  → scooter.createdAt < 30 days ago
//   new_partner  → shop.verified + shop.reviewCount === 0
//   fast_response → shop.responseTime includes "< 15"
// ─────────────────────────────────────────────────────────────

export type TrustBadgeVariant =
  | 'verified'
  | 'insurance'
  | 'delivery'
  | 'helmet'
  | 'new_listing'
  | 'new_partner'
  | 'fast_response'

interface TrustBadgeProps {
  variant: TrustBadgeVariant
  size?: 'xs' | 'sm'
  className?: string
}

type BadgeConfig = {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  cls: string
}

const CONFIG: Record<TrustBadgeVariant, BadgeConfig> = {
  verified: {
    label: 'Verified shop',
    icon: Check,
    cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  },
  insurance: {
    label: 'Insured',
    icon: Shield,
    cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  },
  delivery: {
    label: 'Delivery',
    icon: Zap,
    cls: 'bg-[#fff4f0] text-[#FF6B35] border-[#fed7b0]',
  },
  helmet: {
    label: 'Helmet',
    cls: 'bg-[#f8f8f6] text-[#5c5c58] border-[#e8e8e4]',
  },
  new_listing: {
    label: 'New listing',
    cls: 'bg-[#fff4f0] text-[#e85d29] border-[#fed7b0]',
  },
  new_partner: {
    label: 'New partner',
    cls: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]',
  },
  fast_response: {
    label: 'Fast response',
    icon: Zap,
    cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  },
}

export function TrustBadge({ variant, size = 'xs', className }: TrustBadgeProps) {
  const { label, icon: Icon, cls } = CONFIG[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        cls,
        className,
      )}
    >
      {Icon && <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {label}
    </span>
  )
}

// ── Utility helpers ───────────────────────────────────────────

/** True if the listing was added within the last 30 days */
export function isNewListing(createdAt?: string): boolean {
  if (!createdAt) return false
  return (Date.now() - new Date(createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
}

/** True if the shop responds fast (responseTime field includes "< 15" or "5" etc.) */
export function isFastResponder(responseTime?: string): boolean {
  if (!responseTime) return false
  return /< ?(5|10|15)\s*min/i.test(responseTime)
}
