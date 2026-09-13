/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AdminPromotedWatchesList from './AdminPromotedWatchesList.vue'

const getPromotedWatchesForAdminMock = vi.hoisted(() => vi.fn())

vi.mock('./AdminShell.vue', () => ({
  default: {
    name: 'AdminShell',
    template: '<div><slot name="actions" /><slot /></div>',
  },
}))

vi.mock('@/services/admin/adminWatchPromotionService', () => ({
  getPromotedWatchesForAdmin: getPromotedWatchesForAdminMock,
}))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => ({ watchCatalog: { mode: 'resale' } }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const NOW_ISO = '2026-06-14T00:00:00.000Z'
const FUTURE_ISO = '2099-01-01T00:00:00.000Z'

const activeCampaign = {
  id: 'camp-active',
  name: 'Soldes été',
  status: 'active',
  startsAt: NOW_ISO,
  endsAt: null,
}

const scheduledCampaign = {
  id: 'camp-scheduled',
  name: 'Black Friday',
  status: 'scheduled',
  startsAt: FUTURE_ISO,
  endsAt: null,
}

function rows() {
  return [
    {
      watch: {
        id: 'w-campaign',
        name: 'Submariner',
        brand: 'ROLEX',
        reference: '116610',
        price: 10000,
        promotion_price: 8000,
        discount_percent: 20,
        is_sold: false,
        is_available: true,
        stock_quantity: 1,
      },
      campaign: activeCampaign,
    },
    {
      watch: {
        id: 'w-direct',
        name: 'Speedmaster',
        brand: 'OMEGA',
        reference: '310.30',
        price: 5000,
        promotion_price: 4500,
        discount_percent: 10,
        is_sold: false,
        is_available: true,
        stock_quantity: 1,
      },
      campaign: null,
    },
    {
      watch: {
        id: 'w-scheduled',
        name: 'Black Bay',
        brand: 'TUDOR',
        reference: '79230',
        price: 3000,
        promotion_price: null,
        discount_percent: null,
        is_sold: false,
        is_available: true,
        stock_quantity: 1,
      },
      campaign: scheduledCampaign,
    },
    {
      // Prix promo incohérent (supérieur au prix catalogue) : pas une remise.
      watch: {
        id: 'w-invalid',
        name: 'Navitimer',
        brand: 'BREITLING',
        reference: 'AB0121',
        price: 4000,
        promotion_price: 4200,
        discount_percent: null,
        is_sold: false,
        is_available: true,
        stock_quantity: 1,
      },
      campaign: null,
    },
  ]
}

async function mountScreen() {
  const wrapper = mount(AdminPromotedWatchesList)
  await flushPromises()
  return wrapper
}

describe('AdminPromotedWatchesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPromotedWatchesForAdminMock.mockResolvedValue(rows())
  })

  it('liste les montres remisées, campagne comme promo directe', async () => {
    const wrapper = await mountScreen()
    const table = wrapper.find('table').text()

    expect(table).toContain('Submariner')
    expect(table).toContain('Speedmaster')
    expect(table).toContain('Black Bay')
    expect(table).toContain('Campagne')
    expect(table).toContain('Promo directe')
    expect(table).toContain('Soldes été')
  })

  it('écarte un prix promo incohérent', async () => {
    const wrapper = await mountScreen()
    expect(wrapper.find('table').text()).not.toContain('Navitimer')
  })

  it('chiffre la synthèse sur les seules remises appliquées', async () => {
    const wrapper = await mountScreen()
    const text = wrapper.text()

    // 3 montres promues (dont 1 programmée), 2 500 € d'écart de prix, −15 % de moyenne.
    expect(text).toContain('dont 1 programmée')
    expect(text).toContain('−15 %')
    expect(text.replace(/\u202f|\u00a0/g, ' ')).toContain('2 500 €')
  })

  it('filtre par origine de la remise', async () => {
    const wrapper = await mountScreen()
    const directFilter = wrapper
      .findAll('button')
      .find((button) => button.text().startsWith('Promos directes'))

    await directFilter.trigger('click')

    const table = wrapper.find('table').text()
    expect(table).toContain('Speedmaster')
    expect(table).not.toContain('Submariner')
    expect(table).not.toContain('Black Bay')
  })

  it('cherche par montre ou par campagne', async () => {
    const wrapper = await mountScreen()
    await wrapper.find('input[type="text"]').setValue('black friday')
    await flushPromises()

    const table = wrapper.find('table').text()
    expect(table).toContain('Black Bay')
    expect(table).not.toContain('Submariner')
  })

  it('écarte du chiffrage les remises portées par une montre vendue', async () => {
    getPromotedWatchesForAdminMock.mockResolvedValue([
      ...rows(),
      {
        watch: {
          id: 'w-sold',
          name: 'Daytona',
          brand: 'ROLEX',
          reference: '116500',
          price: 20000,
          promotion_price: 10000,
          discount_percent: 50,
          is_sold: true,
          is_available: true,
          stock_quantity: 0,
        },
        campaign: null,
      },
    ])

    const wrapper = await mountScreen()

    expect(wrapper.find('table').text()).not.toContain('Daytona')
    // La remise de 50 % de la montre vendue ne doit pas tirer la moyenne.
    expect(wrapper.text()).toContain('−15 %')

    const includeOffline = wrapper.find('input[type="checkbox"]')
    await includeOffline.setValue(true)

    expect(wrapper.find('table').text()).toContain('Daytona')
    expect(wrapper.find('table').text()).toContain('Vendue')
  })

  it('affiche un état vide explicite sans promotion', async () => {
    getPromotedWatchesForAdminMock.mockResolvedValue([])
    const wrapper = await mountScreen()

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).toContain('Aucune montre en promotion')
  })

  it('remonte une erreur de chargement', async () => {
    getPromotedWatchesForAdminMock.mockRejectedValue(new Error('Supabase indisponible'))
    const wrapper = await mountScreen()

    expect(wrapper.text()).toContain('Supabase indisponible')
  })
})
