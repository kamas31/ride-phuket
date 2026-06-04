export type Platform = 'web' | 'ios' | 'android'

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor
  if (cap?.isNativePlatform?.()) {
    const p = cap.getPlatform?.()
    return p === 'android' ? 'android' : 'ios'
  }
  return 'web'
}

export const isNative  = (): boolean => getPlatform() !== 'web'
export const isIOS     = (): boolean => getPlatform() === 'ios'
export const isAndroid = (): boolean => getPlatform() === 'android'
