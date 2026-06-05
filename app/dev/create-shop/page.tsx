import { notFound } from 'next/navigation'
import DevShopCreator from './DevShopCreator'

// TEMPORARY — for App Store screenshot preparation only.
// Remove by deleting the entire app/dev/ directory.
// Requires DEV_SCREENSHOT_MODE=true in .env.local to function.

export const dynamic = 'force-dynamic'

export default function DevCreateShopPage() {
  if (process.env.DEV_SCREENSHOT_MODE !== 'true') notFound()
  return <DevShopCreator />
}
