// Generates placeholder PWA icons (192, 512, apple-touch 180) as PNGs
// using only Node built-ins. Replace with real artwork whenever you like —
// run `npm run icons` after dropping in new designs.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// ---------- Minimal PNG encoder ----------
function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      table[n] = c
    }
  }
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([length, typeBuf, data, crcBuf])
}

function encodePNG(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * stride + 1 + x * 4
      raw[dst] = rgba[src]
      raw[dst + 1] = rgba[src + 1]
      raw[dst + 2] = rgba[src + 2]
      raw[dst + 3] = rgba[src + 3]
    }
  }

  const idat = zlib.deflateSync(raw)
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- Drawing ----------
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

// A simple "plate" on the theme background. Full-bleed background so the
// icon also works as a maskable icon.
function makeIcon(size) {
  const bg = hexToRgb('#a33f00') // primary
  const rim = hexToRgb('#903700') // primaryDim
  const plate = hexToRgb('#ffae89') // primaryContainer
  const food = hexToRgb('#fef8f3') // surface

  const cx = size / 2
  const cy = size / 2
  const rPlate = size * 0.42
  const rRim = size * 0.4
  const rFood = size * 0.26

  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      let color
      if (dist <= rFood) color = food
      else if (dist <= rRim) color = plate
      else if (dist <= rPlate) color = rim
      else color = bg
      rgba[idx] = color[0]
      rgba[idx + 1] = color[1]
      rgba[idx + 2] = color[2]
      rgba[idx + 3] = 255
    }
  }
  return encodePNG(size, rgba)
}

// ---------- Write files ----------
const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

const icons = {
  'icon-192.png': 192,
  'icon-512.png': 512,
  'apple-touch-icon.png': 180,
}

for (const [file, size] of Object.entries(icons)) {
  fs.writeFileSync(path.join(outDir, file), makeIcon(size))
  console.log(`✓ ${file} (${size}x${size})`)
}
