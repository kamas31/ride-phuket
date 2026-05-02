'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SITE_NAME } from '@/constants'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const authError = searchParams.get('error')

  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(authError === 'auth_failed' ? 'Authentication failed. Please try again.' : null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace(redirect)
  }, [user, loading, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (mode === 'login') {
      const { error: err } = await signInWithEmail(email, password)
      if (err) {
        setError(err)
        setSubmitting(false)
      } else {
        router.replace(redirect)
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your name.')
        setSubmitting(false)
        return
      }
      const { error: err } = await signUpWithEmail(email, password, name)
      if (err) {
        setError(err)
        setSubmitting(false)
      } else {
        setSuccess('Account created! Check your email to confirm.')
        setSubmitting(false)
      }
    }
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
      {/* Header */}
      <div className="px-4 pt-6 pb-0 flex items-center justify-between max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-[#FF6B35] rounded-[8px] flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm text-[#0f0f0e]">{SITE_NAME}</span>
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[24px] border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Toggle tabs */}
            <div className="flex border-b border-[#e8e8e4]">
              {(['login', 'signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                    mode === m
                      ? 'text-[#0f0f0e] border-b-2 border-[#FF6B35]'
                      : 'text-[#9c9c98] hover:text-[#5c5c58]'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <div className="p-7">
              <h1 className="text-[22px] font-bold text-[#0f0f0e] mb-1">
                {mode === 'login' ? 'Welcome back' : 'Start exploring'}
              </h1>
              <p className="text-sm text-[#9c9c98] mb-6">
                {mode === 'login'
                  ? 'Sign in to manage your bookings.'
                  : 'Create your account to book premium scooters.'}
              </p>

              {/* Google OAuth */}
              <button
                onClick={signInWithGoogle}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 border border-[#e8e8e4] rounded-[12px] text-sm font-medium text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors mb-5"
              >
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[#e8e8e4]" />
                <span className="text-xs text-[#9c9c98] font-medium">or</span>
                <div className="flex-1 h-px bg-[#e8e8e4]" />
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c9c98]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                      required
                      minLength={mode === 'signup' ? 8 : 1}
                      className="w-full pl-10 pr-11 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9c9c98] hover:text-[#5c5c58]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-sm text-[#dc2626]">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="px-4 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] text-sm text-[#16a34a]">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {mode === 'login' && (
                <p className="text-center text-xs text-[#9c9c98] mt-4">
                  Forgot password?{' '}
                  <button className="text-[#FF6B35] hover:underline font-medium">Reset it</button>
                </p>
              )}

              <p className="text-center text-xs text-[#9c9c98] mt-5 leading-relaxed">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
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
