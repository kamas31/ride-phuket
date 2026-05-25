import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, MapPin, Shield, Zap, Check,
  Phone, MessageCircle, Clock, RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { getScooters, getScooterById } from '@/lib/supabase/queries'
import { formatPrice, formatPricePerDay, pluralize, getScooterCover } from '@/lib/utils'
import { ImageGallery } from '@/components/ride/ImageGallery'
import { TrustBadge, isNewListing, isFastResponder } from '@/components/ride/TrustBadge'
import { EmptyReviews } from '@/components/ride/EmptyReviews'
import { QuickContact } from '@/components/ride/QuickContact'
import { DepositInfo } from '@/components/ride/DepositInfo'
import { StickyBookingBar } from '@/components/ride/StickyBookingBar'
import { SaveButton } from '@/components/ride/SaveButton'
import { getPublicInquiries } from '@/app/actions/inquiry-actions'
import { TrackView } from '@/components/analytics/TrackView'
import { TrustSignals } from '@/components/trust/TrustSignals'
import { getPrimaryTrustSignals } from '@/lib/trust-signals'

import type { OpeningHoursSchedule } from '@/types'

function getShopOpenStatus(hours: OpeningHoursSchedule | undefined): { isOpen: boolean; label: string } | null {
  if (!hours) return null
  try {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const
    const now  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    const key  = days[now.getDay()]
    const day  = hours[key]
    if (!day) return null
    if (!day.enabled) return { isOpen: false, label: 'Closed today' }
    if (!day.open || !day.close) return null
    const cur   = now.getHours() * 60 + now.getMinutes()
    const [oh, om] = day.open.split(':').map(Number)
    const [ch, cm] = day.close.split(':').map(Number)
    if (isNaN(oh) || isNaN(om) || isNaN(ch) || isNaN(cm)) return null
    const open  = oh * 60 + om
    const close = ch * 60 + cm
    if (cur < open)  return { isOpen: false, label: `Opens at ${day.open}` }
    if (cur < close) return { isOpen: true,  label: `Closes at ${day.close}` }
    for (let i = 1; i <= 7; i++) {
      const next = hours[days[(now.getDay() + i) % 7]]
      if (next?.enabled && next.open) {
        const name = i === 1 ? 'Tomorrow' : days[(now.getDay() + i) % 7].charAt(0).toUpperCase() + days[(now.getDay() + i) % 7].slice(1)
        return { isOpen: false, label: `Opens ${name} at ${next.open}` }
      }
    }
    return { isOpen: false, label: 'Temporarily closed' }
  } catch {
    return null
  }
}

interface ScooterPageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const scooters = await getScooters({ available: true })
    return scooters.map(s => ({ id: s.id }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: ScooterPageProps) {
  const { id } = await params
  const scooter = await getScooterById(id)
  if (!scooter) return {}
  const coverUrl = getScooterCover(scooter)
  return {
    title: `${scooter.name} — ${formatPricePerDay(scooter.pricePerDay)}`,
    description: scooter.description,
    openGraph: {
      title: `${scooter.name} — ${formatPricePerDay(scooter.pricePerDay)}`,
      description: scooter.description,
      ...(coverUrl ? { images: [{ url: coverUrl, width: 1600, height: 900, alt: scooter.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(coverUrl ? { images: [coverUrl] } : {}),
    },
  }
}

export default async function ScooterPage({ params }: ScooterPageProps) {
  const { id } = await params
  const scooter = await getScooterById(id)
  if (!scooter) notFound()

  // shop is optional in the type — guard explicitly so all downstream code is safe
  const shop = scooter.shop
  if (!shop) notFound()

  // Filter out empty / N/A values — no fake placeholders
  const isValidSpec = (v: string | undefined) =>
    v && v.trim().length > 0 && !/^n\/?a$/i.test(v.trim())

  const SPEC_ROWS = [
    { label: 'Engine',      value: scooter.specs.engine },
    { label: 'Power',       value: scooter.specs.power },
    { label: 'Fuel Tank',   value: scooter.specs.fuelCapacity },
    { label: 'Consumption', value: scooter.specs.consumption },
    { label: 'Weight',      value: scooter.specs.weight },
    { label: 'Storage',     value: scooter.specs.storage },
  ].filter(r => isValidSpec(r.value))

  const weekSavings = scooter.pricePerWeek
    ? scooter.pricePerDay * 7 - scooter.pricePerWeek
    : 0

  const newListing   = isNewListing(scooter.createdAt)
  const fastShop     = isFastResponder(shop.responseTime)
  const openStatus   = getShopOpenStatus(shop.openingHours)

  const primaryTrust = getPrimaryTrustSignals({
    shop: {
      id:                    shop.id,
      verified:              shop.verified,
      phone:                 shop.phone,
      whatsapp:              shop.whatsapp,
      description:           shop.description,
      address:               shop.address,
      logo:                  shop.logo,
      openingHours:          shop.openingHours,
      gallery:               shop.gallery,
      depositProtectedMember: shop.depositProtectedMember,
      responseTime:          shop.responseTime,
    },
    scooters: [{ images: scooter.images, category: scooter.category, createdAt: scooter.createdAt, available: scooter.available }],
  })

  // Public FAQ from answered inquiries (useful SEO content)
  const faqItems = await getPublicInquiries(scooter.id)

  return (
    <div className="bg-white min-h-screen">
      <TrackView eventType="scooter_view" shopId={shop.id} scooterId={scooter.id} metadata={{ scooterName: scooter.name }} />

      {/* Breadcrumb nav */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-4 h-13 flex items-center gap-3">
          <Link
            href="/explore"
            prefetch={true}
            className="flex items-center gap-2 py-2 pr-3 text-sm font-semibold text-[#5c5c58] hover:text-[#0f0f0e] transition-colors active:opacity-50 active:scale-95 rounded-[10px] hover:bg-[#f8f8f6]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {newListing && <TrustBadge variant="new_listing" />}
            {shop.verified && <TrustBadge variant="verified" />}
            <SaveButton scooterId={scooter.id} size="md" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="lg:grid lg:grid-cols-5 lg:gap-10">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sentinel — triggers the sticky booking bar when scrolled past */}
            <div id="sticky-booking-sentinel" className="-mt-1" aria-hidden />

            {/* Image gallery — edge-to-edge on mobile, rounded on desktop */}
            <div className="-mx-4 md:mx-0">
              <ImageGallery images={scooter.images} name={scooter.name} coverImage={scooter.coverImage} />
            </div>

            {/* Title & meta */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-1">
                <h1 className="text-[26px] md:text-[32px] font-bold text-[#0f0f0e] tracking-tight leading-tight">
                  {scooter.name}
                </h1>
                <Badge variant={scooter.category === 'automatic' ? 'brand' : 'default'} className="mt-1 flex-shrink-0">
                  {scooter.category ? scooter.category.charAt(0).toUpperCase() + scooter.category.slice(1) : 'Scooter'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                {/* Rating — only shown when real reviews exist */}
                {scooter.reviewCount > 0 ? (
                  <button className="flex items-center gap-1 hover:underline">
                    <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                    <span className="font-bold text-sm text-[#0f0f0e]">{scooter.rating.toFixed(1)}</span>
                    <span className="text-sm text-[#9c9c98] underline">({scooter.reviewCount} reviews)</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-[#9c9c98]">
                    <Star className="w-3.5 h-3.5 text-[#e0e0dc]" />
                    No reviews yet
                  </span>
                )}

                <span className="text-[#e8e8e4]">·</span>
                <div className="flex items-center gap-1 text-sm text-[#9c9c98]">
                  <MapPin className="w-3.5 h-3.5" />
                  {scooter.location}
                </div>
                {scooter.deliveryAvailable && (
                  <>
                    <span className="text-[#e8e8e4]">·</span>
                    <span className="text-sm text-[#FF6B35] font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Delivery available
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {scooter.description && (
              <p className="text-[#5c5c58] text-[15px] leading-relaxed border-t border-[#f0f0ec] pt-5">
                {scooter.description}
              </p>
            )}

            {/* What's included */}
            <div>
              <h2 className="text-[16px] font-bold text-[#0f0f0e] mb-3">What&rsquo;s included</h2>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {scooter.features.map(feature => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-[#5c5c58]">
                    <div className="w-5 h-5 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#22c55e]" />
                    </div>
                    {feature}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
                  <div className="w-5 h-5 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#22c55e]" />
                  </div>
                  Flexible rental terms
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
                  <div className="w-5 h-5 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#22c55e]" />
                  </div>
                  24/7 roadside support
                </div>
              </div>
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-[16px] font-bold text-[#0f0f0e] mb-3">Technical specs</h2>
              <div className="bg-[#f8f8f6] rounded-[16px] overflow-hidden">
                {SPEC_ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${i < SPEC_ROWS.length - 1 ? 'border-b border-[#efefed]' : ''}`}
                  >
                    <span className="text-[#9c9c98]">{row.label}</span>
                    <span className="font-semibold text-[#0f0f0e]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deposit & security */}
            <DepositInfo
              depositAmount={scooter.depositAmount}
              depositType={scooter.depositType}
              passportRequired={scooter.passportRequired}
              passportCopyAllowed={scooter.passportCopyAllowed}
              isPremiumBike={scooter.isPremiumBike}
              depositNotes={scooter.depositNotes}
              depositProtected={shop.depositProtectedMember}
            />

            {/* Rental partner — always visible, direct contact */}
            <div id="contact-rental-shop" className="bg-[#f8f8f6] rounded-[20px] p-5 border border-[#e8e8e4]">
              <h2 className="text-[15px] font-bold text-[#0f0f0e] mb-4">Rental partner</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-[#FF6B35]/10 rounded-full flex items-center justify-center text-[#FF6B35] font-bold text-lg flex-shrink-0">
                  {shop.name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/shop/${shop.slug}`} className="font-bold text-[#0f0f0e] hover:text-[#FF6B35] transition-colors">
                      {shop.name}
                    </Link>
                    {shop.verified && <TrustBadge variant="verified" size="xs" />}
                    {fastShop && <TrustBadge variant="fast_response" size="xs" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {shop.reviewCount > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-[#9c9c98]">
                        <Star className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
                        {shop.rating.toFixed(1)} · {shop.reviewCount} reviews
                      </div>
                    ) : (
                      <TrustBadge variant="new_partner" size="xs" />
                    )}
                    {shop.responseTime && (
                      <div className="flex items-center gap-1 text-xs text-[#9c9c98]">
                        <Clock className="w-3 h-3" />
                        Responds {shop.responseTime}
                      </div>
                    )}
                    {openStatus && (
                      <div className={`flex items-center gap-1 text-xs font-semibold ${openStatus.isOpen ? 'text-[#16a34a]' : 'text-[#9c9c98]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-[#22c55e]' : 'bg-[#9c9c98]'}`} />
                        {openStatus.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust signals — 1-2 subtle signals to increase conversion confidence */}
              {primaryTrust.length > 0 && (
                <TrustSignals signals={primaryTrust} max={2} size="xs" className="mb-4" />
              )}

              {/* Direct contact — always shown */}
              <div className="flex gap-2">
                {shop.phone && (
                  <a href={`tel:${shop.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] border border-[#e8e8e4] bg-white text-sm font-medium text-[#5c5c58] hover:border-[#d0d0cc] transition-colors">
                    <Phone className="w-4 h-4" />Call
                  </a>
                )}
                {shop.whatsapp && (
                  <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found your ${scooter.name} on Ride Phuket and I'm interested.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] bg-[#f0fdf4] border border-[#22c55e]/20 text-sm font-semibold text-[#16a34a] hover:bg-[#dcfce7] transition-colors">
                    <MessageCircle className="w-4 h-4" />WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Quick questions via WhatsApp */}
            {(shop.whatsapp || shop.phone) && (
            <div className="bg-[#f8f8f6] rounded-[20px] p-5 border border-[#e8e8e4]">
              <h2 className="text-[15px] font-bold text-[#0f0f0e] mb-4">Questions? Ask the shop</h2>
              <QuickContact
                whatsapp={shop.whatsapp}
                phone={shop.phone}
                shopId={shop.id}
                scooterId={scooter.id}
                shopName={shop.name}
                responseTime={shop.responseTime}
                context={{ scooterName: scooter.name, location: scooter.location }}
                questions={['ask_delivery', 'ask_deposit', 'ask_license', 'ask_availability', 'ask_monthly']}
                variant="full"
              />
            </div>
            )}

            {/* Public FAQ — answered inquiries */}
            {faqItems.length > 0 && (
              <div>
                <h2 className="text-[16px] font-bold text-[#0f0f0e] mb-3">Frequently Asked</h2>
                <div className="space-y-3">
                  {faqItems.map((item, i) => (
                    <div key={i} className="bg-[#f8f8f6] rounded-[14px] p-4 border border-[#e8e8e4]">
                      <p className="text-[11px] font-semibold text-[#FF6B35] uppercase tracking-wider mb-1">
                        {item.questionLabel}
                      </p>
                      <p className="text-sm text-[#5c5c58] leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews — real or empty state, never fake */}
            <div>
              <h2 className="text-[16px] font-bold text-[#0f0f0e] mb-4 flex items-center gap-2">
                {scooter.reviewCount > 0 ? (
                  <>
                    <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                    {scooter.rating.toFixed(1)} · {scooter.reviewCount} {scooter.reviewCount === 1 ? 'review' : 'reviews'}
                  </>
                ) : (
                  'Reviews'
                )}
              </h2>
              {/* EmptyReviews until real reviews are fetched from DB */}
              <EmptyReviews scooterName={scooter.reviewCount === 0 ? scooter.name : undefined} />
            </div>
          </div>

          {/* ── RIGHT COLUMN: Booking card ── */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="sticky top-32">
              <div className="bg-white rounded-[24px] border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.10),0_1px_4px_-1px_rgba(0,0,0,0.05)] overflow-hidden">

                {/* Price header */}
                <div className="px-6 pt-6 pb-4 border-b border-[#f0f0ec]">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-[34px] font-bold text-[#0f0f0e] leading-none">
                      {formatPrice(scooter.pricePerDay)}
                    </span>
                    <span className="text-[#9c9c98] text-base">/day</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {scooter.pricePerWeek && (
                      <span className="text-[#9c9c98]">{formatPrice(scooter.pricePerWeek)}/week</span>
                    )}
                    {weekSavings > 0 && (
                      <span className="text-[#22c55e] font-semibold text-xs bg-[#f0fdf4] px-2 py-0.5 rounded-full">
                        Save {formatPrice(weekSavings)} weekly
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Availability */}
                  <div className="flex items-center gap-2 p-3 bg-[#f0fdf4] rounded-[12px]">
                    <div className="w-2 h-2 bg-[#22c55e] rounded-full flex-shrink-0" />
                    <span className="text-sm font-semibold text-[#16a34a]">Available · Contact to rent</span>
                  </div>

                  {/* Line items */}
                  <div className="space-y-2 text-sm">
                    {scooter.deliveryAvailable && (
                      <div className="flex justify-between text-[#5c5c58]">
                        <span>Delivery available</span>
                        <span className="font-medium text-[#0f0f0e]">Ask shop</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#5c5c58]">
                      <span>Minimum rental</span>
                      <span className="font-medium text-[#0f0f0e]">{pluralize(scooter.minRentalDays, 'day')}</span>
                    </div>
                    <div className="flex justify-between text-[#5c5c58]">
                      <span>Rental terms</span>
                      <span className="font-medium text-[#0f0f0e]">Confirm with shop</span>
                    </div>
                  </div>

                  {/* Primary CTA — WhatsApp */}
                  {shop.whatsapp ? (
                    <a
                      href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found your ${scooter.name} on Ride Phuket and I'm interested.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#16a34a] text-white font-bold rounded-full hover:bg-[#15803d] transition-all text-base shadow-sm hover:shadow-[0_8px_24px_rgba(22,163,74,0.35)] hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp the shop
                    </a>
                  ) : shop.phone ? (
                    <a
                      href={`tel:${shop.phone}`}
                      className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#0f0f0e] text-white font-bold rounded-full hover:bg-[#2a2a28] transition-all text-base"
                    >
                      <Phone className="w-5 h-5" />
                      Call the shop
                    </a>
                  ) : null}

                  {/* Secondary call button (only when WA is primary) */}
                  {shop.whatsapp && shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-full border border-[#e8e8e4] bg-white text-sm font-medium text-[#5c5c58] hover:border-[#d0d0cc] transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call instead
                    </a>
                  )}

                  {/* Trust strip */}
                  <div className="flex items-center justify-center gap-4 pt-1 text-xs text-[#9c9c98]">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Verified shop</span>
                    <span className="text-[#e8e8e4]">·</span>
                    <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Flexible terms</span>
                    <span className="text-[#e8e8e4]">·</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Local</span>
                  </div>
                  <p className="text-center text-[10px] text-[#c0c0bc] pt-1 leading-relaxed">
                    Ride Phuket is a discovery marketplace — rental terms are arranged directly with the shop.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky contact bar — appears when sentinel scrolls off screen */}
      <StickyBookingBar
        scooterName={scooter.name}
        pricePerDay={scooter.pricePerDay}
        scooterId={scooter.id}
        available={scooter.available}
        shopWhatsapp={shop.whatsapp}
        shopPhone={shop.phone}
      />
    </div>
  )
}
