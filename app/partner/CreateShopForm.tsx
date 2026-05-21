'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, Phone, FileText, ArrowRight, Check } from 'lucide-react'
import { createShop } from '@/app/actions/partner'

const LOCATIONS = ['Patong', 'Kata', 'Karon', 'Rawai', 'Bang Tao', 'Phuket Town', 'Kamala', 'Surin']

export default function CreateShopForm({ userName }: { userName?: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    shopName: '',
    location: '',
    phone: '',
    address: '',
    description: '',
  })

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await createShop({
      shopName:    form.shopName,
      location:    form.location,
      phone:       form.phone,
      address:     form.address || undefined,
      description: form.description || undefined,
    })

    if (result.success) {
      // Hard navigate so server state (profile.shop_id) is refreshed
      router.push('/partner/dashboard')
      router.refresh()
    } else {
      setError(result.error ?? 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      {/* Header */}
      <div className="bg-[#0f0f0e] text-white">
        <div className="max-w-xl mx-auto px-4 pt-24 pb-10 text-center">
          <div className="w-14 h-14 bg-[#FF6B35]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-7 h-7 text-[#FF6B35]" />
          </div>
          <h1 className="text-[26px] font-bold mb-2">
            {userName ? `Welcome, ${userName.split(' ')[0]} 👋` : 'Create Your Shop'}
          </h1>
          <p className="text-white/55 text-sm leading-relaxed">
            Fill in a few details and your shop goes live immediately.
            <br />No waiting. No approval.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-[24px] border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-[#FF6B35]" style={{ width: '100%' }} />

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            {/* Shop Name */}
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                Shop Name <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                <input
                  type="text"
                  value={form.shopName}
                  onChange={update('shopName')}
                  placeholder="e.g. Patong Riders"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                Main Area <span className="text-[#ef4444]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, location: loc }))}
                    className={`py-2.5 px-3 rounded-[10px] text-sm font-medium border transition-all text-center ${
                      form.location === loc
                        ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]'
                        : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58] hover:border-[#d0d0cc]'
                    }`}
                  >
                    {form.location === loc && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                    {loc}
                  </button>
                ))}
              </div>
              {!form.location && <input type="text" value="" onChange={() => {}} required tabIndex={-1} className="sr-only" aria-hidden />}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                WhatsApp / Phone <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="+66 8X XXX XXXX"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                Address <span className="text-[#9c9c98] font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                <input
                  type="text"
                  value={form.address}
                  onChange={update('address')}
                  placeholder="Street, number, area"
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                Short Description <span className="text-[#9c9c98] font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9c9c98]" />
                <textarea
                  value={form.description}
                  onChange={update('description')}
                  placeholder="Tell riders what makes your shop special…"
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] text-sm text-[#dc2626]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !form.shopName || !form.location || !form.phone}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all text-base disabled:opacity-40 shadow-[0_4px_20px_rgba(255,107,53,0.35)]"
            >
              {submitting
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>Create My Shop &amp; Go to Dashboard <ArrowRight className="w-5 h-5" /></>
              }
            </button>

            <p className="text-center text-[11px] text-[#9c9c98]">
              Verified instantly · No approval needed · Add scooters right away
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
