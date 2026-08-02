import { afterEach, describe, expect, it, vi } from 'vitest'

const OBJECT_URL =
  'http://localhost:54321/storage/v1/object/public/watches/photos/img.jpg'
const RENDER_URL =
  'http://localhost:54321/storage/v1/render/image/public/watches/photos/img.jpg'
const EXTERNAL_URL = 'https://cdn.example.com/photo.jpg'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function loadModule({ transforms = false } = {}) {
  if (transforms) {
    vi.stubEnv('VITE_SUPABASE_IMAGE_TRANSFORMS', 'true')
  }
  vi.resetModules()
  return import('./watchImageUrl.js')
}

describe('isSupabaseStoragePublicUrl', () => {
  it('détecte les URLs publiques du Storage Supabase', async () => {
    const mod = await loadModule()
    expect(mod.isSupabaseStoragePublicUrl(OBJECT_URL)).toBe(true)
    expect(mod.isSupabaseStoragePublicUrl(EXTERNAL_URL)).toBe(false)
    expect(mod.isSupabaseStoragePublicUrl(null)).toBe(false)
    expect(mod.isSupabaseStoragePublicUrl(undefined)).toBe(false)
  })
})

describe('transformations désactivées (défaut)', () => {
  it('retourne les URLs inchangées et aucun srcset', async () => {
    const mod = await loadModule()

    expect(mod.SUPABASE_IMAGE_TRANSFORMS_ENABLED).toBe(false)
    expect(mod.toSupabaseRenderUrl(OBJECT_URL, { width: 100 })).toBe(OBJECT_URL)
    expect(mod.watchCardImageUrl(OBJECT_URL)).toBe(OBJECT_URL)
    expect(mod.watchLightboxImageUrl(OBJECT_URL)).toBe(OBJECT_URL)
    expect(mod.buildWatchCardSrcSet(OBJECT_URL)).toBeUndefined()
  })

  it('interdit le préchargement : les originaux pèsent plusieurs Mo', async () => {
    const mod = await loadModule()
    expect(mod.canPreloadWatchImages()).toBe(false)
  })

  it('retourne undefined pour une URL absente', async () => {
    const mod = await loadModule()
    expect(mod.watchCardImageUrl(null)).toBeUndefined()
    expect(mod.toSupabaseRenderUrl(undefined)).toBeUndefined()
  })
})

describe('transformations activées (plan Pro+)', () => {
  it('réécrit /object/public/ vers /render/image/public/ avec les paramètres', async () => {
    const mod = await loadModule({ transforms: true })
    const result = new URL(mod.toSupabaseRenderUrl(OBJECT_URL, { width: 320, quality: 60 }))

    expect(result.pathname).toContain('/storage/v1/render/image/public/')
    expect(result.searchParams.get('width')).toBe('320')
    expect(result.searchParams.get('quality')).toBe('60')
    expect(result.searchParams.get('resize')).toBe('cover')
  })

  it('complète une URL déjà en /render/ sans la réécrire', async () => {
    const mod = await loadModule({ transforms: true })
    const result = new URL(mod.toSupabaseRenderUrl(RENDER_URL, { width: 640 }))

    expect(result.pathname).toBe(new URL(RENDER_URL).pathname)
    expect(result.searchParams.get('width')).toBe('640')
  })

  it('laisse intactes les URLs hors Storage Supabase', async () => {
    const mod = await loadModule({ transforms: true })
    expect(mod.toSupabaseRenderUrl(EXTERNAL_URL, { width: 320 })).toBe(EXTERNAL_URL)
    expect(mod.buildWatchCardSrcSet(EXTERNAL_URL)).toBeUndefined()
  })

  it('watchCardImageUrl applique largeur 480 et qualité 80 par défaut', async () => {
    const mod = await loadModule({ transforms: true })
    const result = new URL(mod.watchCardImageUrl(OBJECT_URL))

    expect(result.searchParams.get('width')).toBe('480')
    expect(result.searchParams.get('quality')).toBe('80')
  })

  it('watchLightboxImageUrl vise une largeur adaptée au zoom, en resize contain', async () => {
    const mod = await loadModule({ transforms: true })
    const result = new URL(mod.watchLightboxImageUrl(OBJECT_URL))

    expect(result.searchParams.get('width')).toBe(String(mod.WATCH_LIGHTBOX_IMAGE_WIDTH))
    expect(result.searchParams.get('resize')).toBe('contain')
  })

  it('autorise le préchargement hors connexion lente ou mode économie', async () => {
    const mod = await loadModule({ transforms: true })

    vi.stubGlobal('navigator', { connection: { effectiveType: '4g', saveData: false } })
    expect(mod.canPreloadWatchImages()).toBe(true)

    vi.stubGlobal('navigator', { connection: { effectiveType: '4g', saveData: true } })
    expect(mod.canPreloadWatchImages()).toBe(false)

    vi.stubGlobal('navigator', { connection: { effectiveType: '2g', saveData: false } })
    expect(mod.canPreloadWatchImages()).toBe(false)

    vi.unstubAllGlobals()
  })

  it('buildWatchCardSrcSet expose une entrée par largeur', async () => {
    const mod = await loadModule({ transforms: true })
    const srcset = mod.buildWatchCardSrcSet(OBJECT_URL)
    const entries = srcset.split(', ')

    expect(entries).toHaveLength(mod.WATCH_CARD_SRC_WIDTHS.length)
    for (const [i, width] of mod.WATCH_CARD_SRC_WIDTHS.entries()) {
      expect(entries[i]).toContain(`width=${width}`)
      expect(entries[i].endsWith(` ${width}w`)).toBe(true)
    }
  })
})
