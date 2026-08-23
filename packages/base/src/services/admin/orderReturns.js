/**
 * Règles retours / remboursements du panel admin.
 *
 * Deux délais légaux de 14 jours, à ne pas confondre :
 * - rétractation (art. L221-18) : le client a 14 jours après réception du colis
 *   pour se rétracter ;
 * - remboursement (art. L221-24) : le vendeur a 14 jours après avoir été informé
 *   de la rétractation pour rembourser.
 *
 * Le remboursement lui-même n'est pas déclenché par l'application : il est
 * effectué à la main depuis le dashboard Stripe, puis enregistré ici. Ce module
 * est pur (aucun accès Supabase) pour rester testable.
 */

/** Durée du droit de rétractation, en jours. */
export const WITHDRAWAL_PERIOD_DAYS = 14

/** Délai légal de remboursement après notification de la rétractation, en jours. */
export const REFUND_PERIOD_DAYS = 14

export const RETURN_STATUSES = ['none', 'requested', 'received', 'refunded', 'rejected']

export const RETURN_STATUS_LABELS = {
  none: 'Aucun retour',
  requested: 'Rétractation demandée',
  received: 'Colis reçu',
  refunded: 'Remboursée',
  rejected: 'Retour refusé',
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

/**
 * Jours restants avant une échéance (négatif une fois dépassée). Une journée
 * entamée compte pour une journée : J-1 tant que l'échéance n'est pas passée.
 * @param {Date} deadline
 * @param {Date} now
 * @returns {number}
 */
function daysUntil(deadline, now) {
  return Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS)
}

/**
 * Fenêtre de rétractation d'une commande.
 *
 * Le délai court à compter de la réception du colis. Tant que `deliveredAt`
 * n'est pas renseigné, on retombe sur la date de paiement et la fenêtre est
 * marquée `isProvisional` : c'est une estimation basse (la réception est
 * forcément postérieure), à confirmer par l'admin.
 *
 * @param {{ deliveredAt?: string|Date|null, paidAt?: string|Date|null }} order
 * @param {Date} [now]
 * @returns {{ startedAt: Date, deadline: Date, daysLeft: number, isOpen: boolean, isProvisional: boolean }|null}
 */
export function computeWithdrawalWindow(order, now = new Date()) {
  const deliveredAt = toDate(order?.deliveredAt)
  const startedAt = deliveredAt || toDate(order?.paidAt)
  if (!startedAt) return null

  const deadline = addDays(startedAt, WITHDRAWAL_PERIOD_DAYS)
  const daysLeft = daysUntil(deadline, now)

  return {
    startedAt,
    deadline,
    daysLeft,
    isOpen: daysLeft > 0,
    isProvisional: !deliveredAt,
  }
}

/**
 * Échéance de remboursement après une demande de rétractation.
 * @param {string|Date|null|undefined} returnRequestedAt
 * @param {Date} [now]
 * @returns {{ deadline: Date, daysLeft: number, isOverdue: boolean }|null}
 */
export function computeRefundDeadline(returnRequestedAt, now = new Date()) {
  const requestedAt = toDate(returnRequestedAt)
  if (!requestedAt) return null

  const deadline = addDays(requestedAt, REFUND_PERIOD_DAYS)
  const daysLeft = daysUntil(deadline, now)

  return { deadline, daysLeft, isOverdue: daysLeft <= 0 }
}

/**
 * Lien direct vers le paiement dans le dashboard Stripe, où le remboursement
 * est effectué à la main.
 * @param {string|null|undefined} paymentIntentId
 * @param {{ testMode?: boolean }} [options]
 * @returns {string|null} null si aucun paiement Stripe rattaché.
 */
export function stripePaymentDashboardUrl(paymentIntentId, { testMode = false } = {}) {
  if (!paymentIntentId || !/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) return null
  const segment = testMode ? '/test' : ''
  return `https://dashboard.stripe.com${segment}/payments/${paymentIntentId}`
}

/**
 * Contrôle la cohérence d'une mise à jour de dossier retour avant écriture.
 *
 * Un dossier marqué « remboursée » doit porter la trace du remboursement fait
 * dans Stripe : sans montant, la commande deviendrait inexploitable en compta.
 *
 * @param {{ returnStatus?: string, refundAmountCents?: number|null, stripeRefundId?: string|null }} update
 * @param {{ totalCents?: number|null }} [order]
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateReturnUpdate(update, order = {}) {
  const status = update?.returnStatus
  if (!RETURN_STATUSES.includes(status)) {
    return { ok: false, error: 'Statut de retour invalide' }
  }

  const amount = update?.refundAmountCents
  if (amount != null) {
    if (!Number.isInteger(amount) || amount < 0) {
      return { ok: false, error: 'Montant remboursé invalide' }
    }
    if (order?.totalCents != null && amount > order.totalCents) {
      return { ok: false, error: 'Le montant remboursé dépasse le total de la commande' }
    }
  }

  if (status === 'refunded') {
    if (amount == null || amount === 0) {
      return { ok: false, error: 'Renseignez le montant remboursé dans Stripe' }
    }
  }

  const refundId = update?.stripeRefundId?.trim()
  if (refundId && !/^re_[A-Za-z0-9_]+$/.test(refundId)) {
    return { ok: false, error: 'Identifiant de remboursement Stripe invalide (format re_…)' }
  }

  return { ok: true }
}
