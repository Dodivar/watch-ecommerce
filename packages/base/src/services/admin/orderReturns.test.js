import { describe, expect, it } from 'vitest'

import {
  computeRefundDeadline,
  computeWithdrawalWindow,
  stripePaymentDashboardUrl,
  validateReturnUpdate,
} from './orderReturns.js'

describe('computeWithdrawalWindow', () => {
  it('court sur 14 jours à partir de la réception', () => {
    const window = computeWithdrawalWindow(
      { deliveredAt: '2026-08-01T10:00:00.000Z', paidAt: '2026-07-25T10:00:00.000Z' },
      new Date('2026-08-10T10:00:00.000Z'),
    )

    expect(window.deadline.toISOString()).toBe('2026-08-15T10:00:00.000Z')
    expect(window.daysLeft).toBe(5)
    expect(window.isOpen).toBe(true)
    expect(window.isProvisional).toBe(false)
  })

  it('retombe sur la date de paiement et marque la fenêtre comme provisoire', () => {
    const window = computeWithdrawalWindow(
      { deliveredAt: null, paidAt: '2026-08-01T10:00:00.000Z' },
      new Date('2026-08-10T10:00:00.000Z'),
    )

    expect(window.startedAt.toISOString()).toBe('2026-08-01T10:00:00.000Z')
    expect(window.isProvisional).toBe(true)
  })

  it('signale un délai expiré', () => {
    const window = computeWithdrawalWindow(
      { deliveredAt: '2026-08-01T10:00:00.000Z' },
      new Date('2026-08-20T10:00:00.000Z'),
    )

    expect(window.isOpen).toBe(false)
    expect(window.daysLeft).toBe(-5)
  })

  it('rend null sans aucune date exploitable', () => {
    expect(computeWithdrawalWindow({})).toBeNull()
    expect(computeWithdrawalWindow({ paidAt: 'pas-une-date' })).toBeNull()
  })
})

describe('computeRefundDeadline', () => {
  it('donne 14 jours au vendeur après la demande', () => {
    const deadline = computeRefundDeadline(
      '2026-08-01T10:00:00.000Z',
      new Date('2026-08-10T10:00:00.000Z'),
    )

    expect(deadline.deadline.toISOString()).toBe('2026-08-15T10:00:00.000Z')
    expect(deadline.daysLeft).toBe(5)
    expect(deadline.isOverdue).toBe(false)
  })

  it('bascule en retard une fois le délai passé', () => {
    const deadline = computeRefundDeadline(
      '2026-08-01T10:00:00.000Z',
      new Date('2026-08-16T10:00:00.000Z'),
    )

    expect(deadline.isOverdue).toBe(true)
  })

  it('rend null sans demande de rétractation', () => {
    expect(computeRefundDeadline(null)).toBeNull()
  })
})

describe('stripePaymentDashboardUrl', () => {
  it('pointe vers le paiement en mode live', () => {
    expect(stripePaymentDashboardUrl('pi_3ABC123def')).toBe(
      'https://dashboard.stripe.com/payments/pi_3ABC123def',
    )
  })

  it('préfixe /test avec une clé de test', () => {
    expect(stripePaymentDashboardUrl('pi_3ABC123def', { testMode: true })).toBe(
      'https://dashboard.stripe.com/test/payments/pi_3ABC123def',
    )
  })

  it('rend null sans identifiant de paiement valide', () => {
    expect(stripePaymentDashboardUrl(null)).toBeNull()
    expect(stripePaymentDashboardUrl('')).toBeNull()
    expect(stripePaymentDashboardUrl('ch_3ABC')).toBeNull()
  })
})

describe('validateReturnUpdate', () => {
  it('refuse un statut inconnu', () => {
    expect(validateReturnUpdate({ returnStatus: 'wat' }).ok).toBe(false)
  })

  it('exige le montant remboursé sur un dossier remboursé', () => {
    const result = validateReturnUpdate({ returnStatus: 'refunded', refundAmountCents: null })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/montant/i)
  })

  it('refuse un remboursement supérieur au total de la commande', () => {
    const result = validateReturnUpdate(
      { returnStatus: 'refunded', refundAmountCents: 60000 },
      { totalCents: 50000 },
    )
    expect(result.ok).toBe(false)
  })

  it('refuse un identifiant de remboursement mal formé', () => {
    const result = validateReturnUpdate({
      returnStatus: 'received',
      stripeRefundId: 'pi_3ABC123def',
    })
    expect(result.ok).toBe(false)
  })

  it('accepte un dossier remboursé complet', () => {
    const result = validateReturnUpdate(
      { returnStatus: 'refunded', refundAmountCents: 50000, stripeRefundId: 're_3ABC123def' },
      { totalCents: 50000 },
    )
    expect(result).toEqual({ ok: true })
  })

  it('accepte un dossier ouvert sans remboursement encore saisi', () => {
    expect(validateReturnUpdate({ returnStatus: 'requested' }).ok).toBe(true)
  })
})
