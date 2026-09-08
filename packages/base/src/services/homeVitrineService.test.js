import { beforeEach, describe, expect, it, vi } from 'vitest'

const getFeaturedWatchesPublicMock = vi.hoisted(() => vi.fn())
const getLatestAvailableWatchesMock = vi.hoisted(() => vi.fn())
const getWatchByIdMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/admin/adminFeaturedService', () => ({
  getFeaturedWatchesPublic: getFeaturedWatchesPublicMock,
}))

vi.mock('@/services/watchService', () => ({
  getLatestAvailableWatches: getLatestAvailableWatchesMock,
  getWatchById: getWatchByIdMock,
}))

const { loadVitrineWatch, resetVitrineWatchCache, resolveVitrineWatch } = await import(
  './homeVitrineService.js'
)

/** @param {string} id @param {Record<string, unknown>} [extra] */
function watch(id, extra = {}) {
  return { id, name: `Montre ${id}`, images: [`https://cdn.test/${id}.jpg`], ...extra }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetVitrineWatchCache()
  getLatestAvailableWatchesMock.mockResolvedValue([watch('catalogue')])
})

describe('resolveVitrineWatch', () => {
  it('expose la tête de la sélection admin, assemblée avec ses relations', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue([watch('choisie'), watch('remplacante')])
    getWatchByIdMock.mockResolvedValue(watch('choisie', { images: ['https://cdn.test/full.jpg'] }))

    const result = await resolveVitrineWatch()

    expect(getFeaturedWatchesPublicMock).toHaveBeenCalledWith('vitrine')
    expect(getWatchByIdMock).toHaveBeenCalledWith('choisie')
    expect(result.images).toEqual(['https://cdn.test/full.jpg'])
    expect(getLatestAvailableWatchesMock).not.toHaveBeenCalled()
  })

  it('passe à la remplaçante quand la montre en tête est vendue', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue([
      watch('vendue', { is_sold: true }),
      watch('remplacante'),
    ])
    getWatchByIdMock.mockResolvedValue(watch('remplacante'))

    const result = await resolveVitrineWatch()

    expect(getWatchByIdMock).toHaveBeenCalledTimes(1)
    expect(getWatchByIdMock).toHaveBeenCalledWith('remplacante')
    expect(result.id).toBe('remplacante')
  })

  it('retombe sur le catalogue quand la sélection est vide', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue(null)

    const result = await resolveVitrineWatch()

    expect(result.id).toBe('catalogue')
  })

  it('retombe sur le catalogue quand la sélection est entièrement vendue', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue([watch('vendue', { is_sold: true })])

    const result = await resolveVitrineWatch()

    expect(getWatchByIdMock).not.toHaveBeenCalled()
    expect(result.id).toBe('catalogue')
  })

  it('retombe sur le catalogue quand la fiche choisie a disparu', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue([watch('fantome')])
    getWatchByIdMock.mockRejectedValue(new Error('Montre non trouvée'))

    const result = await resolveVitrineWatch()

    expect(result.id).toBe('catalogue')
  })

  it('retombe sur le catalogue sur un tenant sans le contexte `vitrine` en base', async () => {
    getFeaturedWatchesPublicMock.mockRejectedValue(new Error('check constraint'))

    const result = await resolveVitrineWatch()

    expect(result.id).toBe('catalogue')
  })

  it('rend null quand rien n’est exposable', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue(null)
    getLatestAvailableWatchesMock.mockResolvedValue([])

    await expect(resolveVitrineWatch()).resolves.toBeNull()
  })
})

describe('loadVitrineWatch', () => {
  it('ne résout qu’une fois par session', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue(null)

    await Promise.all([loadVitrineWatch(), loadVitrineWatch()])
    await loadVitrineWatch()

    expect(getFeaturedWatchesPublicMock).toHaveBeenCalledTimes(1)
  })

  it('repart de zéro après invalidation du cache', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue(null)

    await loadVitrineWatch()
    resetVitrineWatchCache()
    await loadVitrineWatch()

    expect(getFeaturedWatchesPublicMock).toHaveBeenCalledTimes(2)
  })
})
