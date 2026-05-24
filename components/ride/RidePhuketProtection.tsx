import { Shield, Check } from 'lucide-react'

// RidePhuketProtection — informational trust block shown on scooter detail page.

interface RidePhuketProtectionProps {
  depositProtected?: boolean
  verified?: boolean
}

const BASE_ITEMS = [
  'Verified rental partner',
  'Listed on Ride Phuket marketplace',
  'Real availability confirmed directly',
  'Flexible cancellation — confirm with shop',
  'Direct WhatsApp contact 24/7',
]

const DEPOSIT_ITEMS = [
  'Deposit mediation available',
  'Pre/post-rental photo evidence',
]

export function RidePhuketProtection({
  depositProtected = false,
  verified = false,
}: RidePhuketProtectionProps) {
  const items = [
    ...BASE_ITEMS,
    ...(depositProtected ? DEPOSIT_ITEMS : []),
  ]

  return (
    <div className="rounded-[16px] border border-[#e8e8e4] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#fff4f0] to-[#fff8f5] border-b border-[#f0ede8] flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[#FF6B35] rounded-[10px] flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0f0f0e] leading-tight">Rental Partner Info</p>
          <p className="text-[10px] text-[#9c9c98] mt-0.5">What to expect from this shop</p>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2.5 bg-white">
        {items.map(item => (
          <div key={item} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-[#22c55e]" strokeWidth={3} />
            </div>
            <span className="text-xs text-[#5c5c58] leading-relaxed">{item}</span>
          </div>
        ))}
      </div>

      {depositProtected && (
        <div className="px-4 py-2.5 bg-[#fff4f0] border-t border-[#f0ede8]">
          <p className="text-[10px] text-[#c2410c] flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            <strong>Deposit Protection</strong> — Enrolled in our deposit dispute program
          </p>
        </div>
      )}
    </div>
  )
}
