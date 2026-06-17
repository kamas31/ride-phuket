'use client'

// CapacitorProvider — mounts once in the root layout and wires up all native
// iOS behaviours that have no web equivalent:
//
//   1. appUrlOpen  — routes Universal Links / custom-scheme deep links into
//                    the Next.js router so the user lands on the correct page
//                    inside the app instead of in Safari.
//
//   2. appStateChange — calls supabase.auth.getSession() whenever the app
//                    returns to the foreground so expired access tokens are
//                    refreshed before any network request is made.
//
// The provider is a no-op on web (Capacitor.isNativePlatform() returns false).

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { pushDebug } from '@/lib/pushDebug'

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const cleanupFns: Array<() => void> = []

    async function init() {
      pushDebug('init:start')

      // Dynamic import keeps Capacitor out of the web JS bundle entirely.
      const { Capacitor } = await import('@capacitor/core')
      if (!mounted || !Capacitor.isNativePlatform()) {
        pushDebug('init:not-native-or-unmounted')
        return
      }
      pushDebug('init:is-native')

      // Mark <html> so CSS can scope native-only rules to .native
      document.documentElement.classList.add('native')

      const { App } = await import('@capacitor/app')
      pushDebug('init:app-imported')

      // ── 1. Deep link handler ──────────────────────────────────────────────
      //
      // Fires when:
      //   a) A Universal Link (https://kohride.com/...) is tapped in Mail or
      //      another app while the Koh Ride app is already running.
      //   b) A custom scheme link (kohride://...) is tapped anywhere.
      //   c) The app is cold-launched from a Universal Link.
      //
      // The handler normalises both https:// and kohride:// origins to plain
      // Next.js route paths, then delegates to the router.
      //
      // Password-reset deep links require special treatment: the Supabase
      // singleton client (created once on first page load) will NOT re-run its
      // internal _detectSessionInUrl() when router.push changes the URL client-
      // side.  We therefore call verifyOtp() here BEFORE navigating, then pass
      // ?ready=true so the page immediately shows the form instead of waiting
      // for the PASSWORD_RECOVERY event that will never arrive.
      const urlHandle = await App.addListener('appUrlOpen', async ({ url }) => {
        if (!mounted) return
        try {
          const parsed = new URL(url)
          const path   = parsed.pathname
          const params = parsed.searchParams

          // ── Password reset ────────────────────────────────────────────────
          if (path === '/auth/reset-password') {
            const tokenHash = params.get('token_hash')
            const type      = params.get('type')

            if (tokenHash && type === 'recovery') {
              // Exchange the one-time token before navigating.  The result
              // (success or expired) is passed as a URL flag so the page
              // reacts immediately without any polling or timeout.
              const { createClient } = await import('@/lib/supabase/client')
              const supabase = createClient()
              const { error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'recovery',
              })
              router.push(
                error
                  ? '/auth/reset-password?error=expired'
                  : '/auth/reset-password?ready=true',
              )
              return
            }
          }

          // ── Email verification callback ───────────────────────────────────
          // Supabase verification links land on /auth/callback?code=xxx.
          // The existing GET handler at app/auth/callback/route.ts exchanges
          // the code server-side, so we just navigate there with the params.
          if (path === '/auth/callback') {
            const code = params.get('code')
            if (code) {
              router.push(`/auth/callback?code=${code}`)
              return
            }
          }

          // ── All other deep links ──────────────────────────────────────────
          // Covers: /scooter/[id], /shop/[slug], /messages/[id], /saved, etc.
          const routePath = path + (parsed.search || '')
          if (routePath && routePath !== '/') {
            router.push(routePath)
          }
        } catch {
          // Malformed or unrecognised URL — silently ignore.
        }
      })
      if (mounted) cleanupFns.push(() => urlHandle.remove())

      // ── 2. Foreground refresh ─────────────────────────────────────────────
      //
      // iOS suspends the WKWebView process when the app is backgrounded.
      // Access tokens expire silently while suspended.  Calling getSession()
      // on resume triggers the Supabase client's built-in refresh flow so the
      // user is always authenticated when they return to the app.
      const stateHandle = await App.addListener('appStateChange', async ({ isActive }) => {
        if (!mounted || !isActive) return
        try {
          const { createClient } = await import('@/lib/supabase/client')
          await createClient().auth.getSession()
        } catch {
          // Silent — the next authenticated API call will surface any real error.
        }
      })
      if (mounted) cleanupFns.push(() => stateHandle.remove())
      pushDebug('init:app-listeners-done')

      // ── 3. Push notifications ─────────────────────────────────────────────
      //
      // Listeners are always registered here. Permission is requested separately
      // in ConversationList (warm-up prompt → native dialog) so we never ask on
      // first launch.
      //
      // On subsequent launches where permission was already granted, we call
      // register() to refresh the APNS token — tokens can change silently.
      pushDebug('init:push-importing')
      const { PushNotifications } = await import('@capacitor/push-notifications')
      pushDebug('init:push-imported')

      // Tap handler: fires when the user taps a push notification while the app
      // was backgrounded or terminated. Navigates to the relevant conversation.
      const tapHandle = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        ({ notification }) => {
          if (!mounted) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const conversationId = (notification.data as any)?.conversationId as string | undefined
          if (conversationId) router.push(`/messages/${conversationId}`)
        },
      )
      if (mounted) cleanupFns.push(() => tapHandle.remove())

      // Token registration: fires after PushNotifications.register() succeeds.
      // Triggered from ConversationList (first prompt) and from here on subsequent
      // launches. Saves the fresh token to push_tokens via a server action.
      const regHandle = await PushNotifications.addListener(
        'registration',
        async ({ value: token }) => {
          pushDebug('registration:fired', `prefix:${token.substring(0, 8)} len:${token.length}`)
          if (!mounted) { pushDebug('registration:unmounted'); return }
          try {
            pushDebug('registration:calling-savePushToken')
            const { savePushToken } = await import('@/app/actions/push')
            await savePushToken(token, 'ios')
            pushDebug('registration:savePushToken-returned')
          } catch (e) { pushDebug('registration:savePushToken-threw', String(e)) }
        },
      )
      if (mounted) cleanupFns.push(() => regHandle.remove())
      pushDebug('init:reg-listener-ready')

      // registrationError: fires if APNS rejects the registration request.
      // Common causes: Push Notifications capability missing in Xcode,
      // wrong provisioning profile, or sandbox vs production mismatch.
      const errHandle = await PushNotifications.addListener(
        'registrationError',
        ({ error }) => {
          pushDebug('registrationError:fired', JSON.stringify(error))
        },
      )
      if (mounted) cleanupFns.push(() => errHandle.remove())
      pushDebug('init:error-listener-ready')

      // If permission was already granted in a prior session, re-register to
      // keep the stored token current (APNS tokens can change across launches).
      const currentPerm = await PushNotifications.checkPermissions()
      pushDebug('init:checkPermissions', currentPerm.receive)

      if (currentPerm.receive === 'granted' && mounted) {
        pushDebug('init:register-calling')
        await PushNotifications.register()
        pushDebug('init:register-returned')
      } else {
        pushDebug('init:register-skipped', `receive=${currentPerm.receive} mounted=${mounted}`)
      }
    }

    // Surface init() errors to the debug log instead of silently discarding them.
    // An error thrown anywhere in init() (e.g. in the App listeners section)
    // would previously skip all push notification setup with no trace at all.
    init().catch(e => pushDebug('init:error', String(e)))

    return () => {
      mounted = false
      cleanupFns.forEach(fn => fn())
    }
  }, [router])

  // Renders nothing extra — just wraps children to allow the effect to run.
  return <>{children}</>
}
