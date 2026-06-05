'use client'

import { useState } from 'react'
import { Building2, MapPin, Phone, FileText, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { createShop } from '@/app/actions/partner'

const LOCATIONS = [
  'Patong', 'Kata', 'Karon', 'Rawai', 'Phuket Town', 'Bang Tao',
  'Kamala', 'Surin', 'Chalong', 'Nai Harn', 'Cherng Talay',
  'Kata Noi', 'Mai Khao', 'Thalang', 'Cape Panwa', 'Ko Sirey',
]

// Client-side timeout: if the Server Action takes > 15s → abort
const CLIENT_TIMEOUT_MS = 15_000

export default function CreateShopForm({ userName }: { userName?: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [form, setForm] = useState({
    shopName: '',
    location: '',
    phone: '',
    address: '',
    description: '',
  })

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation (duplicate of server, but fast)
    if (!form.shopName.trim()) { setError('Shop name is required.'); return }
    if (!form.location)        { setError('Please select your area.'); return }
    if (!form.phone.trim())    { setError('Phone number is required.'); return }

    setError(null)
    setSubmitting(true)

    // Client-side timeout guard — if action never returns, unblock the UI
    const timeoutId = setTimeout(() => {
      setSubmitting(false)
      setError('The request timed out. Please check your connection and try again.')
    }, CLIENT_TIMEOUT_MS)

    try {
      const result = await createShop({
        shopName:    form.shopName,
        location:    form.location,
        phone:       form.phone,
        address:     form.address || undefined,
        description: form.description || undefined,
      })

      clearTimeout(timeoutId)

      if (result.success) {
        // Hard navigation — forces fresh server render with updated profile.shop_id
        window.location.href = '/partner/dashboard'
      } else {
        setError(result.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
      }
    } catch (thrown) {
      // Server Action threw an unhandled exception — should never happen
      // after the top-level guard, but defensive just in case
      clearTimeout(timeoutId)
      const msg = thrown instanceof Error ? thrown.message : 'Unexpected error.'
      console.error('[CreateShopForm] caught thrown error:', msg)
      setError(`Connection error: ${msg}`)
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
          <div className="h-1 bg-[#FF6B35]" />

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
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors disabled:opacity-60"
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
                    disabled={submitting}
                    onClick={() => setForm(f => ({ ...f, location: loc }))}
                    className={`py-2.5 px-3 rounded-[10px] text-sm font-medium border transition-all text-center disabled:opacity-60 ${
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
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                Address <span className="font-normal normal-case text-[#9c9c98]">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                <input
                  type="text"
                  value={form.address}
                  onChange={update('address')}
                  placeholder="Street, number, area"
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                Short Description <span className="font-normal normal-case text-[#9c9c98]">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9c9c98]" />
                <textarea
                  value={form.description}
                  onChange={update('description')}
                  placeholder="Tell riders what makes your shop special…"
                  rows={2}
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors resize-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[12px]">
                <AlertCircle className="w-4 h-4 text-[#dc2626] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#dc2626] leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !form.shopName || !form.location || !form.phone}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all text-base disabled:opacity-40 shadow-[0_4px_20px_rgba(255,107,53,0.35)]"
            >
              {submitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Creating your shop…
                </>
              ) : (
                <>
                  Create My Shop &amp; Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
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
