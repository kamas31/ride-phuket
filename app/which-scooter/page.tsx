import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, ChevronRight, Fuel, Gauge, Mountain, Package, Users } from 'lucide-react'
import { ScooterQuiz } from '@/components/which-scooter/ScooterQuiz'
import { MODELS } from '@/constants/models'
import { getCategoryForModel, type CategoryProfile } from '@/constants/scooter-categories'
import { getScooters } from '@/lib/supabase/queries'
import { SITE_NAME, SITE_URL } from '@/constants'

export const revalidate = 60

const TITLE = 'Which Scooter Should You Rent in Phuket? | Koh Ride'
const DESCRIPTION =
  "Not sure which scooter is right for your trip? Answer a few quick questions and we'll recommend the best scooter for your needs — then compare every model Koh Ride offers in Phuket."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/which-scooter` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/which-scooter`,
    type: 'website',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  keywords: [
    'which scooter to rent in phuket',
    'best scooter rental phuket',
    'scooter recommendation phuket',
    'pcx vs nmax vs adv',
    'what scooter should i rent phuket',
  ],
}

const FAQ_ITEMS = [
  {
    question: 'How does the scooter recommendation tool work?',
    answer: "Answer five quick questions about who's riding, your experience level, what you'll mainly use the scooter for, your budget, and what matters most to you. We match your answers against the real characteristics of each scooter model Koh Ride offers and recommend the best fit, plus two close alternatives.",
  },
  {
    question: 'What if I disagree with the recommendation?',
    answer: "The quiz gives you a strong starting point, not a strict rule — you can always retake it with different answers, or browse every model directly on the comparison table below and the Popular Models section.",
  },
  {
    question: 'Do I need to rent the exact scooter that gets recommended?',
    answer: "No. Each recommendation links to that model's page, where you can see live listings, prices, and shops — but you're always free to message any shop about any scooter you see on Koh Ride.",
  },
  {
    question: 'Is a bigger scooter always better for Phuket?',
    answer: "Not necessarily. Bigger, more powerful scooters (like the X-ADV or TMAX) suit experienced riders and longer touring days, but a lighter, easier scooter (like the PCX or Click) is often the better choice for first-time riders sticking to town and beach areas.",
  },
]

export default async function WhichScooterPage() {
  const allScooters = await getScooters({ available: true })

  // Build once, reused by both the quiz results and the comparison/popular
  // sections below — no per-model DB calls, same pattern as model pages.
  const modelCounts: Record<string, number> = {}
  for (const model of MODELS) {
    modelCounts[model.slug] = allScooters.filter(
      s => s.model.toLowerCase() === model.modelQuery.toLowerCase(),
    ).length
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Which Scooter Should You Rent?', item: `${SITE_URL}/which-scooter` },
    ],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative bg-[#0f0f0e] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/20 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-14">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">Which Scooter?</span>
            </nav>

            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-[32px] md:text-[52px] font-bold leading-tight tracking-tight mb-5">
                Which Scooter Should You
                <br />
                <span className="text-[#FF6B35]">Rent in Phuket?</span>
              </h1>
              <p className="text-white/65 text-[17px] leading-relaxed mb-2 max-w-xl mx-auto">
                Not sure which scooter is right for your trip?
              </p>
              <p className="text-white/65 text-[17px] leading-relaxed mb-8 max-w-xl mx-auto">
                Answer a few quick questions and we&apos;ll recommend the best scooter for your needs.
              </p>
              <a
                href="#quiz"
                className="inline-flex items-center gap-2 px-7 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-lg text-[15px]"
              >
                Find My Perfect Scooter
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Quiz */}
        <section id="quiz" className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <ScooterQuiz modelCounts={modelCounts} />
        </section>

        {/* Comparison table */}
        <section className="bg-[#f8f8f6] py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8">
              <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Compare</p>
              <h2 className="text-[24px] md:text-[32px] font-bold text-[#0f0f0e] tracking-tight">
                Scooter Comparison
              </h2>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e8e4]">
                    <th className="text-left text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 pr-4">Model</th>
                    <th className="text-center text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 px-2">
                      <Users className="w-3.5 h-3.5 inline-block mb-1" /><br />Beginner
                    </th>
                    <th className="text-center text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 px-2">
                      Comfort
                    </th>
                    <th className="text-center text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 px-2">
                      <Package className="w-3.5 h-3.5 inline-block mb-1" /><br />Storage
                    </th>
                    <th className="text-center text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 px-2">
                      <Gauge className="w-3.5 h-3.5 inline-block mb-1" /><br />Power
                    </th>
                    <th className="text-center text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 px-2">
                      Passenger
                    </th>
                    <th className="text-center text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 px-2">
                      <Mountain className="w-3.5 h-3.5 inline-block mb-1" /><br />Hills
                    </th>
                    <th className="text-center text-xs font-semibold text-[#9c9c98] uppercase tracking-wide py-3 pl-2">
                      <Fuel className="w-3.5 h-3.5 inline-block mb-1" /><br />Economy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map(model => {
                    const category = getCategoryForModel(model.slug)
                    if (!category) return null // uncategorized — see UNCATEGORIZED_MODEL_SLUGS
                    return <ComparisonRow key={model.slug} name={model.name} category={category} />
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#9c9c98] text-center mt-4">
              Ratings reflect the general characteristics of each scooter class, not a single specific listing.
            </p>
          </div>
        </section>

        {/* Popular models */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Browse</p>
              <h2 className="text-[24px] md:text-[32px] font-bold text-[#0f0f0e] tracking-tight">
                Popular Scooter Models
              </h2>
            </div>
            <Link
              href="/explore"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all"
            >
              All scooters <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MODELS.map(model => (
              <Link
                key={model.slug}
                href={`/models/${model.slug}`}
                className="flex items-center justify-between px-4 py-3.5 bg-[#f8f8f6] rounded-[14px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all"
              >
                <div>
                  <p className="font-semibold text-sm text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors">{model.name}</p>
                  <p className="text-xs text-[#9c9c98]">
                    {modelCounts[model.slug] > 0 ? `${modelCounts[model.slug]} available now` : 'See details'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9c9c98] group-hover:text-[#FF6B35] transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map(item => (
              <div key={item.question} className="p-5 bg-[#f8f8f6] rounded-[16px] border border-[#e8e8e4]">
                <p className="font-semibold text-sm text-[#0f0f0e] mb-1.5">{item.question}</p>
                <p className="text-sm text-[#5c5c58] leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-[#0f0f0e] rounded-[24px] px-8 py-10 text-center relative">
            <div className="absolute left-1/2 -translate-x-1/2 w-60 h-20 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-[24px] md:text-[32px] font-bold text-white mb-3 tracking-tight">
              Ready to find your scooter?
            </h2>
            <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">
              Browse every scooter live on Koh Ride and contact the shop directly.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all text-base"
            >
              Explore All Scooters
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}

// ── Comparison row ────────────────────────────────────────────────────────────
// Ratings are derived entirely from the model's existing CategoryProfile
// (constants/scooter-categories.ts) — never hand-scored per model.

function Dots({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]'}`}
        />
      ))}
    </span>
  )
}

function experienceLabel(category: CategoryProfile): string {
  if (category.minExperience === 'beginner') return 'Yes'
  if (category.minExperience === 'some') return 'Some exp.'
  return 'Experienced'
}

function ComparisonRow({ name, category }: { name: string; category: CategoryProfile }) {
  return (
    <tr className="border-b border-[#e8e8e4] last:border-0">
      <td className="text-left py-3.5 pr-4 font-semibold text-sm text-[#0f0f0e] whitespace-nowrap">{name}</td>
      <td className="text-center py-3.5 px-2 text-xs text-[#5c5c58]">{experienceLabel(category)}</td>
      <td className="text-center py-3.5 px-2"><Dots value={category.priorities.comfort} /></td>
      <td className="text-center py-3.5 px-2"><Dots value={category.priorities.storage} /></td>
      <td className="text-center py-3.5 px-2"><Dots value={category.priorities.performance} /></td>
      <td className="text-center py-3.5 px-2 text-xs text-[#5c5c58]">{category.passengerFriendly ? 'Good' : 'Limited'}</td>
      <td className="text-center py-3.5 px-2 text-xs text-[#5c5c58]">{category.usage.includes('hills') ? 'Good' : 'Limited'}</td>
      <td className="text-center py-3.5 pl-2"><Dots value={category.priorities.fuelEconomy} /></td>
    </tr>
  )
}
