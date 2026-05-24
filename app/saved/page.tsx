import Link from 'next/link'
import { LogIn, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSavedScooters, getSavedRideIds } from '@/app/actions/saved-rides'
import { SavedRidesContent } from './SavedRidesContent'

export const metadata = {
  title: 'Saved rides — Ride Phuket',
  description: 'Your saved scooters on Ride Phuket. Compare listings and contact shops when you\'re ready.',
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <SignInPrompt />
  }

  const [scooters, savedIds] = await Promise.all([
    getSavedScooters(),
    getSavedRideIds(),
  ])

  return <SavedRidesContent initialScooters={scooters} savedIds={savedIds} />
}

function SignInPrompt() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-6">
          <h1 className="text-[26px] font-bold text-[#0f0f0e] tracking-tight">
            Saved rides
          </h1>
          <p className="text-[#9c9c98] text-sm mt-1">
            Compare scooters, revisit listings, and contact shops when you&rsquo;re ready.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-[#f8f8f6] border border-[#e8e8e4] rounded-full flex items-center justify-center mx-auto mb-5">
            <Bookmark className="w-8 h-8 text-[#c8c8c4]" strokeWidth={1.5} />
          </div>
          <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-2">Sign in to save rides</h2>
          <p className="text-[#9c9c98] text-sm mb-7 max-w-[280px] mx-auto leading-relaxed">
            Save scooters while exploring Phuket — your saved rides will appear here.
          </p>
          <Link
            href="/auth/login?next=/saved"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f0f0e] text-white text-sm font-semibold rounded-full hover:bg-[#2a2a28] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
