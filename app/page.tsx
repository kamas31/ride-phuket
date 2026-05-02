import Link from 'next/link'
import { ArrowRight, Shield, Zap, Truck, Headphones, Star, ChevronRight, MapPin, RotateCcw } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { ReviewCard } from '@/components/ride/ReviewCard'
import { REVIEWS } from '@/data/scooters'
import { LOCATIONS } from '@/constants'
import { getScooters } from '@/lib/supabase/queries'

const TRUST_STATS = [
  { value: '48', label: 'Verified shops' },
  { value: '4.9★', label: 'Average rating' },
  { value: '3,200+', label: 'Rides completed' },
  { value: '< 5min', label: 'To confirm' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose Your Ride',
    description: 'Browse verified scooters by location, model, and price. Filter by delivery, insurance, and more.',
  },
  {
    step: '02',
    title: 'Book Instantly',
    description: 'Select your dates and confirm in seconds. No waiting, no back-and-forth. Confirmed immediately.',
  },
  {
    step: '03',
    title: 'We Deliver to You',
    description: 'Your scooter arrives at your hotel, villa, or any location. Ride and enjoy Phuket.',
  },
]

const BENEFITS = [
  {
    icon: Shield,
    title: 'Verified & Insured',
    description: 'Every scooter and shop is personally vetted. Basic insurance included with every rental.',
    color: 'bg-[#f0fdf4] text-[#16a34a]',
  },
  {
    icon: Zap,
    title: 'Instant Booking',
    description: 'Book and receive confirmation in under 5 minutes. 24/7, no phone calls needed.',
    color: 'bg-[#fff4f0] text-[#FF6B35]',
  },
  {
    icon: Truck,
    title: 'Delivered to You',
    description: 'Skip the taxi to the rental shop. We deliver directly to your hotel or villa.',
    color: 'bg-[#eff6ff] text-[#2563eb]',
  },
  {
    icon: RotateCcw,
    title: 'Free Cancellation',
    description: 'Plans change. Cancel up to 24 hours before pickup at no charge, no questions asked.',
    color: 'bg-[#fdf4ff] text-[#9333ea]',
  },
]

export default async function HomePage() {
  const allScooters = await getScooters({ available: true })
  const featuredScooters = allScooters.slice(0, 4)
  const popularLocations = LOCATIONS.slice(1, 7)

  return (
    <div className="flex flex-col">
      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex flex-col">
        {/* Base dark layer */}
        <div className="absolute inset-0 bg-[#0d1a0f]" />
        {/* Hero background — tropical coastal road */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            opacity: 0.55,
          }}
        />
        {/* Gradient: darken top (nav) + strong bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/75" />
        {/* Subtle warm tint */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B35]/10 via-transparent to-transparent" />

        <div className="relative flex-1 flex flex-col justify-center items-center text-center px-4 pt-28 pb-20">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8">
            <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
            Live across Phuket — book in minutes
          </div>

          {/* Headline */}
          <h1 className="text-white font-bold text-[44px] md:text-[68px] lg:text-[76px] leading-[1.06] tracking-[-0.035em] max-w-4xl mb-6">
            Explore Phuket{' '}
            <span className="text-gradient">your way.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-white/70 text-[18px] md:text-[21px] max-w-md leading-relaxed mb-10 font-light">
            Premium scooters delivered to your hotel.
            <br />
            Verified shops. Instant booking.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
            <Link
              href="/explore"
              className="flex items-center gap-2.5 px-9 py-4 bg-[#FF6B35] text-white text-[16px] font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-[0_4px_24px_rgba(255,107,53,0.45)] hover:shadow-[0_8px_32px_rgba(255,107,53,0.5)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Scooters
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-[15px] font-semibold rounded-full border border-white/25 hover:bg-white/18 transition-all"
            >
              View All Locations
            </Link>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {TRUST_STATS.map((stat, i) => (
              <div key={stat.label} className="text-center">
                {i > 0 && <div className="hidden sm:block absolute -left-5 top-1/2 -translate-y-1/2 w-px h-6 bg-white/20" />}
                <div className="text-white font-bold text-[26px] leading-none tracking-tight">{stat.value}</div>
                <div className="text-white/50 text-xs mt-1.5 font-medium tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative flex justify-center pb-8">
          <div className="w-6 h-10 rounded-full border-2 border-white/25 flex justify-center pt-2 animate-bounce">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { emoji: '✅', text: 'All shops verified in-person' },
            { emoji: '🛡️', text: 'Insurance on every rental' },
            { emoji: '🚚', text: 'Hotel delivery available' },
            { emoji: '🔓', text: 'Free cancellation 24h' },
            { emoji: '💬', text: '24/7 WhatsApp support' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 flex-shrink-0 text-sm text-[#5c5c58]">
              <span className="text-base">{item.emoji}</span>
              <span className="font-medium whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── LOCATION STRIP ── */}
      <section className="bg-[#f8f8f6] border-b border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <span className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest whitespace-nowrap mr-2 flex-shrink-0">
              Popular areas
            </span>
            {popularLocations.map(loc => (
              <Link
                key={loc.id}
                href={`/explore?location=${loc.id}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-[#e8e8e4] hover:border-[#FF6B35] hover:text-[#FF6B35] text-sm text-[#5c5c58] font-medium transition-colors whitespace-nowrap"
              >
                <MapPin className="w-3 h-3" />
                {loc.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SCOOTERS ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Top Picks</p>
            <h2 className="text-[26px] md:text-[34px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
              Most popular scooters
            </h2>
          </div>
          <Link
            href="/explore"
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredScooters.map(scooter => (
            <ScooterCard key={scooter.id} scooter={scooter} />
          ))}
        </div>

        <div className="mt-7 text-center md:hidden">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#e8e8e4] rounded-full text-sm font-semibold text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
          >
            View all scooters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[#f8f8f6] py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-[26px] md:text-[34px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
              From browsing to riding in 3 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative bg-white rounded-[20px] p-6 border border-[#e8e8e4] group hover:border-[#FF6B35]/30 hover:shadow-[0_4px_20px_-4px_rgba(255,107,53,0.12)] transition-all">
                {/* Connector line on desktop */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-9 -right-3 w-5 border-t-2 border-dashed border-[#e8e8e4] z-10" />
                )}
                <div className="text-[40px] font-bold text-[#f0f0ec] leading-none mb-4 font-mono group-hover:text-[#FF6B35]/20 transition-colors">
                  {step.step}
                </div>
                <h3 className="text-[17px] font-bold text-[#0f0f0e] mb-2">{step.title}</h3>
                <p className="text-[#5c5c58] text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Why Ride Phuket</p>
          <h2 className="text-[26px] md:text-[34px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
            Street rentals are a gamble.{' '}
            <span className="text-[#FF6B35]">We're not.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map(benefit => (
            <div
              key={benefit.title}
              className="flex gap-4 p-5 bg-white rounded-[20px] border border-[#e8e8e4] hover:border-[#d0d0cc] hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all"
            >
              <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 ${benefit.color}`}>
                <benefit.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-[#0f0f0e] mb-1">{benefit.title}</h3>
                <p className="text-[#5c5c58] text-sm leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="bg-[#f8f8f6] py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-[#FF6B35] fill-[#FF6B35]" />
              ))}
            </div>
            <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Real Reviews</p>
            <h2 className="text-[26px] md:text-[34px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
              Loved by riders worldwide
            </h2>
            <p className="text-[#9c9c98] text-sm mt-2">
              3,200+ completed rentals &nbsp;·&nbsp; 4.9 / 5 average rating &nbsp;·&nbsp; 97% would re-book
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REVIEWS.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="relative overflow-hidden bg-[#0f0f0e] rounded-[28px] px-8 md:px-16 py-12 text-center">
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#FF6B35]/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 right-0 w-60 h-40 bg-[#FF6B35]/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-4">Ready to ride?</p>
            <h2 className="text-[28px] md:text-[40px] font-bold text-white leading-tight tracking-tight mb-3">
              Your perfect scooter<br />is waiting.
            </h2>
            <p className="text-white/50 text-base mb-8 max-w-sm mx-auto leading-relaxed">
              Join 3,200+ riders who explored Phuket their way — on their own terms, at their own pace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/explore"
                className="flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white text-base font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Find My Scooter
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
              >
                Free cancellation · No card required
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
