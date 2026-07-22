const { escapeHtml, emailShell, resolveEmailBranding } = require('./emailCommon')

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
  const { accentColor, brandName } = resolveEmailBranding(site)

  const linesHtml = (lines || [])
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(l.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">×${Number(l.quantity) || 1}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatEur(l.unit_price_cents * (Number(l.quantity) || 1))}</td>
      </tr>`,
    )
    .join('')

  const subtotalCents = (lines || []).reduce(
    (sum, l) => sum + (l.unit_price_cents || 0) * (Number(l.quantity) || 1),
    0,
  )

  const body = `
    <p class="message-text">Bonjour,</p>
    <p class="message-text">
      Vous avez commencé une commande sur ${escapeHtml(brandName)} sans la finaliser.
      Votre sélection vous attend — vous pouvez reprendre votre commande là où vous
      l'aviez laissée, en un clic.
    </p>
    <div class="section">
      <div class="section-title">Votre sélection</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${linesHtml}
        <tr style="font-weight:bold;">
          <td style="padding:10px 0 0;" colspan="2">Sous-total</td>
          <td style="padding:10px 0 0;text-align:right;">${formatEur(subtotalCents)}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a class="cta" href="${escapeHtml(resumeUrl)}" style="background-color:${accentColor};color:#ffffff;">
        Reprendre ma commande
      </a>
    </div>
    <p class="message-text" style="font-size:13px;color:#777;">
      Ce lien est valable 48 heures. La disponibilité des montres n'est pas garantie
      jusqu'à la finalisation du paiement. Si vous avez déjà finalisé votre commande
      ou si vous ne souhaitez pas donner suite, vous pouvez ignorer cet email.
    </p>
  `

  return emailShell(site, 'Votre commande vous attend', body)
}

module.exports = {
  createAbandonedCheckoutEmail,
}
