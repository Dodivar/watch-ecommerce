import { describe, expect, it } from 'vitest'

import { compressImageForUpload, isHeicFile } from './imageCompressionService.js'

/**
 * Ces tests tournent sous l'environnement `node` : ils couvrent les garde-fous
 * qui n'atteignent jamais le canvas. Le contrat tenu ici est le plus important
 * du module — ne jamais faire échouer un upload à cause de la compression.
 */

/**
 * @param {string} name
 * @param {string} type
 * @param {number} [bytes]
 */
function makeFile(name, type, bytes = 1024) {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('isHeicFile', () => {
  it('reconnaît les photos iPhone par type MIME comme par extension', () => {
    expect(isHeicFile(makeFile('IMG_0001.HEIC', ''))).toBe(true)
    expect(isHeicFile(makeFile('photo.heif', ''))).toBe(true)
    expect(isHeicFile(makeFile('sans-extension', 'image/heic'))).toBe(true)
  })

  it('ne se déclenche pas sur les autres formats', () => {
    expect(isHeicFile(makeFile('photo.jpg', 'image/jpeg'))).toBe(false)
    expect(isHeicFile(makeFile('photo.webp', 'image/webp'))).toBe(false)
    expect(isHeicFile(undefined)).toBe(false)
  })
})

describe('compressImageForUpload', () => {
  it('laisse passer un fichier non-image sans le toucher', async () => {
    const file = makeFile('facture.pdf', 'application/pdf')
    const result = await compressImageForUpload(file)

    expect(result.compressed).toBe(false)
    expect(result.blob).toBe(file)
    expect(result.contentType).toBe('application/pdf')
    expect(result.fileName).toMatch(/\.pdf$/)
  })

  it('ne rastérise pas un SVG', async () => {
    const file = makeFile('logo.svg', 'image/svg+xml')
    const result = await compressImageForUpload(file)

    expect(result.compressed).toBe(false)
    expect(result.blob).toBe(file)
    expect(result.fileName).toMatch(/\.svg$/)
  })

  it('renvoie l’original quand le décodage échoue, sans lever', async () => {
    // Un JPEG annoncé mais illisible : hors navigateur, le décodage échoue.
    const file = makeFile('corrompu.jpg', 'image/jpeg')
    const result = await compressImageForUpload(file)

    expect(result.compressed).toBe(false)
    expect(result.blob).toBe(file)
    expect(result.contentType).toBe('image/jpeg')
  })

  it('produit toujours un nom de fichier unique', async () => {
    const file = makeFile('facture.pdf', 'application/pdf')

    const first = await compressImageForUpload(file)
    const second = await compressImageForUpload(file)

    expect(first.fileName).not.toBe(second.fileName)
  })
})
