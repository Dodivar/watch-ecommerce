/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import AdminOrderReturnPanel from './AdminOrderReturnPanel.vue'

const updateOrderReturnMock = vi.hoisted(() => vi.fn())
const refundOrderMock = vi.hoisted(() => vi.fn())
const getOrderRefundsMock = vi.hoisted(() => vi.fn())
const roleRef = vi.hoisted(() => ({ current: 'admin' }))

// `@/config` lit la config du site (contact, Stripe) : inutile ici, et le stub
// de test ne la fournit pas.
vi.mock('@/config', () => ({ STRIPE_PUBLISHABLE_KEY: 'pk_live_test' }))

vi.mock('@/services/admin/adminOrderService', () => ({
  updateOrderReturn: updateOrderReturnMock,
  refundOrder: refundOrderMock,
  getOrderRefunds: getOrderRefundsMock,
}))

vi.mock('@/services/admin/useAdminPermissions', () => ({
  useAdminPermissions: () => ({ canWrite: ref(true), role: ref(roleRef.current) }),
}))

const paidOrder = {
  id: 'order-1',
  status: 'paid',
  totalCents: 450000,
  paidAt: '2026-08-01T10:00:00.000Z',
  deliveredAt: null,
  returnStatus: 'none',
  returnRequestedAt: null,
  returnNotes: '',
  returnReason: '',
  returnRequestedBy: null,
  refundAmountCents: null,
  refundedAt: null,
  stripeRefundId: null,
  stripePaymentIntentId: 'pi_3ABC123def',
}

async function mountPanel(order = {}) {
  const wrapper = mount(AdminOrderReturnPanel, { props: { order: { ...paidOrder, ...order } } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.useRealTimers()
  roleRef.current = 'admin'
  updateOrderReturnMock.mockReset()
  updateOrderReturnMock.mockResolvedValue({ success: true })
  refundOrderMock.mockReset()
  refundOrderMock.mockResolvedValue({
    success: true,
    refund: { id: 're_1', amountCents: 450000, status: 'succeeded' },
  })
  getOrderRefundsMock.mockReset()
  getOrderRefundsMock.mockResolvedValue([])
})

describe('AdminOrderReturnPanel — délais légaux', () => {
  it('calcule la fenêtre de rétractation depuis la réception du colis', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T10:00:00.000Z'))

    const wrapper = await mountPanel({ deliveredAt: '2026-08-05T10:00:00.000Z' })
    const banner = wrapper.get('[data-testid="withdrawal-window"]').text()

    expect(banner).toContain('19 août 2026')
    expect(banner).not.toContain('date de paiement')
  })

  it('signale une échéance provisoire tant que la réception n’est pas saisie', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T10:00:00.000Z'))

    const wrapper = await mountPanel({ deliveredAt: null })

    expect(wrapper.get('[data-testid="withdrawal-window"]').text()).toContain('date de paiement')
  })

  it('rappelle le délai de remboursement de 14 jours après la demande', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T10:00:00.000Z'))

    const wrapper = await mountPanel({
      returnStatus: 'requested',
      returnRequestedAt: '2026-08-02T10:00:00.000Z',
    })

    expect(wrapper.get('[data-testid="refund-deadline"]').text()).toContain('16 août 2026')
  })
})

describe('AdminOrderReturnPanel — remboursement', () => {
  it('pré-remplit le montant avec le reste à rembourser', async () => {
    getOrderRefundsMock.mockResolvedValue([{ id: 'r1', amountCents: 50000, status: 'succeeded' }])

    const wrapper = await mountPanel()

    expect(wrapper.get('[data-testid="refund-amount"]').element.value).toBe('4000.00')
    expect(wrapper.get('[data-testid="refund-summary"]').text()).toContain('500,00')
  })

  it('demande confirmation avant de faire sortir l’argent', async () => {
    const wrapper = await mountPanel()

    await wrapper.get('[data-testid="refund-button"]').trigger('click')

    expect(refundOrderMock).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="refund-confirm"]').text()).toContain('irréversible')
  })

  it('déclenche le remboursement du montant saisi, converti en centimes', async () => {
    const wrapper = await mountPanel({ returnStatus: 'received' })

    await wrapper.get('[data-testid="refund-amount"]').setValue('4200.50')
    await wrapper.get('[data-testid="refund-button"]').trigger('click')
    await wrapper.get('[data-testid="refund-confirm-button"]').trigger('click')
    await flushPromises()

    expect(refundOrderMock).toHaveBeenCalledTimes(1)
    const [orderId, params] = refundOrderMock.mock.calls[0]
    expect(orderId).toBe('order-1')
    expect(params.amountCents).toBe(420050)
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('refuse un montant supérieur au reste à rembourser, sans appeler le backend', async () => {
    const wrapper = await mountPanel()

    await wrapper.get('[data-testid="refund-amount"]').setValue('5000')
    await wrapper.get('[data-testid="refund-button"]').trigger('click')

    expect(refundOrderMock).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="refund-error"]').text()).toMatch(/reste à rembourser/i)
  })

  it('remonte le refus de Stripe et propose alors le dashboard en secours', async () => {
    refundOrderMock.mockRejectedValue(
      new Error('Stripe : charge has already been refunded'),
    )
    const wrapper = await mountPanel()

    await wrapper.get('[data-testid="refund-button"]').trigger('click')
    await wrapper.get('[data-testid="refund-confirm-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="refund-error"]').text()).toContain('already been refunded')
    expect(wrapper.get('[data-testid="stripe-link"]').attributes('href')).toBe(
      'https://dashboard.stripe.com/payments/pi_3ABC123def',
    )
  })

  it('cache le remboursement au rôle modérateur', async () => {
    roleRef.current = 'moderator'

    const wrapper = await mountPanel()

    expect(wrapper.find('[data-testid="refund-button"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('réservé au rôle administrateur')
  })

  it('affiche l’historique des remboursements et leur origine', async () => {
    getOrderRefundsMock.mockResolvedValue([
      {
        id: 'r1',
        amountCents: 450000,
        status: 'succeeded',
        source: 'stripe_dashboard',
        initiatedBy: null,
        refundedAt: '2026-08-12T10:00:00.000Z',
        failureReason: null,
      },
    ])

    const wrapper = await mountPanel()
    const history = wrapper.get('[data-testid="refund-history"]').text()

    expect(history).toContain('Effectué')
    expect(history).toContain('Dashboard Stripe')
    expect(wrapper.find('[data-testid="refund-button"]').exists()).toBe(false)
  })
})

describe('AdminOrderReturnPanel — suivi du dossier', () => {
  it('enregistre le suivi sans toucher aux montants', async () => {
    const wrapper = await mountPanel({ returnStatus: 'requested' })

    await wrapper.get('select').setValue('received')
    await wrapper.get('[data-testid="save-return"]').trigger('click')
    await flushPromises()

    expect(updateOrderReturnMock).toHaveBeenCalledTimes(1)
    const [orderId, update] = updateOrderReturnMock.mock.calls[0]
    expect(orderId).toBe('order-1')
    expect(update.returnStatus).toBe('received')
    expect(update).not.toHaveProperty('refundAmountCents')
    expect(update).not.toHaveProperty('stripeRefundId')
  })

  it('remonte l’erreur du service sans émettre de mise à jour', async () => {
    updateOrderReturnMock.mockRejectedValue(new Error('Statut de retour invalide'))
    const wrapper = await mountPanel({ returnStatus: 'requested' })

    await wrapper.get('[data-testid="save-return"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Statut de retour invalide')
    expect(wrapper.emitted('updated')).toBeUndefined()
  })

  it('affiche la demande venue du client, en lecture seule', async () => {
    const wrapper = await mountPanel({
      returnStatus: 'requested',
      returnRequestedBy: 'customer',
      returnRequestedAt: '2026-08-08T10:00:00.000Z',
      returnReason: 'Bracelet trop grand',
    })

    const block = wrapper.get('[data-testid="customer-request"]').text()
    expect(block).toContain('8 août 2026')
    expect(block).toContain('Bracelet trop grand')
  })
})
