'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Check, MapPin, Calendar, Truck, Store, ChevronRight, Lock, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { SCOOTERS } from '@/data/scooters'
import { formatPrice, calculateDays, calculateTotal, addDays, getScooterCover, calcSmartPrice } from '@/lib/utils'
import { createBookingAction } from '@/app/actions/booking'
import { getScooterAction } from '@/app/actions/scooter'
import { useAuth } from '@/hooks/useAuth'
import type { Scooter } from '@/types'

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const scooterId = params.get('scooterId') || SCOOTERS[1].id

  // Start with mock fallback, replace with live data
  const [scooter, setScooter] = useState<Scooter>(
    SCOOTERS.find(s => s.id === scooterId) ?? SCOOTERS[1]
  )

  const { user, loading: authLoading } = useAuth()

  // Load real scooter data from DB
  useEffect(() => {
    getScooterAction(scooterId).then(live => { if (live) setScooter(live) })
  }, [scooterId])

  const tomorrow = addDays(new Date(), 1)
  const defaultEnd = addDays(new Date(), 4)

  const [startDate, setStartDate] = useState(tomorrow.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split('T')[0])
  const [delivery, setDelivery] = useState<'delivery' | 'pickup'>('delivery')
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  // Pre-fill name from auth profile
  useEffect(() => {
    if (user?.user_metadata?.name) setName(user.user_metadata.name as string)
  }, [user])

  const days = calculateDays(startDate, endDate) || 3
  const deliveryFee = delivery === 'delivery' ? scooter.deliveryFee : 0
  const pricing = calcSmartPrice(days, scooter.pricePerDay, scooter.pricePerWeek, scooter.pricePerMonth)
  const subtotal = pricing.total
  const total = subtotal + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await createBookingAction({
        userId: user?.id ?? 'guest',
        scooterId: scooter.id,
        shopId: scooter.shopId,
        startDate,
        endDate,
        dailyRate: scooter.pricePerDay,
        deliveryFee,
        totalAmount: total,
        deliveryMethod: delivery,
        deliveryAddress: delivery === 'delivery' ? address : undefined,
        notes: notes || undefined,
      })

      if (!result) throw new Error('Booking failed — please try again.')
      setBookingId(result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Success screen
  if (bookingId) {
    const shortId = bookingId.startsWith('dev-')
      ? `RP-${bookingId.slice(-6)}`
      : `RP-${bookingId.slice(-8).toUpperCase()}`

    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-[28px] p-10 text-center border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
          <div className="w-20 h-20 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#22c55e]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[26px] font-bold text-[#0f0f0e] mb-2">Booking Confirmed!</h1>
          <p className="text-[#5c5c58] text-sm leading-relaxed mb-2">
            Your <strong>{scooter.name}</strong> is booked for <strong>{days} {days === 1 ? 'day' : 'days'}</strong>.
          </p>
          <p className="text-[#9c9c98] text-sm mb-8">
            The shop will contact you within 30 minutes via WhatsApp or phone to confirm delivery details.
          </p>
          <div className="bg-[#f8f8f6] rounded-[16px] p-4 mb-8 text-left space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#9c9c98]">Booking ID</span>
              <span className="font-mono font-bold text-[#0f0f0e]">{shortId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9c9c98]">Total</span>
              <span className="font-bold text-[#0f0f0e]">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9c9c98]">Payment</span>
              <span className="font-medium text-[#0f0f0e]">Cash / transfer on delivery</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9c9c98]">Shop</span>
              <span className="font-medium text-[#0f0f0e]">{scooter.shop?.name}</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {/* WhatsApp CTA — pre-filled message */}
            {scooter.shop?.whatsapp && (
              <a
                href={`https://wa.me/${scooter.shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hi ${scooter.shop.name}! I just booked your ${scooter.name} on Ride Phuket (Ref: ${shortId}). Can you confirm the details?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#f0fdf4] border border-[#22c55e]/20 text-[#16a34a] font-bold rounded-full hover:bg-[#dcfce7] transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Message the shop on WhatsApp
              </a>
            )}
            <div className="flex gap-2">
              <Link
                href="/bookings"
                className="flex-1 flex items-center justify-center py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
              >
                View Booking
              </Link>
              <Link
                href="/explore"
                className="flex-1 flex items-center justify-center py-3.5 border border-[#e8e8e4] text-[#5c5c58] font-semibold rounded-full hover:bg-[#f8f8f6] transition-colors text-sm"
              >
                Explore More
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/scooter/${scooter.id}`} className="text-[#5c5c58] hover:text-[#0f0f0e] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-[17px] text-[#0f0f0e]">Complete Booking</h1>
            <p className="text-xs text-[#9c9c98]">Step {step} of 2</p>
          </div>
          {/* Progress */}
          <div className="flex gap-1.5">
            <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]'}`} />
            <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]'}`} />
          </div>
        </div>
      </div>

      {/* Auth notice for guests */}
      {!user && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#fffbeb] border border-[#f59e0b]/30 rounded-[14px]">
            <Lock className="w-4 h-4 text-[#d97706] flex-shrink-0" />
            <p className="text-sm text-[#92400e]">
              <Link href={`/auth/login?redirect=/checkout?scooterId=${scooter.id}`} className="font-bold underline">Sign in</Link>
              {' '}to save your booking and access it later. Or continue as guest — we&apos;ll contact you directly.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              {/* Scooter summary */}
              <div className="bg-white rounded-[20px] p-5 border border-[#e8e8e4]">
                <div className="flex gap-4">
                  <ScooterImage
                    src={getScooterCover(scooter)}
                    alt={scooter.name}
                    className="w-24 h-20 rounded-[12px] flex-shrink-0"
                    sizes="96px"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#0f0f0e] truncate">{scooter.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-[#9c9c98] mt-0.5">
                      <MapPin className="w-3 h-3" />{scooter.location}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <Badge variant="success">✓ Insurance</Badge>
                      <Badge variant="brand">✓ Verified shop</Badge>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[20px] text-[#0f0f0e] leading-none">{formatPrice(scooter.pricePerDay)}</p>
                    <p className="text-xs text-[#9c9c98] mt-0.5">/day</p>
                  </div>
                </div>
              </div>

              {/* Dates — custom calendar, no native input[type=date] */}
              <div className="bg-white rounded-[20px] p-5 border border-[#e8e8e4]">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-[#FF6B35]" />
                  <h3 className="font-bold text-[#0f0f0e]">Rental Dates</h3>
                </div>

                {/* Selected dates summary */}
                <div className="flex gap-2 mb-4">
                  {[
                    { label: 'Check-in', value: startDate },
                    { label: 'Check-out', value: endDate },
                  ].map(f => (
                    <div key={f.label} className={`flex-1 px-3 py-2.5 rounded-[12px] border-2 transition-colors ${
                      f.value ? 'border-[#FF6B35] bg-[#fff4f0]' : 'border-[#e8e8e4] bg-[#f8f8f6]'
                    }`}>
                      <p className="text-[9px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-0.5">{f.label}</p>
                      <p className={`text-sm font-bold ${f.value ? 'text-[#0f0f0e]' : 'text-[#9c9c98]'}`}>
                        {f.value ? new Date(f.value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                  ))}
                </div>

                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartChange={setStartDate}
                  onEndChange={setEndDate}
                  minDate={tomorrow.toISOString().split('T')[0]}
                />

                {/* Live pricing feedback */}
                {startDate && endDate && (
                  <div className="mt-4 px-4 py-3 bg-[#fff4f0] rounded-[12px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-[#FF6B35]">{formatPrice(subtotal)}</span>
                        <span className="text-xs text-[#9c9c98] ml-1">· {pricing.label}</span>
                      </div>
                      {pricing.savings > 0 && (
                        <span className="text-[10px] font-bold text-[#22c55e] bg-[#f0fdf4] px-2 py-1 rounded-full">
                          Save {formatPrice(pricing.savings)}
                        </span>
                      )}
                    </div>
                    {pricing.rateUsed !== 'daily' && (
                      <p className="text-[10px] text-[#9c9c98] mt-1">
                        {pricing.rateUsed === 'weekly' ? 'Weekly' : 'Monthly'} rate applied
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery method */}
              <div className="bg-white rounded-[20px] p-5 border border-[#e8e8e4]">
                <h3 className="font-bold text-[#0f0f0e] mb-4">Delivery Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'delivery', label: 'Hotel Delivery', icon: Truck, desc: `+${formatPrice(scooter.deliveryFee)}`, available: scooter.deliveryAvailable },
                    { value: 'pickup', label: 'Self Pickup', icon: Store, desc: 'Free', available: true },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!opt.available}
                      onClick={() => setDelivery(opt.value as 'delivery' | 'pickup')}
                      className={`p-4 rounded-[14px] border-2 text-left transition-all disabled:opacity-40 ${
                        delivery === opt.value
                          ? 'border-[#FF6B35] bg-[#fff4f0]'
                          : 'border-[#e8e8e4] hover:border-[#d0d0cc]'
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 mb-2 ${delivery === opt.value ? 'text-[#FF6B35]' : 'text-[#9c9c98]'}`} />
                      <p className="font-semibold text-sm text-[#0f0f0e]">{opt.label}</p>
                      <p className="text-xs text-[#9c9c98] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {delivery === 'delivery' && (
                  <div className="mt-4">
                    <label className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5 block">Delivery Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Hotel name, room number, or full address"
                      required
                      className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-base"
              >
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Contact details */}
              <div className="bg-white rounded-[20px] p-5 border border-[#e8e8e4]">
                <h3 className="font-bold text-[#0f0f0e] mb-4">Your Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Full Name', value: name, onChange: setName, placeholder: 'As on your passport', type: 'text' },
                    { label: 'WhatsApp / Phone', value: phone, onChange: setPhone, placeholder: '+66 or international format', type: 'tel' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5 block">{field.label}</label>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={e => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        required
                        className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Anything else the shop should know?"
                      rows={2}
                      className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-white rounded-[20px] p-5 border border-[#e8e8e4]">
                <h3 className="font-bold text-[#0f0f0e] mb-4">Order Summary</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-[#5c5c58]">
                    <span>{scooter.name}</span>
                    <span>{formatPrice(scooter.pricePerDay)} × {days}d</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c58]">
                    <span>Delivery</span>
                    <span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c58]">
                    <span>Insurance</span>
                    <span className="text-[#22c55e] font-medium">Included</span>
                  </div>
                  <div className="border-t border-[#e8e8e4] pt-2.5 flex justify-between font-bold text-[#0f0f0e]">
                    <span>Total</span>
                    <span className="text-[20px]">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment note */}
              <div className="flex items-center gap-3 px-4 py-3.5 bg-[#f0fdf4] border border-[#22c55e]/20 rounded-[14px]">
                <Shield className="w-5 h-5 text-[#22c55e] flex-shrink-0" />
                <p className="text-sm text-[#16a34a]">
                  <strong>Pay on delivery.</strong> No card required. Cash or bank transfer on pickup or arrival.
                </p>
              </div>

              {error && (
                <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] text-sm text-[#dc2626]">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-[#f8f8f6] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-base disabled:opacity-50"
                >
                  {submitting
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : `Confirm — ${formatPrice(total)}`
                  }
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
