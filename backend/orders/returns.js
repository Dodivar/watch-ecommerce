/**
 * Règles de rétractation appliquées côté serveur.
 *
 * Ces règles existent aussi côté panel admin
 * (`packages/base/src/services/admin/orderReturns.js`), mais la version qui
 * fait foi est celle-ci : c'est elle qui décide si un client peut ouvrir un
 * dossier depuis la page de suivi, et c'est le serveur qui horodate la
 * notification — une date déclarée par l'interface ne vaut rien face au délai
 * légal de l'art. L221-24.
 *
 * Module pur (aucun accès Supabase ni Stripe) pour rester testable.
 */

/** Droit de rétractation : 14 jours après réception (art. L221-18). */
const WITHDRAWAL_PERIOD_DAYS = 14

/** Délai de remboursement : 14 jours après notification (art. L221-24). */
const REFUND_PERIOD_DAYS = 14

/**
 * Marge accordée quand la date de réception n'est pas connue.
 *
 * Sans `delivered_at`, la fenêtre partirait du paiement — c'est-à-dire avant
 * même l'expédition — et fermerait le droit du client plus tôt que la loi.
 * Cette marge couvre le délai d'acheminement ; l'admin reste libre de refuser
 * un dossier manifestement hors délai, ce que l'inverse (refuser à tort) ne
 * permettrait pas de rattraper.
 */
const PROVISIONAL_DELIVERY_GRACE_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/** Dossiers déjà ouverts : une seconde demande ne les redate pas. */
const OPEN_RETURN_STATUSES = ['requested', 'received', 'refunded']

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
 */
function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

/**
 * Fenêtre de rétractation d'une commande payée.
 *
 * @param {{ delivered_at?: string|Date|null, paid_at?: string|Date|null }} order
 * @param {Date} [now]
 * @returns {{ deadline: Date, isOpen: boolean, isProvisional: boolean, daysLeft: number }|null}
 */
function computeWithdrawalWindow(order, now = new Date()) {
  const deliveredAt = toDate(order?.delivered_at)
  const startedAt = deliveredAt || toDate(order?.paid_at)
  if (!startedAt) return null

  const days = deliveredAt
    ? WITHDRAWAL_PERIOD_DAYS
    : WITHDRAWAL_PERIOD_DAYS + PROVISIONAL_DELIVERY_GRACE_DAYS
  const deadline = addDays(startedAt, days)

  return {
    deadline,
    isOpen: deadline.getTime() > now.getTime(),
    isProvisional: !deliveredAt,
    daysLeft: Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS),
  }
}

/**
 * Échéance de remboursement après notification de la rétractation.
 * @param {string|Date|null|undefined} requestedAt
 * @param {Date} [now]
 * @returns {{ deadline: Date, daysLeft: number, isOverdue: boolean }|null}
 */
function computeRefundDeadline(requestedAt, now = new Date()) {
  const start = toDate(requestedAt)
  if (!start) return null
  const deadline = addDays(start, REFUND_PERIOD_DAYS)
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS)
  return { deadline, daysLeft, isOverdue: daysLeft <= 0 }
}

/**
 * Une demande de rétractation client est-elle recevable sur cette commande ?
 *
 * @param {{ status?: string, return_status?: string|null, delivered_at?: string|null,
 *   paid_at?: string|null }} order
 * @param {Date} [now]
 * @returns {{ ok: boolean, status?: number, error?: string, alreadyOpen?: boolean }}
 */
function validateReturnRequest(order, now = new Date()) {
  if (!order) {
    return { ok: false, status: 404, error: 'Commande introuvable' }
  }
  if (order.status !== 'paid') {
    return { ok: false, status: 400, error: 'Cette commande n’a pas été payée' }
  }
  if (order.return_status === 'rejected') {
    return {
      ok: false,
      status: 409,
      error: 'Ce dossier de retour a été clos. Contactez-nous pour le rouvrir.',
    }
  }
  // Demande déjà enregistrée : réponse en succès, sans redater. La première
  // notification est celle qui compte pour le délai de remboursement.
  if (OPEN_RETURN_STATUSES.includes(order.return_status)) {
    return { ok: true, alreadyOpen: true }
  }

  const window = computeWithdrawalWindow(order, now)
  if (!window) {
    return { ok: false, status: 400, error: 'Commande sans date de paiement' }
  }
  if (!window.isOpen) {
    return {
      ok: false,
      status: 409,
      error: 'Le délai de rétractation de 14 jours après réception est dépassé.',
    }
  }

  return { ok: true, alreadyOpen: false }
}

/**
 * Colonnes à écrire pour ouvrir un dossier à la demande du client.
 * @param {{ reason?: string|null, now?: Date }} [params]
 */
function buildReturnRequestUpdate({ reason, now = new Date() } = {}) {
  const cleanedReason = String(reason || '').trim().slice(0, 2000)
  return {
    return_status: 'requested',
    return_requested_at: now.toISOString(),
    return_requested_by: 'customer',
    ...(cleanedReason ? { return_reason: cleanedReason } : {}),
    updated_at: now.toISOString(),
  }
}

module.exports = {
  OPEN_RETURN_STATUSES,
  PROVISIONAL_DELIVERY_GRACE_DAYS,
  REFUND_PERIOD_DAYS,
  WITHDRAWAL_PERIOD_DAYS,
  buildReturnRequestUpdate,
  computeRefundDeadline,
  computeWithdrawalWindow,
  validateReturnRequest,
}
