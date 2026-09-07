const {
  escapeHtml,
  emailShell,
  section,
  paragraph,
  button,
  buttonRow,
  lineItemsTable,
  resolveEmailBranding,
} = require('./emailCommon')

function formatEur(cents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100,
  )
}

/**
 * Email de relance d'un panier abandonné : récapitulatif des montres de la
 * commande draft et bouton de reprise du checkout (lien signé, voir
 * `backend/orders/recovery.js`).
 *
 * @param {object} site Site registry entry
 * @param {object} order Ligne `orders` (draft / pending_payment)
 * @param {object[]} lines Lignes `order_lines`
 * @param {string} resumeUrl Lien de reprise `/checkout?order=…&token=…`
 * @returns {string} HTML
 */
function createAbandonedCheckoutEmail(site, order, lines, resumeUrl) {
  const branding = resolveEmailBranding(site)

  const subtotalCents = (lines || []).reduce(
    (sum, l) => sum + (l.unit_price_cents || 0) * (Number(l.quantity) || 1),
    0,
  )

  // `image_url` est l'instantané pris sur la fiche au moment de la commande : `order_lines` le
  // porte déjà, chargé par `orders/recovery.js`. Une relance de panier se regarde plus qu'elle
  // ne se lit — c'est la photo de la montre qui rappelle au client ce qu'il a laissé.
  const selectionHtml = lineItemsTable(
    branding,
    (lines || []).map((l) => ({
      name: l.name,
      reference: l.reference,
      imageUrl: l.image_url,
      quantity: Number(l.quantity) || 1,
      amountLabel: formatEur(l.unit_price_cents * (Number(l.quantity) || 1)),
    })),
    { totals: [{ label: 'Sous-total', amountLabel: formatEur(subtotalCents), strong: true }] },
  )

  const body = `
    ${paragraph(branding, 'Bonjour,')}
    ${paragraph(
      branding,
      `Vous avez commencé une commande sur ${escapeHtml(branding.brandName)} sans la finaliser.
       Votre sélection vous attend — vous pouvez reprendre votre commande là où vous l'aviez
       laissée, en un clic.`,
    )}
    ${section(branding, 'Votre sélection', selectionHtml)}
    ${buttonRow([button(branding, resumeUrl, 'Reprendre ma commande')])}
    ${paragraph(
      branding,
      `Ce lien est valable 48 heures. La disponibilité des montres n'est pas garantie jusqu'à la
       finalisation du paiement. Si vous avez déjà finalisé votre commande ou si vous ne souhaitez
       pas donner suite, vous pouvez ignorer cet email.`,
      { muted: true, small: true },
    )}
  `

  return emailShell(site, 'Votre commande vous attend', body, {
    preheader: `Votre sélection vous attend — ${formatEur(subtotalCents)}`,
  })
}

module.exports = {
  createAbandonedCheckoutEmail,
}
