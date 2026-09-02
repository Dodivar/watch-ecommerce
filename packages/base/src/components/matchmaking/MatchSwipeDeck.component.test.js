/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

import MatchSwipeDeck from './MatchSwipeDeck.vue'

vi.mock('@/utils/watchImageUrl.js', () => ({
  watchCardImageUrl: (url) => url,
  buildWatchCardSrcSet: () => undefined,
  canPreloadWatchImages: () => false,
}))

function makeWatch(id, model) {
  return { id, brand: 'ROLEX', model, name: `Rolex ${model}`, price: 5000, images: [] }
}

/** Fac-similé réactif de `useWatchMatchmaking()`, limité à ce que le deck consomme. */
function makeMm() {
  return reactive({
    currentWatch: makeWatch('a', 'Explorer'),
    upcomingWatches: [makeWatch('b', 'Datejust'), makeWatch('c', 'Submariner')],
    seenInBudget: 0,
    totalInBudget: 3,
    session: { liked: [] },
    like: vi.fn(),
    pass: vi.fn(),
    showShortlist: vi.fn(),
    editPreferences: vi.fn(),
  })
}

describe('MatchSwipeDeck', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('présente la montre courante et le compteur', () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm } })
    expect(wrapper.text()).toContain('Explorer')
    expect(wrapper.text()).toContain('1 sur 3')
    wrapper.unmount()
  })

  it('le bouton cœur envoie la décision une fois la carte sortie', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm } })

    await wrapper.find('button[aria-label="Coup de cœur"]').trigger('click')
    expect(mm.like).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(mm.like).toHaveBeenCalledWith('a')
    wrapper.unmount()
  })

  it('← passe, → aime, Entrée ouvre le détail', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    vi.advanceTimersByTime(300)
    expect(mm.pass).toHaveBeenCalledWith('a')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    vi.advanceTimersByTime(300)
    expect(mm.like).toHaveBeenCalledWith('a')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(wrapper.emitted('open-details')?.[0]?.[0]?.id).toBe('a')
    wrapper.unmount()
  })

  it('ignore le clavier quand une modale a la main', () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm, keyboardDisabled: true } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    vi.advanceTimersByTime(300)
    expect(mm.like).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('annonce la décision pour les lecteurs d’écran', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm } })

    await wrapper.find('button[aria-label="Passer"]').trigger('click')
    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="status"]').text()).toContain('Explorer')
    wrapper.unmount()
  })
})
