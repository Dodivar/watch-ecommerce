import { beforeEach, describe, expect, it, vi } from 'vitest'

const getFeaturedWatchesPublicMock = vi.hoisted(() => vi.fn())
const getWatchByIdMock = vi.hoisted(() => vi.fn())
const getLatestAvailableWatchesMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/admin/adminFeaturedService', () => ({
  getFeaturedWatchesPublic: getFeaturedWatchesPublicMock,
}))

vi.mock('@/services/watchService', () => ({
  getWatchById: getWatchByIdMock,
  getLatestAvailableWatches: getLatestAvailableWatchesMock,
}))

const { assembleNouvellesWatches, resolveNouvellesWatches, resetNouvellesWatchesCache } =
  await import('./nouvellesWatchesService.js')

const LATEST = [{ id: 'latest-1' }]

beforeEach(() => {
  vi.clearAllMocks()
  resetNouvellesWatchesCache()
  getLatestAvailableWatchesMock.mockResolvedValue(LATEST)
})

describe('assembleNouvellesWatches', () => {
  it('monte les montres de la sélection, dans l’ordre reçu', async () => {
    getWatchByIdMock.mockImplementation(async (id) => ({ id }))

    const watches = await assembleNouvellesWatches(['b', 'a'])

    expect(watches.map((watch) => watch.id)).toEqual(['b', 'a'])
    expect(getLatestAvailableWatchesMock).not.toHaveBeenCalled()
  })

  it('écarte les montres retirées de la vente, comme la page d’accueil', async () => {
    getWatchByIdMock.mockImplementation(async (id) => {
      if (id === 'sold') throw new Error('UNAVAILABLE')
      return { id }
    })

    const watches = await assembleNouvellesWatches(['sold', 'a'])

    expect(watches.map((watch) => watch.id)).toEqual(['a'])
  })

  it('retombe sur les dernières montres disponibles sans sélection exploitable', async () => {
    getWatchByIdMock.mockRejectedValue(new Error('UNAVAILABLE'))

    await expect(assembleNouvellesWatches([])).resolves.toEqual(LATEST)
    await expect(assembleNouvellesWatches(['sold'])).resolves.toEqual(LATEST)
  })

  it('accepte un chargeur injecté — l’aperçu admin mémorise ses montres', async () => {
    const loadWatch = vi.fn(async (id) => ({ id }))

    const watches = await assembleNouvellesWatches(['a'], { loadWatch })

    expect(watches.map((watch) => watch.id)).toEqual(['a'])
    expect(loadWatch).toHaveBeenCalledWith('a')
    expect(getWatchByIdMock).not.toHaveBeenCalled()
  })
})

describe('resolveNouvellesWatches', () => {
  it('assemble la sélection publiée', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue([{ id: 'featured-1' }])
    getWatchByIdMock.mockImplementation(async (id) => ({ id }))

    const watches = await resolveNouvellesWatches()

    expect(watches.map((watch) => watch.id)).toEqual(['featured-1'])
  })

  it('retombe sur les dernières montres sans sélection publiée', async () => {
    getFeaturedWatchesPublicMock.mockResolvedValue(null)

    await expect(resolveNouvellesWatches()).resolves.toEqual(LATEST)
  })
})
