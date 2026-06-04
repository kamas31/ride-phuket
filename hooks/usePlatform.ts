'use client'

import { useState, useEffect } from 'react'
import { getPlatform, isNative, isIOS, isAndroid, type Platform } from '@/lib/platform'

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('web')

  useEffect(() => {
    setPlatform(getPlatform())
  }, [])

  return {
    platform,
    isNative: platform !== 'web',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  }
}

export { isNative, isIOS, isAndroid }
