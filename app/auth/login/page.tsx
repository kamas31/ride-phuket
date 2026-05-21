'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SITE_NAME } from '@/constants'

function LoginForm() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirect    = searchParams.get('redirect') ?? '/'
  const authError   = searchParams.get('error')

  const { user, loading, signInWithEmail, signInWithGoogle } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(
    authError === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  )

  useEffect(() => {
    if (!loading && user) router.replace(redirect)
  }, [user, loading, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: err } = await signInWithEmail(email, password)
    if (err) { setError(err); setSubmitting(false) }
    else { router.replace(redirect) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-6 pb-0 flex items-center justify-between max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Home
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
              <h1 className="text-[22px] font-bold text-[#0f0f0e] mb-1">Welcome back</h1>
              <p className="text-sm text-[#9c9c98] mb-6">Sign in to manage your bookings.</p>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center gap-3 py-3 border border-[#e8e8e4] rounded-[12px] text-sm font-medium text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors mb-5"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[#e8e8e4]" />
                <span className="text-xs text-[#9c9c98] font-medium">or</span>
                <div className="flex-1 h-px bg-[#e8e8e4]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
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
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider">Password</label>
                    <button type="button" className="text-[10px] text-[#FF6B35] font-semibold hover:underline">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
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

                {error && (
                  <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-sm text-[#dc2626]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Sign In
                </button>
              </form>
            </div>

            <div className="px-7 py-4 bg-[#f8f8f6] border-t border-[#e8e8e4] text-center">
              <p className="text-sm text-[#5c5c58]">
                New to {SITE_NAME}?{' '}
                <Link href="/auth/signup" className="text-[#FF6B35] font-bold hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-[#9c9c98] mt-6 leading-relaxed px-4">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
