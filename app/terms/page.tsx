import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Ride Phuket',
  description: 'Terms of Service for Ride Phuket, a scooter rental discovery marketplace in Phuket, Thailand.',
}

const LAST_UPDATED = 'May 2025'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <div className="bg-white rounded-[24px] border border-[#e8e8e4] p-8 md:p-10">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-[28px] font-bold text-[#0f0f0e] mb-2 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[#9c9c98] mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="prose-custom space-y-8 text-[#5c5c58] text-[15px] leading-relaxed">

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">1. What Ride Phuket Is</h2>
              <p>
                Ride Phuket is a discovery and contact marketplace. We list scooters from local rental
                shops in Phuket, Thailand, and connect interested renters directly with those shops.
              </p>
              <p className="mt-3">
                Ride Phuket is <strong className="text-[#0f0f0e]">not a rental company</strong>. We do not own, operate, or rent
                scooters. We do not handle payments, deposits, or rental agreements. All rental terms
                are arranged directly between you and the shop.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">2. Using the Platform</h2>
              <p>By using Ride Phuket, you agree to:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>Provide accurate information when creating an account</li>
                <li>Use the platform only for legitimate rental inquiries</li>
                <li>Not misuse shop contact information for spam or unrelated purposes</li>
                <li>Comply with local laws and licensing requirements when renting a scooter</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">3. Shop Listings</h2>
              <p>
                Ride Phuket verifies partner shops before listing them. However, we cannot guarantee the
                accuracy of pricing, availability, or specifications at the time of your inquiry.
                Always confirm details directly with the shop before committing.
              </p>
              <p className="mt-3">
                Prices shown are indicative daily rates. Actual prices, deposit requirements, and rental
                conditions are determined by each shop and may vary.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">4. No Platform Fees</h2>
              <p>
                Ride Phuket charges no platform fees, booking fees, or service charges to renters.
                All payments are made directly to the rental shop. Ride Phuket is not a party to
                any financial transaction between you and a shop.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">5. Liability</h2>
              <p>
                Ride Phuket is a marketplace platform only. We are not liable for:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>The condition or safety of rented scooters</li>
                <li>Accidents, injuries, or losses arising from scooter use</li>
                <li>Disputes between you and a rental shop</li>
                <li>Shop closures, availability changes, or price discrepancies</li>
              </ul>
              <p className="mt-3">
                Always ensure you have adequate insurance and a valid licence before riding.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">6. Accounts</h2>
              <p>
                You are responsible for maintaining the security of your account. Ride Phuket
                reserves the right to suspend accounts that violate these terms or engage in
                abusive behaviour toward partner shops or other users.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">7. Changes to These Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of Ride Phuket after
                any changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">8. Contact</h2>
              <p>
                For questions about these terms, contact us through the platform or reach out to a
                shop directly via WhatsApp.
              </p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-[#f0f0ec] flex items-center gap-4 text-sm text-[#9c9c98]">
            <Link href="/privacy" className="hover:text-[#0f0f0e] transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/" className="hover:text-[#0f0f0e] transition-colors">Back to Ride Phuket</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
