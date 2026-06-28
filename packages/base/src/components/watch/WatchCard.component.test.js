/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import WatchCard from './WatchCard.vue'

const getSiteConfigMock = vi.hoisted(() => vi.fn())

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

vi.mock('@/utils/watchImageUrl.js', () => ({
  watchCardImageUrl: (url) => url,
  buildWatchCardSrcSet: () => undefined,
  WATCH_CARD_IMAGE_SIZES: '400px',
}))

const baseWatch = {
  id: '1',
  name: 'Test Watch',
  reference: 'REF-001',
  price: 1000,
  images: [],
}

describe('WatchCard', () => {
  it('affiche la référence quand le catalogue l’autorise', () => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: { display: { showReference: true, showSoldBadge: false } },
    })

    const wrapper = mount(WatchCard, {
      props: { watch: baseWatch, showReference: true },
    })

    expect(wrapper.text()).toContain('REF-001')
  })

  it('masque la référence quand showReference catalogue est false', () => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: { display: { showReference: false, showSoldBadge: false } },
    })

    const wrapper = mount(WatchCard, {
      props: { watch: baseWatch, showReference: true },
    })

    expect(wrapper.text()).not.toContain('REF-001')
  })

  it('affiche le badge Hors stock en retail quand le stock est à 0', () => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: {
        mode: 'retail',
        display: { showReference: false, showSoldBadge: false, showStockStatus: true },
      },
    })

    const wrapper = mount(WatchCard, {
      props: { watch: { ...baseWatch, stockQuantity: 0 } },
    })

    expect(wrapper.text()).toContain('Hors stock')
  })

  it('n’affiche pas Hors stock quand la montre est en stock', () => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: {
        mode: 'retail',
        display: { showReference: false, showSoldBadge: false, showStockStatus: true },
      },
    })

    const wrapper = mount(WatchCard, {
      props: { watch: { ...baseWatch, stockQuantity: 2 } },
    })

    expect(wrapper.text()).not.toContain('Hors stock')
  })

  it('n’affiche pas Hors stock en mode resale', () => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: {
        mode: 'resale',
        display: { showReference: true, showSoldBadge: true, showStockStatus: false },
      },
    })

    const wrapper = mount(WatchCard, {
      props: { watch: { ...baseWatch, stockQuantity: 0 } },
    })

    expect(wrapper.text()).not.toContain('Hors stock')
  })

  it('affiche la promotion à gauche et l’année en haut à droite', () => {
    getSiteConfigMock.mockReturnValue({
      watchCatalog: {
        mode: 'resale',
        display: {
          showReference: true,
          showSoldBadge: false,
          showResaleFields: true,
          yearBadgePosition: 'corner',
        },
      },
    })

    const wrapper = mount(WatchCard, {
      props: {
        watch: {
          ...baseWatch,
          year: 2016,
          isOnPromotion: true,
          displayDiscountPercent: 10,
        },
        showNewBadge: true,
      },
    })

    const promotionBadge = wrapper.find('.bg-red-600')
    const yearBadge = wrapper.find('.bg-white\\/90')

    expect(promotionBadge.exists()).toBe(true)
    expect(promotionBadge.text()).toContain('-10 %')
    expect(promotionBadge.classes()).toContain('left-2')
    expect(promotionBadge.classes()).toContain('top-9')
    expect(promotionBadge.classes()).not.toContain('right-2')

    expect(yearBadge.exists()).toBe(true)
    expect(yearBadge.text()).toContain('2016')
    expect(yearBadge.classes()).toContain('right-2')
    expect(yearBadge.classes()).toContain('top-2')
    expect(yearBadge.classes()).not.toContain('left-2')
  })
})
