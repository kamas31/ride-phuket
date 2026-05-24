import { Lock } from 'lucide-react'

interface UpgradeTeaserProps {
  /** One-line description of what's locked, e.g. "see which scooters convert best" */
  feature:    string
  plan?:      'pro' | 'premium'
  className?: string
}

export function UpgradeTeaser({ feature, plan = 'pro', className }: UpgradeTeaserProps) {
  const planLabel = plan === 'premium' ? 'Premium' : 'Pro'

  return (
    <div className={`relative rounded-[16px] border border-[#e8e8e4] bg-white p-4 overflow-hidden ${className ?? ''}`}>
      {/* Blurred placeholder */}
      <div aria-hidden className="blur-sm opacity-25 pointer-events-none select-none space-y-2">
        <div className="h-7 w-14 bg-[#0f0f0e] rounded-md" />
        <div className="h-3 w-20 bg-[#9c9c98] rounded" />
        <div className="h-2 w-28 bg-[#e8e8e4] rounded mt-1" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/88 rounded-[16px]">
        <div className="w-7 h-7 rounded-full bg-[#f8f8f6] border border-[#e8e8e4] flex items-center justify-center mb-2">
          <Lock className="w-3.5 h-3.5 text-[#9c9c98]" />
        </div>
        <p className="text-[11px] text-[#5c5c58] font-semibold text-center leading-snug px-4">
          {planLabel}
        </p>
        <p className="text-[10px] text-[#9c9c98] text-center leading-snug px-4 mt-0.5">
          {feature}
        </p>
        <a
          href="/partner/upgrade"
          className="mt-2.5 text-[10px] font-bold px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full hover:bg-[#FF6B35]/18 transition-colors"
        >
          Upgrade →
        </a>
      </div>
    </div>
  )
}
