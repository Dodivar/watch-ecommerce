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
})
