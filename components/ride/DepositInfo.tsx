import { Shield, Lock, Check, Info } from 'lucide-react'
import { TrustBadge } from '@/components/ride/TrustBadge'
import { formatPrice } from '@/lib/utils'
import type { DepositType } from '@/types'

interface DepositInfoProps {
  depositAmount?: number
  depositType?: DepositType
  // Legacy fields kept in interface for call-site compatibility — not used for display
  passportRequired?: boolean
  passportCopyAllowed?: boolean
  isPremiumBike?: boolean
  depositNotes?: string
  depositProtected?: boolean
  className?: string
}

export function DepositInfo({
  depositAmount,
  depositType,
  depositNotes,
  depositProtected = false,
  className,
}: DepositInfoProps) {
  const hasInfo = depositAmount || depositType || depositProtected
  if (!hasInfo) return null

  const needsPassport = depositType === 'passport'

  return (
    <div className={className}>
      <h2 className="text-[16px] font-bold text-[#0f0f0e] mb-3 flex items-center gap-2">
        {needsPassport
          ? <Lock className="w-4 h-4 text-[#2563eb]" />
          : <Shield className="w-4 h-4 text-[#FF6B35]" />}
        Deposit &amp; Security
      </h2>

      <div className="bg-[#f8f8f6] rounded-[16px] p-4 border border-[#e8e8e4] space-y-3">

        {/* ── CASH ────────────────────────────────────────────────── */}
        {depositType === 'cash' && (
          <>
            {depositAmount ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5c5c58]">Deposit</span>
                <span className="text-sm font-bold text-[#0f0f0e]">
                  {formatPrice(depositAmount)} <span className="font-normal text-[#9c9c98]">refundable</span>
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-sm text-[#22c55e]">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">No passport required</span>
            </div>
          </>
        )}

        {/* ── PASSPORT ────────────────────────────────────────────── */}
        {depositType === 'passport' && (
          <>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#2563eb] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#0f0f0e] font-medium leading-snug">
                Original passport required as deposit
              </p>
            </div>
            <p className="text-xs text-[#5c5c58] leading-relaxed">
              Your original passport is held by the shop and returned in full on
              drop-off. A passport copy is not accepted.
            </p>
          </>
        )}

        {/* ── CASH + PASSPORT (renter chooses either) ─────────────── */}
        {depositType === 'both' && (
          <>
            <p className="text-sm font-semibold text-[#0f0f0e]">Choose one deposit option:</p>
            {depositAmount ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5c5c58]">💵 Cash deposit</span>
                <span className="text-sm font-bold text-[#0f0f0e]">
                  {formatPrice(depositAmount)} <span className="font-normal text-[#9c9c98]">refundable</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
                <span>💵 Refundable cash deposit</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
              <span>🛂 Original passport (returned on drop-off)</span>
            </div>
          </>
        )}

        {/* ── NONE ────────────────────────────────────────────────── */}
        {depositType === 'none' && (
          <div className="flex items-center gap-2 text-sm text-[#22c55e]">
            <Check className="w-4 h-4" />
            <span className="font-medium">No deposit required</span>
          </div>
        )}

        {/* ── OTHER TYPES (card_hold, flexible) ───────────────────── */}
        {depositType && !['cash', 'passport', 'both', 'none'].includes(depositType) && (
          <>
            {depositAmount ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5c5c58]">Deposit</span>
                <span className="text-sm font-bold text-[#0f0f0e]">
                  {formatPrice(depositAmount)} <span className="font-normal text-[#9c9c98]">refundable</span>
                </span>
              </div>
            ) : null}
          </>
        )}

        {/* Deposit notes */}
        {depositNotes && (
          <p className="text-xs text-[#9c9c98] leading-relaxed border-t border-[#efefed] pt-2">
            {depositNotes}
          </p>
        )}

        {/* Protection badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {depositProtected && <TrustBadge variant="deposit_protected" size="xs" />}
          {needsPassport  && <TrustBadge variant="premium_deposit" size="xs" />}
        </div>
      </div>
    </div>
  )
}
