/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent, h } from 'vue'

import WatchImageLightbox from './WatchImageLightbox.vue'

const Blank = defineComponent({ render: () => h('div') })

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Blank },
      { path: '/montre/:slug', component: Blank },
    ],
  })
}

async function mountLightbox(router) {
  const wrapper = mount(WatchImageLightbox, {
    props: { open: false, images: ['/a.jpg', '/b.jpg'], modelValue: 0, title: 'Explorer' },
    global: {
      plugins: [router],
      stubs: { WatchImageSwipeCarousel: true, WatchImageZoomable: true, Teleport: true },
    },
  })
  await flushPromises()
  return wrapper
}

/** Ouvre puis referme la visionneuse en laissant les navigations se résoudre. */
async function openThenClose(wrapper) {
  await wrapper.setProps({ open: true })
  await flushPromises()

  await wrapper.setProps({ open: false })
  await flushPromises()
}

describe('WatchImageLightbox — entrée d’historique', () => {
  let router

  beforeEach(async () => {
    router = createTestRouter()
    router.push('/')
    await router.isReady()
  })

  it('reste sur la fiche montre après ouverture puis fermeture (onglet avec historique)', async () => {
    await router.push('/montre/rolex-explorer')
    const wrapper = await mountLightbox(router)

    await openThenClose(wrapper)

    expect(router.currentRoute.value.path).toBe('/montre/rolex-explorer')
  })

  it('ne dépile rien si l’entrée a déjà été consommée (retour navigateur en vol)', async () => {
    await router.push('/montre/rolex-explorer')
    const wrapper = await mountLightbox(router)

    await wrapper.setProps({ open: true })
    await flushPromises()

    // Le retour navigateur consomme l'entrée avant que la fermeture ne s'exécute.
    router.back()
    await flushPromises()

    const back = vi.spyOn(router, 'back')
    await wrapper.setProps({ open: false })
    await flushPromises()

    expect(back).not.toHaveBeenCalled()
  })

  it('empile une entrée marquée à l’ouverture pour que le retour Android referme la visionneuse', async () => {
    await router.push('/montre/rolex-explorer')
    const wrapper = await mountLightbox(router)

    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(router.options.history.state.__watchLightbox).toBe(true)
    expect(router.currentRoute.value.path).toBe('/montre/rolex-explorer')
  })

  it('retire l’entrée empilée à la fermeture', async () => {
    await router.push('/montre/rolex-explorer')
    const wrapper = await mountLightbox(router)

    await openThenClose(wrapper)

    expect(router.options.history.state.__watchLightbox).toBeUndefined()
  })
})
