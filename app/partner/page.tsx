'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Star, TrendingUp, Users, MapPin, Building2, Phone, Mail, MessageCircle } from 'lucide-react'
import { submitPartnerApplication } from '@/app/actions/partner'

const BENEFITS = [
  { icon: TrendingUp, title: 'More bookings', desc: 'Get discovered by tourists before they even land in Phuket.' },
  { icon: Users, title: 'Verified badge', desc: 'Stand out with our Verified Partner badge — builds instant trust.' },
  { icon: Star, title: 'Review system', desc: 'Collect verified reviews that grow your reputation automatically.' },
  { icon: MapPin, title: 'Map placement', desc: 'Your fleet appears on the Phuket map with live availability.' },
]

const LOCATIONS = ['Patong', 'Kata', 'Karon', 'Rawai', 'Bang Tao', 'Phuket Town', 'Kamala', 'Surin', 'Other']

export default function PartnerPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    phone: '',
    shopName: '',
    location: '',
    fleetSize: '',
    message: '',
  })

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const ok = await submitPartnerApplication({
      ownerName: form.ownerName,
      email: form.email,
      phone: form.phone,
      shopName: form.shopName,
      location: form.location,
      fleetSize: Number(form.fleetSize),
      message: form.message,
    })

    if (ok) {
      setSubmitted(true)
    } else {
      setError('Something went wrong. Please try WhatsApp or email directly.')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-[28px] p-10 text-center border border-[#e8e8e4]">
          <div className="w-20 h-20 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#22c55e]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[24px] font-bold text-[#0f0f0e] mb-3">Application Received!</h1>
          <p className="text-[#5c5c58] text-sm leading-relaxed mb-8">
            We review every application personally. You&apos;ll hear from us within <strong>24 hours</strong> to schedule an onboarding call.
          </p>
          <div className="bg-[#f8f8f6] rounded-[16px] p-4 mb-8 text-left">
            <p className="text-xs font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">What happens next</p>
            {['We verify your shop in person (Phuket only)', 'We photograph your fleet', 'Your listing goes live within 48h'].map((step, i) => (
              <div key={step} className="flex items-center gap-3 py-2 border-b border-[#e8e8e4] last:border-0">
                <span className="w-6 h-6 bg-[#FF6B35] rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-[#5c5c58]">{step}</span>
              </div>
            ))}
          </div>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm">
            Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-[#0f0f0e] text-white">
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-14">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Ride Phuket
          </Link>
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-bold uppercase tracking-widest rounded-full mb-5">
              For Rental Shops
            </span>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight tracking-tight mb-5">
              List your scooters.
              <br />
              <span className="text-[#FF6B35]">Grow your business.</span>
            </h1>
            <p className="text-white/60 text-[17px] leading-relaxed max-w-xl">
              Join Phuket&apos;s premium scooter rental marketplace. Get discovered by international tourists before they even board the plane.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: Benefits */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[20px] font-bold text-[#0f0f0e]">Why partner with us?</h2>
            <div className="space-y-4">
              {BENEFITS.map(b => (
                <div key={b.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-[#fff4f0] rounded-[12px] flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-5 h-5 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0f0f0e] text-sm">{b.title}</p>
                    <p className="text-[#5c5c58] text-sm mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#f8f8f6] rounded-[20px] p-5 border border-[#e8e8e4]">
              <p className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">Commission model</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5c5c58]">Platform fee</span>
                  <span className="font-bold text-[#0f0f0e]">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c5c58]">Setup cost</span>
                  <span className="font-bold text-[#22c55e]">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c5c58]">Monthly fee</span>
                  <span className="font-bold text-[#22c55e]">Free</span>
                </div>
              </div>
              <p className="text-xs text-[#9c9c98] mt-4 leading-relaxed">
                You only pay when you earn. No upfront cost, no lock-in.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest">Prefer to talk first?</p>
              <a
                href="https://wa.me/66800000001"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-[#16a34a] hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp us directly
              </a>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[24px] border border-[#e8e8e4] p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
              <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-1">Apply to join</h2>
              <p className="text-sm text-[#9c9c98] mb-6">Takes 2 minutes. We respond within 24 hours.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Shop info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={update('ownerName')}
                        placeholder="Owner / manager name"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                      Shop Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                      <input
                        type="text"
                        value={form.shopName}
                        onChange={update('shopName')}
                        placeholder="Your rental shop name"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={update('email')}
                        placeholder="you@shop.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={update('phone')}
                        placeholder="+66 8X XXX XXXX"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Location</label>
                    <select
                      value={form.location}
                      onChange={update('location')}
                      required
                      className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm text-[#0f0f0e] focus:outline-none focus:border-[#FF6B35] transition-colors appearance-none"
                    >
                      <option value="" disabled>Select area</option>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Fleet Size</label>
                    <input
                      type="number"
                      value={form.fleetSize}
                      onChange={update('fleetSize')}
                      placeholder="e.g. 12"
                      min="1"
                      required
                      className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                    Tell us about your shop (optional)
                  </label>
                  <textarea
                    value={form.message}
                    onChange={update('message')}
                    placeholder="Models you have, years in business, anything else relevant..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors resize-none"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] text-sm text-[#dc2626]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Submit Application'
                  }
                </button>

                <p className="text-center text-xs text-[#9c9c98]">
                  No commitment required. We&apos;ll walk you through everything.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
