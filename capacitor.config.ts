import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ridephuket.app',
  appName: 'Ride Phuket',

  // webDir is required by cap sync even in remote-URL mode.
  // The dist/index.html placeholder satisfies the tooling; the app
  // loads content from server.url at runtime, not from this directory.
  webDir: 'dist',

  server: {
    // Remote URL mode: WKWebView loads the live production app.
    // No static export required — all SSR routes remain on Vercel.
    url: 'https://ridephuket.com',
    cleartext: false,
  },

  ios: {
    // Content inset: 'automatic' matches UIKit conventions.
    // Safe areas are handled in CSS via env(safe-area-inset-*) + viewport-fit:cover.
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#ffffff',
    allowsLinkPreview: false,
    // Append to User-Agent so server analytics can segment native traffic
    appendUserAgent: 'RidePhuket-iOS',
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
