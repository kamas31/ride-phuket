'use client'

import dynamic from 'next/dynamic'

// Dynamic import with ssr:false must live in a Client Component.
// This wrapper is imported by the Server Component shop page.
const ShopLocationMapDynamic = dynamic(() => import('./ShopLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-[16px] bg-[#f8f8f6] border border-[#e8e8e4] animate-pulse w-full h-full" />
  ),
})

interface Props {
  lat: number
  lng: number
  mode: 'exact' | 'approximate'
  className?: string
}

export function ShopLocationMapClient(props: Props) {
  return <ShopLocationMapDynamic {...props} />
}
