import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, MessageCircle,
  Globe, Shield, Zap, Check, Star, ExternalLink, Bike, Store,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getShopBySlug } from '@/lib/supabase/queries'
import { SITE_URL, SITE_NAME } from '@/constants'
import { getAreaForLocation } from '@/constants/areas'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { TrustBadge } from '@/components/ride/TrustBadge'
import { TrackView } from '@/components/analytics/TrackView'
import { shopProperties } from '@/lib/posthog'
import { ShopChatButton } from '@/components/shop/ShopChatButton'
import { ShopQuickQuestions } from '@/components/shop/ShopQuickQuestions'
import { ShopAboutSection } from '@/components/shop/ShopAboutSection'
import { ShopLocationMapClient as ShopLocationMap } from '@/components/map/ShopLocationMapClient'
import { getShopChatStats } from '@/lib/shop-chat-stats'
import { getShopReviews } from '@/app/actions/reviews'
import ReviewsSection from './ReviewsSection'
import { AdminShopControl } from '@/components/admin/AdminShopControl'
import { OpeningHoursDropdown } from '@/components/shop/OpeningHoursDropdown'

interface ShopPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export async function generateMetadata({ params }: ShopPageProps) {
  const { slug } = await params
  const data = await getShopBySlug(slug)
  if (!data) return {}

  const title = `${data.name} — Scooter Rental ${data.location}, Phuket`
  const description = data.description ||
    `Rent scooters from ${data.name} in ${data.location}, Phuket. ${data.scooters.length > 0 ? `${data.scooters.length} scooters available.` : 'Contact the shop directly.'}`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/shop/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop/${slug}`,
      type: 'website' as const,
      siteName: SITE_NAME,
      ...(data.coverImage ? { images: [{ url: data.coverImage, width: 1600, height: 900, alt: data.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      ...(data.coverImage ? { images: [data.coverImage] } : {}),
    },
  }
}

// ── Default shop banner ─────────────────────────────────────────────────────────
// To activate: place final asset at /public/default-shop-banner.png and set:
//   const DEFAULT_BANNER_URL = '/default-shop-banner.png'
const DEFAULT_BANNER_URL: string | null = null

function DefaultShopBanner({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? 'aspect-[16/9] relative overflow-hidden' : 'h-[260px] relative overflow-hidden'}>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0d1520 0%, #1a1208 55%, #2d1008 100%)' }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 15% 50%, #FF6B35 0%, transparent 65%), ' +
            'radial-gradient(ellipse 50% 50% at 88% 42%, rgba(255,107,53,0.22) 0%, transparent 55%)',
        }}
      />
    </div>
  )
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params
  const data = await getShopBySlug(slug)
  if (!data) notFound()

  const { scooters, ...shop } = data
  const shopArea = shop.location ? getAreaForLocation(shop.location) : null

  const [chatStats, { reviews, userReview }, supabase] = await Promise.all([
    getShopChatStats(shop.id),
    getShopReviews(shop.id),
    createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null
  const hasDelivery  = scooters.some(s => s.deliveryAvailable)
  const hasInsurance = scooters.some(s => s.insuranceIncluded)
  const hasHelmet    = scooters.some(s => s.helmetIncluded)

  const waLink = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(shop.name)}%2C%20I%20found%20you%20on%20Koh%20Ride%20and%20would%20like%20to%20rent%20a%20scooter.`
    : null

  const hasCoords = Boolean(shop.lat && shop.lng)
  const locMode   = shop.locationVisibility ?? 'exact'
  // Only show map when owner has placed a real pin — not for zone-default coords (TYPE 3)
  const showMap   = hasCoords && shop.hasPrecisePin

  // LocalBusiness structured data — only real fields, no invented data
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: shop.name,
    url: `${SITE_URL}/shop/${slug}`,
    image: shop.coverImage || shop.logo || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: shop.location,
      addressRegion: 'Phuket',
      addressCountry: 'TH',
    },
    ...(shop.description ? { description: shop.description } : {}),
    ...(shop.phone ? { telephone: shop.phone } : {}),
    ...(shop.website ? { sameAs: [shop.website] } : {}),
    ...(hasCoords ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: shop.lat,
        longitude: shop.lng,
      },
    } : {}),
    ...(shop.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: shop.rating.toFixed(1),
        reviewCount: shop.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
    ...(scooters.length > 0 ? {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Scooter Rentals',
        itemListElement: scooters.slice(0, 5).map(s => ({
          '@type': 'Offer',
          name: s.name,
          price: s.pricePerDay,
          priceCurrency: 'THB',
          availability: 'https://schema.org/InStock',
        })),
      },
    } : {}),
  }

  // Breadcrumb: Home → Area page (if resolved) → Shop, for accurate URL hierarchy + PageRank flow
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: shopArea ? [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `Scooter Rental ${shopArea.label}`, item: `${SITE_URL}/phuket/${shopArea.slug}` },
      { '@type': 'ListItem', position: 3, name: shop.name, item: `${SITE_URL}/shop/${slug}` },
    ] : [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Rental Shops', item: `${SITE_URL}/explore` },
      { '@type': 'ListItem', position: 3, name: shop.name, item: `${SITE_URL}/shop/${slug}` },
    ],
  }

  // Desktop: coverImage → mobileBanner → default  |  Mobile: mobileBanner → coverImage → default
  const desktopBannerSrc = shop.coverImage || shop.mobileBanner || DEFAULT_BANNER_URL
  const mobileBannerSrc  = shop.mobileBanner || shop.coverImage || DEFAULT_BANNER_URL

  // Admin display overrides — NULL means "use real value"
  const displayRating       = shop.adminRating       ?? shop.rating
  const displayReviewCount  = shop.adminReviewCount  ?? shop.reviewCount
  const displayScooterCount = shop.adminScooterCount ?? scooters.length
  const showScooterCount      = shop.showScooterCount      !== false
  const showNewListingBadges  = shop.showNewListingBadges  !== false

  return (
    <div className="bg-white min-h-screen pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TrackView
        eventType="shop_view"
        shopId={shop.id}
        posthogEvent="shop_viewed"
        posthogProperties={shopProperties(shop)}
      />

      {/* ── Breadcrumb ── */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-4 h-11 flex items-center">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#f5f4f2] text-[#5c5c58] hover:bg-[#ececea] hover:text-[#0f0f0e] transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore
          </Link>
        </div>
      </div>

      {/* ── Banner ── */}
      <div className="relative">
        {/* Desktop banner (≥ 768px) */}
        <div className="hidden md:block">
          {desktopBannerSrc ? (
            <ScooterImage src={desktopBannerSrc} alt={shop.name} className="h-[260px]" overlay priority sizes="100vw" />
          ) : (
            <DefaultShopBanner />
          )}
        </div>
        {/* Mobile banner (< 768px) */}
        <div className="block md:hidden">
          {mobileBannerSrc ? (
            <ScooterImage src={mobileBannerSrc} alt={shop.name} className="aspect-[16/9]" overlay priority sizes="100vw" />
          ) : (
            <DefaultShopBanner mobile />
          )}
        </div>

        {/* Shop identity overlaid on banner */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end px-5 md:px-8 pb-7">
          <div className="max-w-5xl mx-auto w-full">
            {/* Logo — only rendered when present; no fallback, no placeholder */}
            {shop.logo && (
              <img
                src={shop.logo}
                alt={shop.name}
                className="w-16 h-16 rounded-2xl object-cover border border-white/20 mb-3"
              />
            )}
            <h1 className="text-white font-bold text-[26px] md:text-[34px] leading-tight tracking-tight mb-1.5">
              {shop.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-white/70 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {shop.location}, Phuket
              </span>
              {displayReviewCount > 0 && (
                <span className="flex items-center gap-1 text-white/70 text-sm">
                  <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                  {displayRating.toFixed(1)} ({displayReviewCount} reviews)
                </span>
              )}
              {showScooterCount && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-white/70 text-sm">
                    {displayScooterCount} scooter{displayScooterCount !== 1 ? 's' : ''} available
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
        {/*
          Mobile: flex-col with order — fleet (order-1) above sidebar (order-2)
          Desktop: CSS grid with explicit col/row placement, order ignored
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-10">

          {/* ── RIGHT sidebar (col-3 on desktop, second on mobile via order-2) ── */}
          <div className="order-2 lg:order-none lg:col-start-3 lg:row-start-1 lg:row-span-2 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-32 space-y-4">

              {/* Contact card */}
              <div className="bg-white rounded-[20px] border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] p-5">

                {/* Shop identity row */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#f0f0ec]">
                  {shop.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.logo} alt={shop.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 bg-[#f0ede8] rounded-full flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-[#a09890]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0f0f0e] truncate">{shop.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-[#FF6B35] flex-shrink-0" />
                      <span className="text-[11px] text-[#5c5c58] font-medium truncate">{shop.address || shop.location + ', Phuket'}</span>
                    </div>
                    {shop.showOpeningHours !== false && shop.openingHours && (
                      <OpeningHoursDropdown
                        hours={shop.openingHours}
                        variant="default"
                        className="mt-0.5"
                      />
                    )}
                    {chatStats.isFastResponder && (
                      <div className="mt-1">
                        <TrustBadge variant="fast_response" size="xs" />
                      </div>
                    )}
                  </div>
                  {displayReviewCount > 0 && (
                    <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                        <span className="text-sm font-bold text-[#0f0f0e]">{displayRating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-[#9c9c98]">{displayReviewCount} reviews</span>
                    </div>
                  )}
                </div>

                {/* Response time — only shown when backed by real data */}
                {chatStats.avgMinutes !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-[#9c9c98] mb-3">
                    <Zap className="w-3 h-3 text-[#22c55e]" />
                    <span>Usually replies in <strong className="text-[#0f0f0e]">{chatStats.avgMinutes} min</strong></span>
                  </div>
                )}

                {/* Primary CTA — Koh Ride Chat */}
                <ShopChatButton shopId={shop.id} shopName={shop.name} shopSlug={slug} />

                {/* Secondary — WhatsApp */}
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-full bg-[#16a34a] text-white text-sm font-bold hover:bg-[#15803d] transition-colors active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Continue on WhatsApp
                  </a>
                )}

                {/* Quick question chips — open Koh Ride Chat with prefill */}
                <ShopQuickQuestions
                  shopId={shop.id}
                  shopSlug={slug}
                  questions={['ask_delivery', 'ask_deposit', 'ask_license', 'ask_availability', 'ask_monthly']}
                  waContext={{ shopName: shop.name, location: shop.location }}
                  className="mt-3"
                />

                {/* Info rows */}
                <div className="space-y-2 mt-4 pt-4 border-t border-[#f0f0ec] text-sm">
                  {shop.phone && !shop.whatsapp && (
                    <a href={`tel:${shop.phone}`} className="flex items-center gap-2.5 text-[#5c5c58] hover:text-[#FF6B35] transition-colors">
                      <Phone className="w-4 h-4 text-[#9c9c98] flex-shrink-0" />
                      {shop.phone}
                    </a>
                  )}
                  {shop.website && (
                    <a href={shop.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[#5c5c58] hover:text-[#FF6B35] transition-colors">
                      <Globe className="w-4 h-4 text-[#9c9c98] flex-shrink-0" />
                      <span className="truncate">{shop.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                    </a>
                  )}
                  {shop.instagram && (
                    <a href={`https://instagram.com/${shop.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[#5c5c58] hover:text-[#FF6B35] transition-colors">
                      <span className="w-4 h-4 text-[#9c9c98] flex-shrink-0 text-sm font-bold">IG</span>
                      <span>{shop.instagram.startsWith('@') ? shop.instagram : `@${shop.instagram}`}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Location map — desktop only (mobile map appears in left column) */}
              {showMap && (
                <div className="hidden lg:block">
                  <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2 px-1">
                    Location
                  </p>
                  <ShopLocationMap lat={shop.lat} lng={shop.lng} mode={locMode} className="h-[200px]" />
                  {shop.googleMapsLink && (
                    <a
                      href={shop.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 mt-2 text-xs text-[#9c9c98] hover:text-[#FF6B35] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in Google Maps
                    </a>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {showScooterCount && (
                  <div className="bg-white rounded-[16px] border border-[#e8e8e4] p-3.5 text-center">
                    <p className="text-[22px] font-bold text-[#0f0f0e] leading-none">{displayScooterCount}</p>
                    <p className="text-[10px] text-[#9c9c98] mt-1">Scooters available</p>
                  </div>
                )}
                {displayReviewCount > 0 ? (
                  <div className="bg-white rounded-[16px] border border-[#e8e8e4] p-3.5 text-center">
                    <p className="text-[22px] font-bold text-[#0f0f0e] leading-none">{displayRating.toFixed(1)}</p>
                    <p className="text-[10px] text-[#9c9c98] mt-1">{displayReviewCount} reviews</p>
                  </div>
                ) : chatStats.avgMinutes !== null ? (
                  <div className="bg-white rounded-[16px] border border-[#e8e8e4] p-3.5 text-center">
                    <p className="text-[13px] font-bold text-[#22c55e] leading-tight mt-1">&lt;{chatStats.avgMinutes} min</p>
                    <p className="text-[10px] text-[#9c9c98] mt-1">Response time</p>
                  </div>
                ) : null}
              </div>

              {/* Explore area CTAs */}
              {shopArea && (
                <Link
                  href={`/phuket/${shopArea.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#f8f8f6] border border-[#e8e8e4] text-[#5c5c58] font-semibold text-sm rounded-full hover:bg-[#f0f0ec] hover:text-[#0f0f0e] transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Scooter rental in {shopArea.label}
                </Link>
              )}
              <Link
                href={`/explore?location=${shop.location.toLowerCase()}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#f8f8f6] border border-[#e8e8e4] text-[#5c5c58] font-semibold text-sm rounded-full hover:bg-[#f0f0ec] hover:text-[#0f0f0e] transition-colors"
              >
                All scooters in {shop.location}
              </Link>

            </div>
          </div>

          {/* ── LEFT column Part A — fleet (first on mobile) ── */}
          <div className="order-1 lg:order-none lg:col-start-1 lg:col-span-2 lg:row-start-1 space-y-10">

            {/* Fleet — the main product */}
            <section>
              <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">
                Available scooters
                {showScooterCount && (
                  <span className="ml-2 text-sm font-normal text-[#9c9c98]">({displayScooterCount})</span>
                )}
              </h2>
              {scooters.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {scooters.map(scooter => (
                    <ScooterCard key={scooter.id} scooter={scooter} compact hideTrustRow hideNewListingBadge={!showNewListingBadges} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-[#f0f0ec] rounded-[20px]">
                  <div className="w-12 h-12 bg-[#f8f8f6] rounded-[16px] flex items-center justify-center mx-auto mb-3">
                    <Bike className="w-6 h-6 text-[#9c9c98]" strokeWidth={1.5} />
                  </div>
                  <p className="font-semibold text-[#0f0f0e] mb-1">No scooters available right now</p>
                  <p className="text-sm text-[#9c9c98]">Check back soon or contact the shop directly.</p>
                </div>
              )}
            </section>

          </div>

          {/* ── LEFT column Part B — about + services + reviews (third on mobile) ── */}
          <div className="order-3 lg:order-none lg:col-start-1 lg:col-span-2 lg:row-start-2 space-y-10 mt-10 lg:mt-0">

            {/* About */}
            {shop.description && shop.description.trim().length >= 30 && (
              <ShopAboutSection description={shop.description.trim()} />
            )}

            {/* Services */}
            {(hasInsurance || hasDelivery || hasHelmet) && (
              <section>
                <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">Services</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { show: hasInsurance, icon: Shield, label: 'Insurance available', color: 'text-[#22c55e]' },
                    { show: hasDelivery,  icon: Zap,    label: 'Delivery available',  color: 'text-[#FF6B35]' },
                    { show: hasHelmet,    icon: Check,  label: 'Helmet included',     color: 'text-[#22c55e]' },
                  ].filter(s => s.show).map(item => (
                    <div key={item.label} className="flex items-center gap-2.5 p-3 bg-[#f8f8f6] rounded-[12px] text-sm text-[#5c5c58]">
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Delivery zones */}
            {shop.deliveryZones && shop.deliveryZones.length > 0 && (
              <section>
                <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-1">Delivery available</h2>
                <p className="text-sm text-[#9c9c98] mb-3">This shop delivers to the following areas — confirm details directly.</p>
                <div className="flex flex-wrap gap-2">
                  {shop.deliveryZones.map(zone => (
                    <span key={zone} className="px-3 py-1.5 bg-[#fff4f0] text-[#FF6B35] text-sm font-medium rounded-full border border-[#fed7b0]">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {zone}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Location map — mobile only (desktop is in the sidebar) */}
            {hasCoords && (
              <section className="lg:hidden">
                <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-3">Where we're based</h2>
                <ShopLocationMap lat={shop.lat} lng={shop.lng} mode={locMode} className="h-[180px]" />
                {shop.googleMapsLink && (
                  <a
                    href={shop.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 mt-2 text-xs text-[#9c9c98] hover:text-[#FF6B35] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Google Maps
                  </a>
                )}
              </section>
            )}

            {/* Reviews */}
            <ReviewsSection
              shopId={shop.id}
              shopName={shop.name}
              shopOwnerId={shop.ownerId ?? null}
              initialReviews={reviews}
              userReview={userReview}
              currentUserId={currentUserId}
              shopRating={shop.rating}
              shopReviewCount={shop.reviewCount}
            />

          </div>
        </div>
      </div>

      <AdminShopControl
        shopId={shop.id}
        initialRating={shop.adminRating ?? null}
        initialReviewCount={shop.adminReviewCount ?? null}
        initialScooterCount={shop.adminScooterCount ?? null}
        initialShowScooterCount={showScooterCount}
        initialShowNewListingBadges={showNewListingBadges}
      />
    </div>
  )
}
