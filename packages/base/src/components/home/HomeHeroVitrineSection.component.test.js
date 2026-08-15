/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RouterLinkStub } from '@vue/test-utils'

import HomeHeroVitrineSection from './HomeHeroVitrineSection.vue'

const getSiteConfigMock = vi.hoisted(() => vi.fn())
const getLatestAvailableWatchesMock = vi.hoisted(() => vi.fn())

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

vi.mock('@/services/watchService.js', () => ({
  getLatestAvailableWatches: getLatestAvailableWatchesMock,
}))

vi.mock('@/utils/watchImageUrl.js', () => ({
  watchCardImageUrl: (url) => url,
}))

const siteConfig = {
  features: { collection: true, recherche: true },
  home: {
    hero: {
      variant: 'vitrine',
      eyebrow: 'Revendeur horloger — Strasbourg',
      title: 'Des montres authentifiées, choisies une par une.',
      subtitle: 'Nous achetons, vérifions et détenons nos montres.',
      primaryCta: { label: 'Voir les montres en stock', to: '/collection' },
      secondaryCta: { label: 'Recherche personnalisée', to: '/recherche' },
      highlights: ['Authenticité vérifiée par nos experts'],
    },
  },
}

const availableWatch = {
  id: 'w1',
  slug: 'rolex-datejust-16014',
  name: 'ROLEX DATEJUST',
  brand: 'ROLEX',
  model: 'DATEJUST',
  reference: '16014',
  images: ['https://cdn.test/rolex-datejust.jpg'],
}

function mountSection() {
  return mount(HomeHeroVitrineSection, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('HomeHeroVitrineSection', () => {
  it('expose la première montre en vente et pointe vers sa fiche', async () => {
    getSiteConfigMock.mockReturnValue(siteConfig)
    getLatestAvailableWatchesMock.mockResolvedValue([availableWatch])

    const wrapper = mountSection()
    await flushPromises()

    expect(getLatestAvailableWatchesMock).toHaveBeenCalledWith(1)

    const image = wrapper.get('img')
    expect(image.attributes('src')).toBe('https://cdn.test/rolex-datejust.jpg')
    expect(image.attributes('alt')).toBe('ROLEX DATEJUST')
    expect(wrapper.text()).toContain('DATEJUST')
    expect(wrapper.text()).toContain('En stock')

    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links.some((link) => link.props('to') === '/montre/rolex-datejust-16014')).toBe(true)
  })

  it('garde un hero lisible quand le catalogue ne répond pas', async () => {
    getSiteConfigMock.mockReturnValue(siteConfig)
    getLatestAvailableWatchesMock.mockRejectedValue(new Error('réseau'))

    const wrapper = mountSection()
    await flushPromises()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Pièce en vitrine')
    expect(wrapper.text()).toContain('Des montres authentifiées, choisies une par une.')
  })

  it('masque le panneau quand la montre n’a pas de photo', async () => {
    getSiteConfigMock.mockReturnValue(siteConfig)
    getLatestAvailableWatchesMock.mockResolvedValue([{ ...availableWatch, images: [] }])

    const wrapper = mountSection()
    await flushPromises()

    expect(wrapper.text()).not.toContain('Pièce en vitrine')
  })
})
