'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { SITE_NAME } from '@/constants'
import { submitFeedback, type FeedbackType } from '@/app/actions/feedback'

const TYPES: { value: FeedbackType; label: string; emoji: string }[] = [
  { value: 'bug_report',      label: 'Bug Report',       emoji: '🐛' },
  { value: 'feature_request', label: 'Feature Request',  emoji: '💡' },
  { value: 'general',         label: 'General',          emoji: '💬' },
]

export default function FeedbackPage() {
  const router = useRouter()
  const [type, setType]           = useState<FeedbackType>('general')
  const [message, setMessage]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { success: ok, error: err } = await submitFeedback(type, message)
    setSubmitting(false)
    if (ok) { setSuccess(true) }
    else    { setError(err ?? 'Something went wrong.') }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] pt-16">
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-md mx-auto px-4 py-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#f5f4f2] text-[#5c5c58] hover:bg-[#ececea] hover:text-[#0f0f0e] transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <div className="flex items-start justify-center px-4 py-10">
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
                  <h1 className="text-[20px] font-bold text-[#0f0f0e] mb-2">Thank you!</h1>
                  <p className="text-sm text-[#9c9c98] mb-6 leading-relaxed">
                    Your feedback has been received. We read every submission.
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
                  <h1 className="text-[22px] font-bold text-[#0f0f0e] mb-1">Send Feedback</h1>
                  <p className="text-sm text-[#9c9c98] mb-6">Help us improve {SITE_NAME}.</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type selector */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
                        Feedback Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TYPES.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setType(t.value)}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-[12px] border-2 transition-all text-center ${
                              type === t.value
                                ? 'border-[#FF6B35] bg-[#fff4f0]'
                                : 'border-[#e8e8e4] bg-[#f8f8f6] hover:border-[#d0d0cc]'
                            }`}
                          >
                            <span className="text-lg leading-none">{t.emoji}</span>
                            <span className={`text-[10px] font-semibold leading-tight ${
                              type === t.value ? 'text-[#FF6B35]' : 'text-[#5c5c58]'
                            }`}>
                              {t.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind…"
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
                      disabled={submitting || !message.trim()}
                      className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting && (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      Send Feedback
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
