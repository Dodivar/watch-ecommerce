/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AdminHomeFeatured from './AdminHomeFeatured.vue'
import CarouselNouvelles from '@/components/CarouselNouvelles.vue'

const getFeaturedWatchesForAdminMock = vi.hoisted(() => vi.fn())
const getWatchesByIdsForAdminMock = vi.hoisted(() => vi.fn())
const searchWatchesForAdminMock = vi.hoisted(() => vi.fn())
const getWatchByIdMock = vi.hoisted(() => vi.fn())
const getLatestAvailableWatchesMock = vi.hoisted(() => vi.fn())

vi.mock('./AdminShell.vue', () => ({
  default: { name: 'AdminShell', template: '<div><slot /></div>' },
}))

vi.mock('@/services/admin/adminWatchService', () => ({
  getWatchesByIdsForAdmin: getWatchesByIdsForAdminMock,
  searchWatchesForAdmin: searchWatchesForAdminMock,
}))

vi.mock('@/services/admin/adminFeaturedService', () => ({
  getFeaturedWatchesForAdmin: getFeaturedWatchesForAdminMock,
  setFeaturedWatchesForAdmin: vi.fn(),
  getFeaturedWatchesPublic: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/services/watchService', () => ({
  getWatchById: getWatchByIdMock,
  getLatestAvailableWatches: getLatestAvailableWatchesMock,
}))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => siteConfig,
}))

vi.mock('@/utils/watchImageUrl.js', () => ({
  watchCardImageUrl: (url) => url,
  buildWatchCardSrcSet: () => undefined,
  WATCH_CARD_IMAGE_SIZES: '400px',
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { name: 'RouterLink', template: '<a><slot /></a>' },
}))

const siteConfig = {
  features: { collection: true },
  home: {
    sections: ['hero', 'nouvelles'],
    nouvelles: { title: 'Nos dernières montres', subtitle: '' },
  },
  watchCatalog: { display: { showReference: true, showSoldBadge: true } },
}

/** Ligne admin : une seule image, en basse définition (`attachFirstImagesToWatches`). */
const adminRow = {
  id: 'w1',
  name: 'ROLEX DATEJUST',
  brand: 'ROLEX',
  price: 5000,
  is_available: true,
  images: ['https://cdn.test/vignette-admin.jpg'],
}

/** Même montre côté public : toutes ses images, dans l'ordre du site. */
const publicWatch = {
  id: 'w1',
  name: 'ROLEX DATEJUST',
  brand: 'ROLEX',
  price: 5000,
  isAvailable: true,
  images: ['https://cdn.test/accueil-1.jpg', 'https://cdn.test/accueil-2.jpg'],
}

const fallbackWatch = {
  id: 'auto-1',
  name: 'OMEGA SEAMASTER',
  brand: 'OMEGA',
  price: 3000,
  images: ['https://cdn.test/auto-1.jpg'],
}

function mountScreen() {
  return mount(AdminHomeFeatured, { props: { context: 'nouvelles' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  getWatchesByIdsForAdminMock.mockResolvedValue([adminRow])
  searchWatchesForAdminMock.mockResolvedValue({ watches: [], total: 0, page: 1, pageSize: 24 })
  getWatchByIdMock.mockResolvedValue(publicWatch)
  getLatestAvailableWatchesMock.mockResolvedValue([fallbackWatch])
  getFeaturedWatchesForAdminMock.mockResolvedValue([{ watch_id: 'w1' }])
})

describe('AdminHomeFeatured — aperçu', () => {
  it('rend la section de l’accueil elle-même, avec les images du site', async () => {
    const wrapper = mountScreen()
    await flushPromises()

    const preview = wrapper.findComponent(CarouselNouvelles)
    expect(preview.exists()).toBe(true)

    // La montre est chargée par le chemin public : c'est ce qui garantit une
    // image identique à celle de l'accueil, et non la vignette de l'admin.
    expect(getWatchByIdMock).toHaveBeenCalledWith('w1')
    const sources = preview.findAll('img').map((img) => img.attributes('src'))
    expect(sources).toContain('https://cdn.test/accueil-1.jpg')
    expect(sources).not.toContain('https://cdn.test/vignette-admin.jpg')
  })

  it('porte la bande d’accueil de la section', async () => {
    const wrapper = mountScreen()
    await flushPromises()

    // `hero` puis `nouvelles` : la seconde bande est claire (cf. homeBands.js).
    expect(wrapper.findComponent(CarouselNouvelles).classes()).toContain('home-band--light')
  })

  it('montre le repli automatique quand la sélection est vide', async () => {
    getFeaturedWatchesForAdminMock.mockResolvedValue([])
    getWatchesByIdsForAdminMock.mockResolvedValue([])

    const wrapper = mountScreen()
    await flushPromises()

    const preview = wrapper.findComponent(CarouselNouvelles)
    expect(preview.text()).toContain('OMEGA SEAMASTER')
    expect(getLatestAvailableWatchesMock).toHaveBeenCalled()
  })

  it('n’ouvre aucune fiche depuis l’aperçu', async () => {
    const wrapper = mountScreen()
    await flushPromises()

    const card = wrapper.findComponent(CarouselNouvelles).find('.cursor-pointer')
    expect(card.exists()).toBe(false)
  })
})
