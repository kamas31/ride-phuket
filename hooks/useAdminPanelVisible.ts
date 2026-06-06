'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'adminPanelVisible'
const EVENT_NAME  = 'adminpanelvisibility'

export function useAdminPanelVisible(): [boolean, (v: boolean) => void] {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'false') setVisible(false)
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setVisible(e.newValue !== 'false')
    }
    const onCustom = (e: Event) => {
      setVisible((e as CustomEvent<boolean>).detail)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(EVENT_NAME, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(EVENT_NAME, onCustom)
    }
  }, [])

  const set = (v: boolean) => {
    setVisible(v)
    try { localStorage.setItem(STORAGE_KEY, String(v)) } catch {}
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: v }))
  }

  return [visible, set]
}
