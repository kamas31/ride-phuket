import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Clock,
  Globe, Shield, Zap, Check, Star, ExternalLink,
} from 'lucide-react'
import { getShopBySlug } from '@/lib/supabase/queries'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { TrustBadge, isNewListing, isFastResponder } from '@/components/ride/TrustBadge'
import { EmptyReviews } from '@/components/ride/EmptyReviews'
import { QuickContact } from '@/components/ride/QuickContact'

interface ShopPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export async function generateMetadata({ params }: ShopPageProps) {
  const { slug } = await params
  const data = await getShopBySlug(slug)
  if (!data) return {}

  const title = `Scooter Rental in ${data.location} | ${data.name} — Ride Phuket`
  const description = data.description ||
    `Rent scooters from ${data.name} in ${data.location}, Phuket. ${data.scooters.length} scooters available. Insurance included.`

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

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params
  const data = await getShopBySlug(slug)
  if (!data) notFound()

  const { scooters, ...shop } = data

  const newPartner   = shop.reviewCount === 0 && shop.verified
  const fastResponder = isFastResponder(shop.responseTime)
  const waLink       = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(shop.name)}%2C%20I%20found%20you%20on%20Ride%20Phuket%20and%20would%20like%20to%20book%20a%20scooter.`
    : null

  return (
    <div className="bg-white min-h-screen">
      {/* ── Sticky breadcrumb ── */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-4 h-11 flex items-center justify-between">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm font-medium text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore
          </Link>
          <div className="flex items-center gap-2">
            {shop.verified && <TrustBadge variant="verified" />}
            {newPartner   && <TrustBadge variant="new_partner" />}
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative">
        {shop.coverImage ? (
          <ScooterImage
            src={shop.coverImage}
            alt={shop.name}
            className="h-[260px] md:h-[360px]"
            overlay
            priority
            sizes="100vw"
          />
        ) : (
          /* Fallback cinematic gradient hero */
          <div className="h-[260px] md:h-[360px] bg-gradient-to-br from-[#0d1520] via-[#1a1208] to-[#070809] relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, #FF6B35 0%, transparent 70%)' }} />
          </div>
        )}

        {/* Hero overlay content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end px-5 md:px-8 pb-7">
          <div className="max-w-5xl mx-auto w-full">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-bold text-2xl mb-3">
              {shop.name[0]}
            </div>
            <h1 className="text-white font-bold text-[26px] md:text-[34px] leading-tight tracking-tight mb-1.5">
              {shop.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
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
              <span className="text-white/70 text-sm">{scooters.length} scooter{scooters.length !== 1 ? 's' : ''} available</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* ── LEFT (fleet + about) ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {shop.verified      && <TrustBadge variant="verified"      size="sm" />}
              {fastResponder      && <TrustBadge variant="fast_response"  size="sm" />}
              {scooters.some(s => s.insuranceIncluded) && <TrustBadge variant="insurance" size="sm" />}
              {scooters.some(s => s.deliveryAvailable) && <TrustBadge variant="delivery"  size="sm" />}
              {newPartner         && <TrustBadge variant="new_partner"    size="sm" />}
            </div>

            {/* Description */}
            {shop.description && (
              <p className="text-[#5c5c58] text-[15px] leading-relaxed -mt-4">
                {shop.description}
              </p>
            )}

            {/* Fleet */}
            <section>
              <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">
                Available scooters
                <span className="ml-2 text-sm font-normal text-[#9c9c98]">({scooters.length})</span>
              </h2>
              {scooters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scooters.map(scooter => (
                    <ScooterCard key={scooter.id} scooter={scooter} compact />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-[#f0f0ec] rounded-[20px]">
                  <div className="text-4xl mb-3">🛵</div>
                  <p className="font-semibold text-[#0f0f0e] mb-1">No scooters available right now</p>
                  <p className="text-sm text-[#9c9c98]">Check back soon or contact the shop directly.</p>
                </div>
              )}
            </section>

            {/* Services */}
            <section>
              <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">Services</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { show: scooters.some(s => s.insuranceIncluded), icon: Shield, label: 'Insurance available', color: 'text-[#22c55e]' },
                  { show: scooters.some(s => s.deliveryAvailable), icon: Zap,    label: 'Hotel delivery',      color: 'text-[#FF6B35]' },
                  { show: scooters.some(s => s.helmetIncluded),    icon: Check,  label: 'Helmet included',     color: 'text-[#22c55e]' },
                  { show: true,                                      icon: Check,  label: 'Free cancellation',   color: 'text-[#22c55e]' },
                ].filter(s => s.show).map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 p-3 bg-[#f8f8f6] rounded-[12px] text-sm text-[#5c5c58]">
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </section>

            {/* Delivery zones */}
            {shop.deliveryZones && shop.deliveryZones.length > 0 && (
              <section>
                <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-3">Delivery zones</h2>
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

            {/* Reviews */}
            <section>
              <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">Reviews</h2>
              <EmptyReviews />
            </section>
          </div>

          {/* ── RIGHT (contact card) ── */}
          <div className="mt-8 lg:mt-0">
            <div className="sticky top-32 space-y-4">
              {/* Premium contact card */}
              <div className="bg-white rounded-[20px] border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] p-5">
                {/* Shop identity */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#f0f0ec]">
                  <div className="w-11 h-11 bg-[#FF6B35]/10 rounded-full flex items-center justify-center text-[#FF6B35] font-bold text-lg flex-shrink-0">
                    {shop.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0f0f0e] truncate">{shop.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {shop.verified && <TrustBadge variant="verified" size="xs" />}
                      {fastResponder && <TrustBadge variant="fast_response" size="xs" />}
                    </div>
                  </div>
                </div>

                {/* Quick contact with smart templates */}
                <QuickContact
                  whatsapp={shop.whatsapp}
                  phone={shop.phone}
                  shopName={shop.name}
                  responseTime={shop.responseTime}
                  context={{ shopName: shop.name, location: shop.location }}
                  questions={['ask_delivery', 'ask_deposit', 'ask_license', 'ask_availability', 'ask_monthly']}
                />

                {/* Info rows */}
                <div className="space-y-2 mt-4 pt-4 border-t border-[#f0f0ec] text-sm">
                  <div className="flex items-start gap-2.5 text-[#5c5c58]">
                    <MapPin className="w-4 h-4 text-[#9c9c98] flex-shrink-0 mt-0.5" />
                    <span>{shop.address || shop.location + ', Phuket'}</span>
                  </div>
                  {shop.openingHours?.monday && (
                    <div className="flex items-start gap-2.5 text-[#5c5c58]">
                      <Clock className="w-4 h-4 text-[#9c9c98] flex-shrink-0 mt-0.5" />
                      <span>
                        {shop.openingHours.monday.enabled
                          ? `Mon–Fri ${shop.openingHours.monday.open}–${shop.openingHours.monday.close}`
                          : 'See shop for hours'}
                      </span>
                    </div>
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

              {/* Stats row — real data only */}
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
                ) : shop.responseTime ? (
                  <div className="bg-white rounded-[16px] border border-[#e8e8e4] p-3.5 text-center">
                    <p className="text-[13px] font-bold text-[#22c55e] leading-tight mt-1">{shop.responseTime}</p>
                    <p className="text-[10px] text-[#9c9c98] mt-1">Response time</p>
                  </div>
                ) : null}
              </div>

              {/* Explore CTA */}
              <Link
                href={`/explore?location=${shop.location.toLowerCase()}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#FF6B35] text-white font-bold text-sm rounded-full hover:bg-[#e85d29] transition-colors shadow-sm"
              >
                Explore all scooters in {shop.location}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
