import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  PROVISIONAL_DELIVERY_GRACE_DAYS,
  buildReturnRequestUpdate,
  computeRefundDeadline,
  computeWithdrawalWindow,
  validateReturnRequest,
} = require('../../backend/orders/returns.js')

const NOW = new Date('2026-09-11T10:00:00.000Z')

const PAID_ORDER = {
  status: 'paid',
  return_status: 'none',
  paid_at: '2026-09-01T10:00:00.000Z',
  delivered_at: '2026-09-05T10:00:00.000Z',
}

describe('computeWithdrawalWindow', () => {
  it('court sur 14 jours à partir de la réception', () => {
    const window = computeWithdrawalWindow(PAID_ORDER, NOW)

    expect(window.deadline.toISOString()).toBe('2026-09-19T10:00:00.000Z')
    expect(window.isOpen).toBe(true)
    expect(window.isProvisional).toBe(false)
  })

  it('accorde une marge d’acheminement tant que la réception est inconnue', () => {
    const window = computeWithdrawalWindow({ ...PAID_ORDER, delivered_at: null }, NOW)

    // Sans cette marge, la fenêtre partirait du paiement — donc avant même
    // l'expédition — et fermerait le droit du client plus tôt que la loi.
    expect(window.isProvisional).toBe(true)
    expect(window.deadline.toISOString()).toBe(
      new Date(
        Date.parse('2026-09-01T10:00:00.000Z') +
          (14 + PROVISIONAL_DELIVERY_GRACE_DAYS) * 24 * 60 * 60 * 1000,
      ).toISOString(),
    )
  })

  it('rend null sans date de départ', () => {
    expect(computeWithdrawalWindow({ paid_at: null, delivered_at: null }, NOW)).toBeNull()
  })
})

describe('computeRefundDeadline', () => {
  it('court sur 14 jours après la notification', () => {
    const deadline = computeRefundDeadline('2026-09-01T10:00:00.000Z', NOW)

    expect(deadline.deadline.toISOString()).toBe('2026-09-15T10:00:00.000Z')
    expect(deadline.isOverdue).toBe(false)
  })

  it('signale un remboursement hors délai', () => {
    expect(computeRefundDeadline('2026-08-01T10:00:00.000Z', NOW).isOverdue).toBe(true)
  })
})

describe('validateReturnRequest', () => {
  it('accepte une demande dans la fenêtre de rétractation', () => {
    expect(validateReturnRequest(PAID_ORDER, NOW)).toEqual({ ok: true, alreadyOpen: false })
  })

  it('refuse une commande non payée', () => {
    const result = validateReturnRequest({ ...PAID_ORDER, status: 'draft' }, NOW)
    expect(result.ok).toBe(false)
    expect(result.status).toBe(400)
  })

  it('refuse une demande hors délai', () => {
    const result = validateReturnRequest(
      { ...PAID_ORDER, delivered_at: '2026-08-01T10:00:00.000Z' },
      NOW,
    )
    expect(result.ok).toBe(false)
    expect(result.status).toBe(409)
    expect(result.error).toMatch(/14 jours/)
  })

  it('ne redate pas un dossier déjà ouvert', () => {
    const result = validateReturnRequest({ ...PAID_ORDER, return_status: 'requested' }, NOW)
    expect(result).toEqual({ ok: true, alreadyOpen: true })
  })

  it('refuse de rouvrir un dossier clos par le commerçant', () => {
    const result = validateReturnRequest({ ...PAID_ORDER, return_status: 'rejected' }, NOW)
    expect(result.ok).toBe(false)
    expect(result.status).toBe(409)
  })
})

describe('buildReturnRequestUpdate', () => {
  it('horodate la notification côté serveur et trace l’origine client', () => {
    const update = buildReturnRequestUpdate({ reason: '  Bracelet trop grand  ', now: NOW })

    expect(update).toMatchObject({
      return_status: 'requested',
      return_requested_at: NOW.toISOString(),
      return_requested_by: 'customer',
      return_reason: 'Bracelet trop grand',
    })
  })

  it('n’écrit pas de motif vide', () => {
    const update = buildReturnRequestUpdate({ reason: '   ', now: NOW })
    expect(update).not.toHaveProperty('return_reason')
  })

  it('tronque un motif démesuré', () => {
    const update = buildReturnRequestUpdate({ reason: 'x'.repeat(5000), now: NOW })
    expect(update.return_reason).toHaveLength(2000)
  })
})
