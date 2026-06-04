import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronRight, MapPin } from 'lucide-react'
import { SITE_URL, SITE_NAME } from '@/constants'
import { AREAS } from '@/constants/areas'

const FAQ_TITLE = 'Scooter Rental Phuket FAQ — Licenses, Prices & Safety'
const FAQ_DESC  = 'Answers to the most common questions about renting a scooter in Phuket. Driving license requirements, deposits, prices, safety tips, and insurance explained.'

export const metadata: Metadata = {
  title: FAQ_TITLE,
  description: FAQ_DESC,
  keywords: ['scooter rental phuket faq', 'phuket motorbike license', 'scooter rental deposit phuket', 'driving license phuket', 'scooter safety phuket'],
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: FAQ_TITLE,
    description: FAQ_DESC,
    url: `${SITE_URL}/faq`,
    type: 'website',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: FAQ_TITLE,
    description: FAQ_DESC,
  },
}

const FAQ_GROUPS = [
  {
    heading: 'Pricing & Rental',
    items: [
      {
        q: 'How much does it cost to rent a scooter in Phuket?',
        a: 'Automatic scooters (Honda Click, Yamaha Fino) typically start from ฿180–฿250 per day. Larger models like the Honda PCX or Yamaha NMAX range from ฿300–฿450/day. Big bikes (Honda ADV, Royal Enfield) can reach ฿600–฿900/day. Prices drop significantly for weekly or monthly rentals — always ask the shop for a longer-term rate.',
      },
      {
        q: 'How do I book a scooter?',
        a: 'There is no online booking required. Browse available scooters on Koh Ride, find one you like, and contact the shop directly via the message button or WhatsApp. The shop will confirm availability, arrange a pickup time, and handle payment — usually cash on arrival.',
      },
      {
        q: 'Can I rent a scooter for a week or a month?',
        a: 'Yes, and most shops offer significant discounts for longer rentals. A scooter priced at ฿300/day may cost ฿1,500–฿1,800/week or ฿4,000–฿6,000/month. Long-term rates vary by shop and model — contact the shop directly to negotiate.',
      },
      {
        q: 'Can I pay by credit card?',
        a: 'Most small rental shops in Phuket are cash-only. Some larger shops at beach areas accept card payments, but this is not standard. Bring Thai baht cash for the rental fee and deposit.',
      },
    ],
  },
  {
    heading: 'Driving License Requirements',
    items: [
      {
        q: 'Do I need a driving license to rent a scooter in Phuket?',
        a: 'Thai law requires a valid motorcycle licence to ride any motorised scooter. You need either a Thai motorcycle licence or an International Driving Permit (IDP) that covers motorcycle category — a standard car IDP is not sufficient. Thai police do conduct licence checks in tourist areas, particularly in Patong and Kata. If stopped without a valid licence, fines of ฿500–฿1,000 apply.',
      },
      {
        q: 'Can I use my home country driving licence?',
        a: 'A foreign national driving licence alone does not legally authorise you to ride in Thailand without an IDP. However, an IDP issued in your home country (which must list motorcycle category) is recognised under the 1949 Geneva Road Traffic Convention. Many countries issue IDPs through national automobile clubs (AA, AAA, ADAC, RAC, etc.) — apply before you travel.',
      },
      {
        q: 'Will the rental shop ask to see my licence?',
        a: 'Requirements vary by shop. Some ask for a licence, others do not. Regardless of whether the shop asks, riding without a valid licence means Thai third-party insurance is void, police fines apply, and your travel insurance will likely be invalidated if you have an accident.',
      },
    ],
  },
  {
    heading: 'Deposits & Documents',
    items: [
      {
        q: 'What deposit is required?',
        a: 'Most shops ask for a cash deposit of ฿2,000–฿5,000 depending on the scooter model. The deposit is returned when you bring the bike back undamaged. Some shops accept a copy of your passport rather than a cash deposit — always clarify before renting.',
      },
      {
        q: 'Should I hand over my passport as a deposit?',
        a: 'Handing over your actual passport is not recommended and is technically illegal under Thai law. If a shop asks for your passport as security, offer a cash deposit instead, or provide a passport photocopy. Reputable shops accept one of these alternatives.',
      },
      {
        q: 'What documents should I bring to pick up my scooter?',
        a: 'Bring your passport (or a copy), your national driving licence, and your International Driving Permit if you have one. Have the cash for the rental fee and deposit ready. Take photos of any existing scratches or damage before you ride away.',
      },
    ],
  },
  {
    heading: 'Safety & Traffic Rules',
    items: [
      {
        q: 'Which side of the road do I drive on in Thailand?',
        a: 'Thailand drives on the left side of the road, the same as the UK, Australia, and Japan. If you are used to driving on the right, take extra care at intersections and when pulling out of junctions, especially in the first day or two.',
      },
      {
        q: 'Are helmets required by law?',
        a: 'Yes. Wearing a helmet is compulsory by law for both the rider and any pillion passenger. Police checkpoints do issue on-the-spot fines for riding without a helmet, typically ฿500. Your rental shop will provide helmets — check that the strap and fit are secure before riding.',
      },
      {
        q: 'What is the speed limit in Phuket?',
        a: 'The general speed limit on urban roads is 80 km/h, though many roads near beaches and towns have 30–50 km/h limits. Highways linking areas can allow up to 90 km/h. Speed cameras and police patrols are active on main roads. Riding to road conditions is more important than the posted limit.',
      },
      {
        q: 'Is it safe to ride a scooter in Phuket?',
        a: 'Phuket roads are manageable for experienced riders, but require attention. Common hazards include sand on bends (especially near beaches), sudden rain making roads slippery, tourist minivans, and poor road surfaces on smaller roads. Ride at a pace you are comfortable with, never drink and ride, and avoid the steep hill roads at night until you know them. Starting on quieter roads before venturing into Patong traffic is advisable for first-time visitors.',
      },
    ],
  },
  {
    heading: 'Insurance & Breakdowns',
    items: [
      {
        q: 'Is insurance included in the rental?',
        a: 'Thai compulsory third-party insurance (Por Ror Bor) is required on all registered vehicles and should be included in any legitimate rental. This covers injury to third parties but does not cover damage to the scooter itself, your own injuries, or theft. Ask the shop what is covered. Riders without a valid licence are typically excluded from all insurance coverage.',
      },
      {
        q: 'What happens if I have an accident or the scooter breaks down?',
        a: 'Contact your rental shop immediately. Reputable shops have a contact number for breakdowns and will send a replacement scooter or assistance. For accidents involving another party, call the tourist police (1155) or regular police (191) to file a report before moving the vehicles. Document everything with photos. Your cash deposit may be used to cover damage costs.',
      },
      {
        q: 'What if the scooter gets a puncture or runs out of fuel?',
        a: 'Petrol stations (ปั๊มน้ำมัน) are plentiful across Phuket, including small roadside bottles and drums in more remote areas. Fuel is typically petrol 95 (gasohol) for most scooters — check with the shop. For a puncture, tyre repair shops (ช่างยาง) are common near every beach area and cost ฿50–฿150 to fix. Most shops are happy to direct you to the nearest one.',
      },
    ],
  },
]

export default function FaqPage() {
  const allFaqs = FAQ_GROUPS.flatMap(g => g.items)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${SITE_URL}/faq` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-[#0f0f0e] text-white">
          <div className="max-w-3xl mx-auto px-4 pt-28 pb-14">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">FAQ</span>
            </nav>
            <h1 className="text-[36px] md:text-[48px] font-bold leading-tight tracking-tight mb-4">
              Scooter Rental Phuket
              <br />
              <span className="text-[#FF6B35]">FAQ</span>
            </h1>
            <p className="text-white/65 text-[17px] leading-relaxed max-w-xl">
              Everything you need to know before renting a scooter in Phuket — license requirements, deposits, safety, and how to get the best deal.
            </p>
          </div>
        </section>

        {/* FAQ content */}
        <section className="max-w-3xl mx-auto px-4 py-14 space-y-12">
          {FAQ_GROUPS.map(group => (
            <div key={group.heading}>
              <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6 pb-3 border-b border-[#e8e8e4]">
                {group.heading}
              </h2>
              <div className="space-y-7">
                {group.items.map(({ q, a }) => (
                  <div key={q}>
                    <h3 className="text-[16px] font-semibold text-[#0f0f0e] mb-2">{q}</h3>
                    <p className="text-[15px] text-[#5c5c58] leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Area links */}
        <section className="bg-[#f8f8f6] py-12">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-2">Browse by area</h2>
            <p className="text-sm text-[#5c5c58] mb-6">Find scooters available to rent in your area of Phuket.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AREAS.map(area => (
                <Link
                  key={area.slug}
                  href={`/phuket/${area.slug}`}
                  className="flex items-center justify-between px-4 py-3 bg-white rounded-[14px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors truncate">{area.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9c9c98] group-hover:text-[#FF6B35] transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-[#0f0f0e] rounded-[24px] px-8 py-10 text-center">
            <h2 className="text-[22px] font-bold text-white mb-3">Ready to find your scooter?</h2>
            <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">
              Browse all available scooters across Phuket and contact shops directly.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all text-base"
            >
              Browse All Scooters
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
