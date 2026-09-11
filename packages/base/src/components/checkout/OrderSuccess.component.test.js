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
const requestOrderReturnMock = vi.hoisted(() => vi.fn())
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
  requestOrderReturn: requestOrderReturnMock,
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

/** Dossier retour tel que le renvoie `GET /api/orders/:id/verify`. */
function returnInfo(overrides = {}) {
  return {
    status: 'none',
    requestedAt: null,
    refundedAt: null,
    refundAmountCents: null,
    withdrawalOpen: true,
    withdrawalDeadline: '2026-03-25T10:00:00.000Z',
    refundDeadline: null,
    ...overrides,
  }
}

beforeEach(() => {
  verifyOrderMock.mockReset()
  trackPurchaseMock.mockReset()
  clearCartMock.mockReset()
  requestOrderReturnMock.mockReset()
  requestOrderReturnMock.mockResolvedValue({
    success: true,
    return: returnInfo({ status: 'requested', requestedAt: '2026-03-10T10:00:00.000Z' }),
  })
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

describe('OrderSuccess — rétractation depuis le suivi', () => {
  /** @param {object} info */
  function withReturn(info) {
    verifyOrderMock.mockResolvedValue({
      valid: true,
      order: { ...PAID_ORDER, return: info },
      lines: [],
    })
  }

  it('propose la rétractation tant que la fenêtre est ouverte', async () => {
    withReturn(returnInfo())
    const wrapper = await mountAt('/commande/suivi')

    expect(wrapper.get('[data-testid="return-cta"]').text()).toContain('Demander un retour')
  })

  it('ne la propose pas une fois le délai dépassé', async () => {
    withReturn(returnInfo({ withdrawalOpen: false }))
    const wrapper = await mountAt('/commande/suivi')

    expect(wrapper.find('[data-testid="return-block"]').exists()).toBe(false)
  })

  it('ne la propose jamais en fin de tunnel : le colis n’est pas encore parti', async () => {
    withReturn(returnInfo())
    const wrapper = await mountAt('/commande/succes')

    expect(wrapper.find('[data-testid="return-block"]').exists()).toBe(false)
  })

  it('envoie la demande avec son motif et affiche l’accusé', async () => {
    withReturn(returnInfo())
    const wrapper = await mountAt('/commande/suivi')

    await wrapper.get('[data-testid="return-cta"]').trigger('click')
    await wrapper.get('[data-testid="return-reason"]').setValue('Bracelet trop grand')
    await wrapper.get('[data-testid="return-submit"]').trigger('click')
    await flushPromises()

    expect(requestOrderReturnMock).toHaveBeenCalledWith(
      'order-42',
      'tok.sig',
      'Bracelet trop grand',
    )
    expect(wrapper.text()).toContain('10 mars 2026')
    expect(wrapper.find('[data-testid="return-cta"]').exists()).toBe(false)
  })

  it('affiche l’échéance de remboursement d’un dossier en cours', async () => {
    withReturn(
      returnInfo({
        status: 'requested',
        requestedAt: '2026-03-10T10:00:00.000Z',
        refundDeadline: '2026-03-24T10:00:00.000Z',
        withdrawalOpen: false,
      }),
    )
    const wrapper = await mountAt('/commande/suivi')

    expect(wrapper.text()).toContain('24 mars 2026')
  })

  it('annonce le remboursement émis, montant et date', async () => {
    withReturn(
      returnInfo({
        status: 'refunded',
        refundedAt: '2026-03-20T10:00:00.000Z',
        refundAmountCents: 850000,
        withdrawalOpen: false,
      }),
    )
    const wrapper = await mountAt('/commande/suivi')
    const text = wrapper.text()

    expect(text).toContain('20 mars 2026')
    expect(text).toMatch(/8\s?500,00/)
  })

  it('affiche l’erreur sans perdre le motif saisi', async () => {
    requestOrderReturnMock.mockRejectedValue(new Error('Le délai de rétractation est dépassé.'))
    withReturn(returnInfo())
    const wrapper = await mountAt('/commande/suivi')

    await wrapper.get('[data-testid="return-cta"]').trigger('click')
    await wrapper.get('[data-testid="return-reason"]').setValue('Changement d’avis')
    await wrapper.get('[data-testid="return-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Le délai de rétractation est dépassé.')
    expect(wrapper.get('[data-testid="return-reason"]').element.value).toBe('Changement d’avis')
  })
})
