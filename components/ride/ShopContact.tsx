import { Lock, Zap, Shield, Check } from 'lucide-react'
import { TrustBadge, isFastResponder } from '@/components/ride/TrustBadge'
import { QuickContact } from '@/components/ride/QuickContact'
import { InquiryChips } from '@/components/ride/InquiryChips'
import { getShopAlias } from '@/lib/zones'
import type { WATemplate, WAContext } from '@/lib/whatsapp'

// ─────────────────────────────────────────────────────────────────────────────
// ShopContact — respects the locked / unlocked state
//
// BEFORE booking confirmed (isUnlocked = false):
//   → Shows alias ("Verified Rawai Partner")
//   → Response time + trust badges (no contact info)
//   → InquiryChips (internal messaging, no direct WA)
//
// AFTER booking confirmed (isUnlocked = true):
//   → Shows real shop name, WhatsApp, phone (QuickContact)
//   → Full contact information
//
// This is the Airbnb model: protect identity pre-booking, reveal post-booking.
// ─────────────────────────────────────────────────────────────────────────────

interface ShopContactProps {
  shop: {
    id: string
    name: string
    location: string
    verified: boolean
    reviewCount: number
    responseTime?: string
    whatsapp?: string
    phone?: string
  }
  scooterId: string
  isUnlocked: boolean
  context?: WAContext
  questions?: WATemplate[]
  className?: string
}

export function ShopContact({
  shop,
  scooterId,
  isUnlocked,
  context = {},
  questions,
  className,
}: ShopContactProps) {
  const fastResponder = isFastResponder(shop.responseTime)
  const alias = getShopAlias(shop)
  const fullContext: WAContext = { scooterName: context.scooterName, shopName: shop.name, ...context }

  return (
    <div className={className}>
      {/* Shop identity row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-[#FF6B35]/10 rounded-full flex items-center justify-center text-[#FF6B35] font-bold text-lg flex-shrink-0">
          {isUnlocked ? shop.name[0] : '🛵'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#0f0f0e] truncate">
            {isUnlocked ? shop.name : alias}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {shop.verified    && <TrustBadge variant="verified"      size="xs" />}
            {fastResponder    && <TrustBadge variant="fast_response" size="xs" />}
          </div>
        </div>
      </div>

      {/* Response time — always visible if real */}
      {shop.responseTime && (
        <div className="flex items-center gap-1.5 text-xs text-[#9c9c98] mb-4">
          <Zap className="w-3 h-3 text-[#22c55e]" />
          <span>Usually replies <strong className="text-[#0f0f0e]">{shop.responseTime}</strong></span>
        </div>
      )}

      {isUnlocked ? (
        // ── UNLOCKED: full contact information ────────────────────────────────
        <>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f0fdf4] rounded-[10px] border border-[#22c55e]/20 mb-4">
            <Check className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0" />
            <p className="text-xs text-[#16a34a] font-medium">Booking confirmed — full contact unlocked</p>
          </div>
          <QuickContact
            whatsapp={shop.whatsapp}
            phone={shop.phone}
            shopName={shop.name}
            responseTime={shop.responseTime}
            context={fullContext}
            questions={questions}
            variant="full"
          />
        </>
      ) : (
        // ── LOCKED: inquiry system only ───────────────────────────────────────
        <>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#f8f8f6] rounded-[10px] border border-[#e8e8e4] mb-4">
            <Lock className="w-3.5 h-3.5 text-[#9c9c98] flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#5c5c58]">Shop details unlock after booking</p>
              <p className="text-[10px] text-[#9c9c98] mt-0.5">
                Name, WhatsApp & location revealed once confirmed
              </p>
            </div>
          </div>

          <InquiryChips
            scooterId={scooterId}
            shopId={shop.id}
            context={fullContext}
            questions={questions}
          />

          {/* Reassurance */}
          <div className="flex items-start gap-2 mt-3">
            <Shield className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#9c9c98] leading-relaxed">
              Shop details are shared directly. All rental terms are confirmed between you and the shop.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
