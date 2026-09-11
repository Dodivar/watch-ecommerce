/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import WatchImageSwipeCarousel from './WatchImageSwipeCarousel.vue'

const IMAGES = ['/a.jpg', '/b.jpg', '/c.jpg']

function mountCarousel(props = {}) {
  return mount(WatchImageSwipeCarousel, {
    attachTo: document.body,
    props: { images: IMAGES, modelValue: 0, ...props },
  })
}

/** Rejoue un glissement horizontal complet à la souris. */
async function mouseDrag(wrapper, { from = 300, to = 120 } = {}) {
  await wrapper.trigger('mousedown', { button: 0, clientX: from, clientY: 200 })

  for (const x of [from, (from + to) / 2, to]) {
    window.dispatchEvent(
      new MouseEvent('mousemove', { clientX: x, clientY: 200, buttons: 1, bubbles: true }),
    )
  }

  window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  await wrapper.vm.$nextTick()
}

describe('WatchImageSwipeCarousel — glissement souris', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('change d’image quand le curseur glisse vers la gauche', async () => {
    const wrapper = mountCarousel({ mouseDrag: true })

    await mouseDrag(wrapper)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
  })

  it('revient à l’image précédente quand le curseur glisse vers la droite', async () => {
    const wrapper = mountCarousel({ mouseDrag: true, modelValue: 1 })

    await mouseDrag(wrapper, { from: 120, to: 300 })

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0])
  })

  it('ignore un simple clic, qui n’est pas un glissement', async () => {
    const wrapper = mountCarousel({ mouseDrag: true })

    await mouseDrag(wrapper, { from: 300, to: 298 })

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('reste inerte à la souris tant que `mouseDrag` n’est pas demandé', async () => {
    const wrapper = mountCarousel()

    await mouseDrag(wrapper)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('n’arme pas le geste quand le zoom a la main', async () => {
    const wrapper = mountCarousel({ mouseDrag: true, swipeDisabled: true })

    await mouseDrag(wrapper)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  /**
   * Le clic de fin de glissement vise l'ancêtre commun des deux boutons — le fond
   * de la visionneuse, qui la referme. Il ne doit jamais remonter.
   */
  it('avale le clic qui clôt un glissement', async () => {
    const wrapper = mountCarousel({ mouseDrag: true })
    const onClick = vi.fn()
    document.addEventListener('click', onClick)

    await mouseDrag(wrapper)
    wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).not.toHaveBeenCalled()
    document.removeEventListener('click', onClick)
  })

  it('laisse passer le clic qui suit un simple appui', async () => {
    const wrapper = mountCarousel({ mouseDrag: true })
    const onClick = vi.fn()
    document.addEventListener('click', onClick)

    await mouseDrag(wrapper, { from: 300, to: 299 })
    wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledTimes(1)
    document.removeEventListener('click', onClick)
  })
})
