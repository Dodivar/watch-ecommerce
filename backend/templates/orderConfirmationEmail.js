function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatEur(cents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100,
  )
}

const DISCOUNT_TYPE_LABELS = {
  percent: 'Pourcentage',
  fixed: 'Montant fixe',
  free_shipping: 'Livraison offerte',
}

/**
 * Construit le bloc HTML de l'adresse de livraison.
 * @param {object|null} address
 * @returns {string}
 */
function buildAddressHtml(address) {
  if (!address || typeof address !== 'object') return ''
  const recipient = [address.firstName, address.lastName].filter(Boolean).join(' ').trim()
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ').trim()
  const parts = [recipient, address.line1, address.line2, cityLine, address.country]
    .map((p) => String(p || '').trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  return parts.map((p) => escapeHtml(p)).join('<br>')
}

/**
 * @param {object} site Site registry entry
 * @param {object} order
 * @param {object[]} lines
 * @param {boolean} forMerchant
 * @param {{ shipping?: object|null, discount?: object|null, followUpUrl?: string|null }} [extras]
 */
function createOrderConfirmationEmail(site, order, lines, forMerchant = false, extras = {}) {
  const accent = site.config.backend.email.template.accentColor
  const logoText = site.config.backend.email.template.logoText
  const brandName = site.config.backend.email.fromName
  const title = forMerchant ? 'Nouvelle commande en ligne' : 'Confirmation de votre commande'

  const shipping = extras.shipping || null
  const discount = extras.discount || null
  // Lien de suivi durable — la trace que le client garde de sa commande, sans compte
  // ni mot de passe. Réservé à l'email client : le commerçant passe par l'admin.
  const followUpUrl = !forMerchant && extras.followUpUrl ? String(extras.followUpUrl) : ''

  const linesHtml = (lines || [])
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(l.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(l.reference || '')}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">×${l.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatEur(l.unit_price_cents * l.quantity)}</td>
      </tr>`,
    )
    .join('')

  const hasDiscount = Boolean(discount) || (order.discount_cents || 0) > 0
  const discountCents = discount?.discount_cents ?? order.discount_cents ?? 0

  const summaryHtml = `
    <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;font-size:14px;color:#444;">
      <tr>
        <td style="padding:4px 0;">Sous-total</td>
        <td style="padding:4px 0;text-align:right;">${formatEur(order.subtotal_cents)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;">Livraison</td>
        <td style="padding:4px 0;text-align:right;">${formatEur(order.shipping_cents)}</td>
      </tr>
      ${
        hasDiscount
          ? `<tr style="color:#15803d;">
        <td style="padding:4px 0;">Réduction</td>
        <td style="padding:4px 0;text-align:right;">-${formatEur(discountCents)}</td>
      </tr>`
          : ''
      }
      <tr style="font-weight:bold;color:#111;border-top:1px solid #eee;">
        <td style="padding:8px 0 0;">Total</td>
        <td style="padding:8px 0 0;text-align:right;">${formatEur(order.total_cents)}</td>
      </tr>
    </table>`

  const discountHtml = hasDiscount
    ? `
    <div style="margin:0 0 24px;">
      <h2 style="font-size:15px;color:#111;margin:0 0 8px;">Réduction appliquée</h2>
      ${discount?.promo_code ? `<p style="color:#444;margin:2px 0;">Code promo : <strong>${escapeHtml(discount.promo_code)}</strong></p>` : ''}
      ${
        discount?.discount_type
          ? `<p style="color:#444;margin:2px 0;">Type : ${escapeHtml(DISCOUNT_TYPE_LABELS[discount.discount_type] || discount.discount_type)}</p>`
          : ''
      }
      <p style="color:#15803d;margin:2px 0;">Montant économisé : <strong>-${formatEur(discountCents)}</strong></p>
    </div>`
    : ''

  const followUpHtml = followUpUrl
    ? `
    <div style="margin:0 0 24px;padding:16px;border:1px solid #eee;border-radius:8px;background:#fafafa;">
      <h2 style="font-size:15px;color:#111;margin:0 0 8px;">Suivre votre commande</h2>
      <p style="color:#444;margin:0 0 12px;line-height:1.5;">
        Retrouvez à tout moment le détail de votre commande et retéléchargez votre reçu
        depuis ce lien — sans compte ni mot de passe. Conservez cet email.
      </p>
      <a
        href="${escapeHtml(followUpUrl)}"
        style="display:inline-block;padding:10px 18px;background:${accent};color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;"
      >Voir ma commande</a>
    </div>`
    : ''

  const addressHtml = buildAddressHtml(order.shipping_address)
  const shippingHtml =
    shipping || addressHtml
      ? `
    <div style="margin:0 0 24px;">
      <h2 style="font-size:15px;color:#111;margin:0 0 8px;">Livraison</h2>
      ${
        shipping
          ? `<p style="color:#444;margin:2px 0;">Méthode : ${escapeHtml(shipping.method_label || shipping.method_type || '')}</p>`
          : ''
      }
      ${
        addressHtml
          ? `<p style="color:#444;margin:8px 0 2px;font-weight:bold;">Adresse de livraison</p>
      <p style="color:#444;margin:2px 0;line-height:1.5;">${addressHtml}</p>`
          : ''
      }
    </div>`
      : ''

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:18px;font-weight:bold;color:${accent};">${escapeHtml(logoText)}</span>
    </div>
    <h1 style="font-size:22px;color:#111;margin:0 0 16px;">${escapeHtml(title)}</h1>
    <p style="color:#444;">Commande <strong>${escapeHtml(order.id)}</strong></p>
    ${order.customer_email ? `<p style="color:#444;">Client : ${escapeHtml(order.customer_email)}</p>` : ''}
    ${order.customer_phone ? `<p style="color:#444;">Téléphone : ${escapeHtml(order.customer_phone)}</p>` : ''}
    <table style="width:100%;border-collapse:collapse;margin:24px 0;">
      <thead>
        <tr style="color:#666;font-size:12px;text-transform:uppercase;">
          <th style="text-align:left;padding-bottom:8px;">Article</th>
          <th style="text-align:right;padding-bottom:8px;">Réf.</th>
          <th style="text-align:right;padding-bottom:8px;">Qté</th>
          <th style="text-align:right;padding-bottom:8px;">Montant</th>
        </tr>
      </thead>
      <tbody>${linesHtml}</tbody>
    </table>
    ${summaryHtml}
    ${discountHtml}
    ${shippingHtml}
    ${followUpHtml}
    <p style="color:#888;font-size:12px;margin-top:32px;">${escapeHtml(brandName)}</p>
  </div>
</body>
</html>`
}

module.exports = {
  createOrderConfirmationEmail,
  formatEur,
}
