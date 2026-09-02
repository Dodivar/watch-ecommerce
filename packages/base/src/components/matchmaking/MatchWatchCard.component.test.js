/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import MatchWatchCard from './MatchWatchCard.vue'

vi.mock('@/utils/watchImageUrl.js', () => ({
  watchCardImageUrl: (url) => url,
  buildWatchCardSrcSet: () => undefined,
}))

const baseWatch = {
  id: 'w1',
  brand: 'ROLEX',
  model: 'Oysterdate',
  name: 'Rolex Oysterdate Precision',
  price: 3190,
  effectivePrice: 3190,
  isOnPromotion: false,
  year: 1973,
  images: ['/oyster.webp'],
}

describe('MatchWatchCard', () => {
  it('affiche la marque, le modèle, le prix et l’année', () => {
    const wrapper = mount(MatchWatchCard, { props: { watch: baseWatch } })
    const text = wrapper.text()
    expect(text).toContain('ROLEX')
    expect(text).toContain('Oysterdate')
    expect(text).toContain('1973')
    expect(text).toMatch(/3\s?190/)
    expect(wrapper.find('img').attributes('src')).toBe('/oyster.webp')
    expect(wrapper.find('img').attributes('draggable')).toBe('false')
  })

  it('retombe sur le nom quand le modèle manque', () => {
    const wrapper = mount(MatchWatchCard, {
      props: { watch: { ...baseWatch, model: '' } },
    })
    expect(wrapper.find('h3').text()).toBe('Rolex Oysterdate Precision')
  })

  it('barre le prix catalogue et affiche la remise en promotion', () => {
    const wrapper = mount(MatchWatchCard, {
      props: {
        watch: {
          ...baseWatch,
          price: 4000,
          effectivePrice: 3200,
          isOnPromotion: true,
          displayDiscountPercent: 20,
        },
      },
    })
    expect(wrapper.find('.line-through').text()).toMatch(/4\s?000/)
    expect(wrapper.text()).toContain('-20 %')
  })

  it('signale une image manquante sans casser la carte', () => {
    const wrapper = mount(MatchWatchCard, { props: { watch: { ...baseWatch, images: [] } } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Image non disponible')
  })

  it('porte un libellé accessible complet', () => {
    const wrapper = mount(MatchWatchCard, { props: { watch: baseWatch } })
    const label = wrapper.find('article').attributes('aria-label')
    expect(label).toContain('ROLEX')
    expect(label).toContain('Oysterdate')
  })
})
