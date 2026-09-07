/**
 * @vitest-environment happy-dom
 *
 * Le catalogue arrive par pages. Ce qui se joue ici est le décalage entre les deux moments
 * du chargement : la session est reprise dès la première page, pour que le parcours s'ouvre,
 * mais rien n'est conclu du stock avant la dernière — sans quoi une montre livrée en page 2
 * passerait pour disparue.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const getAllWatchesForListing = vi.hoisted(() => vi.fn())

vi.mock('@/services/watchService', () => ({ getAllWatchesForListing }))
vi.mock('@/services/watchPromotionCampaignService.js', () => ({
  getActiveCampaignWatchPricingPublic: () => Promise.resolve(null),
}))
vi.mock('@/utils/watchPromotionCampaign.js', () => ({
  enrichWatchesWithActiveCampaignPricing: (watches) => watches,
}))
vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => ({ siteId: 'test' }),
}))

const { useWatchMatchmaking } = await import('./useWatchMatchmaking.js')
const { getMatchSessionStorageKey, MATCH_SESSION_VERSION } = await import(
  '@/services/matchSessionStorage.js'
)

function makeWatch(id, price = 5000) {
  return {
    id,
    brand: 'ROLEX',
    model: id,
    name: `Rolex ${id}`,
    price,
    isAvailable: true,
    isSold: false,
    images: [],
    details: {},
  }
}

/** Session déjà en place dans le navigateur, telle que `saveMatchSession` l'écrit. */
function storeSession(patch) {
  localStorage.setItem(
    getMatchSessionStorageKey(),
    JSON.stringify({
      version: MATCH_SESSION_VERSION,
      savedAt: new Date().toISOString(),
      preferences: {},
      step: 'swipe',
      stepIndex: 0,
      seen: [],
      liked: [],
      passed: [],
      ...patch,
    }),
  )
}

/**
 * Sert `pages` l'une après l'autre. La promesse `secondPageGate` retient la seconde page
 * aussi longtemps qu'on veut observer l'état intermédiaire.
 */
function servePages(pages, gate) {
  getAllWatchesForListing.mockImplementation(async ({ onPage }) => {
    const all = []
    for (const [index, page] of pages.entries()) {
      if (index > 0 && gate) await gate
      all.push(...page)
      await onPage(page)
    }
    return all
  })
}

describe('useWatchMatchmaking — chargement par pages', () => {
  beforeEach(() => {
    localStorage.clear()
    getAllWatchesForListing.mockReset()
  })

  it('ouvre le parcours sur la première page, sans attendre la suivante', async () => {
    let openGate
    const gate = new Promise((resolve) => {
      openGate = resolve
    })
    servePages([[makeWatch('a'), makeWatch('b')], [makeWatch('c')]], gate)

    const mm = useWatchMatchmaking()
    const loaded = mm.load()
    await nextTick()
    await Promise.resolve()

    expect(mm.phase).not.toBe('loading')
    expect(mm.pool).toHaveLength(2)
    expect(mm.isLoadingMore).toBe(true)

    openGate()
    await loaded
    expect(mm.pool).toHaveLength(3)
    expect(mm.isLoadingMore).toBe(false)
  })

  it('ne remet pas dans le deck une montre vue, livrée seulement en deuxième page', async () => {
    storeSession({ seen: ['c'], passed: ['c'] })
    servePages([[makeWatch('a')], [makeWatch('c')]])

    const mm = useWatchMatchmaking()
    await mm.load()

    expect(mm.session.seen).toContain('c')
    expect(mm.deck.map((w) => w.id)).toEqual(['a'])
  })

  it('n’annonce pas « plus disponible » un coup de cœur livré en deuxième page', async () => {
    storeSession({ step: 'shortlist', liked: ['c'], seen: ['c'] })
    servePages([[makeWatch('a')], [makeWatch('c')]])

    const mm = useWatchMatchmaking()
    await mm.load()

    expect(mm.unavailableLikedIds).toEqual([])
    expect(mm.likedEntries).toEqual([expect.objectContaining({ id: 'c', unavailable: false })])
  })

  it('oublie ce qui a bel et bien quitté le catalogue, une fois tout chargé', async () => {
    storeSession({ seen: ['a', 'vendue'], passed: ['vendue'], liked: ['vendue'] })
    servePages([[makeWatch('a')], [makeWatch('c')]])

    const mm = useWatchMatchmaking()
    await mm.load()

    expect(mm.session.seen).toEqual(['a'])
    expect(mm.session.passed).toEqual([])
    // Un coup de cœur disparu garde sa place, signalé : la shortlist doit pouvoir le dire.
    expect(mm.session.liked).toEqual(['vendue'])
    expect(mm.unavailableLikedIds).toEqual(['vendue'])
  })

  it('garde les décisions prises pendant que les pages arrivent', async () => {
    let openGate
    const gate = new Promise((resolve) => {
      openGate = resolve
    })
    servePages([[makeWatch('a'), makeWatch('b')], [makeWatch('c')]], gate)

    const mm = useWatchMatchmaking()
    const loaded = mm.load()
    await nextTick()
    await Promise.resolve()

    mm.like('a')
    openGate()
    await loaded

    expect(mm.session.liked).toEqual(['a'])
    expect(mm.session.seen).toEqual(['a'])
    expect(mm.unavailableLikedIds).toEqual([])
  })

  it('annonce le catalogue vide seulement une fois toutes les pages passées', async () => {
    servePages([])
    const mm = useWatchMatchmaking()
    await mm.load()
    expect(mm.phase).toBe('empty')
  })
})
