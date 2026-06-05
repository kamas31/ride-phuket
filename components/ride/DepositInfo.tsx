import { Shield, Lock, Check, Info } from 'lucide-react'
import { TrustBadge } from '@/components/ride/TrustBadge'
import { formatPrice } from '@/lib/utils'
import type { DepositType } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// DepositInfo — displays deposit rules and protection status
//
// Adapts automatically:
//   Standard scooters  → low deposit, copy OK, no passport
//   Premium bikes      → higher deposit, passport may be required
//
// Business rule: passport requirements for 500cc+ / high-value bikes
// are NORMAL and should be presented as professional/secure, not as a
// risk signal. We use a blue "Secured Deposit" badge, not a warning.
// ─────────────────────────────────────────────────────────────────────────────

const DEPOSIT_TYPE_LABELS: Record<DepositType, string> = {
  cash:      'Cash deposit (refundable)',
  card_hold: 'Credit card hold',
  flexible:  'Cash or card hold',
  none:      'No deposit required',
  passport:  'Passport deposit',
  both:      'Cash or passport deposit',
}

const ACCEPTED_ICONS: Record<string, string> = {
  cash:       '💵',
  card_hold:  '💳',
  flexible:   '💵 / 💳',
  passport:   '🛂',
  both:       '💵 / 🛂',
}

interface DepositInfoProps {
  depositAmount?: number
  depositType?: DepositType
  passportRequired?: boolean
  passportCopyAllowed?: boolean
  isPremiumBike?: boolean
  depositNotes?: string
  depositProtected?: boolean  // shop enrolled in Deposit Protection program
  className?: string
}

export function DepositInfo({
  depositAmount,
  depositType,
  passportRequired = false,
  passportCopyAllowed = true,
  isPremiumBike = false,
  depositNotes,
  depositProtected = false,
  className,
}: DepositInfoProps) {
  // Nothing to show if no deposit info is configured
  const hasInfo = depositAmount || depositType || depositProtected || isPremiumBike

  if (!hasInfo) return null

  return (
    <div className={className}>
      <h2 className="text-[16px] font-bold text-[#0f0f0e] mb-3 flex items-center gap-2">
        {isPremiumBike ? <Lock className="w-4 h-4 text-[#2563eb]" /> : <Shield className="w-4 h-4 text-[#FF6B35]" />}
        {isPremiumBike ? 'Premium Bike Deposit' : 'Deposit & Security'}
      </h2>

      <div className="bg-[#f8f8f6] rounded-[16px] p-4 border border-[#e8e8e4] space-y-3">
        {/* Deposit amount */}
        {depositAmount && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#5c5c58]">Deposit</span>
            <span className="text-sm font-bold text-[#0f0f0e]">
              {formatPrice(depositAmount)} <span className="font-normal text-[#9c9c98]">refundable</span>
            </span>
          </div>
        )}

        {/* Deposit type */}
        {depositType && depositType !== 'none' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#5c5c58]">Accepted</span>
            <span className="text-sm text-[#0f0f0e]">
              {ACCEPTED_ICONS[depositType] ?? ''} {DEPOSIT_TYPE_LABELS[depositType]}
            </span>
          </div>
        )}

        {depositType === 'none' && (
          <div className="flex items-center gap-2 text-sm text-[#22c55e]">
            <Check className="w-4 h-4" />
            <span className="font-medium">No deposit required</span>
          </div>
        )}

        {/* Passport rules */}
        {isPremiumBike && passportRequired ? (
          <div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#2563eb] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#5c5c58] leading-relaxed">
                Passport required for this premium bike. Standard practice for
                motorcycles valued above ฿300,000. Your document is returned on drop-off.
              </p>
            </div>
          </div>
        ) : passportCopyAllowed ? (
          <div className="flex items-center gap-2 text-sm text-[#22c55e]">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Passport copy accepted — original not required</span>
          </div>
        ) : null}

        {/* Deposit notes */}
        {depositNotes && (
          <p className="text-xs text-[#9c9c98] leading-relaxed border-t border-[#efefed] pt-2">
            {depositNotes}
          </p>
        )}

        {/* Protection badges row */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {depositProtected && <TrustBadge variant="deposit_protected" size="xs" />}
          {isPremiumBike && passportRequired
            ? <TrustBadge variant="premium_deposit" size="xs" />
            : passportCopyAllowed
            ? <TrustBadge variant="passport_copy" size="xs" />
            : null
          }
          {!passportRequired && !isPremiumBike && <TrustBadge variant="no_passport" size="xs" />}
        </div>
      </div>

    </div>
  )
}
