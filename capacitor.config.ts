import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kohride.app',
  appName: 'Koh Ride',

  // webDir is required by cap sync even in remote-URL mode.
  // The dist/index.html placeholder satisfies the tooling; the app
  // loads content from server.url at runtime, not from this directory.
  webDir: 'dist',

  server: {
    // Remote URL mode: WKWebView loads the live production app.
    // No static export required — all SSR routes remain on Vercel.
    url: 'https://kohride.com',
    cleartext: false,
    // Allow WKWebView to navigate to these external origins when needed
    // (Supabase auth endpoints, Mapbox tile servers, etc.).
    // Explicit allowlist is more secure than allowing all external navigation.
    allowNavigation: [
      'www.kohride.com',
      '*.supabase.co',
      'supabase.co',
    ],
  },

  ios: {
    // 'never' lets CSS env(safe-area-inset-*) handle safe areas exclusively.
    // 'automatic' was causing double safe-area padding: UIKit added its own
    // inset AND pb-safe (env()) added a second one — nav grew after hydration.
    contentInset: 'never',
    preferredContentMode: 'mobile',
    backgroundColor: '#ffffff',
    allowsLinkPreview: false,
    // Append to User-Agent so server analytics can segment native traffic.
    // Supabase and Vercel will see this in request headers.
    appendUserAgent: 'KohRide-iOS',
    // ── Mac TODO: add Associated Domains capability in Xcode ──────────────
    // After running `npx cap add ios` on the Mac:
    //   Xcode → Signing & Capabilities → + Associated Domains
    //   Add: applinks:kohride.com
    //   Add: webcredentials:kohride.com (enables iCloud Keychain AutoFill)
    // This activates the apple-app-site-association file at
    // https://kohride.com/.well-known/apple-app-site-association
    // and enables Universal Links for password reset and scooter deep links.
    // ──────────────────────────────────────────────────────────────────────
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      iosSpinnerStyle: 'small',
      spinnerColor: '#FF6B35',
    },
    StatusBar: {
      // 'dark' = dark icons on light background.
      // overlaysWebView lets the web content extend behind the status bar;
      // safe-area-inset-top in CSS then correctly positions the nav content.
      style: 'dark',
      overlaysWebView: true,
    },
    PushNotifications: {
      // Show notifications as banners even when the app is in the foreground.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
