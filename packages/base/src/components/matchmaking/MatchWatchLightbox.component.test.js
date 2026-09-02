/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import MatchWatchLightbox from './MatchWatchLightbox.vue'

const getSiteConfigMock = vi.hoisted(() => vi.fn())

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

vi.mock('@/utils/watchImageUrl.js', () => ({
  watchLightboxImageUrl: (url) => url,
}))

getSiteConfigMock.mockReturnValue({
  watchCatalog: { display: { showReference: true } },
})

const watch = {
  id: 'w1',
  slug: 'rolex-explorer',
  brand: 'ROLEX',
  model: 'Explorer',
  name: 'Rolex Explorer',
  reference: '124270',
  price: 7890,
  effectivePrice: 7890,
  isOnPromotion: false,
  year: 2021,
  condition: 'Excellent état',
  description: 'Une Explorer en parfait état.',
  images: ['/a.jpg', '/b.jpg'],
  details: {
    movement: 'Remontage automatique',
    caseMaterial: 'Acier',
    braceletMaterials: ['steel'],
    braceletColors: ['silver'],
    dialColor: 'Noir',
    caseSize: '36',
    waterResistance: '100m',
    guarantee: '1 an de garantie',
    accessories: [
      { name: "Boîte d'origine", included: true },
      { name: 'Facture', included: false },
    ],
  },
}

function mountLightbox(props = {}) {
  return mount(MatchWatchLightbox, {
    props: { open: true, watch, mode: 'deck', ...props },
    global: {
      stubs: {
        WatchImageSwipeCarousel: true,
        RouterLink: { template: '<a><slot /></a>' },
        Teleport: true,
      },
    },
  })
}

describe('MatchWatchLightbox', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('affiche les caractéristiques traduites et les accessoires inclus', () => {
    const wrapper = mountLightbox()
    const text = wrapper.text()
    expect(text).toContain('Explorer')
    expect(text).toContain('Réf. 124270')
    expect(text).toContain('Remontage automatique')
    expect(text).toContain('36 mm')
    expect(text).toContain('100 m')
    expect(text).toContain('1 an de garantie')
    expect(text).toContain('Boîte d’origine')
    expect(text).not.toContain('Facture')
    wrapper.unmount()
  })

  it('émet la décision prise depuis le détail, sans toucher au deck', async () => {
    const wrapper = mountLightbox()
    await wrapper.find('button.bg-primary').trigger('click')
    expect(wrapper.emitted('like')?.[0]?.[0]).toMatchObject({ id: 'w1' })

    const buttons = wrapper.findAll('footer button')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('pass')?.[0]?.[0]).toMatchObject({ id: 'w1' })
    wrapper.unmount()
  })

  it('Échap referme', async () => {
    const wrapper = mountLightbox()
    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('verrouille le défilement tant qu’elle est ouverte', async () => {
    const wrapper = mountLightbox({ open: false })
    expect(document.body.style.overflow).toBe('')
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('propose « retirer » et le lien vers la fiche en mode shortlist', async () => {
    const wrapper = mountLightbox({ mode: 'shortlist' })
    expect(wrapper.text()).toContain('Retirer')
    expect(wrapper.text()).toContain('Voir la fiche complète')
    await wrapper.findAll('footer button')[0].trigger('click')
    expect(wrapper.emitted('remove')?.[0]?.[0]).toMatchObject({ id: 'w1' })
    wrapper.unmount()
  })
})
