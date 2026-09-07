// @vitest-environment happy-dom

import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { useViewportFill } from './useViewportFill.js'

/**
 * Monte un élément mesuré dans un conteneur à marge basse, à la position voulue dans la page.
 * `getBoundingClientRect` est simulé : happy-dom ne fait pas de mise en page.
 */
function mountFill({ top = 100, paddingBottom = '40px', variable } = {}) {
  const Host = defineComponent({
    setup() {
      const el = ref(null)
      useViewportFill(el, variable ? { variable } : undefined)
      return () =>
        h('div', { style: `padding-bottom: ${paddingBottom}` }, [h('section', { ref: el })])
    },
  })

  const wrapper = mount(Host, { attachTo: document.body })

  const el = wrapper.get('section').element
  el.getBoundingClientRect = () => ({ top })
  return { wrapper, el }
}

describe('useViewportFill', () => {
  afterEach(() => {
    window.scrollY = 0
  })

  it('retranche la position de l’élément et la marge basse du conteneur', async () => {
    window.innerHeight = 800
    const { wrapper, el } = mountFill({ top: 100, paddingBottom: '40px' })

    // La mesure du montage a eu lieu sans géométrie : on la rejoue avec.
    window.dispatchEvent(new Event('resize'))

    expect(el.style.getPropertyValue('--mm-fill')).toBe('660px')

    wrapper.unmount()
  })

  it('ne mesure plus une fois l’élément démonté', () => {
    window.innerHeight = 800
    const { wrapper, el } = mountFill({ top: 100, paddingBottom: '0px' })
    window.dispatchEvent(new Event('resize'))
    expect(el.style.getPropertyValue('--mm-fill')).toBe('700px')

    wrapper.unmount()
    window.innerHeight = 400
    window.dispatchEvent(new Event('resize'))

    expect(el.style.getPropertyValue('--mm-fill')).toBe('700px')
  })
})
