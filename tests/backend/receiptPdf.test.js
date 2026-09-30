import { createRequire } from 'node:module'
import { Buffer } from 'node:buffer'
import { afterEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const sharp = require('sharp')
const { isPdfkitImage, loadLineImages, toPdfImage } = require('../../backend/orders/receiptPdf.js')

/** @param {'webp'|'png'} format */
function solidImage(format, size = 600) {
  return sharp({
    create: { width: size, height: size, channels: 3, background: { r: 20, g: 40, b: 60 } },
  })
    .toFormat(format)
    .toBuffer()
}

/** Réponse `fetch` minimale : un content-type et un corps. */
function imageResponse(buffer, contentType) {
  return {
    ok: true,
    headers: { get: () => contentType },
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length),
  }
}

const NOT_FOUND = { ok: false, headers: { get: () => 'application/json' } }

/** Supabase réduit à la lecture de la photo principale d'une montre. */
function watchImagesSupabase(imageUrl) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: async () => ({ data: { image_url: imageUrl }, error: null }),
  }
  return { from: vi.fn(() => builder) }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('toPdfImage', () => {
  it('convertit le WebP du catalogue en JPEG, que PDFKit sait lire', async () => {
    const webp = await solidImage('webp')
    expect(isPdfkitImage(webp)).toBe(false)

    const converted = await toPdfImage(webp)

    expect(isPdfkitImage(converted)).toBe(true)
    expect(converted[0]).toBe(0xff)
  })

  it('réduit les photos pleine résolution avant de les intégrer au PDF', async () => {
    const converted = await toPdfImage(await solidImage('png', 2000))
    const { width, height } = await sharp(converted).metadata()

    expect(Math.max(width, height)).toBeLessThanOrEqual(288)
  })

  it('rend null pour un contenu qui n’est pas une image', async () => {
    expect(await toPdfImage(Buffer.from('pas une image'))).toBeNull()
    expect(await toPdfImage(null)).toBeNull()
  })
})

describe('loadLineImages', () => {
  const receipt = (lines) => ({ branding: { showWatchImages: true }, lines })

  it('intègre la photo de la ligne, même en WebP', async () => {
    const webp = await solidImage('webp')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(imageResponse(webp, 'image/webp')))

    const images = await loadLineImages(receipt([{ imageUrl: 'https://cdn/a.webp' }]))

    expect(isPdfkitImage(images.get(0))).toBe(true)
  })

  it('reprend la photo actuelle de la montre quand l’instantané a disparu', async () => {
    const webp = await solidImage('webp')
    const fetchMock = vi.fn(async (url) =>
      url === 'https://cdn/current.webp' ? imageResponse(webp, 'image/webp') : NOT_FOUND,
    )
    vi.stubGlobal('fetch', fetchMock)
    const supabase = watchImagesSupabase('https://cdn/current.webp')

    const images = await loadLineImages(
      receipt([{ imageUrl: 'https://cdn/deleted.jpg', watchId: 'watch-1' }]),
      { supabase },
    )

    expect(supabase.from).toHaveBeenCalledWith('watch_images')
    expect(fetchMock).toHaveBeenCalledWith('https://cdn/current.webp', expect.anything())
    expect(isPdfkitImage(images.get(0))).toBe(true)
  })

  it('laisse le placeholder sans photo récupérable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(NOT_FOUND))

    const images = await loadLineImages(receipt([{ imageUrl: 'https://cdn/deleted.jpg' }]))

    expect(images.size).toBe(0)
  })
})
