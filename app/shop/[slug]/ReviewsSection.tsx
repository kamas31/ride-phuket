'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { submitReview, updateReview, markReviewsSeen } from '@/app/actions/reviews'
import { ShopReviewCard } from '@/components/shop/ShopReviewCard'
import type { ShopReview } from '@/types'

// ── Star selector ──────────────────────────────────────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'w-7 h-7 transition-colors',
              n <= active ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#e8e8e4] fill-[#e8e8e4]',
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ── Rating summary bar ─────────────────────────────────────────────────────────

function RatingSummary({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            className={cn(
              'w-4 h-4',
              n <= Math.round(rating) ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#e8e8e4] fill-[#e8e8e4]',
            )}
          />
        ))}
      </div>
      <span className="text-[15px] font-bold text-[#0f0f0e]">{rating.toFixed(1)}</span>
      <span className="text-sm text-[#9c9c98]">
        {count} {count === 1 ? 'review' : 'reviews'}
      </span>
    </div>
  )
}

// ── Review form ────────────────────────────────────────────────────────────────

interface ReviewFormProps {
  shopId: string
  existingReview: ShopReview | null
  onDone: (review: ShopReview) => void
  onCancel: () => void
}

function ReviewForm({ shopId, existingReview, onDone, onCancel }: ReviewFormProps) {
  const [rating, setRating]   = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [error, setError]     = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (rating === 0) { setError('Please select a star rating.'); return }
    if (comment.trim().length < 10) { setError('Comment must be at least 10 characters.'); return }
    setError(null)

    startTransition(async () => {
      let result
      if (existingReview) {
        result = await updateReview(existingReview.id, rating, comment)
      } else {
        result = await submitReview(shopId, rating, comment)
      }

      if (result.success) {
        onDone({
          ...(existingReview ?? {
            id: (result as { reviewId?: string }).reviewId ?? '',
            userId: '',
            displayName: 'You',
            initials: 'Y',
            createdAt: new Date().toISOString(),
            verified: false,
            ownerReply: null,
            ownerReplyCreatedAt: null,
          }),
          rating,
          comment: comment.trim(),
          updatedAt: new Date().toISOString(),
        } as ShopReview)
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
      <p className="text-[15px] font-bold text-[#0f0f0e]">
        {existingReview ? 'Edit your review' : 'Write a review'}
      </p>

      <div>
        <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">Your rating</p>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">Your review</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience with this shop — quality, communication, reliability…"
          rows={4}
          className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[14px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] resize-none transition-colors"
        />
        <p className="text-[10px] text-[#9c9c98] mt-1 text-right">{comment.length}/1000</p>
      </div>

      {error && <p className="text-sm text-[#dc2626]">{error}</p>}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="flex-1 py-3 bg-[#FF6B35] text-white text-sm font-bold rounded-full hover:bg-[#e85d29] disabled:opacity-50 transition-colors"
        >
          {pending ? 'Submitting…' : existingReview ? 'Update Review' : 'Post Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] rounded-full hover:bg-[#f8f8f6] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ReviewsSectionProps {
  shopId: string
  shopName: string
  shopOwnerId: string | null
  initialReviews: ShopReview[]
  userReview: ShopReview | null
  currentUserId: string | null
  shopRating: number
  shopReviewCount: number
}

export default function ReviewsSection({
  shopId, shopName, shopOwnerId, initialReviews, userReview: initialUserReview,
  currentUserId, shopRating, shopReviewCount,
}: ReviewsSectionProps) {
  const router = useRouter()
  const seenRef = useRef(false)

  // Mark reviews as read when the shop owner views this section.
  // Runs once on mount; seenRef prevents repeat calls on re-render.
  useEffect(() => {
    if (seenRef.current) return
    if (!currentUserId || !shopOwnerId || currentUserId !== shopOwnerId) return
    seenRef.current = true
    markReviewsSeen(shopId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // shopId, currentUserId, shopOwnerId are stable server-rendered props

  const [reviews, setReviews]           = useState<ShopReview[]>(initialReviews)
  const [userReview, setUserReview]     = useState<ShopReview | null>(initialUserReview)
  const [formOpen, setFormOpen]         = useState(false)
  const [editingReview, setEditingReview] = useState<ShopReview | null>(null)

  const isOwner      = Boolean(currentUserId && currentUserId === shopOwnerId)
  const isLoggedIn   = Boolean(currentUserId)
  const displayCount = reviews.length
  const displayRating = displayCount > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / displayCount
    : shopRating

  function handleFormDone(updated: ShopReview) {
    if (editingReview) {
      setReviews(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
      setUserReview(prev => prev ? { ...prev, ...updated } : prev)
    } else {
      const newReview: ShopReview = { ...updated, userId: currentUserId! }
      setReviews(prev => [newReview, ...prev])
      setUserReview(newReview)
    }
    setFormOpen(false)
    setEditingReview(null)
  }

  function openEdit(review: ShopReview) {
    setEditingReview(review)
    setFormOpen(true)
    setTimeout(() => {
      document.getElementById('review-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  function handleReplySubmitted(reviewId: string, reply: string) {
    setReviews(prev => prev.map(r =>
      r.id === reviewId
        ? { ...r, ownerReply: reply, ownerReplyCreatedAt: new Date().toISOString() }
        : r
    ))
  }

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[18px] font-bold text-[#0f0f0e]">Reviews</h2>
          {displayCount > 0 && (
            <div className="mt-1.5">
              <RatingSummary rating={displayRating} count={displayCount} />
            </div>
          )}
        </div>

        {/* Write / Edit review button */}
        {isLoggedIn && !isOwner && (
          <button
            onClick={() => {
              if (userReview) {
                openEdit(userReview)
              } else {
                setEditingReview(null)
                setFormOpen(o => !o)
              }
            }}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              userReview
                ? 'bg-[#f8f8f6] text-[#5c5c58] border border-[#e8e8e4] hover:bg-[#f0f0ec]'
                : 'bg-[#FF6B35] text-white hover:bg-[#e85d29]',
            )}
          >
            {userReview ? 'Edit Review' : 'Write Review'}
          </button>
        )}
        {!isLoggedIn && (
          <button
            onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-[#f8f8f6] text-[#5c5c58] border border-[#e8e8e4] hover:bg-[#f0f0ec] transition-colors"
          >
            Sign in to review
          </button>
        )}
      </div>

      {/* Review form */}
      <div id="review-form-anchor">
        {formOpen && (
          <div className="mb-5">
            <ReviewForm
              shopId={shopId}
              existingReview={editingReview}
              onDone={handleFormDone}
              onCancel={() => { setFormOpen(false); setEditingReview(null) }}
            />
          </div>
        )}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-[#f8f8f6] rounded-full flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-[#e0e0dc]" />
          </div>
          <p className="font-semibold text-[#0f0f0e] mb-1.5">No reviews yet</p>
          <p className="text-sm text-[#9c9c98] max-w-[260px] leading-relaxed">
            Be the first to share your experience with {shopName}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <ShopReviewCard
              key={review.id}
              review={review}
              isOwner={isOwner}
              isCurrentUser={review.userId === currentUserId}
              onEdit={() => openEdit(review)}
              onReplySubmitted={reply => handleReplySubmitted(review.id, reply)}
              onReported={() => {/* review stays visible client-side after report */}}
            />
          ))}
        </div>
      )}
    </section>
  )
}
