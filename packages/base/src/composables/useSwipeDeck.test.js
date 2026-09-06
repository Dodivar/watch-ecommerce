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
          onTouchstart: deck.onTouchStart,
          onTouchmove: deck.onTouchMove,
          onTouchend: deck.onTouchEnd,
          onTouchcancel: deck.onTouchCancel,
          onPointerdown: deck.onPointerDown,
          onPointermove: deck.onPointerMove,
          onPointerup: deck.onPointerUp,
          onPointercancel: deck.onPointerCancel,
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

/** Un Touch Event à un doigt, tel que Safari iOS le livre. */
function touch(wrapper, type, { x = 0, y = 0 } = {}) {
  const point = { identifier: 1, clientX: x, clientY: y }
  return wrapper.trigger(type, { changedTouches: [point], touches: [point] })
}

/** Rejoue un geste au doigt, en Touch Events. `points` sont des décalages en pixels. */
async function touchDrag(wrapper, points, { stepMs = 16 } = {}) {
  await touch(wrapper, 'touchstart', { x: 200, y: 300 })
  for (const [dx, dy] of points) {
    vi.advanceTimersByTime(stepMs)
    await touch(wrapper, 'touchmove', { x: 200 + dx, y: 300 + dy })
  }
  return wrapper.element.style.transform
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

/** Réponse de `prefers-reduced-motion: reduce`, réglable par test. */
let matchMediaMatches = false

describe('useSwipeDeck', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // `performance.now()` doit suivre les timers pour que la vitesse soit calculable.
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
    matchMediaMatches = false
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      media: query,
      get matches() {
        return matchMediaMatches
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
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
   * événement déjà loin, montée franche avant de filer sur le côté — verrouillaient l'axe
   * sur « vertical » et figeaient la carte pour tout le geste : aucune animation sur
   * téléphone, là où la souris passait.
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
    [
      'montée franche',
      [
        [0, -60],
        [2, -120],
        [40, -130],
        [140, -125],
      ],
    ],
  ])('suit le pointeur malgré une amorce %s', async (_name, points) => {
    const { wrapper } = mountDeck()
    const transform = await drag(wrapper, points)
    const [, moved] = /translate3d\((-?\d+(?:\.\d+)?)px/.exec(transform) || []
    expect(Number(moved)).toBeGreaterThan(50)
    expect(transform).toMatch(/rotate\(-?\d/)
    wrapper.unmount()
  })

  /**
   * La carte ne glisse pas à plat : elle bascule aussi en profondeur, du côté où elle part.
   * `rotateY` positif éloigne le bord droit et amène le gauche vers l'utilisateur.
   */
  it('penche du côté où part la carte', async () => {
    const { wrapper } = mountDeck()
    const right = await drag(wrapper, [[60, 0]], { pointerType: 'mouse' })
    expect(right).toContain('perspective(1100px)')
    const [, rightTilt] = /rotateY\((-?\d+(?:\.\d+)?)deg\)/.exec(right) || []
    expect(Number(rightTilt)).toBeGreaterThan(0)
    await pointer(wrapper, 'pointerup', { x: 260, y: 300, pointerType: 'mouse' })
    vi.advanceTimersByTime(500)

    const left = await drag(wrapper, [[-60, 0]], { pointerType: 'mouse' })
    const [, leftTilt] = /rotateY\((-?\d+(?:\.\d+)?)deg\)/.exec(left) || []
    expect(Number(leftTilt)).toBeLessThan(0)
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

  it('suit le pointeur en hauteur aussi, sans le brider', async () => {
    const { wrapper } = mountDeck()
    const transform = await drag(wrapper, [
      [10, -40],
      [30, -90],
    ])
    expect(transform).toContain('translate3d(30px, -90px, 0)')
    wrapper.unmount()
  })

  it('monter puis filer sur le côté engage la décision', async () => {
    const { wrapper, commits } = mountDeck()
    await drag(wrapper, [
      [0, -60],
      [4, -140],
      [50, -150],
      [150, -140],
    ])
    await pointer(wrapper, 'pointerup', { x: 350, y: 160 })
    vi.advanceTimersByTime(500)
    expect(commits).toEqual([1])
    wrapper.unmount()
  })

  it('ne décide rien sur un geste purement vertical', async () => {
    const { wrapper, commits } = mountDeck()
    await drag(wrapper, [
      [2, 40],
      [4, 120],
      [6, 200],
    ])
    await pointer(wrapper, 'pointerup', { x: 206, y: 500 })
    vi.advanceTimersByTime(500)
    expect(commits).toHaveLength(0)
    // La carte revient à sa place au lieu de sortir.
    expect(wrapper.element.style.transform).toContain('translate3d(0px, 0px, 0)')
    wrapper.unmount()
  })

  /**
   * Un glissement mou ne classe pas la montre. Sur une carte de 360 px il faut dépasser
   * 122 px (un tiers de la largeur) ; en deçà, la carte revient à sa place.
   */
  it('rend la montre quand le glissement n’est pas franc', async () => {
    const { wrapper, commits } = mountDeck()
    // 90 px parcourus, mais lentement : ni la distance ni la vitesse ne décident.
    await drag(
      wrapper,
      [
        [20, 4],
        [55, 6],
        [90, 8],
      ],
      { pointerType: 'mouse', stepMs: 200 },
    )
    await pointer(wrapper, 'pointerup', { x: 290, y: 308, pointerType: 'mouse' })
    vi.advanceTimersByTime(500)
    expect(commits).toHaveLength(0)
    expect(wrapper.element.style.transform).toContain('translate3d(0px, 0px, 0)')
    wrapper.unmount()
  })

  it('ne prend pas un frémissement rapide pour une décision', async () => {
    const { wrapper, commits } = mountDeck()
    // Vif, mais sur 30 px seulement : sous la distance minimale d'un geste vif.
    await drag(
      wrapper,
      [
        [12, 2],
        [30, 3],
      ],
      { pointerType: 'mouse', stepMs: 8 },
    )
    await pointer(wrapper, 'pointerup', { x: 230, y: 303, pointerType: 'mouse' })
    vi.advanceTimersByTime(500)
    expect(commits).toHaveLength(0)
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

  /**
   * Le doigt sur iPhone. Safari ouvre un `pointerdown` puis coupe le flux Pointer par un
   * `pointercancel` dès qu'il soupçonne un défilement — souvent avant le premier
   * `pointermove`. La carte restait donc figée sur iOS, là où la souris la faisait voler.
   * Les `touchmove`, eux, continuent d'arriver : c'est eux qui portent le geste.
   */
  describe('au doigt (Touch Events)', () => {
    it('suit le doigt sans le moindre Pointer Event', async () => {
      const { wrapper } = mountDeck()
      const transform = await touchDrag(wrapper, [
        [10, -14],
        [48, -20],
        [120, -18],
      ])
      expect(transform).toContain('translate3d(120px, -18px, 0)')
      wrapper.unmount()
    })

    it('poursuit le geste malgré le pointercancel de Safari iOS', async () => {
      const { wrapper, commits } = mountDeck()
      await pointer(wrapper, 'pointerdown', { x: 200, y: 300 })
      await touch(wrapper, 'touchstart', { x: 200, y: 300 })
      // Safari renonce au pointeur : la carte ne doit pas retomber à sa place pour autant.
      await pointer(wrapper, 'pointercancel', { x: 200, y: 300 })
      vi.advanceTimersByTime(16)
      await touch(wrapper, 'touchmove', { x: 260, y: 292 })
      expect(wrapper.element.style.transform).toContain('translate3d(60px')
      vi.advanceTimersByTime(16)
      await touch(wrapper, 'touchmove', { x: 350, y: 290 })
      await touch(wrapper, 'touchend', { x: 350, y: 290 })
      vi.advanceTimersByTime(500)
      expect(commits).toEqual([1])
      wrapper.unmount()
    })

    it('réclame le geste au navigateur une fois la carte engagée', async () => {
      const { wrapper } = mountDeck()
      await touch(wrapper, 'touchstart', { x: 200, y: 300 })
      const held = []
      for (const [dx, dy] of [
        [3, 2],
        [40, -6],
      ]) {
        vi.advanceTimersByTime(16)
        const event = new Event('touchmove', { bubbles: true, cancelable: true })
        const point = { identifier: 1, clientX: 200 + dx, clientY: 300 + dy }
        Object.assign(event, { changedTouches: [point], touches: [point] })
        wrapper.element.dispatchEvent(event)
        held.push(event.defaultPrevented)
      }
      // Sous le seuil, la page garde la main ; au-delà, la carte la prend.
      expect(held).toEqual([false, true])
      wrapper.unmount()
    })

    it("n'ouvre pas le détail quand le doigt a glissé", async () => {
      const { wrapper, taps } = mountDeck()
      await touchDrag(wrapper, [
        [20, 4],
        [90, 6],
      ])
      await touch(wrapper, 'touchend', { x: 290, y: 306 })
      vi.advanceTimersByTime(500)
      expect(taps).toHaveLength(0)
      wrapper.unmount()
    })

    it('ouvre le détail sur un appui posé', async () => {
      const { wrapper, taps, commits } = mountDeck()
      await touchDrag(wrapper, [[5, 5]])
      await touch(wrapper, 'touchend', { x: 205, y: 305 })
      expect(taps).toHaveLength(1)
      expect(commits).toHaveLength(0)
      wrapper.unmount()
    })

    it('suit encore le doigt quand le système réclame moins de mouvement', async () => {
      matchMediaMatches = true
      const { wrapper } = mountDeck()
      const transform = await touchDrag(wrapper, [
        [12, -8],
        [110, -10],
      ])
      // Le suivi du doigt n'est pas une animation : c'est l'objet touché qui se déplace.
      expect(transform).toContain('translate3d(110px, -10px, 0)')
      // La rotation et la bascule en profondeur, elles, disparaissent.
      expect(transform).toContain('rotate(0.00deg) rotateY(0.00deg)')
      wrapper.unmount()
    })
  })
})
