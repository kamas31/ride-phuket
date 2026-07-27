'use client'

// TikTok Pixel — loads the official browser snippet once, from the root
// layout. Renders nothing if NEXT_PUBLIC_TIKTOK_PIXEL_ID is unset.
//
// PageView: ttq.page() below is kept only to "arm" the SDK (verified live —
// without at least one call, no beacon of any kind is ever sent). It is NOT
// what produces TikTok's Standard Event "PageView" that Test Events / Ads
// Manager read — verified live that ttq.page()'s automatic HistoryObserver
// re-fire on client-side navigation only reproduces its own internal
// analytics signals ("Pageview"/"LandingPageView"/"EngagedSession"), never
// the Standard Event. So the base snippet fires ttq.track('PageView')
// explicitly once on load, and the usePathname() effect below fires it
// again on every subsequent route change — skipping its own first mount so
// the two never both cover the same navigation. See docs/DECISIONS.md
// (ADR-067 original conclusion, ADR-068 the correction + evidence).
//
// No Automatic Advanced Matching: ttq.load() is called with no second
// argument, and no ttq.identify() call exists anywhere in this codebase.

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { TIKTOK_PIXEL_ID, trackTikTokPageView } from '@/lib/analytics/tiktok'

export function TikTokPixel() {
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    // The base snippet's own ttq.track('PageView') call already covers this
    // first render's route — only re-fire on actual subsequent changes.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    trackTikTokPageView()
  }, [pathname])

  if (!TIKTOK_PIXEL_ID) return null

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<e.length;n++)ttq.setAndDefer(e,e.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

          ttq.load('${TIKTOK_PIXEL_ID}');
          ttq.page();
          ttq.track('PageView');
        }(window, document, 'ttq');
      `}
    </Script>
  )
}
