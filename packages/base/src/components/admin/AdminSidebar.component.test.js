/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

import AdminSidebar from './AdminSidebar.vue'

const siteConfigMock = vi.hoisted(() => ({ value: null }))
const canAccessPathMock = vi.hoisted(() => vi.fn(() => true))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => siteConfigMock.value,
}))

vi.mock('@/services/admin/adminAuthService', () => ({
  logoutAdmin: vi.fn(),
  getCurrentAdmin: vi.fn(() => Promise.resolve({ email: 'admin@test.fr' })),
}))

vi.mock('@/services/admin/useAdminPermissions', () => ({
  useAdminPermissions: () => ({
    role: ref('admin'),
    ready: ref(true),
    canWrite: computed(() => true),
    canManageUsers: computed(() => true),
    canAccessPath: canAccessPathMock,
    deniedTooltip: () => 'Accès réservé à l’administrateur',
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/admin' }),
  useRouter: () => ({ push: vi.fn() }),
}))

// `RouterLink` est résolu globalement par le plugin vue-router, absent des tests : on le
// remplace par une ancre, ce qui suffit à lire la structure du menu.
const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

function siteConfig(features = {}) {
  return {
    brand: { logoAlt: 'Logo' },
    theme: { colorScheme: 'light' },
    features: { adminWatchPromotions: true, ...features },
  }
}

async function mountSidebar() {
  const wrapper = mount(AdminSidebar, {
    props: { open: true },
    global: { components: { RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

/** Intitulés des sections groupées du menu. */
function groupLabels(wrapper) {
  return wrapper.findAll('nav p').map((node) => node.text())
}

/** Entrées (liens ou entrées grisées) d'une section, dans l'ordre. */
function groupItems(wrapper, label) {
  const group = wrapper
    .findAll('nav > div')
    .find((node) => node.find('p').exists() && node.find('p').text() === label)
  if (!group) return []
  return group.findAll('a, span[aria-disabled]').map((node) => node.text())
}

beforeEach(() => {
  vi.clearAllMocks()
  canAccessPathMock.mockReturnValue(true)
  siteConfigMock.value = siteConfig()
})

describe('AdminSidebar — sous-catégorie Promotions', () => {
  it('regroupe les trois écrans de remises sous un même intitulé', async () => {
    const wrapper = await mountSidebar()

    expect(groupLabels(wrapper)).toContain('Promotions')
    expect(groupItems(wrapper, 'Promotions')).toEqual([
      'Codes promo checkout',
      'Campagnes de promotion',
      'Montres en promo',
    ])
  })

  it('ne sort pas ces écrans au premier niveau du menu', async () => {
    const wrapper = await mountSidebar()

    const topLevel = wrapper.findAll('nav > a').map((node) => node.text())
    expect(topLevel).toContain('Montres')
    expect(topLevel).not.toContain('Codes promo checkout')
    expect(topLevel).not.toContain('Campagnes de promotion')
    expect(topLevel).not.toContain('Montres en promo')
  })

  it('garde les seuls codes promo quand le site n’a pas les campagnes montres', async () => {
    siteConfigMock.value = siteConfig({ adminWatchPromotions: false })
    const wrapper = await mountSidebar()

    expect(groupItems(wrapper, 'Promotions')).toEqual(['Codes promo checkout'])
  })

  it('grise la section pour un rôle sans accès plutôt que de la masquer', async () => {
    canAccessPathMock.mockImplementation((path) => !path.includes('promo'))
    const wrapper = await mountSidebar()

    const group = wrapper
      .findAll('nav > div')
      .find((node) => node.find('p').exists() && node.find('p').text() === 'Promotions')

    expect(group.findAll('a')).toHaveLength(0)
    expect(group.findAll('span[aria-disabled]')).toHaveLength(3)
    expect(group.find('span[aria-disabled]').attributes('title')).toBe(
      'Accès réservé à l’administrateur',
    )
  })

  it('laisse la section Carrousels intacte', async () => {
    siteConfigMock.value = siteConfig({ homeCarousel: true, collection: true })
    const wrapper = await mountSidebar()

    expect(groupLabels(wrapper)).toEqual(['Promotions', 'Carrousels'])
    expect(groupItems(wrapper, 'Carrousels')).toEqual(['Carrousel accueil', 'Aperçu collection'])
  })
})
