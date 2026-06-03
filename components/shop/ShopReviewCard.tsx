'use client'

import { useState } from 'react'
import { Star, Store, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { submitOwnerReply, reportReview } from '@/app/actions/reviews'
import type { ShopReview, ReviewReportReason } from '@/types'

const REPORT_REASONS: { value: ReviewReportReason; label: string }[] = [
  { value: 'never_rented',  label: 'Customer never rented from us' },
  { value: 'fake_review',   label: 'Fake review' },
  { value: 'harassment',    label: 'Harassment' },
  { value: 'spam',          label: 'Spam' },
  { value: 'other',         label: 'Other' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

interface Props {
  review: ShopReview
  isOwner: boolean
  isCurrentUser: boolean
  onEdit?: () => void
  onReplySubmitted?: (reply: string) => void
  onReported?: () => void
}

export function ShopReviewCard({
  review, isOwner, isCurrentUser, onEdit, onReplySubmitted, onReported,
}: Props) {
  const [replyOpen, setReplyOpen]       = useState(false)
  const [replyText, setReplyText]       = useState(review.ownerReply ?? '')
  const [replySaving, setReplySaving]   = useState(false)
  const [replyError, setReplyError]     = useState<string | null>(null)

  const [reportOpen, setReportOpen]     = useState(false)
  const [reportReason, setReportReason] = useState<ReviewReportReason>('never_rented')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSaving, setReportSaving] = useState(false)
  const [reportDone, setReportDone]     = useState(false)
  const [reportError, setReportError]   = useState<string | null>(null)

  async function handleReply() {
    setReplySaving(true)
    setReplyError(null)
    const res = await submitOwnerReply(review.id, replyText)
    setReplySaving(false)
    if (res.success) {
      setReplyOpen(false)
      onReplySubmitted?.(replyText.trim())
    } else {
      setReplyError(res.error ?? 'Failed to save reply.')
    }
  }

  async function handleReport() {
    setReportSaving(true)
    setReportError(null)
    const res = await reportReview(review.id, reportReason, reportDetails || undefined)
    setReportSaving(false)
    if (res.success) {
      setReportDone(true)
    } else {
      setReportError(res.error ?? 'Failed to submit report.')
    }
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-3">
      {/* Stars + date */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-4 h-4',
                i < review.rating ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#e8e8e4] fill-[#e8e8e4]',
              )}
            />
          ))}
        </div>
        <span className="text-[11px] text-[#9c9c98] flex-shrink-0">{formatDate(review.createdAt)}</span>
      </div>

      {/* Comment */}
      <p className="text-[14px] text-[#0f0f0e] leading-relaxed">{review.comment}</p>

      {/* Author row + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {review.avatarUrl ? (
            <img
              src={review.avatarUrl}
              alt={review.displayName}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 bg-[#fff4f0] text-[#FF6B35] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {review.initials}
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-[#0f0f0e]">{review.displayName}</p>
            {review.verified && (
              <p className="text-[10px] text-[#22c55e] font-medium">Verified rental</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit button — shown to review author */}
          {isCurrentUser && onEdit && (
            <button
              onClick={onEdit}
              className="text-[11px] font-semibold text-[#9c9c98] hover:text-[#0f0f0e] transition-colors"
            >
              Edit
            </button>
          )}

          {/* Report button — shown to shop owner */}
          {isOwner && !isCurrentUser && !reportDone && (
            <button
              onClick={() => setReportOpen(o => !o)}
              className="flex items-center gap-1 text-[11px] text-[#9c9c98] hover:text-[#dc2626] transition-colors"
              title="Report review"
            >
              <Flag className="w-3 h-3" />
              Report
            </button>
          )}
          {reportDone && (
            <span className="text-[11px] text-[#22c55e] font-medium">Reported</span>
          )}
        </div>
      </div>

      {/* Report form */}
      {reportOpen && !reportDone && (
        <div className="pt-2 border-t border-[#f0f0ec] space-y-3">
          <p className="text-[12px] font-semibold text-[#dc2626]">Report this review</p>
          <div className="space-y-1.5">
            {REPORT_REASONS.map(r => (
              <label key={r.value} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name={`report-${review.id}`}
                  value={r.value}
                  checked={reportReason === r.value}
                  onChange={() => setReportReason(r.value)}
                  className="accent-[#FF6B35]"
                />
                <span className="text-[12px] text-[#5c5c58]">{r.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={reportDetails}
            onChange={e => setReportDetails(e.target.value)}
            placeholder="Optional details…"
            rows={2}
            className="w-full px-3 py-2 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-[12px] placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] resize-none"
          />
          {reportError && <p className="text-[11px] text-[#dc2626]">{reportError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              disabled={reportSaving}
              className="px-4 py-2 bg-[#dc2626] text-white text-[12px] font-bold rounded-full disabled:opacity-50 hover:bg-[#b91c1c] transition-colors"
            >
              {reportSaving ? 'Submitting…' : 'Submit Report'}
            </button>
            <button
              onClick={() => setReportOpen(false)}
              className="px-4 py-2 text-[12px] text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Owner reply */}
      {review.ownerReply && !replyOpen && (
        <div className="bg-[#f8f8f6] rounded-[14px] p-3.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-[#9c9c98]" />
            <p className="text-[11px] font-semibold text-[#5c5c58]">Response from the shop</p>
            {isOwner && (
              <button
                onClick={() => { setReplyText(review.ownerReply ?? ''); setReplyOpen(true) }}
                className="ml-auto text-[10px] text-[#9c9c98] hover:text-[#FF6B35] transition-colors"
              >
                Edit reply
              </button>
            )}
          </div>
          <p className="text-[13px] text-[#5c5c58] leading-relaxed">{review.ownerReply}</p>
          {review.ownerReplyCreatedAt && (
            <p className="text-[10px] text-[#9c9c98]">{formatDate(review.ownerReplyCreatedAt)}</p>
          )}
        </div>
      )}

      {/* Reply form — shown to owner when no reply yet, or in edit mode */}
      {isOwner && (replyOpen || (!review.ownerReply && !replyOpen)) && (
        <div className={cn('space-y-2', !replyOpen && 'pt-1')}>
          {!replyOpen ? (
            <button
              onClick={() => setReplyOpen(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#FF6B35] hover:text-[#e85d29] transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              Reply to this review
            </button>
          ) : (
            <>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write your response…"
                rows={3}
                className="w-full px-3.5 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-[13px] placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] resize-none"
              />
              {replyError && <p className="text-[11px] text-[#dc2626]">{replyError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleReply}
                  disabled={replySaving || replyText.trim().length < 2}
                  className="px-4 py-2 bg-[#0f0f0e] text-white text-[12px] font-bold rounded-full disabled:opacity-40 hover:bg-[#333] transition-colors"
                >
                  {replySaving ? 'Saving…' : 'Post Reply'}
                </button>
                <button
                  onClick={() => { setReplyOpen(false); setReplyText(review.ownerReply ?? '') }}
                  className="px-4 py-2 text-[12px] text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
