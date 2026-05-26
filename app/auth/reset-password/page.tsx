'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'
import { SITE_NAME } from '@/constants'

function ResetPasswordForm() {
  const router = useRouter()

  const [ready, setReady]         = useState(false)
  const [expired, setExpired]     = useState(false)
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = createClient()

    // createBrowserClient auto-exchanges the ?code= param from the URL.
    // PASSWORD_RECOVERY fires once the code exchange succeeds.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
      // If no PASSWORD_RECOVERY within 10s, the link has expired
    })

    const timeout = setTimeout(() => {
      setExpired(true)
    }, 10_000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // Once ready fires, cancel the expiry timer
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) setExpired(false)
  }, [ready])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.replace('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      <div className="px-4 pt-6 pb-0 flex items-center justify-between max-w-md mx-auto w-full">
        <Link href="/auth/login" className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-[#FF6B35] rounded-[8px] flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm text-[#0f0f0e]">{SITE_NAME}</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div
            className="bg-white rounded-[24px] border border-[#e8e8e4] overflow-hidden"
            style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.10)' }}
          >
            <div className="p-7">
              <h1 className="text-[22px] font-bold text-[#0f0f0e] mb-1">Set new password</h1>
              <p className="text-sm text-[#9c9c98] mb-6">Enter a new password for your account.</p>

              {expired && !ready ? (
                <div className="space-y-4">
                  <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-sm text-[#dc2626]">
                    This reset link has expired or is invalid. Request a new one.
                  </div>
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
                  >
                    Back to Sign In
                  </Link>
                </div>
              ) : !ready ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        autoComplete="new-password"
                        className="w-full pl-10 pr-11 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9c9c98] hover:text-[#5c5c58]"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Repeat password"
                        required
                        autoComplete="new-password"
                        className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-sm text-[#dc2626]">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Update Password
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-[#9c9c98] mt-6">
            Remember your password?{' '}
            <Link href="/auth/login" className="hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
