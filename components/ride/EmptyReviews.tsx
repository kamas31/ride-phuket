import { Star } from 'lucide-react'

interface EmptyReviewsProps {
  scooterName?: string
}

export function EmptyReviews({ scooterName }: EmptyReviewsProps) {
  return (
    <div className="py-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-[#f8f8f6] rounded-full flex items-center justify-center mb-4">
        <Star className="w-6 h-6 text-[#e0e0dc]" />
      </div>
      <p className="font-semibold text-[#0f0f0e] mb-1.5">No reviews yet</p>
      <p className="text-sm text-[#9c9c98] max-w-[260px] leading-relaxed">
        {scooterName
          ? `${scooterName} is new on Koh Ride. Book first and leave the first review.`
          : 'This listing is new. Be the first to rent and share your experience.'}
      </p>
    </div>
  )
}
