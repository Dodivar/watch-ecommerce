/**
 * @vitest-environment happy-dom
 *
 * Zone d'intervention : texte de référencement local lu dans `site.serviceArea`. Une vitrine
 * qui ne déclare pas le bloc ne doit rien afficher.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const siteConfig = vi.hoisted(() => ({ current: {} }))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => siteConfig.current,
}))

const loadComponent = async () => (await import('./ServiceAreaNote.vue')).default

describe('ServiceAreaNote', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('affiche le titre et le texte de la zone', async () => {
    siteConfig.current = {
      serviceArea: {
        title: 'Zone d’intervention — Alsace & Grand Est',
        text: 'Nous intervenons à Strasbourg, Colmar et Metz.',
      },
    }
    const wrapper = mount(await loadComponent())

    expect(wrapper.find('h2').text()).toBe('Zone d’intervention — Alsace & Grand Est')
    expect(wrapper.text()).toContain('Nous intervenons à Strasbourg, Colmar et Metz.')
  })

  it('ne rend rien sans bloc serviceArea', async () => {
    siteConfig.current = {}
    const wrapper = mount(await loadComponent())

    expect(wrapper.text()).toBe('')
    expect(wrapper.find('h2').exists()).toBe(false)
  })
})
