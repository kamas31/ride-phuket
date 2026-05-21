import Link from 'next/link'
import { ArrowRight, Shield, Zap, Truck, Star, ChevronRight, MapPin, RotateCcw, Check } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { LOCATIONS } from '@/constants'
import { getScooters, getStats } from '@/lib/supabase/queries'

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
  const [allScooters, { shopCount, scooterCount }] = await Promise.all([
    getScooters({ available: true }),
    getStats(),
  ])
  const featuredScooters = allScooters.slice(0, 4)
  const popularLocations = LOCATIONS.slice(1, 7)

  // Real trust stats — numbers only shown when > 0, otherwise qualitative
  const trustItems = [
    scooterCount > 0
      ? { value: String(scooterCount), label: 'Scooters listed' }
      : { value: '✓', label: 'Curated fleet' },
    shopCount > 0
      ? { value: String(shopCount), label: 'Verified shops' }
      : { value: '✓', label: 'Verified shops' },
    { value: '24/7', label: 'WhatsApp support' },
    { value: 'Free', label: 'Cancellation' },
  ]

  return (
    <div className="flex flex-col">
      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden">

        {/* ── Layer 1: Absolute black base (prevents any flash) */}
        <div className="absolute inset-0 bg-[#07090d]" />

        {/* ── Layer 2: Cinematic background — Phuket tropical beach, golden hour */}
        <div
          className="absolute inset-0 hero-ken-burns"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 45%',
            opacity: 0.62,
          }}
        />

        {/* ── Layer 3: Radial vignette — darkens edges, keeps center luminous */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 20%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* ── Layer 4: Top shadow — nav readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-transparent pointer-events-none" />

        {/* ── Layer 5: Bottom shadow — CTA + stats readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* ── Layer 6: Warm golden tint at bottom — ties into brand orange */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(180,70,10,0.22) 0%, rgba(255,107,53,0.08) 25%, transparent 55%)',
          }}
        />

        {/* ── Layer 7: Cool blue-teal atmosphere at top — depth + sky feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(5,18,38,0.35) 0%, transparent 40%)',
          }}
        />

        {/* ── CONTENT ── */}
        <div className="relative flex-1 flex flex-col justify-center items-center text-center px-5 pt-28 pb-16">

          {/* Live pill — entrance 0.15s */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.15s' }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 bg-white/[0.1] backdrop-blur-md border border-white/[0.18] rounded-full text-white/90 text-sm font-medium">
              <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse flex-shrink-0" />
              Live across Phuket — book in minutes
            </div>
          </div>

          {/* Headline — entrance 0.3s */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.3s' }}
          >
            <h1
              className="text-white font-bold text-[46px] md:text-[70px] lg:text-[80px] leading-[1.04] tracking-[-0.04em] max-w-[16ch] mb-6 hero-text-shadow"
            >
              Explore Phuket{' '}
              <span className="text-gradient">your way.</span>
            </h1>
          </div>

          {/* Subheadline — entrance 0.48s */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.48s' }}
          >
            <p className="text-white/72 text-[17px] md:text-[20px] max-w-[30ch] leading-[1.65] mb-10 font-light hero-sub-shadow">
              Premium scooters delivered to your hotel.
              <br className="hidden sm:block" />
              Verified shops. Instant booking.
            </p>
          </div>

          {/* CTAs — entrance 0.62s */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.62s' }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
              <Link
                href="/explore"
                className="flex items-center gap-2.5 px-9 py-[15px] bg-[#FF6B35] text-white text-[15px] font-bold rounded-full
                           shadow-[0_4px_28px_rgba(255,107,53,0.5),0_2px_8px_rgba(0,0,0,0.3)]
                           hover:bg-[#e85d29] hover:shadow-[0_8px_40px_rgba(255,107,53,0.6)]
                           hover:scale-[1.03] active:scale-[0.97]
                           transition-all duration-200"
              >
                Explore Scooters
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-2 px-7 py-[15px] rounded-full text-[15px] font-semibold text-white/90
                           bg-white/[0.1] backdrop-blur-md border border-white/[0.22]
                           hover:bg-white/[0.18] hover:border-white/30
                           transition-all duration-200"
              >
                View All Locations
              </Link>
            </div>
          </div>

          {/* Stats glass card — entrance 0.8s */}
          <div
            className="w-full max-w-xl"
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.8s' }}
          >
            <div className="px-5 py-4 bg-white/[0.07] backdrop-blur-md border border-white/[0.1] rounded-2xl">
              <div className="flex flex-wrap items-center justify-center gap-y-3">
                {trustItems.map((item, i) => (
                  <div key={item.label} className="flex items-center">
                    {i > 0 && (
                      <div className="w-px h-7 bg-white/[0.15] mx-5 flex-shrink-0" />
                    )}
                    <div className="text-center">
                      <div className="text-white font-bold text-[22px] md:text-[24px] leading-none tracking-tight">
                        {item.value}
                      </div>
                      <div className="text-white/48 text-[11px] mt-1.5 font-medium tracking-wide uppercase">
                        {item.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator — entrance 1.1s */}
        <div
          className="relative flex flex-col items-center pb-8 gap-2"
          style={{ opacity: 0, animation: 'fade-in 0.8s ease forwards 1.1s' }}
        >
          <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-white/35">Scroll</span>
          <div className="w-[22px] h-9 rounded-full border border-white/20 flex justify-center pt-1.5">
            <div className="w-0.5 h-2.5 bg-white/40 rounded-full animate-bounce" />
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
              Verified shops, real insurance, and delivery to your hotel — the reliable way to explore Phuket.
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
