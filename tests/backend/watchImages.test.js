/**
 * Résolution des photos de montres (`backend/utils/watchImages.js`).
 *
 * Ce que ces tests protègent : l'e-mail part, avec ou sans photo. Une base injoignable, une
 * montre sans cliché ou une ligne mal formée rendent `null` — jamais une exception qui ferait
 * échouer l'envoi du rendez-vous ou de l'alerte qui l'appelle.
 */
import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  publicWatchImageUrl,
  fetchWatchImageUrl,
} = require('../../backend/utils/watchImages.js')

/** Supabase minimal : une requête `watch_images` et un bucket Storage public. */
function mockSupabase({ row = null, error = null, throws = null } = {}) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => {
      if (throws) throw throws
      return { data: row, error }
    }),
  }
  return {
    from: vi.fn(() => chain),
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://sb.example.com/storage/v1/object/public/watch-images/${path}` },
        }),
      })),
    },
    chain,
  }
}

describe('publicWatchImageUrl', () => {
  it("préfère l'URL absolue quand la ligne en porte une", () => {
    const supabase = mockSupabase()
    const url = publicWatchImageUrl(supabase, {
      image_url: 'https://cdn.example.com/a.jpg',
      image_path: 'w1/a.jpg',
    })

    expect(url).toBe('https://cdn.example.com/a.jpg')
    expect(supabase.storage.from).not.toHaveBeenCalled()
  })

  it('résout un chemin de bucket en URL publique', () => {
    const url = publicWatchImageUrl(mockSupabase(), { image_path: 'w1/a.jpg' })

    expect(url).toBe('https://sb.example.com/storage/v1/object/public/watch-images/w1/a.jpg')
  })

  it('rend null pour une ligne absente ou vide', () => {
    expect(publicWatchImageUrl(mockSupabase(), null)).toBeNull()
    expect(publicWatchImageUrl(mockSupabase(), {})).toBeNull()
  })
})

describe('fetchWatchImageUrl', () => {
  it("prend la première photo dans l'ordre d'affichage de la fiche", async () => {
    const supabase = mockSupabase({ row: { image_url: 'https://cdn.example.com/a.jpg' } })

    await expect(fetchWatchImageUrl(supabase, 'w1')).resolves.toBe('https://cdn.example.com/a.jpg')
    expect(supabase.from).toHaveBeenCalledWith('watch_images')
    expect(supabase.chain.eq).toHaveBeenCalledWith('watch_id', 'w1')
    expect(supabase.chain.order).toHaveBeenCalledWith('image_order', { ascending: true })
  })

  it("n'interroge pas la base sans identifiant de montre", async () => {
    const supabase = mockSupabase()

    await expect(fetchWatchImageUrl(supabase, '')).resolves.toBeNull()
    await expect(fetchWatchImageUrl(supabase, undefined)).resolves.toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('rend null plutôt que de propager une erreur de requête', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const supabase = mockSupabase({ error: { message: 'relation absente' } })

    await expect(fetchWatchImageUrl(supabase, 'w1')).resolves.toBeNull()
  })

  it('rend null plutôt que de propager une base injoignable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const supabase = mockSupabase({ throws: new Error('fetch failed') })

    await expect(fetchWatchImageUrl(supabase, 'w1')).resolves.toBeNull()
  })

  it('rend null quand la montre existe sans aucune photo', async () => {
    await expect(fetchWatchImageUrl(mockSupabase({ row: null }), 'w1')).resolves.toBeNull()
  })
})
