/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

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

/**
 * Deck qui retire réellement la montre décidée, pour observer le relais d'une carte à
 * l'autre (le fac-similé ci-dessus garde toujours la même carte en tête).
 */
function makeConsumingMm() {
  const all = [makeWatch('a', 'Explorer'), makeWatch('b', 'Datejust'), makeWatch('c', 'Submariner')]
  const seen = reactive([])
  const remaining = () => all.filter((w) => !seen.includes(w.id))
  return reactive({
    get currentWatch() {
      return remaining()[0] ?? null
    },
    get upcomingWatches() {
      return remaining().slice(1, 3)
    },
    seenInBudget: 0,
    totalInBudget: all.length,
    session: { liked: [] },
    like: (id) => seen.push(id),
    pass: (id) => seen.push(id),
    showShortlist: vi.fn(),
    editPreferences: vi.fn(),
  })
}

const cardStyles = (wrapper) =>
  wrapper.findAll('.matchmaking-stack > div').map((d) => d.attributes('style'))

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

    vi.advanceTimersByTime(500)
    expect(mm.like).toHaveBeenCalledWith('a')
    wrapper.unmount()
  })

  it('← passe, → aime, Entrée ouvre le détail', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    vi.advanceTimersByTime(500)
    expect(mm.pass).toHaveBeenCalledWith('a')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    vi.advanceTimersByTime(500)
    expect(mm.like).toHaveBeenCalledWith('a')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(wrapper.emitted('open-details')?.[0]?.[0]?.id).toBe('a')
    wrapper.unmount()
  })

  it('ignore le clavier quand une modale a la main', () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm, keyboardDisabled: true } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    vi.advanceTimersByTime(500)
    expect(mm.like).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('fait monter la carte suivante pendant la sortie, sans saut au relais', async () => {
    const wrapper = mount(MatchSwipeDeck, { props: { mm: makeConsumingMm() } })

    // Au repos : la deuxième carte est en retrait (plus petite et plus pâle).
    expect(cardStyles(wrapper)[1]).toContain('translateY(10px) scale(0.96)')

    await wrapper.find('button[aria-label="Coup de cœur"]').trigger('click')
    await nextTick()

    // Pendant la sortie, elle occupe déjà la place finale : c'est ce glissement,
    // interpolé sur 360 ms, qui remplace l'apparition sèche d'avant.
    const leaving = cardStyles(wrapper)
    expect(leaving[0]).toMatch(/translate3d\(-?\d/)
    expect(leaving[1]).toContain('translateY(0px) scale(1)')
    expect(leaving[1]).toContain('opacity: 1')
    expect(leaving[1]).toContain('360ms')

    vi.advanceTimersByTime(500)
    await nextTick()
    await nextTick()

    // Devenue carte du dessus, sa géométrie est inchangée : aucun soubresaut.
    const after = cardStyles(wrapper)
    expect(after[0]).toContain('translate3d(0px, 0px, 0) rotate(0.00deg)')
    expect(after[0]).toContain('opacity: 1')
    wrapper.unmount()
  })

  it('laisse à la carte le temps de sortir (420 ms, plus lent que le glissement)', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm } })

    await wrapper.find('button[aria-label="Coup de cœur"]').trigger('click')
    await nextTick()
    expect(cardStyles(wrapper)[0]).toContain('420ms')

    vi.advanceTimersByTime(419)
    expect(mm.like).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2)
    expect(mm.like).toHaveBeenCalledWith('a')
    wrapper.unmount()
  })

  it('annonce la décision pour les lecteurs d’écran', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchSwipeDeck, { props: { mm } })

    await wrapper.find('button[aria-label="Passer"]').trigger('click')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="status"]').text()).toContain('Explorer')
    wrapper.unmount()
  })
})
