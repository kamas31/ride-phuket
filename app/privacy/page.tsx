import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Ride Phuket',
  description: 'Privacy Policy for Ride Phuket. How we collect, use, and protect your information.',
}

const LAST_UPDATED = 'May 2025'

export default function PrivacyPage() {
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
          <h1 className="text-[28px] font-bold text-[#0f0f0e] mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[#9c9c98] mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-8 text-[#5c5c58] text-[15px] leading-relaxed">

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">1. Overview</h2>
              <p>
                Ride Phuket (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a scooter rental discovery
                platform based in Phuket, Thailand. This policy explains what data we collect,
                how we use it, and your rights regarding it.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">2. Data We Collect</h2>
              <p className="mb-3">We collect only what is necessary to operate the platform:</p>
              <div className="space-y-3">
                <div className="p-4 bg-[#f8f8f6] rounded-[12px]">
                  <p className="font-semibold text-[#0f0f0e] text-sm mb-1">Account data</p>
                  <p className="text-sm">Email address, name, and optional phone number — provided when you create an account.</p>
                </div>
                <div className="p-4 bg-[#f8f8f6] rounded-[12px]">
                  <p className="font-semibold text-[#0f0f0e] text-sm mb-1">Saved listings</p>
                  <p className="text-sm">The scooter listings you save — stored so your list syncs across devices.</p>
                </div>
                <div className="p-4 bg-[#f8f8f6] rounded-[12px]">
                  <p className="font-semibold text-[#0f0f0e] text-sm mb-1">Usage data</p>
                  <p className="text-sm">Standard server logs (page visits, errors) for debugging and platform improvement. No behavioural tracking or advertising profiles.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">3. How We Use Your Data</h2>
              <ul className="space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>To provide and maintain your account</li>
                <li>To sync your saved scooter listings across devices</li>
                <li>To send account-related emails (confirmation, password reset)</li>
                <li>To improve platform performance and fix bugs</li>
              </ul>
              <p className="mt-3">
                We do <strong className="text-[#0f0f0e]">not</strong> sell your data. We do not use your data for advertising.
                We do not build behavioural profiles.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">4. Data Sharing</h2>
              <p className="mb-3">
                Your personal information is not shared with rental shops. When you contact a shop
                via WhatsApp, you initiate that conversation directly — Ride Phuket is not involved
                in that exchange.
              </p>
              <p>
                We use <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">Supabase</a> for database
                and authentication infrastructure. Data is stored in accordance with their security practices.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">5. Cookies</h2>
              <p>
                We use only essential cookies — required for authentication and session management.
                No advertising cookies, no tracking pixels.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">6. Your Rights</h2>
              <p className="mb-3">You can at any time:</p>
              <ul className="space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>Update your profile information from your account settings</li>
                <li>Delete your account and all associated data by contacting us</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">7. Data Retention</h2>
              <p>
                We retain your account data for as long as your account is active. If you delete
                your account, your personal data is removed within 30 days. Anonymised usage
                statistics may be retained indefinitely.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">8. Contact</h2>
              <p>
                For privacy-related requests or questions, contact us through the platform.
                We aim to respond within 5 business days.
              </p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-[#f0f0ec] flex items-center gap-4 text-sm text-[#9c9c98]">
            <Link href="/terms" className="hover:text-[#0f0f0e] transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link href="/" className="hover:text-[#0f0f0e] transition-colors">Back to Ride Phuket</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
