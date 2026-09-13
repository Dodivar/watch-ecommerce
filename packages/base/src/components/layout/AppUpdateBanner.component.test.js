/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const fetchDeployedVersionMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/appVersion.js', () => ({
  APP_VERSION: 'abc123456789',
  fetchDeployedVersion: fetchDeployedVersionMock,
}))

vi.mock('@/i18n', () => ({
  t: (key) =>
    ({
      'update.available': 'Une nouvelle version du site est disponible.',
      'update.reload': 'Recharger',
      'update.dismiss': 'Fermer',
    })[key] ?? key,
}))

const AppUpdateBanner = (await import('./AppUpdateBanner.vue')).default
const { resetAppUpdateState } = await import('@/composables/useAppUpdate.js')

beforeEach(() => {
  vi.clearAllMocks()
  resetAppUpdateState()
})

describe('AppUpdateBanner', () => {
  it('reste invisible tant que la version déployée est celle du bundle', async () => {
    fetchDeployedVersionMock.mockResolvedValue('abc123456789')

    const wrapper = mount(AppUpdateBanner)
    await flushPromises()

    expect(wrapper.text()).toBe('')
  })

  it('propose de recharger dès qu’un déploiement plus récent est détecté', async () => {
    fetchDeployedVersionMock.mockResolvedValue('def987654321')

    const wrapper = mount(AppUpdateBanner)
    await flushPromises()

    expect(wrapper.text()).toContain('Une nouvelle version du site est disponible.')
    expect(wrapper.text()).toContain('Recharger')
  })

  it('se referme sans recharger quand on le rejette', async () => {
    fetchDeployedVersionMock.mockResolvedValue('def987654321')

    const wrapper = mount(AppUpdateBanner)
    await flushPromises()

    await wrapper.get('button[aria-label="Fermer"]').trigger('click')

    expect(wrapper.text()).toBe('')
  })

  it('ne s’affiche pas quand le manifeste est injoignable', async () => {
    fetchDeployedVersionMock.mockResolvedValue(null)

    const wrapper = mount(AppUpdateBanner)
    await flushPromises()

    expect(wrapper.text()).toBe('')
  })
})
