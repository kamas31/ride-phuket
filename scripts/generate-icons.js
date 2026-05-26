// @ts-check
'use strict'

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const ROOT        = path.join(__dirname, '..')
const SRC_FULL    = path.join(ROOT, 'exports', 'Ride Phuket Icon 1024.png')
const SRC_IOS     = path.join(ROOT, 'exports', 'Ride Phuket Icon iOS 1024.png')
const PUBLIC_ICONS = path.join(ROOT, 'public', 'icons')

async function main () {
  // ── PWA icons (full-bleed — system applies its own mask) ─────────────
  await sharp(SRC_FULL).resize(512, 512).png().toFile(path.join(PUBLIC_ICONS, 'icon-512.png'))
  console.log('✓ icon-512.png')

  await sharp(SRC_FULL).resize(192, 192).png().toFile(path.join(PUBLIC_ICONS, 'icon-192.png'))
  console.log('✓ icon-192.png')

  // ── Apple touch icon (180×180, full-bleed — iOS applies its own mask) ─
  await sharp(SRC_FULL).resize(180, 180).png().toFile(path.join(PUBLIC_ICONS, 'apple-touch-icon.png'))
  console.log('✓ apple-touch-icon.png')

  // ── Favicon ICO (16×16 + 32×32, iOS variant — rounded corners look
  //    better at small sizes in browser tabs and bookmarks) ───────────────
  const px16 = await sharp(SRC_IOS).resize(16, 16).png().toBuffer()
  const px32 = await sharp(SRC_IOS).resize(32, 32).png().toBuffer()
  const ico  = buildIco([
    { width: 16, height: 16, data: px16 },
    { width: 32, height: 32, data: px32 },
  ])
  fs.writeFileSync(path.join(ROOT, 'app', 'favicon.ico'), ico)
  console.log('✓ favicon.ico  (16×16 + 32×32 PNG-in-ICO)')

  console.log('\nAll icons generated from production branding assets.')
}

/**
 * Build a valid ICO file that embeds each image as raw PNG bytes.
 * PNG-in-ICO is supported by all modern browsers (Chrome, Firefox, Safari, Edge).
 *
 * Format reference: https://en.wikipedia.org/wiki/ICO_(file_format)
 *
 * @param {{ width: number, height: number, data: Buffer }[]} images
 * @returns {Buffer}
 */
function buildIco (images) {
  const HEADER_SIZE    = 6
  const DIR_ENTRY_SIZE = 16
  const dataStart      = HEADER_SIZE + images.length * DIR_ENTRY_SIZE

  // Calculate data offsets
  let offset = dataStart
  const offsets = images.map(img => {
    const o = offset
    offset += img.data.length
    return o
  })

  const total = offset
  const buf   = Buffer.alloc(total)
  let   pos   = 0

  // ICO header
  buf.writeUInt16LE(0, pos);               pos += 2  // reserved
  buf.writeUInt16LE(1, pos);               pos += 2  // type: 1 = ICO
  buf.writeUInt16LE(images.length, pos);   pos += 2  // image count

  // Directory entries
  for (let i = 0; i < images.length; i++) {
    const { width, height, data } = images[i]
    buf.writeUInt8(width  === 256 ? 0 : width,  pos); pos += 1  // width  (0 = 256)
    buf.writeUInt8(height === 256 ? 0 : height, pos); pos += 1  // height (0 = 256)
    buf.writeUInt8(0, pos);                            pos += 1  // color count (0 = >256 colors)
    buf.writeUInt8(0, pos);                            pos += 1  // reserved
    buf.writeUInt16LE(1,    pos);                      pos += 2  // planes
    buf.writeUInt16LE(32,   pos);                      pos += 2  // bits per pixel
    buf.writeUInt32LE(data.length, pos);               pos += 4  // image data size
    buf.writeUInt32LE(offsets[i],  pos);               pos += 4  // image data offset
  }

  // Image data (raw PNG bytes)
  for (const { data } of images) {
    data.copy(buf, pos)
    pos += data.length
  }

  return buf
}

main().catch(err => { console.error(err); process.exit(1) })
