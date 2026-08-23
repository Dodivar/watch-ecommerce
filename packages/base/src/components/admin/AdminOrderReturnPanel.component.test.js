/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import AdminOrderReturnPanel from './AdminOrderReturnPanel.vue'

const updateOrderReturnMock = vi.hoisted(() => vi.fn())

// `@/config` lit la config du site (contact, Stripe) : inutile ici, et le stub
// de test ne la fournit pas.
vi.mock('@/config', () => ({ STRIPE_PUBLISHABLE_KEY: 'pk_live_test' }))

vi.mock('@/services/admin/adminOrderService', () => ({
  updateOrderReturn: updateOrderReturnMock,
}))

vi.mock('@/services/admin/useAdminPermissions', () => ({
  useAdminPermissions: () => ({ canWrite: ref(true) }),
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
  refundAmountCents: null,
  refundedAt: null,
  stripeRefundId: null,
  stripePaymentIntentId: 'pi_3ABC123def',
}

function mountPanel(order = {}) {
  return mount(AdminOrderReturnPanel, { props: { order: { ...paidOrder, ...order } } })
}

beforeEach(() => {
  vi.useRealTimers()
  updateOrderReturnMock.mockReset()
  updateOrderReturnMock.mockResolvedValue({ success: true })
})

describe('AdminOrderReturnPanel', () => {
  it('calcule la fenêtre de rétractation depuis la réception du colis', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T10:00:00.000Z'))

    const wrapper = mountPanel({ deliveredAt: '2026-08-05T10:00:00.000Z' })
    const banner = wrapper.get('[data-testid="withdrawal-window"]').text()

    expect(banner).toContain('19 août 2026')
    expect(banner).not.toContain('date de paiement')
  })

  it('signale une échéance provisoire tant que la réception n’est pas saisie', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T10:00:00.000Z'))

    const wrapper = mountPanel({ deliveredAt: null })

    expect(wrapper.get('[data-testid="withdrawal-window"]').text()).toContain(
      'date de paiement',
    )
  })

  it('renvoie vers le dashboard Stripe sans proposer de remboursement en admin', async () => {
    const wrapper = mountPanel({ returnStatus: 'requested' })
    await flushPromises()

    const link = wrapper.get('[data-testid="stripe-link"]')
    expect(link.attributes('href')).toBe('https://dashboard.stripe.com/payments/pi_3ABC123def')
    expect(wrapper.text()).toContain("Aucun remboursement n'est déclenché par l'administration")
  })

  it('rappelle le délai de remboursement de 14 jours après la demande', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T10:00:00.000Z'))

    const wrapper = mountPanel({
      returnStatus: 'requested',
      returnRequestedAt: '2026-08-02T10:00:00.000Z',
    })

    expect(wrapper.get('[data-testid="refund-deadline"]').text()).toContain('16 août 2026')
  })

  it('pré-remplit le montant avec le total quand le dossier passe à « remboursée »', async () => {
    const wrapper = mountPanel()

    await wrapper.get('select').setValue('refunded')

    expect(wrapper.get('input[type="number"]').element.value).toBe('4500.00')
  })

  it('enregistre le remboursement saisi, converti en centimes', async () => {
    const wrapper = mountPanel({ returnStatus: 'received' })

    await wrapper.get('select').setValue('refunded')
    await wrapper.get('input[type="number"]').setValue('4200.50')
    await wrapper.get('input[type="text"]').setValue('re_3XYZ789ghi')
    await wrapper.get('button.bg-primary').trigger('click')
    await flushPromises()

    expect(updateOrderReturnMock).toHaveBeenCalledTimes(1)
    const [orderId, update, context] = updateOrderReturnMock.mock.calls[0]
    expect(orderId).toBe('order-1')
    expect(update.returnStatus).toBe('refunded')
    expect(update.refundAmountCents).toBe(420050)
    expect(update.stripeRefundId).toBe('re_3XYZ789ghi')
    expect(update.refundedAt).toBeTruthy()
    expect(context).toEqual({ totalCents: 450000 })
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('remonte l’erreur du service sans émettre de mise à jour', async () => {
    updateOrderReturnMock.mockRejectedValue(new Error('Statut de retour invalide'))
    const wrapper = mountPanel({ returnStatus: 'requested' })

    await wrapper.get('button.bg-primary').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Statut de retour invalide')
    expect(wrapper.emitted('updated')).toBeUndefined()
  })
})
