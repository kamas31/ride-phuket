import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Zap, Check,
  Phone, MessageCircle, Store,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { getScooterById } from '@/lib/supabase/queries'
import { formatPricePerDay, getScooterCover } from '@/lib/utils'
import { SITE_URL, SITE_NAME } from '@/constants'
import { getAreaForLocation } from '@/constants/areas'
import { ImageGallery } from '@/components/ride/ImageGallery'
import { TrustBadge, isNewListing } from '@/components/ride/TrustBadge'
import { QuickContact } from '@/components/ride/QuickContact'
import { DepositInfo } from '@/components/ride/DepositInfo'
import { MessageOwnerButton } from './MessageOwnerButton'
import { PricingClient } from './PricingClient'
import { WhatsAppButton } from './WhatsAppButton'
import { SaveButton } from '@/components/ride/SaveButton'
import { getPublicInquiries } from '@/app/actions/inquiry-actions'
import { TrackView } from '@/components/analytics/TrackView'

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

export const revalidate = 300

export async function generateMetadata({ params }: ScooterPageProps) {
  try {
    const { id } = await params
    const scooter = await getScooterById(id)
    if (!scooter) return {}
    const coverUrl = getScooterCover(scooter)
    const price = scooter.pricePerDay > 0 ? formatPricePerDay(scooter.pricePerDay) : null
    const locationLabel = scooter.location
      ? scooter.location.charAt(0).toUpperCase() + scooter.location.slice(1)
      : 'Phuket'
    const title = price
      ? `${scooter.name} Rental ${locationLabel}, Phuket — ${price}`
      : `${scooter.name} Rental ${locationLabel}, Phuket`
    const description = scooter.description ||
      `Rent the ${scooter.name} in ${locationLabel}, Phuket. ${price ? `From ${price}.` : ''} Contact the shop directly — no booking fees.`
    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/scooter/${id}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/scooter/${id}`,
        type: 'website' as const,
        siteName: SITE_NAME,
        ...(coverUrl ? { images: [{ url: coverUrl, width: 1600, height: 900, alt: scooter.name }] } : {}),
      },
      twitter: {
        card: 'summary_large_image' as const,
        title,
        description,
        ...(coverUrl ? { images: [coverUrl] } : {}),
      },
    }
  } catch {
    return {}
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

  // Append "cc" only when value is a bare number — "125" → "125cc", "Electric" stays
  const fmtEngine = (v: string | undefined) => {
    if (!v) return v
    const t = v.trim()
    return /^\d+(\.\d+)?$/.test(t) ? `${t}cc` : t
  }

  const SPEC_ROWS = [
    { label: 'Engine',      value: fmtEngine(scooter.specs?.engine) },
    { label: 'Power',       value: scooter.specs?.power },
    { label: 'Fuel Tank',   value: scooter.specs?.fuelCapacity },
    { label: 'Consumption', value: scooter.specs?.consumption },
    { label: 'Weight',      value: scooter.specs?.weight },
    { label: 'Storage',     value: scooter.specs?.storage },
  ].filter(r => isValidSpec(r.value))

  const newListing = isNewListing(scooter.createdAt)
  const openStatus = getShopOpenStatus(shop.openingHours)

  // Public FAQ from answered inquiries (useful SEO content)
  const faqItems = await getPublicInquiries(scooter.id)

  const coverUrl = getScooterCover(scooter)
  const locationLabel = scooter.location
    ? scooter.location.charAt(0).toUpperCase() + scooter.location.slice(1)
    : 'Phuket'
  const scooterArea = scooter.location ? getAreaForLocation(scooter.location) : null

  // Product structured data — only real fields
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: scooter.id,
    name: scooter.name,
    description: scooter.description ||
      `Rent the ${scooter.name} in ${locationLabel}, Phuket. Contact the shop directly.`,
    category: `${scooter.category ? scooter.category.charAt(0).toUpperCase() + scooter.category.slice(1) : 'Scooter'} Rental`,
    ...(coverUrl ? { image: coverUrl } : {}),
    brand: { '@type': 'Brand', name: scooter.name.split(' ')[0] },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/scooter/${scooter.id}`,
      priceCurrency: 'THB',
      price: scooter.pricePerDay,
      availability: scooter.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'LocalBusiness',
        name: shop.name,
        url: `${SITE_URL}/shop/${shop.slug}`,
      },
    },
  }

  // BreadcrumbList: Home → Locations → Area (if resolved) → Scooter
  const breadcrumbItems: Array<{ '@type': string; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Home',      item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Locations', item: `${SITE_URL}/locations` },
  ]
  if (scooterArea) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: `Scooter Rental ${scooterArea.label}`, item: `${SITE_URL}/phuket/${scooterArea.slug}` })
    breadcrumbItems.push({ '@type': 'ListItem', position: 4, name: scooter.name, item: `${SITE_URL}/scooter/${scooter.id}` })
  } else {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: scooter.name, item: `${SITE_URL}/scooter/${scooter.id}` })
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  // FAQ structured data from real answered inquiries
  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.questionLabel,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
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
            <SaveButton scooterId={scooter.id} size="md" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div>
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            <div id="sticky-contact-sentinel" className="-mt-1" aria-hidden />

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
                {scooterArea ? (
                  <Link
                    href={`/phuket/${scooterArea.slug}`}
                    className="flex items-center gap-1 text-sm text-[#9c9c98] hover:text-[#FF6B35] transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {scooter.location}
                  </Link>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-[#9c9c98]">
                    <MapPin className="w-3.5 h-3.5" />
                    {scooter.location}
                  </div>
                )}
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

            {/* Pricing */}
            <PricingClient
              pricePerDay={scooter.pricePerDay}
              pricePerWeek={scooter.pricePerWeek ?? null}
              pricePerMonth={scooter.pricePerMonth ?? null}
              minRentalDays={scooter.minRentalDays}
              scooterName={scooter.name}
              scooterId={scooter.id}
              available={scooter.available}
              shopWhatsapp={shop.whatsapp}
              shopPhone={shop.phone}
            />

            {/* Quick contact — two side-by-side buttons below pricing */}
            <div className="flex gap-3">
              <div className="flex-1">
                <MessageOwnerButton scooterId={scooter.id} scooterName={scooter.name} />
              </div>
              {shop.whatsapp ? (
                <WhatsAppButton
                  href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found your ${scooter.name} on Koh Ride and I'm interested.`)}`}
                  shopId={shop.id}
                  scooterId={scooter.id}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-[#16a34a] text-white text-[15px] font-bold hover:bg-[#15803d] transition-colors active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </WhatsAppButton>
              ) : shop.phone ? (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full border border-[#e8e8e4] text-[#5c5c58] text-[15px] font-medium hover:border-[#d0d0cc] transition-colors active:scale-[0.98]"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </a>
              ) : null}
            </div>

            {/* Description */}
            {scooter.description && (
              <p className="text-[#5c5c58] text-[15px] leading-relaxed">
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
              </div>
            </div>

            {/* Specs */}
            {SPEC_ROWS.length > 0 && (
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
            )}

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

            {/* Rental partner — unified contact card */}
            <div id="contact-rental-shop" className="bg-[#f8f8f6] rounded-[24px] p-6 border border-[#e8e8e4]">

              {/* Shop identity */}
              <div className="flex items-center gap-3.5 mb-5">
                {shop.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logo} alt={shop.name ?? ''} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-[#f0ede8] rounded-full flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-[#a09890]" />
                  </div>
                )}
                <div className="min-w-0">
                  <Link href={`/shop/${shop.slug}`} className="font-bold text-[15px] text-[#0f0f0e] hover:text-[#FF6B35] transition-colors leading-tight block">
                    {shop.name}
                  </Link>
                  {shop.reviewCount > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="#FF6B35" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 1l1.236 2.505L10 3.91l-2 1.95.472 2.753L6 7.25 3.528 8.613 4 5.86 2 3.91l2.764-.405L6 1z" />
                      </svg>
                      <span className="text-xs font-semibold text-[#0f0f0e]">{shop.rating.toFixed(1)}</span>
                      <span className="text-xs text-[#9c9c98]">({shop.reviewCount} {shop.reviewCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                    {openStatus && (
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${openStatus.isOpen ? 'text-[#16a34a]' : 'text-[#9c9c98]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${openStatus.isOpen ? 'bg-[#22c55e]' : 'bg-[#d0d0cc]'}`} />
                        {openStatus.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#efefed] mb-5" />

              {/* Response time */}
              {shop.responseTime && (
                <p className="text-[13px] text-[#9c9c98] mb-4">
                  Usually replies <span className="text-[#5c5c58] font-medium">{shop.responseTime}</span>
                </p>
              )}

              {/* CTAs */}
              <div className="space-y-3">
                <MessageOwnerButton scooterId={scooter.id} scooterName={scooter.name} />

                {shop.whatsapp ? (
                  <WhatsAppButton
                    href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found your ${scooter.name} on Koh Ride and I'm interested.`)}`}
                    shopId={shop.id}
                    scooterId={scooter.id}
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-[14px] bg-[#16a34a] text-white text-[15px] font-bold hover:bg-[#15803d] transition-colors active:scale-[0.98]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message on WhatsApp
                  </WhatsAppButton>
                ) : shop.phone ? (
                  <a
                    href={`tel:${shop.phone}`}
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-[14px] bg-[#0f0f0e] text-white text-[15px] font-bold hover:bg-[#2a2a28] transition-colors active:scale-[0.98]"
                  >
                    <Phone className="w-5 h-5" />
                    Call the shop
                  </a>
                ) : null}
              </div>

              {/* Quick question chips */}
              {shop.whatsapp && (
                <QuickContact
                  whatsapp={shop.whatsapp}
                  shopId={shop.id}
                  scooterId={scooter.id}
                  shopName={shop.name}
                  context={{ scooterName: scooter.name, location: scooter.location }}
                  questions={['ask_delivery', 'ask_deposit', 'ask_license', 'ask_availability', 'ask_monthly']}
                  variant="chips_only"
                  className="mt-4"
                />
              )}
            </div>

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

          </div>

        </div>
      </div>

    </div>
  )
}
