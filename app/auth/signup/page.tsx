'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MapPin, Mail, Lock, Eye, EyeOff, ArrowLeft, User, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { trackEvent } from '@/lib/analytics'
import { SITE_NAME } from '@/constants'
import type { UserRole } from '@/lib/supabase/types'

const ROLE_OPTIONS: {
  value: UserRole
  icon: string
  title: string
  subtitle: string
  perks: string[]
}[] = [
  {
    value: 'rider',
    icon: '🛵',
    title: 'I\'m a Rider',
    subtitle: 'I want to rent a scooter',
    perks: ['Browse verified shops', 'WhatsApp contact', 'Save favourites', 'Compare prices'],
  },
  {
    value: 'shop_owner',
    icon: '🏪',
    title: 'I\'m a Shop Owner',
    subtitle: 'I want to list my fleet',
    perks: ['List your scooters', 'Get more leads', 'Grow your business', 'Verified badge'],
  },
]

function SignupForm() {
  const searchParams = useSearchParams()

  const { signUpWithEmail } = useAuth()

  const [role, setRole] = useState<UserRole>('rider')
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const [isNative, setIsNative] = useState(false)

  // Google OAuth is blocked in WKWebView by Google — hide on native iOS.
  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      setIsNative(Capacitor.isNativePlatform())
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null)
    setSubmitting(true)

    const { error: err } = await signUpWithEmail(email, password, name, role)
    if (err) {
      setError(err)
      setSubmitting(false)
    } else {
      trackEvent({ eventType: 'auth_signup', metadata: { role } })
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm bg-white rounded-[28px] p-10 text-center border border-[#e8e8e4]"
          style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.12)' }}
        >
          <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-[#22c55e]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[22px] font-bold text-[#0f0f0e] mb-2">Check your email</h2>
          <p className="text-[#5c5c58] text-sm leading-relaxed mb-7">
            We sent a confirmation link to <strong className="text-[#0f0f0e]">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="flex items-center justify-center w-full py-3 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-6 pb-0 flex items-center justify-between max-w-lg mx-auto w-full">
        <Link
          href={step === 1 ? '/auth/login' : '#'}
          onClick={step === 2 ? () => setStep(1) : undefined}
          className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Sign in' : 'Back'}
        </Link>
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-[#FF6B35] rounded-[8px] flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm text-[#0f0f0e]">{SITE_NAME}</span>
        </Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? 'bg-[#FF6B35] text-white' : 'bg-[#e8e8e4] text-[#9c9c98]'
                }`}>
                  {step > s ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s}
                </div>
                {s < 2 && <div className={`h-px flex-1 w-8 transition-colors ${step > s ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]'}`} />}
              </div>
            ))}
            <span className="ml-2 text-xs text-[#9c9c98]">
              {step === 1 ? 'Choose your role' : 'Create your account'}
            </span>
          </div>

          {/* ── STEP 1: Role selection ── */}
          {step === 1 && (
            <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }}>
              <h1 className="text-[26px] font-bold text-[#0f0f0e] mb-1.5">Welcome to {SITE_NAME}</h1>
              <p className="text-[#5c5c58] text-sm mb-7">How would you like to use the platform?</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={`relative text-left p-5 rounded-[20px] border-2 transition-all duration-200 ${
                      role === opt.value
                        ? 'border-[#FF6B35] bg-[#fff4f0] shadow-[0_0_0_4px_rgba(255,107,53,0.08)]'
                        : 'border-[#e8e8e4] bg-white hover:border-[#d0d0cc] hover:bg-[#f8f8f6]'
                    }`}
                  >
                    {role === opt.value && (
                      <div className="absolute top-4 right-4 w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="text-3xl mb-3">{opt.icon}</div>
                    <p className="font-bold text-[#0f0f0e] text-[15px] mb-0.5">{opt.title}</p>
                    <p className="text-[#9c9c98] text-xs mb-4">{opt.subtitle}</p>
                    <ul className="space-y-1.5">
                      {opt.perks.map(p => (
                        <li key={p} className="flex items-center gap-2 text-xs text-[#5c5c58]">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#22c55e]" strokeWidth={3} />
                          </div>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {/* Google OAuth shortcut — hidden on native iOS (WKWebView blocked by Google) */}
              {!isNative && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      sessionStorage.setItem('signup_role', role)
                      const mod = await import('@/lib/supabase/client')
                      const sb = mod.createClient()
                      await sb.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
                          queryParams: { prompt: 'select_account' },
                        }
                      })
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 border border-[#e8e8e4] bg-white rounded-[12px] text-sm font-medium text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors mb-4"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
                    Continue with Google as {role === 'rider' ? 'Rider' : 'Shop Owner'}
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-[#e8e8e4]" />
                    <span className="text-xs text-[#9c9c98] font-medium">or with email</span>
                    <div className="flex-1 h-px bg-[#e8e8e4]" />
                  </div>
                </>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
              >
                Continue as {role === 'rider' ? 'Rider' : 'Shop Owner'}
              </button>
            </div>
          )}

          {/* ── STEP 2: Form ── */}
          {step === 2 && (
            <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }}>
              {/* Role badge */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">{ROLE_OPTIONS.find(r => r.value === role)?.icon}</span>
                <div>
                  <h1 className="text-[22px] font-bold text-[#0f0f0e] leading-none">Create your account</h1>
                  <p className="text-xs text-[#9c9c98] mt-0.5">
                    Signing up as{' '}
                    <button
                      onClick={() => setStep(1)}
                      className="text-[#FF6B35] font-semibold hover:underline"
                    >
                      {role === 'rider' ? 'Rider' : 'Shop Owner'}
                    </button>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={role === 'rider' ? 'Your name' : 'Owner / manager name'}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
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
                  {/* Password strength */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= n * 3
                            ? n <= 2 ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'
                            : 'bg-[#e8e8e4]'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-sm text-[#dc2626]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create Account
                </button>

                <p className="text-center text-xs text-[#9c9c98] pt-1 leading-relaxed">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
                </p>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-[#9c9c98] mt-8">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#FF6B35] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
