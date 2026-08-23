import { describe, expect, it } from 'vitest'

import {
  STORAGE_IMAGE_CACHE_CONTROL,
  UPLOAD_IMAGE_MAX_DIMENSION,
  buildUploadFileName,
  fitWithin,
  withWebpExtension,
} from './imageEncoding.js'

describe('fitWithin', () => {
  it('réduit le plus grand côté à la dimension maximale', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 })
  })

  it("n'agrandit jamais une image déjà plus petite", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(UPLOAD_IMAGE_MAX_DIMENSION, 400)).toEqual({
      width: UPLOAD_IMAGE_MAX_DIMENSION,
      height: 400,
    })
  })

  it('conserve le ratio et reste au moins à 1 pixel', () => {
    const { width, height } = fitWithin(10000, 5, 1600)
    expect(width).toBe(1600)
    expect(height).toBe(1)
  })

  it('accepte une dimension maximale explicite', () => {
    expect(fitWithin(1000, 500, 400)).toEqual({ width: 400, height: 200 })
  })

  it('renvoie des dimensions nulles pour une entrée invalide', () => {
    expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 })
    expect(fitWithin(undefined, undefined)).toEqual({ width: 0, height: 0 })
  })
})

describe('withWebpExtension', () => {
  it("remplace l'extension existante, quelle que soit sa casse", () => {
    expect(withWebpExtension('watches/id/1700000000-abc.jpg')).toBe(
      'watches/id/1700000000-abc.webp',
    )
    expect(withWebpExtension('watches/id/photo.JPEG')).toBe('watches/id/photo.webp')
  })

  it("ajoute l'extension quand le fichier n'en a pas", () => {
    expect(withWebpExtension('watches/id/photo')).toBe('watches/id/photo.webp')
  })

  it('ne confond pas un point du dossier avec une extension', () => {
    expect(withWebpExtension('site.v2/photo')).toBe('site.v2/photo.webp')
  })

  it('laisse passer une entrée vide', () => {
    expect(withWebpExtension('')).toBe('')
    expect(withWebpExtension(null)).toBe(null)
  })
})

describe('buildUploadFileName', () => {
  it('produit un nom unique en .webp', () => {
    const first = buildUploadFileName()
    const second = buildUploadFileName()

    expect(first).toMatch(/^\d+-[a-z0-9]+\.webp$/)
    expect(first).not.toBe(second)
  })
})

describe('STORAGE_IMAGE_CACHE_CONTROL', () => {
  it('vaut un an, pour que le navigateur ne re-télécharge pas le catalogue', () => {
    expect(STORAGE_IMAGE_CACHE_CONTROL).toBe('31536000')
  })
})
