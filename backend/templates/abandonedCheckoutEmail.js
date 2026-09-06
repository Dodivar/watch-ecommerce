const {
  escapeHtml,
  emailShell,
  section,
  paragraph,
  button,
  buttonRow,
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
  const font = branding.fonts.bodyStack

  const cell = `padding:9px 0;border-bottom:1px solid ${branding.borderColor};font-family:${font};font-size:14px;color:${branding.textColor};`
  const linesHtml = (lines || [])
    .map(
      (l) => `
      <tr>
        <td style="${cell}">${escapeHtml(l.name)}</td>
        <td style="${cell}text-align:right;color:${branding.mutedColor};">×${Number(l.quantity) || 1}</td>
        <td style="${cell}text-align:right;white-space:nowrap;">${formatEur(l.unit_price_cents * (Number(l.quantity) || 1))}</td>
      </tr>`,
    )
    .join('')

  const subtotalCents = (lines || []).reduce(
    (sum, l) => sum + (l.unit_price_cents || 0) * (Number(l.quantity) || 1),
    0,
  )

  const totalCell = `padding:12px 0 0;font-family:${font};font-size:15px;font-weight:700;color:${branding.textColor};`
  const selectionHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${linesHtml}
      <tr>
        <td style="${totalCell}" colspan="2">Sous-total</td>
        <td style="${totalCell}text-align:right;white-space:nowrap;">${formatEur(subtotalCents)}</td>
      </tr>
    </table>`

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
