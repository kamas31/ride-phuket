import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/constants'
import ContactUsClient from './ContactUsClient'

const TITLE = 'Contact Us | Koh Ride'
const DESC  = "Have a question about Koh Ride or scooter rentals in Phuket? Send the team a message and we'll get back to you as soon as possible."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/contact-us` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/contact-us`,
    type: 'website',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
  },
}

export default function ContactUsPage() {
  return <ContactUsClient />
}
