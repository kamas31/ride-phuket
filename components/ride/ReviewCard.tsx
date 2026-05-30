import { Star } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { Review } from '@/types'

interface ReviewCardProps {
  review: Review
  className?: string
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[20px] p-6 border border-[#e8e8e4]',
        className
      )}
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < review.rating
                ? 'text-[#FF6B35] fill-[#FF6B35]'
                : 'text-[#e8e8e4] fill-[#e8e8e4]'
            )}
          />
        ))}
      </div>

      {/* Comment */}
      <p className="text-[#0f0f0e] text-sm leading-relaxed mb-4">
        &ldquo;{review.comment}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#fff4f0] text-[#FF6B35] rounded-full flex items-center justify-center text-xs font-bold">
          {getInitials(review.userName)}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0f0f0e]">{review.userName}</p>
        </div>
      </div>
    </div>
  )
}
