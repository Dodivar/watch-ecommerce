/**
 * E-mails du dossier retour : accusé de rétractation et confirmation de
 * remboursement.
 *
 * Les deux courriers ont une valeur juridique et pas seulement informative :
 * l'accusé horodate la notification de la rétractation (départ des 14 jours de
 * l'art. L221-24 pour rembourser), la confirmation matérialise l'exécution. Ils
 * reprennent le branding du site comme les autres transactionnels — voir
 * `emailCommon.js`.
 */

const {
  escapeHtml,
  emailShell,
  section,
  fieldRow,
  optionalFieldRow,
  fieldTable,
  paragraph,
  button,
  buttonRow,
  messageBlock,
  resolveEmailBranding,
} = require('./emailCommon')

function formatEur(cents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100,
  )
}

function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Accusé de réception d'une demande de rétractation.
 *
 * @param {object} site Site registry entry
 * @param {object} order Ligne `orders`
 * @param {{ reason?: string|null, forMerchant?: boolean, refundDeadline?: Date|string|null,
 *   trackingUrl?: string|null, returnAddress?: string|null }} [extras]
 * @returns {string} HTML
 */
function createReturnRequestEmail(site, order, extras = {}) {
  const branding = resolveEmailBranding(site)
  const forMerchant = Boolean(extras.forMerchant)
  const deadlineLabel = formatDate(extras.refundDeadline)

  const detailsHtml = section(
    branding,
    forMerchant ? 'Commande concernée' : 'Votre commande',
    fieldTable(
      [
        fieldRow(branding, 'Commande', order.id),
        fieldRow(branding, 'Montant payé', formatEur(order.total_cents)),
        optionalFieldRow(branding, 'Client', forMerchant ? order.customer_email : ''),
        optionalFieldRow(branding, 'Reçue le', formatDate(order.delivered_at)),
        optionalFieldRow(
          branding,
          forMerchant ? 'À rembourser avant le' : 'Remboursement au plus tard le',
          deadlineLabel,
        ),
      ].join(''),
    ),
  )

  const reasonHtml = String(extras.reason || '').trim()
    ? section(branding, 'Motif indiqué', messageBlock(branding, extras.reason))
    : ''

  const body = forMerchant
    ? `
    ${paragraph(
      branding,
      `Le client <strong>${escapeHtml(order.customer_email || '')}</strong> vient de déclarer
       sa rétractation depuis la page de suivi de sa commande.`,
    )}
    ${detailsHtml}
    ${reasonHtml}
    ${paragraph(
      branding,
      `Le dossier est ouvert dans l'administration, au statut « Rétractation demandée ».
       Le remboursement se déclenche depuis la fiche commande une fois le colis reçu et
       contrôlé${deadlineLabel ? `, au plus tard le <strong>${escapeHtml(deadlineLabel)}</strong>` : ''}.`,
    )}`
    : `
    ${paragraph(branding, 'Bonjour,')}
    ${paragraph(
      branding,
      `Nous avons bien reçu votre demande de rétractation. Elle est enregistrée à la date
       d'aujourd'hui et notre équipe revient vers vous pour organiser le retour.`,
    )}
    ${detailsHtml}
    ${reasonHtml}
    ${paragraph(
      branding,
      extras.returnAddress
        ? `Renvoyez la montre complète, non portée, dans son emballage d'origine avec ses
           documents à l'adresse suivante :<br><strong>${escapeHtml(extras.returnAddress)}</strong>`
        : `Renvoyez la montre complète, non portée, dans son emballage d'origine avec ses
           documents. Notre équipe vous communique l'adresse de retour par retour d'e-mail.`,
    )}
    ${paragraph(
      branding,
      deadlineLabel
        ? `Le remboursement vous sera versé sur le moyen de paiement utilisé lors de l'achat,
           au plus tard le <strong>${escapeHtml(deadlineLabel)}</strong>.`
        : `Le remboursement vous sera versé sur le moyen de paiement utilisé lors de l'achat.`,
    )}
    ${extras.trackingUrl ? buttonRow([button(branding, extras.trackingUrl, 'Suivre ma commande')]) : ''}`

  return emailShell(
    site,
    forMerchant ? 'Nouvelle demande de rétractation' : 'Votre demande de rétractation est enregistrée',
    body,
    {
      preheader: forMerchant
        ? `Rétractation — commande ${order.id} (${formatEur(order.total_cents)})`
        : `Demande enregistrée — remboursement sous 14 jours`,
    },
  )
}

/**
 * Confirmation d'un remboursement exécuté.
 *
 * Envoyé sur transition réelle du remboursement vers `succeeded` — jamais à la
 * création du Refund, qui peut encore échouer.
 *
 * @param {object} site Site registry entry
 * @param {object} order Ligne `orders`
 * @param {{ amountCents: number, refundedTotalCents?: number, isPartial?: boolean,
 *   trackingUrl?: string|null }} refund
 * @returns {string} HTML
 */
function createRefundEmail(site, order, refund) {
  const branding = resolveEmailBranding(site)
  const amountLabel = formatEur(refund.amountCents)
  const isPartial = Boolean(refund.isPartial)

  const detailsHtml = section(
    branding,
    'Détail du remboursement',
    fieldTable(
      [
        fieldRow(branding, 'Commande', order.id),
        fieldRow(branding, 'Montant remboursé', amountLabel),
        optionalFieldRow(branding, 'Total payé', formatEur(order.total_cents)),
        isPartial && refund.refundedTotalCents
          ? fieldRow(branding, 'Total déjà remboursé', formatEur(refund.refundedTotalCents))
          : '',
      ].join(''),
    ),
  )

  const body = `
    ${paragraph(branding, 'Bonjour,')}
    ${paragraph(
      branding,
      isPartial
        ? `Un remboursement de <strong>${escapeHtml(amountLabel)}</strong> vient d'être émis sur
           votre commande.`
        : `Votre commande a été remboursée pour un montant de
           <strong>${escapeHtml(amountLabel)}</strong>.`,
    )}
    ${detailsHtml}
    ${paragraph(
      branding,
      `Le versement est fait sur le moyen de paiement utilisé lors de l'achat. Selon votre
       banque, il apparaît sur votre relevé sous 5 à 10 jours ouvrés.`,
      { muted: true },
    )}
    ${refund.trackingUrl ? buttonRow([button(branding, refund.trackingUrl, 'Voir ma commande')]) : ''}`

  return emailShell(site, isPartial ? 'Remboursement partiel émis' : 'Votre remboursement est émis', body, {
    preheader: `${amountLabel} remboursés — commande ${order.id}`,
  })
}

module.exports = {
  createRefundEmail,
  createReturnRequestEmail,
}
