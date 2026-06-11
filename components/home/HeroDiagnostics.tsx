'use client'

// TEMPORARY — remove before App Store submission
// Displays layout measurements to diagnose CTA position differences
// between Chrome DevTools and real iPhone PWA.

import { useEffect, useState } from 'react'

interface Diag {
  innerHeight: number
  vvHeight: number | null
  safeAreaTop: number
  dvh100: number
  sectionTop: number | null
  sectionHeight: number | null
  ctaTop: number | null
}

export function HeroDiagnostics() {
  const [d, setD] = useState<Diag | null>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Read env(safe-area-inset-top) — no JS API exists, must measure via a probe element
    const safeProbe = document.createElement('div')
    safeProbe.style.cssText =
      'position:fixed;pointer-events:none;top:0;left:0;width:0;height:0;' +
      'padding-top:env(safe-area-inset-top,0px);'
    document.body.appendChild(safeProbe)
    const safeAreaTop = parseFloat(getComputedStyle(safeProbe).paddingTop) || 0
    document.body.removeChild(safeProbe)

    // Measure actual computed 100dvh (may differ from window.innerHeight on some browsers)
    const dvhProbe = document.createElement('div')
    dvhProbe.style.cssText =
      'position:fixed;pointer-events:none;top:0;left:0;width:0;height:100dvh;'
    document.body.appendChild(dvhProbe)
    const dvh100 = Math.round(dvhProbe.getBoundingClientRect().height)
    document.body.removeChild(dvhProbe)

    // Measure section and CTA via IDs added to page.tsx
    const section = document.getElementById('hero-section')
    const cta = document.getElementById('hero-cta')
    const sr = section?.getBoundingClientRect()
    const cr = cta?.getBoundingClientRect()

    setD({
      innerHeight: window.innerHeight,
      vvHeight: window.visualViewport?.height ?? null,
      safeAreaTop,
      dvh100,
      sectionTop:    sr ? Math.round(sr.top)    : null,
      sectionHeight: sr ? Math.round(sr.height) : null,
      ctaTop:        cr ? Math.round(cr.top)    : null,
    })
  }, [])

  if (!visible || !d) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 110,
        left: 10,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.90)',
        color: '#fff',
        fontSize: 11,
        fontFamily: 'ui-monospace, monospace',
        padding: '9px 11px',
        borderRadius: 10,
        lineHeight: 1.85,
        maxWidth: 210,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontSize: 8, color: '#FF6B35', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 5 }}>
        HERO DIAGNOSTICS
      </div>
      <Row label="innerHeight"   value={`${d.innerHeight}px`} />
      <Row label="visualVP.h"    value={d.vvHeight != null ? `${Math.round(d.vvHeight)}px` : 'n/a'} />
      <Row label="env(sat-top)"  value={`${d.safeAreaTop}px`} highlight={d.safeAreaTop > 0} />
      <Row label="100dvh"        value={`${d.dvh100}px`} />
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '5px 0' }} />
      <Row label="section.top"   value={d.sectionTop    != null ? `${d.sectionTop}px`    : '—'} />
      <Row label="section.h"     value={d.sectionHeight != null ? `${d.sectionHeight}px` : '—'} />
      <Row label="cta.top"       value={d.ctaTop        != null ? `${d.ctaTop}px`        : '—'} highlight />
      <button
        onClick={() => setVisible(false)}
        style={{
          display: 'block',
          marginTop: 7,
          fontSize: 9,
          color: '#9c9c98',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
          textAlign: 'center',
        }}
      >
        dismiss
      </button>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ color: '#9c9c98' }}>{label}</span>
      <span style={{ color: highlight ? '#FF6B35' : '#fff', fontWeight: 700 }}>{value}</span>
    </div>
  )
}
