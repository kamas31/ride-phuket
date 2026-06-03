'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Check } from 'lucide-react'
import { completeOAuthProfile } from '@/app/actions/profile'
import { SITE_NAME } from '@/constants'
import type { UserRole } from '@/lib/supabase/types'

const ROLE_OPTIONS: {
  value: UserRole
  icon: string
  title: string
  subtitle: string
  perks: string[]
}[] = [
  {
    value: 'rider',
    icon: '🛵',
    title: "I'm a Rider",
    subtitle: 'I want to rent a scooter',
    perks: ['Browse local shops', 'WhatsApp contact', 'Save favourites', 'Compare prices'],
  },
  {
    value: 'shop_owner',
    icon: '🏪',
    title: "I'm a Shop Owner",
    subtitle: 'I want to list my fleet',
    perks: ['List your scooters', 'Get more leads', 'Grow your business', 'Verified badge'],
  },
]

interface SelectRoleClientProps {
  hint: UserRole
  next: string
}

export default function SelectRoleClient({ hint, next }: SelectRoleClientProps) {
  const router = useRouter()
  const [role, setRole]             = useState<UserRole>(hint)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handleContinue = async () => {
    setSubmitting(true)
    setError(null)
    const { error: err } = await completeOAuthProfile(role)
    if (err) {
      setError(err)
      setSubmitting(false)
      return
    }
    const destination = role === 'shop_owner' ? '/partner/dashboard' : (next === '/' ? '/' : next)
    router.replace(destination)
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      <div className="px-4 pt-6 pb-0 flex items-center justify-center max-w-lg mx-auto w-full">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-[#FF6B35] rounded-[8px] flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm text-[#0f0f0e]">{SITE_NAME}</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <h1 className="text-[26px] font-bold text-[#0f0f0e] mb-1.5">One last step</h1>
          <p className="text-[#5c5c58] text-sm mb-7">How would you like to use {SITE_NAME}?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
            {ROLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRole(opt.value)}
                className={`relative text-left p-5 rounded-[20px] border-2 transition-all duration-200 ${
                  role === opt.value
                    ? 'border-[#FF6B35] bg-[#fff4f0] shadow-[0_0_0_4px_rgba(255,107,53,0.08)]'
                    : 'border-[#e8e8e4] bg-white hover:border-[#d0d0cc] hover:bg-[#f8f8f6]'
                }`}
              >
                {role === opt.value && (
                  <div className="absolute top-4 right-4 w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="text-3xl mb-3">{opt.icon}</div>
                <p className="font-bold text-[#0f0f0e] text-[15px] mb-0.5">{opt.title}</p>
                <p className="text-[#9c9c98] text-xs mb-4">{opt.subtitle}</p>
                <ul className="space-y-1.5">
                  {opt.perks.map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-[#5c5c58]">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#22c55e]" strokeWidth={3} />
                      </div>
                      {p}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {error && (
            <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-sm text-[#dc2626] mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={submitting}
            className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Continue as {role === 'rider' ? 'Rider' : 'Shop Owner'}
          </button>
        </div>
      </div>
    </div>
  )
}
