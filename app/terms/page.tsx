import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'

export const metadata = {
  title: 'Terms of Service — Koh Ride',
  description: 'Terms of Service for Koh Ride, a scooter rental discovery marketplace in Phuket, Thailand.',
}

const LAST_UPDATED = 'June 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f6] pt-16">
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <BackButton />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">

        <div className="bg-white rounded-[24px] border border-[#e8e8e4] p-8 md:p-10">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-[28px] font-bold text-[#0f0f0e] mb-2 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[#9c9c98] mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="prose-custom space-y-8 text-[#5c5c58] text-[15px] leading-relaxed">

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">1. What Koh Ride Is</h2>
              <p>
                Koh Ride is a discovery and contact marketplace. We list scooters from local rental
                shops in Phuket, Thailand, and connect interested renters directly with those shops.
              </p>
              <p className="mt-3">
                Koh Ride is <strong className="text-[#0f0f0e]">not a rental company</strong>. We do not own, operate, or rent
                scooters. We do not handle payments, deposits, or rental agreements. All rental terms
                are arranged directly between you and the shop.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">2. Using the Platform</h2>
              <p>
                You must be <strong className="text-[#0f0f0e]">at least 18 years old</strong> to create
                an account or use Koh Ride. By using Koh Ride, you also agree to:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>Provide accurate information when creating an account</li>
                <li>Use the platform only for legitimate rental inquiries</li>
                <li>Not post unlawful, fraudulent, misleading, or harassing content</li>
                <li>Not engage in spam or abuse directed at shops or other users</li>
                <li>Not misuse shop contact information for unrelated purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">3. Licences &amp; Legal Compliance</h2>
              <p>
                You are <strong className="text-[#0f0f0e]">solely responsible</strong> for ensuring you
                hold any licence, permit, insurance, or legal authorisation required under Thai law
                before operating a scooter or motorcycle. This includes an International Driving Permit
                or a valid Thai motorcycle licence where applicable.
              </p>
              <p className="mt-3">
                Koh Ride does not verify licences or insurance status and accepts no responsibility
                for any legal, financial, or physical consequences arising from unlicensed or
                uninsured riding.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">4. Shop Listings</h2>
              <p>
                Koh Ride verifies partner shops before listing them. However, we cannot guarantee the
                accuracy of pricing, availability, or specifications at the time of your inquiry.
                Always confirm details directly with the shop before committing.
              </p>
              <p className="mt-3">
                Prices shown are indicative daily rates. Actual prices, deposit requirements, and rental
                conditions are determined by each shop and may vary.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">5. No Platform Fees</h2>
              <p>
                Koh Ride charges no platform fees, booking fees, or service charges to renters.
                All payments are made directly to the rental shop. Koh Ride is not a party to
                any financial transaction between you and a shop.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">6. Liability &amp; Disclaimer</h2>
              <p>
                Koh Ride is a marketplace platform only. We are not liable for:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>The condition or safety of rented scooters</li>
                <li>Accidents, injuries, or losses arising from scooter use</li>
                <li>Disputes between you and a rental shop</li>
                <li>Shop closures, availability changes, or price discrepancies</li>
              </ul>
              <p className="mt-4">
                Koh Ride is provided <strong className="text-[#0f0f0e]">&ldquo;as is&rdquo;</strong> and{' '}
                <strong className="text-[#0f0f0e]">&ldquo;as available&rdquo;</strong>. We do not guarantee
                uninterrupted access to the platform, the accuracy of all listings, or that the platform
                will meet your specific needs. Use of Koh Ride is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">7. Accounts</h2>
              <p>
                You are responsible for maintaining the security of your account. Koh Ride may
                suspend or terminate accounts where necessary to protect users, partner shops, or
                the integrity of the platform — including cases involving fraud, abuse, harassment,
                misleading content, or repeated violations of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">8. Governing Law</h2>
              <p>
                These terms are governed by the laws of Thailand. Any disputes arising from the
                use of Koh Ride are subject to the exclusive jurisdiction of the competent
                courts of Thailand.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">9. Changes to These Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of Koh Ride after
                any changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">10. Contact</h2>
              <p>
                For questions about these terms, contact us through the platform or via the
                Contact page.
              </p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-[#f0f0ec] flex items-center gap-4 text-sm text-[#9c9c98]">
            <Link href="/privacy" className="hover:text-[#0f0f0e] transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/" className="hover:text-[#0f0f0e] transition-colors">Back to Koh Ride</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
