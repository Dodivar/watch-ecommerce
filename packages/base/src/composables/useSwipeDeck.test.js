// @vitest-environment happy-dom

import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSwipeDeck } from './useSwipeDeck.js'

const CARD_WIDTH = 360

/**
 * Hôte minimal : une carte de 360 px branchée sur le geste, comme le deck.
 * `commits` collecte les décisions sorties du composable.
 */
function mountDeck() {
  const commits = []
  const taps = []
  const Host = defineComponent({
    setup(_props, { expose }) {
      const cardRef = ref(null)
      const deck = useSwipeDeck({
        cardRef,
        onCommit: (direction) => commits.push(direction),
        onTap: () => taps.push(true),
      })
      expose(deck)
      return () =>
        h('div', {
          ref: cardRef,
          style: deck.cardStyle.value,
          onPointerdown: deck.onPointerDown,
          onPointermove: deck.onPointerMove,
          onPointerup: deck.onPointerUp,
        })
    },
  })
  const wrapper = mount(Host)
  // happy-dom ne calcule pas de disposition : on impose la largeur lue par le composable.
  Object.defineProperty(wrapper.element, 'clientWidth', { value: CARD_WIDTH, configurable: true })
  return { wrapper, commits, taps }
}

function pointer(wrapper, type, { x = 0, y = 0, pointerType = 'touch' } = {}) {
  return wrapper.trigger(type, { pointerId: 1, clientX: x, clientY: y, pointerType, button: 0 })
}

/**
 * Rejoue un geste : `points` sont des décalages depuis l'origine, en pixels.
 * @returns {string} le `transform` de la carte à la fin des déplacements.
 */
async function drag(wrapper, points, { pointerType = 'touch', stepMs = 16 } = {}) {
  await pointer(wrapper, 'pointerdown', { x: 200, y: 300, pointerType })
  for (const [dx, dy] of points) {
    vi.advanceTimersByTime(stepMs)
    await pointer(wrapper, 'pointermove', { x: 200 + dx, y: 300 + dy, pointerType })
  }
  return wrapper.element.style.transform
}

describe('useSwipeDeck', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // `performance.now()` doit suivre les timers pour que la vitesse soit calculable.
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('suit la souris dès les premiers pixels', async () => {
    const { wrapper } = mountDeck()
    const transform = await drag(
      wrapper,
      [
        [2, 0],
        [10, 1],
        [60, 2],
      ],
      { pointerType: 'mouse' },
    )
    expect(transform).toContain('translate3d(60px')
    wrapper.unmount()
  })

  /**
   * Le doigt ne part pas droit. Ces amorces — arc du pouce, bruit vertical, premier
   * événement déjà loin — verrouillaient l'axe sur « vertical » et figeaient la carte
   * pour tout le geste : aucune animation sur téléphone, là où la souris passait.
   */
  it.each([
    [
      'arc du pouce',
      [
        [8, -12],
        [24, -18],
        [60, -20],
        [110, -16],
      ],
    ],
    [
      'amorce verticale',
      [
        [4, 10],
        [20, 12],
        [70, 12],
        [130, 12],
      ],
    ],
    [
      'premier point déjà loin',
      [
        [26, 14],
        [90, 18],
        [150, 20],
      ],
    ],
  ])('suit le doigt malgré une amorce %s', async (_name, points) => {
    const { wrapper } = mountDeck()
    const transform = await drag(wrapper, points)
    const [, moved] = /translate3d\((-?\d+(?:\.\d+)?)px/.exec(transform) || []
    expect(Number(moved)).toBeGreaterThan(50)
    expect(transform).toMatch(/rotate\(-?\d/)
    wrapper.unmount()
  })

  it('engage la décision quand le doigt a franchi le seuil', async () => {
    const { wrapper, commits } = mountDeck()
    await drag(wrapper, [
      [8, -12],
      [40, -14],
      [140, -10],
    ])
    await pointer(wrapper, 'pointerup', { x: 340, y: 290 })
    vi.advanceTimersByTime(500)
    expect(commits).toEqual([1])
    wrapper.unmount()
  })

  it('laisse le défilement vertical au navigateur', async () => {
    const { wrapper } = mountDeck()
    const transform = await drag(wrapper, [
      [2, 20],
      [4, 80],
      [30, 140],
    ])
    expect(transform).toContain('translate3d(0px, 0px, 0)')
    wrapper.unmount()
  })

  it('ouvre le détail malgré le tremblement d’un appui au doigt', async () => {
    const { wrapper, taps, commits } = mountDeck()
    await drag(wrapper, [[7, 7]])
    await pointer(wrapper, 'pointerup', { x: 207, y: 307 })
    expect(taps).toHaveLength(1)
    expect(commits).toHaveLength(0)
    wrapper.unmount()
  })

  it('à la souris, le même écart reste un glissement', async () => {
    const { wrapper, taps } = mountDeck()
    await drag(wrapper, [[7, 7]], { pointerType: 'mouse' })
    await pointer(wrapper, 'pointerup', { x: 207, y: 307, pointerType: 'mouse' })
    expect(taps).toHaveLength(0)
    wrapper.unmount()
  })
})
