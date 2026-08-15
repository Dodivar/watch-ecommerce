// @vitest-environment happy-dom

import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useTiltMotion } from './useTiltMotion.js'

const RECT = { left: 0, top: 0, width: 200, height: 100 }

let frames = []
let originalMatchMedia

/** Vide la file `requestAnimationFrame` jusqu'à ce que l'inclinaison se pose. */
function settle(maxFrames = 200) {
  for (let i = 0; i < maxFrames && frames.length > 0; i += 1) {
    const pending = frames
    frames = []
    pending.forEach((callback) => callback())
  }
}

function reducedMotion(reduce) {
  window.matchMedia = (query) => ({
    matches: reduce && query.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  })
}

function dispatch(target, type, payload) {
  const event = new Event(type)
  Object.assign(event, payload)
  target.dispatchEvent(event)
}

const Host = defineComponent({
  setup(_props, { expose }) {
    const tilt = useTiltMotion()
    expose(tilt)
    return () => h('div', { ref: tilt.tiltRef, style: tilt.tiltStyle.value })
  },
})

/** Les écouteurs sont posés par un `watch` sur la ref : d'où le `nextTick`. */
async function mountHost() {
  const wrapper = mount(Host, { attachTo: document.body })
  const element = wrapper.element
  element.getBoundingClientRect = () => RECT
  await nextTick()
  return { wrapper, element }
}

beforeEach(() => {
  frames = []
  originalMatchMedia = window.matchMedia
  reducedMotion(false)
  window.requestAnimationFrame = (callback) => frames.push(callback)
  window.cancelAnimationFrame = () => {}
  globalThis.requestAnimationFrame = window.requestAnimationFrame
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('useTiltMotion', () => {
  it('oriente la carte vers le pointeur puis la remet à plat en sortant', async () => {
    const { wrapper, element } = await mountHost()

    // Coin bas-droite : le bord survolé doit avancer vers le lecteur.
    dispatch(element, 'pointermove', { pointerType: 'mouse', clientX: 200, clientY: 100 })
    settle()

    expect(wrapper.vm.tiltX).toBeCloseTo(1, 3)
    expect(wrapper.vm.tiltY).toBeCloseTo(1, 3)

    await nextTick()
    expect(element.getAttribute('style')).toContain('rotateX(7.00deg) rotateY(-7.00deg)')
    expect(element.getAttribute('style')).toContain('--tilt-x: 1.000')

    dispatch(element, 'pointerleave', {})
    settle()

    expect(wrapper.vm.tiltX).toBeCloseTo(0, 3)
    expect(wrapper.vm.tiltY).toBeCloseTo(0, 3)
  })

  it('ignore le doigt, qui ne survole pas', async () => {
    const { wrapper, element } = await mountHost()

    dispatch(element, 'pointermove', { pointerType: 'touch', clientX: 200, clientY: 100 })
    settle()

    expect(wrapper.vm.tiltX).toBe(0)
  })

  it('prend la première mesure du gyroscope comme position de repos', async () => {
    const { wrapper } = await mountHost()

    // Téléphone tenu penché : la carte doit rester à plat.
    dispatch(window, 'deviceorientation', { beta: 50, gamma: -12 })
    settle()
    expect(wrapper.vm.tiltX).toBe(0)
    expect(wrapper.vm.tiltY).toBe(0)

    // Puis on l'incline de 18° à droite : amplitude maximale.
    dispatch(window, 'deviceorientation', { beta: 50, gamma: 6 })
    settle()
    expect(wrapper.vm.tiltX).toBeCloseTo(1, 3)
    expect(wrapper.vm.tiltY).toBeCloseTo(0, 3)
  })

  it('laisse la main au pointeur tant que la souris survole', async () => {
    const { wrapper, element } = await mountHost()

    dispatch(element, 'pointermove', { pointerType: 'mouse', clientX: 0, clientY: 50 })
    settle()
    expect(wrapper.vm.tiltX).toBeCloseTo(-1, 3)

    dispatch(window, 'deviceorientation', { beta: 0, gamma: 0 })
    dispatch(window, 'deviceorientation', { beta: 18, gamma: 18 })
    settle()
    expect(wrapper.vm.tiltX).toBeCloseTo(-1, 3)
  })

  it('ne pose aucune écoute quand le mouvement réduit est demandé', async () => {
    reducedMotion(true)
    const { wrapper, element } = await mountHost()

    dispatch(element, 'pointermove', { pointerType: 'mouse', clientX: 200, clientY: 100 })
    dispatch(window, 'deviceorientation', { beta: 0, gamma: 0 })
    dispatch(window, 'deviceorientation', { beta: 18, gamma: 18 })
    settle()

    expect(wrapper.vm.tiltX).toBe(0)
    expect(wrapper.vm.tiltY).toBe(0)
  })

  it('coupe le gyroscope au démontage', async () => {
    const { wrapper } = await mountHost()
    const { tiltX } = wrapper.vm

    expect(tiltX).toBe(0)
    wrapper.unmount()

    dispatch(window, 'deviceorientation', { beta: 0, gamma: 0 })
    dispatch(window, 'deviceorientation', { beta: 18, gamma: 18 })
    settle()

    expect(frames).toHaveLength(0)
  })
})
