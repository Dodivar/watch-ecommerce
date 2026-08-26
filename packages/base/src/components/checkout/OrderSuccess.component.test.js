/**
 * @vitest-environment happy-dom
 *
 * `/commande/suivi` — lien durable envoyé dans l'email de confirmation. La même vue sert la
 * fin de tunnel et la consultation ultérieure : ce test verrouille la différence entre les
 * deux, notamment le fait qu'une commande rouverte des mois plus tard ne vide pas le panier
 * en cours et ne rejoue pas l'achat côté analytics.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import OrderSuccess from './OrderSuccess.vue'

const verifyOrderMock = vi.hoisted(() => vi.fn())
const trackPurchaseMock = vi.hoisted(() => vi.fn())
const clearCartMock = vi.hoisted(() => vi.fn())
const routeMock = vi.hoisted(() => ({ path: '/commande/succes', query: {} }))

vi.mock('@/config', () => ({ STRIPE_PUBLISHABLE_KEY: 'pk_live_test' }))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  RouterLink: { name: 'RouterLink', props: ['to'], template: '<a><slot /></a>' },
}))

vi.mock('@/services/orderService.js', () => ({
  verifyOrder: verifyOrderMock,
  downloadOrderReceipt: vi.fn(),
}))

vi.mock('@/services/watchService', () => ({
  getWatchById: vi.fn(async () => null),
  getLatestAvailableWatches: vi.fn(async () => []),
}))

vi.mock('@/services/analytics', () => ({ trackPurchase: trackPurchaseMock }))
vi.mock('@/composables/useCart.js', () => ({ useCart: () => ({ clear: clearCartMock }) }))
vi.mock('@/services/admin/adminAuthService.js', () => ({
  isAdminAuthenticated: vi.fn(async () => false),
}))

const PAID_ORDER = {
  id: 'order-42',
  status: 'paid',
  fulfillmentStatus: 'shipped',
  paidAt: '2026-03-04T10:00:00.000Z',
  subtotalCents: 850000,
  shippingCents: 0,
  discountCents: 0,
  totalCents: 850000,
  customerEmail: 'client@example.fr',
  shippingMethodType: 'shipping',
  shippingMethodLabel: 'Colissimo',
}

/** @param {string} path */
async function mountAt(path) {
  routeMock.path = path
  routeMock.query = { order: 'order-42', token: 'tok.sig' }
  const wrapper = mount(OrderSuccess, {
    global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  verifyOrderMock.mockReset()
  trackPurchaseMock.mockReset()
  clearCartMock.mockReset()
  verifyOrderMock.mockResolvedValue({ valid: true, order: PAID_ORDER, lines: [] })
})

describe('OrderSuccess — fin de tunnel (/commande/succes)', () => {
  it('vide le panier et remonte l’achat', async () => {
    const wrapper = await mountAt('/commande/succes')

    expect(trackPurchaseMock).toHaveBeenCalledTimes(1)
    expect(clearCartMock).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Paiement réussi')
  })
})

describe('OrderSuccess — suivi durable (/commande/suivi)', () => {
  it('ne vide pas un panier en cours et ne rejoue pas l’achat', async () => {
    await mountAt('/commande/suivi')

    expect(trackPurchaseMock).not.toHaveBeenCalled()
    expect(clearCartMock).not.toHaveBeenCalled()
  })

  it('affiche la commande et son statut de préparation, sans annoncer un paiement', async () => {
    const wrapper = await mountAt('/commande/suivi')
    const text = wrapper.text()

    expect(text).toContain('Votre commande')
    expect(text).toContain('order-42')
    expect(text).toContain('Expédiée')
    expect(text).toContain('4 mars 2026')
    expect(text).not.toContain('Paiement réussi')
  })

  it('propose toujours le retéléchargement du reçu', async () => {
    const wrapper = await mountAt('/commande/suivi')
    expect(wrapper.text()).toContain('Télécharger le reçu PDF')
  })

  it('reste lisible quand la commande est introuvable', async () => {
    verifyOrderMock.mockResolvedValue({ valid: false, reason: 'Commande introuvable' })
    const wrapper = await mountAt('/commande/suivi')

    expect(wrapper.text()).toContain('Commande indisponible')
    expect(wrapper.text()).toContain('Commande introuvable')
  })
})
