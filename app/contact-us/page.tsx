'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Check } from 'lucide-react'
import { SITE_NAME } from '@/constants'
import { submitContactMessage } from '@/app/actions/contact'

export default function ContactUsPage() {
  const [subject, setSubject]     = useState('')
  const [message, setMessage]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { success: ok, error: err } = await submitContactMessage(subject, message)
    setSubmitting(false)
    if (ok) { setSuccess(true) }
    else    { setError(err ?? 'Something went wrong.') }
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

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div
            className="bg-white rounded-[24px] border border-[#e8e8e4] overflow-hidden"
            style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.10)' }}
          >
            <div className="p-7">
              {success ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-[#22c55e]" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-[20px] font-bold text-[#0f0f0e] mb-2">Message sent!</h1>
                  <p className="text-sm text-[#9c9c98] mb-6 leading-relaxed">
                    We&apos;ll get back to you at your account email as soon as possible.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
                  >
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  <h1 className="text-[22px] font-bold text-[#0f0f0e] mb-1">Contact Us</h1>
                  <p className="text-sm text-[#9c9c98] mb-6">
                    Send us a message and we&apos;ll reply as soon as possible.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Subject */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="How can we help?"
                        required
                        maxLength={200}
                        className="w-full px-3.5 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Tell us more…"
                        required
                        rows={5}
                        maxLength={2000}
                        className="w-full px-3.5 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors resize-none"
                      />
                      <p className="text-right text-[10px] text-[#9c9c98] mt-1">
                        {message.length}/2000
                      </p>
                    </div>

                    {error && (
                      <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-sm text-[#dc2626]">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !subject.trim() || !message.trim()}
                      className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting && (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
