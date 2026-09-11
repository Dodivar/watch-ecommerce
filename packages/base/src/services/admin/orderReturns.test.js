import { describe, expect, it } from 'vitest'

import {
  canRefundOrder,
  computeRefundDeadline,
  computeWithdrawalWindow,
  refundableCents,
  stripePaymentDashboardUrl,
  summarizeRefunds,
  summarizeReturnStats,
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

  it('refuse de déclarer « remboursée » une commande sans remboursement', () => {
    const result = validateReturnUpdate({ returnStatus: 'refunded' }, { totalCents: 50000 })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/bouton Rembourser/i)
  })

  it('accepte « remboursée » sur une commande qui porte déjà un remboursement', () => {
    const result = validateReturnUpdate(
      { returnStatus: 'refunded' },
      { totalCents: 50000, refundAmountCents: 50000 },
    )
    expect(result).toEqual({ ok: true })
  })

  it('accepte un dossier ouvert', () => {
    expect(validateReturnUpdate({ returnStatus: 'requested' }).ok).toBe(true)
  })
})

describe('summarizeRefunds', () => {
  it('sépare le remboursé de l’engagé encore en vol', () => {
    const totals = summarizeRefunds([
      { amountCents: 30000, status: 'succeeded' },
      { amountCents: 10000, status: 'pending' },
      { amountCents: 5000, status: 'failed' },
    ])

    expect(totals).toEqual({
      refundedCents: 30000,
      pendingCents: 10000,
      engagedCents: 40000,
      count: 1,
    })
  })

  it('ne compte ni les échecs ni les annulations', () => {
    const totals = summarizeRefunds([
      { amountCents: 20000, status: 'failed' },
      { amountCents: 20000, status: 'canceled' },
    ])

    expect(totals.refundedCents).toBe(0)
    expect(totals.engagedCents).toBe(0)
  })
})

describe('refundableCents', () => {
  it('déduit les remboursements aboutis ET ceux en cours', () => {
    const available = refundableCents({ totalCents: 100000 }, [
      { amountCents: 30000, status: 'succeeded' },
      { amountCents: 20000, status: 'pending' },
    ])

    expect(available).toBe(50000)
  })

  it('ne descend jamais sous zéro', () => {
    expect(
      refundableCents({ totalCents: 10000 }, [{ amountCents: 15000, status: 'succeeded' }]),
    ).toBe(0)
  })
})

describe('canRefundOrder', () => {
  const paid = { status: 'paid', totalCents: 100000, stripePaymentIntentId: 'pi_3ABC123def' }

  it('autorise le remboursement d’une commande payée non remboursée', () => {
    expect(canRefundOrder(paid, [])).toEqual({ ok: true, availableCents: 100000 })
  })

  it('refuse une commande non payée', () => {
    expect(canRefundOrder({ ...paid, status: 'pending_payment' }, []).ok).toBe(false)
  })

  it('renvoie vers Stripe quand aucun paiement n’est rattaché', () => {
    const result = canRefundOrder({ ...paid, stripePaymentIntentId: null }, [])
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/dashboard/i)
  })

  it('refuse une commande déjà intégralement remboursée', () => {
    const result = canRefundOrder(paid, [{ amountCents: 100000, status: 'succeeded' }])
    expect(result.ok).toBe(false)
    expect(result.availableCents).toBe(0)
  })
})

describe('summarizeReturnStats', () => {
  const now = new Date('2026-08-20T10:00:00.000Z')

  /** Quatre commandes payées : une remboursée, une en cours, une refusée, une sans retour. */
  const orders = [
    {
      totalCents: 100000,
      returnStatus: 'refunded',
      returnRequestedAt: '2026-08-01T10:00:00.000Z',
      refundAmountCents: 90000,
      refundedAt: '2026-08-05T10:00:00.000Z',
    },
    { totalCents: 200000, returnStatus: 'received', returnRequestedAt: '2026-08-18T10:00:00.000Z' },
    { totalCents: 50000, returnStatus: 'rejected', returnRequestedAt: '2026-07-01T10:00:00.000Z' },
    { totalCents: 50000, returnStatus: 'none' },
  ]

  it('compte les dossiers par statut sur tout le lot reçu', () => {
    const stats = summarizeReturnStats(orders, now)

    expect(stats.paidOrderCount).toBe(4)
    expect(stats.byStatus).toEqual({ none: 1, requested: 0, received: 1, refunded: 1, rejected: 1 })
    expect(stats.openCount).toBe(1)
    expect(stats.refundedCount).toBe(1)
  })

  it('additionne les montants remboursés et les rapporte au CA encaissé', () => {
    const stats = summarizeReturnStats(orders, now)

    expect(stats.refundedAmountCents).toBe(90000)
    expect(stats.paidRevenueCents).toBe(400000)
    expect(stats.refundedRevenueShare).toBeCloseTo(22.5)
    expect(stats.refundRate).toBeCloseTo(25)
  })

  it('mesure le délai moyen entre la demande et le remboursement', () => {
    expect(summarizeReturnStats(orders, now).avgRefundDelayDays).toBeCloseTo(4)
  })

  it('laisse le délai moyen à null quand aucun dossier remboursé n’est daté', () => {
    const stats = summarizeReturnStats(
      [{ totalCents: 1000, returnStatus: 'refunded', refundAmountCents: 1000 }],
      now,
    )

    expect(stats.avgRefundDelayDays).toBeNull()
  })

  it('signale les dossiers ouverts au-delà du délai légal de remboursement', () => {
    const stats = summarizeReturnStats(
      [
        // Demandée il y a 19 jours et toujours pas remboursée : hors délai.
        { totalCents: 1000, returnStatus: 'requested', returnRequestedAt: '2026-08-01T10:00:00.000Z' },
        // Demandée il y a 2 jours : encore dans les temps.
        { totalCents: 1000, returnStatus: 'received', returnRequestedAt: '2026-08-18T10:00:00.000Z' },
        // Déjà remboursée, même tardivement : plus rien à traiter.
        {
          totalCents: 1000,
          returnStatus: 'refunded',
          returnRequestedAt: '2026-07-01T10:00:00.000Z',
          refundAmountCents: 1000,
          refundedAt: '2026-08-01T10:00:00.000Z',
        },
      ],
      now,
    )

    expect(stats.overdueCount).toBe(1)
  })

  it('traite un statut inconnu ou absent comme « aucun retour »', () => {
    const stats = summarizeReturnStats([{ totalCents: 1000 }, { returnStatus: 'bidon' }], now)

    expect(stats.byStatus.none).toBe(2)
    expect(stats.openCount).toBe(0)
  })

  it('ne divise pas par zéro sur un lot vide', () => {
    const stats = summarizeReturnStats([], now)

    expect(stats.refundRate).toBe(0)
    expect(stats.refundedRevenueShare).toBe(0)
    expect(stats.avgRefundDelayDays).toBeNull()
  })
})
