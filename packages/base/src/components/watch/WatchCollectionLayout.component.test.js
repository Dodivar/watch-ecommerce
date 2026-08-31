/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

import WatchCollectionLayout from './WatchCollectionLayout.vue'
import { WATCH_COLLECTION_LAYOUTS } from '@/constants/watchCollectionLayouts.js'

const getSiteConfigMock = vi.hoisted(() => vi.fn())

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

vi.mock('@/utils/watchImageUrl.js', () => ({
  watchCardImageUrl: (url) => url,
  buildWatchCardSrcSet: () => undefined,
  WATCH_CARD_IMAGE_SIZES: '400px',
}))

const watches = [
  { id: '1', name: 'Montre A', brand: 'Rolex', reference: 'REF-A', price: 1000, images: [] },
  { id: '2', name: 'Montre B', brand: 'Omega', reference: 'REF-B', price: 2000, images: [] },
]

function mountLayout(props = {}) {
  return mount(WatchCollectionLayout, {
    props: { watches, isNouvelle: () => false, ...props },
  })
}

beforeEach(() => {
  getSiteConfigMock.mockReturnValue({
    watchCatalog: {
      mode: 'retail',
      display: { showReference: true, showSoldBadge: false, showStockStatus: true },
    },
  })
})

describe('WatchCollectionLayout', () => {
  it.each(Object.keys(WATCH_COLLECTION_LAYOUTS))(
    'rend les montres dans le format %s',
    (mode) => {
      const wrapper = mountLayout({ mode })
      expect(wrapper.text()).toContain('Montre A')
      expect(wrapper.text()).toContain('Montre B')
    },
  )

  it('retombe sur la grille pour un format inconnu', () => {
    const wrapper = mountLayout({ mode: 'mosaic' })
    expect(wrapper.get('div').classes()).toEqual(
      expect.arrayContaining(WATCH_COLLECTION_LAYOUTS.grid.containerClass.split(' ')),
    )
  })

  it('applique le conteneur du format actif', () => {
    const wrapper = mountLayout({ mode: 'compact' })
    expect(wrapper.get('div').classes()).toEqual(
      expect.arrayContaining(WATCH_COLLECTION_LAYOUTS.compact.containerClass.split(' ')),
    )
  })

  it.each(Object.keys(WATCH_COLLECTION_LAYOUTS))(
    'monte le squelette du format %s pendant le chargement',
    (mode) => {
      const wrapper = mountLayout({ mode, isLoading: true, skeletonCount: 4 })
      expect(wrapper.text()).not.toContain('Montre A')
      expect(wrapper.findAll('.shimmer-bg').length).toBeGreaterThan(0)
    },
  )

  it('donne au squelette le conteneur de la grille réelle', () => {
    const loading = mountLayout({ mode: 'list', isLoading: true })
    const loaded = mountLayout({ mode: 'list' })
    expect(loading.get('div').classes()).toEqual(loaded.get('div').classes())
  })

  it('plafonne le nombre de squelettes selon le format', () => {
    const wrapper = mountLayout({ mode: 'showcase', isLoading: true, skeletonCount: 96 })
    expect(wrapper.findAllComponents({ name: 'WatchCardSkeleton' })).toHaveLength(
      WATCH_COLLECTION_LAYOUTS.showcase.skeletonCap,
    )
  })

  it.each([
    ['showcase', 2],
    ['compact', 6],
    ['list', 3],
  ])('charge %s montres en eager dans le format %s', (mode, eagerCount) => {
    expect(WATCH_COLLECTION_LAYOUTS[mode].eagerImageCount).toBe(eagerCount)

    const many = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Montre ${i}`,
      brand: 'Rolex',
      reference: `REF-${i}`,
      price: 1000,
      images: [`https://example.test/${i}.jpg`],
    }))
    const wrapper = mount(WatchCollectionLayout, {
      props: { mode, watches: many, isNouvelle: () => false },
    })

    const eager = wrapper
      .findAll('img')
      .filter((img) => img.attributes('loading') === 'eager')
    expect(eager).toHaveLength(eagerCount)
  })

  it('réémet viewDetails avec la montre cliquée', async () => {
    const wrapper = mountLayout({ mode: 'list' })
    await wrapper.findAll('article')[1].trigger('click')
    expect(wrapper.emitted('viewDetails')?.[0]?.[0]).toMatchObject({ id: '2' })
  })
})

/**
 * Profil revente (sauvage-watches) : référence, badge « Vendue », année et
 * contenu n'existent que sous `showResaleFields`. Sans ce bloc, ces branches
 * ne s'exécutaient dans aucun test ni aucune capture.
 */
describe('WatchCollectionLayout — catalogue revente', () => {
  const resaleWatch = {
    id: 'r1',
    name: 'Rolex Submariner 1998',
    brand: 'Rolex',
    reference: 'REF-16610',
    price: 8900,
    year: 1998,
    isSold: true,
    images: [],
    details: { content: 'Boîte et papiers', caseSize: '40' },
  }

  beforeEach(() => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: {
        mode: 'resale',
        display: {
          showReference: true,
          showSoldBadge: true,
          showResaleFields: true,
          showStockStatus: false,
          yearBadgePosition: 'inline',
        },
      },
    })
  })

  it('affiche référence, badge vendue, année et contenu en mode liste', () => {
    const wrapper = mount(WatchCollectionLayout, {
      props: { mode: 'list', watches: [resaleWatch], isNouvelle: () => false },
    })
    const text = wrapper.text()
    expect(text).toContain('REF-16610')
    expect(text).toContain('Vendue')
    expect(text).toContain('1998')
    expect(text).toContain('Boîte et papiers')
  })

  it.each(['grid', 'showcase', 'compact'])(
    'affiche le badge vendue sur les cartes du format %s',
    (mode) => {
      const wrapper = mount(WatchCollectionLayout, {
        props: { mode, watches: [resaleWatch], isNouvelle: () => false },
      })
      expect(wrapper.text()).toContain('Vendue')
    },
  )

  it('place l’année en coin quand le manifest le demande', () => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: {
        mode: 'resale',
        display: {
          showReference: true,
          showSoldBadge: true,
          showResaleFields: true,
          showStockStatus: false,
          yearBadgePosition: 'corner',
        },
      },
    })
    const wrapper = mount(WatchCollectionLayout, {
      props: { mode: 'showcase', watches: [resaleWatch], isNouvelle: () => false },
    })
    expect(wrapper.text()).toContain('1998')
  })
})
