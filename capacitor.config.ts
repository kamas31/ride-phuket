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
  },

  ios: {
    // 'never' lets CSS env(safe-area-inset-*) handle safe areas exclusively.
    // 'automatic' was causing double safe-area padding: UIKit added its own
    // inset AND pb-safe (env()) added a second one — nav grew after hydration.
    contentInset: 'never',
    preferredContentMode: 'mobile',
    backgroundColor: '#ffffff',
    allowsLinkPreview: false,
    // Append to User-Agent so server analytics can segment native traffic
    appendUserAgent: 'KohRide-iOS',
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
      // 'dark' = dark icons on light background (correct for white status bar)
      style: 'dark',
      backgroundColor: '#ffffff',
    },
  },
}

export default config
