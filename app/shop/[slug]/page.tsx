import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Clock,
  Globe, Shield, Zap, Check, Star, ExternalLink, Bike, Store,
} from 'lucide-react'
import { getShopBySlug } from '@/lib/supabase/queries'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { TrustBadge } from '@/components/ride/TrustBadge'
import { EmptyReviews } from '@/components/ride/EmptyReviews'
import { TrackView } from '@/components/analytics/TrackView'
import { ShopChatButton } from '@/components/shop/ShopChatButton'
import { ShopQuickQuestions } from '@/components/shop/ShopQuickQuestions'
import { ShopLocationMapClient as ShopLocationMap } from '@/components/map/ShopLocationMapClient'
import { getShopChatStats } from '@/lib/shop-chat-stats'

interface ShopPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export async function generateMetadata({ params }: ShopPageProps) {
  const { slug } = await params
  const data = await getShopBySlug(slug)
  if (!data) return {}

  const title = `Scooter Rental in ${data.location} | ${data.name} — Koh Ride`
  const description = data.description ||
    `Rent scooters from ${data.name} in ${data.location}, Phuket. ${data.scooters.length} scooters available.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(data.coverImage ? { images: [{ url: data.coverImage, width: 1600, height: 900 }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
  }
}

// ── Default shop banner ─────────────────────────────────────────────────────────
// To activate: place final asset at /public/default-shop-banner.png and set:
//   const DEFAULT_BANNER_URL = '/default-shop-banner.png'
const DEFAULT_BANNER_URL: string | null = null

function DefaultShopBanner() {
  return (
    <div className="h-[260px] md:h-[360px] relative overflow-hidden">
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

  const chatStats   = await getShopChatStats(shop.id)
  const hasDelivery  = scooters.some(s => s.deliveryAvailable)
  const hasInsurance = scooters.some(s => s.insuranceIncluded)
  const hasHelmet    = scooters.some(s => s.helmetIncluded)

  const waLink = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(shop.name)}%2C%20I%20found%20you%20on%20Koh%20Ride%20and%20would%20like%20to%20rent%20a%20scooter.`
    : null

  const hasCoords = Boolean(shop.lat && shop.lng)
  const locMode   = shop.locationVisibility ?? 'exact'

  return (
    <div className="bg-white min-h-screen">
      <TrackView eventType="shop_view" shopId={shop.id} />

      {/* ── Breadcrumb ── */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-4 h-11 flex items-center">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm font-medium text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore
          </Link>
        </div>
      </div>

      {/* ── Banner ── */}
      <div className="relative">
        {shop.coverImage || DEFAULT_BANNER_URL ? (
          <ScooterImage
            src={(shop.coverImage ?? DEFAULT_BANNER_URL)!}
            alt={shop.name}
            className="h-[260px] md:h-[360px]"
            overlay
            priority
            sizes="100vw"
          />
        ) : (
          <DefaultShopBanner />
        )}

        {/* Shop identity over banner */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end px-5 md:px-8 pb-7">
          <div className="max-w-5xl mx-auto w-full">
            {/* Logo or initial */}
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.name}
                className="w-14 h-14 rounded-2xl object-cover border border-white/20 mb-3"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-bold text-2xl mb-3">
                {shop.name[0]}
              </div>
            )}
            <h1 className="text-white font-bold text-[26px] md:text-[34px] leading-tight tracking-tight mb-1.5">
              {shop.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-white/70 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {shop.location}, Phuket
              </span>
              {shop.reviewCount > 0 && (
                <span className="flex items-center gap-1 text-white/70 text-sm">
                  <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                  {shop.rating.toFixed(1)} ({shop.reviewCount} reviews)
                </span>
              )}
              <span className="text-white/30">·</span>
              <span className="text-white/70 text-sm">
                {scooters.length} scooter{scooters.length !== 1 ? 's' : ''} available
              </span>
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
          <div className="order-2 lg:order-none lg:col-start-3 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-32 space-y-4">

              {/* Contact card */}
              <div className="bg-white rounded-[20px] border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] p-5">

                {/* Shop identity row */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#f0f0ec]">
                  {shop.logo ? (
                    <img src={shop.logo} alt={shop.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 bg-[#f0ede8] rounded-full flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-[#a09890]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0f0f0e] truncate">{shop.name}</p>
                    {chatStats.isFastResponder && (
                      <div className="mt-1">
                        <TrustBadge variant="fast_response" size="xs" />
                      </div>
                    )}
                  </div>
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
                  <div className="flex items-start gap-2.5 text-[#5c5c58]">
                    <MapPin className="w-4 h-4 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                    <span>{shop.address || shop.location + ', Phuket'}</span>
                  </div>
                  {shop.openingHours?.monday && (
                    <div className="flex items-start gap-2.5 text-[#5c5c58]">
                      <Clock className="w-4 h-4 text-[#0ea5e9] flex-shrink-0 mt-0.5" />
                      <span>
                        {shop.openingHours.monday.enabled
                          ? `Mon–Fri ${shop.openingHours.monday.open}–${shop.openingHours.monday.close}`
                          : 'See shop for hours'}
                      </span>
                    </div>
                  )}
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
              {hasCoords && (
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
                <div className="bg-white rounded-[16px] border border-[#e8e8e4] p-3.5 text-center">
                  <p className="text-[22px] font-bold text-[#0f0f0e] leading-none">{scooters.length}</p>
                  <p className="text-[10px] text-[#9c9c98] mt-1">Scooters available</p>
                </div>
                {shop.reviewCount > 0 ? (
                  <div className="bg-white rounded-[16px] border border-[#e8e8e4] p-3.5 text-center">
                    <p className="text-[22px] font-bold text-[#0f0f0e] leading-none">{shop.rating.toFixed(1)}</p>
                    <p className="text-[10px] text-[#9c9c98] mt-1">{shop.reviewCount} reviews</p>
                  </div>
                ) : chatStats.avgMinutes !== null ? (
                  <div className="bg-white rounded-[16px] border border-[#e8e8e4] p-3.5 text-center">
                    <p className="text-[13px] font-bold text-[#22c55e] leading-tight mt-1">&lt;{chatStats.avgMinutes} min</p>
                    <p className="text-[10px] text-[#9c9c98] mt-1">Response time</p>
                  </div>
                ) : null}
              </div>

              {/* Explore area CTA */}
              <Link
                href={`/explore?location=${shop.location.toLowerCase()}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#f8f8f6] border border-[#e8e8e4] text-[#5c5c58] font-semibold text-sm rounded-full hover:bg-[#f0f0ec] hover:text-[#0f0f0e] transition-colors"
              >
                All scooters in {shop.location}
              </Link>

            </div>
          </div>

          {/* ── LEFT column (col-1/2 on desktop, first on mobile via order-1) ── */}
          <div className="order-1 lg:order-none lg:col-start-1 lg:col-span-2 lg:row-start-1 space-y-10">

            {/* Description */}
            {shop.description && (
              <p className="text-[#5c5c58] text-[15px] leading-relaxed -mt-4">
                {shop.description}
              </p>
            )}

            {/* Fleet — the main product */}
            <section>
              <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">
                Available scooters
                <span className="ml-2 text-sm font-normal text-[#9c9c98]">({scooters.length})</span>
              </h2>
              {scooters.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {scooters.map(scooter => (
                    <ScooterCard key={scooter.id} scooter={scooter} compact />
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
            <section>
              <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">Reviews</h2>
              <EmptyReviews />
            </section>

          </div>
        </div>
      </div>

    </div>
  )
}
