// @ts-check
'use strict'

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const ROOT         = path.join(__dirname, '..')
const MASTER       = path.join(ROOT, 'exports', 'Faviconnobackground.png')
const PUBLIC_ICONS = path.join(ROOT, 'public', 'icons')
const PUBLIC       = path.join(ROOT, 'public')
const EXPORTS      = path.join(ROOT, 'exports')
const RESOURCES    = path.join(ROOT, 'resources')
const SPLASH_DIR   = path.join(ROOT, 'public', 'splash')

const DARK   = { r: 32,  g: 43,  b: 45,  alpha: 1 }  // #202B2D
const ORANGE = { r: 255, g: 107, b: 53,  alpha: 1 }  // #FF6B35
const WHITE  = { r: 255, g: 255, b: 255, alpha: 1 }

// Resize the mark to `logoSize` px, then composite on a `canvasSize` solid canvas.
// Applies a corrective offset to centre by visual centre-of-mass rather than bounding box.
// Offsets measured from master (2048×2048): mass is 45 px left / 15 px up of bbox centre
// after trim — so we shift composite right + down proportionally.
async function iconOnBg(logoSize, canvasSize, bg) {
  const trimmed = await sharp(MASTER).trim({ threshold: 10 }).toBuffer()

  const logo = await sharp(trimmed)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer()

  const basePad   = Math.round((canvasSize - logoSize) / 2)
  const trimW     = 776  // trimmed mark width in master pixels
  const corrLeft  = Math.round(45 * logoSize / trimW)  // shift right to centre mass
  const corrTop   = Math.round(15 * logoSize / trimW)  // shift down  to centre mass

  return sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: bg },
  })
    .composite([{ input: logo, top: basePad + corrTop, left: basePad + corrLeft }])
    .png()
}

// Trim transparent border first, then resize — mark fills the target size.
async function iconTransparent(size) {
  const trimmed = await sharp(MASTER).trim({ threshold: 10 }).toBuffer()
  return sharp(trimmed)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
}

// Build PNG-in-ICO (RGBA, required by Next.js 16 Turbopack).
function buildIco(images) {
  const HEADER = 6, DIR = 16
  const dataStart = HEADER + images.length * DIR
  let offset = dataStart
  const offsets = images.map(img => { const o = offset; offset += img.data.length; return o })
  const buf = Buffer.alloc(offset)
  let pos = 0
  buf.writeUInt16LE(0, pos); pos += 2
  buf.writeUInt16LE(1, pos); pos += 2
  buf.writeUInt16LE(images.length, pos); pos += 2
  for (let i = 0; i < images.length; i++) {
    const { width, height, data } = images[i]
    buf.writeUInt8(width  === 256 ? 0 : width,  pos); pos += 1
    buf.writeUInt8(height === 256 ? 0 : height, pos); pos += 1
    buf.writeUInt8(0, pos); pos += 1
    buf.writeUInt8(0, pos); pos += 1
    buf.writeUInt16LE(1,  pos); pos += 2
    buf.writeUInt16LE(32, pos); pos += 2
    buf.writeUInt32LE(data.length, pos); pos += 4
    buf.writeUInt32LE(offsets[i],  pos); pos += 4
  }
  for (const { data } of images) { data.copy(buf, pos); pos += data.length }
  return buf
}

async function main() {
  fs.mkdirSync(PUBLIC_ICONS, { recursive: true })
  fs.mkdirSync(SPLASH_DIR,   { recursive: true })
  fs.mkdirSync(RESOURCES,    { recursive: true })

  // ── App Store / Capacitor icon (1024×1024, dark bg, 65% logo, iOS safe padding) ──
  const logoAt1024 = Math.round(1024 * 0.65)  // 666 px — well within iOS safe zone
  await (await iconOnBg(logoAt1024, 1024, DARK)).toFile(path.join(EXPORTS,    'Koh Ride Icon 1024.png'))
  await (await iconOnBg(logoAt1024, 1024, DARK)).toFile(path.join(RESOURCES,  'icon.png'))
  console.log('✓ exports/Koh Ride Icon 1024.png')
  console.log('✓ resources/icon.png')

  // iOS orange-bg variant
  await (await iconOnBg(logoAt1024, 1024, ORANGE)).toFile(path.join(EXPORTS, 'Koh Ride Icon iOS 1024.png'))
  console.log('✓ exports/Koh Ride Icon iOS 1024.png')

  // Android icon (512×512, dark bg)
  const logoAt512 = Math.round(512 * 0.65)
  await (await iconOnBg(logoAt512, 512, DARK)).toFile(path.join(EXPORTS, 'Koh Ride Icon Android 512.png'))
  console.log('✓ exports/Koh Ride Icon Android 512.png')

  // ── PWA icons (dark bg, 72% — approved visual size, within maskable safe zone) ──
  const logoAt512pwa = Math.round(512 * 0.72)
  await (await iconOnBg(logoAt512pwa, 512, DARK)).toFile(path.join(PUBLIC_ICONS, 'icon-512.png'))
  console.log('✓ public/icons/icon-512.png')

  const logoAt192 = Math.round(192 * 0.72)
  await (await iconOnBg(logoAt192, 192, DARK)).toFile(path.join(PUBLIC_ICONS, 'icon-192.png'))
  console.log('✓ public/icons/icon-192.png')

  const logoAt32 = Math.round(32 * 0.72)
  await (await iconOnBg(logoAt32, 32, DARK)).toFile(path.join(PUBLIC_ICONS, 'icon-32.png'))
  console.log('✓ public/icons/icon-32.png')

  // ── Apple touch icon (180×180, dark bg, 72%) ───────────────────────────────────
  const logoAt180 = Math.round(180 * 0.72)
  await (await iconOnBg(logoAt180, 180, DARK)).toFile(path.join(PUBLIC_ICONS, 'apple-touch-icon.png'))
  await (await iconOnBg(logoAt180, 180, DARK)).toFile(path.join(PUBLIC,       'apple-touch-icon.png'))
  console.log('✓ apple-touch-icon.png (×2 paths)')

  // ── Favicon ICO (16+32, transparent bg, RGBA for Turbopack) ───────────────────
  const px16 = await (await iconTransparent(16)).toBuffer()
  const px32 = await (await iconTransparent(32)).toBuffer()
  const ico   = buildIco([
    { width: 16, height: 16, data: px16 },
    { width: 32, height: 32, data: px32 },
  ])
  fs.writeFileSync(path.join(ROOT, 'app', 'favicon.ico'), ico)
  console.log('✓ app/favicon.ico  (16×16 + 32×32 RGBA PNG-in-ICO)')

  // ── Navbar icon (64×64 transparent — used in Navbar.tsx) ──────────────────────
  await (await iconTransparent(64)).toFile(path.join(PUBLIC_ICONS, 'icon-nav.png'))
  console.log('✓ public/icons/icon-nav.png  (transparent)')

  // ── Splash logo asset (512×512 transparent, for overlay on splash screens) ────
  await (await iconTransparent(512)).toFile(path.join(SPLASH_DIR, 'splash-logo.png'))
  console.log('✓ public/splash/splash-logo.png')

  console.log('\nAll assets generated from master logo.')
}

main().catch(err => { console.error(err); process.exit(1) })
