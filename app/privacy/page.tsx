import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'

export const metadata = {
  title: 'Privacy Policy — Koh Ride',
  description: 'Privacy Policy for Koh Ride. How we collect, use, and protect your information.',
}

const LAST_UPDATED = 'June 2026'

export default function PrivacyPage() {
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
          <h1 className="text-[28px] font-bold text-[#0f0f0e] mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[#9c9c98] mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-8 text-[#5c5c58] text-[15px] leading-relaxed">

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">1. Overview</h2>
              <p>
                Koh Ride (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a scooter rental discovery
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
                  <p className="text-sm">Email address, name, and optional phone number provided when you create an account. We also store your user ID, authentication information, and account security data necessary to manage and protect your account.</p>
                </div>
                <div className="p-4 bg-[#f8f8f6] rounded-[12px]">
                  <p className="font-semibold text-[#0f0f0e] text-sm mb-1">Messages</p>
                  <p className="text-sm">Messages exchanged through the Koh Ride in-app messaging system are stored to provide and maintain the messaging service.</p>
                </div>
                <div className="p-4 bg-[#f8f8f6] rounded-[12px]">
                  <p className="font-semibold text-[#0f0f0e] text-sm mb-1">Uploaded content</p>
                  <p className="text-sm">Shops may upload profile images, logos, banners, and scooter photos. This content is stored to operate and display listings on the marketplace.</p>
                </div>
                <div className="p-4 bg-[#f8f8f6] rounded-[12px]">
                  <p className="font-semibold text-[#0f0f0e] text-sm mb-1">Saved listings</p>
                  <p className="text-sm">The scooter listings you save — stored so your list syncs across devices.</p>
                </div>
                <div className="p-4 bg-[#f8f8f6] rounded-[12px]">
                  <p className="font-semibold text-[#0f0f0e] text-sm mb-1">Technical diagnostics</p>
                  <p className="text-sm">Error reports, crash information, and device or browser data used for troubleshooting and improving platform stability. No behavioural tracking or advertising profiles.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">3. How We Use Your Data</h2>
              <ul className="space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>To provide and maintain your account</li>
                <li>To deliver the in-app messaging service</li>
                <li>To sync your saved scooter listings across devices</li>
                <li>To send account-related emails (confirmation, password reset)</li>
                <li>To improve platform performance, fix bugs, and diagnose errors</li>
              </ul>
              <p className="mt-3">
                We do <strong className="text-[#0f0f0e]">not</strong> sell your data. We do not use your data for advertising.
                We do not build behavioural profiles.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">4. Data Sharing</h2>
              <p className="mb-3">
                Your personal information is not shared with rental shops except where necessary
                to provide platform features such as in-app messaging. Information you choose to
                share during conversations with shops may be visible to those shops.
              </p>
              <p className="mb-3">
                Koh Ride uses trusted service providers to operate the platform, including services
                related to authentication, database infrastructure, email delivery, and diagnostics.
                We use{' '}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">Supabase</a>{' '}
                for database and authentication infrastructure. Data is stored in accordance with
                their security practices.
              </p>
              <p>
                We do not sell or share your data with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">5. International Data Processing</h2>
              <p>
                Some service providers we use may be located outside Thailand and may process or
                store data on servers in other countries. Where this occurs, we use providers
                that apply appropriate security and privacy standards.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">6. Cookies</h2>
              <p>
                We use only essential cookies — required for authentication and session management.
                No advertising cookies, no tracking pixels.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">7. Your Rights</h2>
              <p className="mb-3">You can at any time:</p>
              <ul className="space-y-2 list-disc list-inside marker:text-[#FF6B35]">
                <li>Update your profile information from your account settings</li>
                <li>Delete your account directly from your account settings or partner dashboard</li>
                <li>Request a copy of the data we hold about you</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">8. Data Retention</h2>
              <p>
                We retain your account data for as long as your account is active. If you delete
                your account, your personal data is scheduled for deletion within 30 days. Anonymised usage
                statistics may be retained indefinitely. Some information may be retained for
                a limited period where required for security, fraud prevention, or legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-bold text-[#0f0f0e] mb-3">9. Contact</h2>
              <p>
                For privacy-related requests or questions, please contact Koh Ride through the{' '}
                <Link href="/contact-us" className="text-[#FF6B35] hover:underline">Contact page</Link>.
                We aim to respond within 5 business days.
              </p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-[#f0f0ec] flex items-center gap-4 text-sm text-[#9c9c98]">
            <Link href="/terms" className="hover:text-[#0f0f0e] transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link href="/" className="hover:text-[#0f0f0e] transition-colors">Back to Koh Ride</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
