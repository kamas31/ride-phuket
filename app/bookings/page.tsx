import { redirect } from 'next/navigation'

// /bookings is now /rentals — keep this redirect for backward compatibility
export default function BookingsRedirect() {
  redirect('/rentals')
}
