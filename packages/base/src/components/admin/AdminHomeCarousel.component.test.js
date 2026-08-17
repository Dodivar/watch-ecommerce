/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AdminHomeCarousel from './AdminHomeCarousel.vue'

const getHomeCarouselSlidesForAdminMock = vi.hoisted(() => vi.fn())
const getAllWatchesForAdminMock = vi.hoisted(() => vi.fn())
const getAvailableCatalogBrandsMock = vi.hoisted(() => vi.fn())
const getActiveCampaignsMock = vi.hoisted(() => vi.fn())

vi.mock('./AdminShell.vue', () => ({
  default: { name: 'AdminShell', template: '<div><slot /></div>' },
}))

vi.mock('@/services/admin/adminHomeCarouselService.js', () => ({
  getHomeCarouselSlidesForAdmin: getHomeCarouselSlidesForAdminMock,
  saveHomeCarouselChanges: vi.fn(),
}))

vi.mock('@/services/admin/adminWatchService.js', () => ({
  getAllWatchesForAdmin: getAllWatchesForAdminMock,
}))

vi.mock('@/services/watchService.js', () => ({
  getAvailableCatalogBrands: getAvailableCatalogBrandsMock,
}))

vi.mock('@/services/admin/adminWatchPromotionService.js', () => ({
  getActiveWatchPromotionCampaignsForCarousel: getActiveCampaignsMock,
}))

const savedSlide = {
  id: 'slide-1',
  image_url: 'https://cdn.test/slide-1.webp',
  image_path: 'place-des-montres/slide-1.webp',
  alt_text: 'Montres sport, bracelets acier',
  brand_name: null,
  watch_id: null,
  promotion_campaign_id: null,
  display_order: 0,
}

const watch = { id: 'watch-1', brand: 'ROLEX', name: 'DATEJUST 16014', is_available: true }
const campaign = { id: 'campaign-1', name: 'Soldes été', slug: 'soldes-ete' }

async function mountAdminCarousel() {
  getHomeCarouselSlidesForAdminMock.mockResolvedValue([savedSlide])
  getAllWatchesForAdminMock.mockResolvedValue([watch])
  getAvailableCatalogBrandsMock.mockResolvedValue(['ROLEX', 'OMEGA'])
  getActiveCampaignsMock.mockResolvedValue([campaign])

  const wrapper = mount(AdminHomeCarousel)
  await flushPromises()
  return wrapper
}

/** Le premier select d'une slide est le mode de redirection. */
function slideSelects(wrapper) {
  return wrapper.find('ul.space-y-4 > li').findAll('select')
}

describe('AdminHomeCarousel — redirection au clic', () => {
  it('affiche le sélecteur de montre après avoir choisi « Fiche montre »', async () => {
    const wrapper = await mountAdminCarousel()

    expect(slideSelects(wrapper)).toHaveLength(1)

    await slideSelects(wrapper)[0].setValue('watch')

    const selects = slideSelects(wrapper)
    expect(selects).toHaveLength(2)
    expect(selects[0].element.value).toBe('watch')
    expect(selects[1].text()).toContain('ROLEX — DATEJUST 16014')
  })

  it('affiche le sélecteur d\'événement après avoir choisi « Événement promotionnel »', async () => {
    const wrapper = await mountAdminCarousel()

    await slideSelects(wrapper)[0].setValue('campaign')

    const selects = slideSelects(wrapper)
    expect(selects).toHaveLength(2)
    expect(selects[0].element.value).toBe('campaign')
    expect(selects[1].text()).toContain('Soldes été')
  })

  it('affiche le sélecteur de marque après avoir choisi « Collection marque »', async () => {
    const wrapper = await mountAdminCarousel()

    await slideSelects(wrapper)[0].setValue('brand')

    const selects = slideSelects(wrapper)
    expect(selects).toHaveLength(2)
    expect(selects[1].text()).toContain('OMEGA')
  })

  it('conserve la redirection choisie et bloque la publication tant que la destination est vide', async () => {
    const wrapper = await mountAdminCarousel()

    // Une modification réelle (texte alternatif) pour activer le bouton de publication.
    await wrapper.find('ul li input[type="text"]').setValue('Nouvelle sélection ROLEX')
    await slideSelects(wrapper)[0].setValue('watch')

    const publishButton = wrapper.findAll('button').find((b) => b.text() === 'Sauvegarder')
    expect(publishButton.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Redirection sans destination')

    await slideSelects(wrapper)[1].setValue('watch-1')

    expect(wrapper.text()).not.toContain('Redirection sans destination')
    expect(publishButton.attributes('disabled')).toBeUndefined()
  })
})
