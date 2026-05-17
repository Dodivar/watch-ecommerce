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

/**
 * @param {object} site Site registry entry
 * @param {object} order
 * @param {object[]} lines
 * @param {boolean} forMerchant
 */
function createOrderConfirmationEmail(site, order, lines, forMerchant = false) {
  const accent = site.config.backend.email.template.accentColor
  const logoText = site.config.backend.email.template.logoText
  const brandName = site.config.backend.email.fromName
  const title = forMerchant ? 'Nouvelle commande en ligne' : 'Confirmation de votre commande'

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
    <p style="text-align:right;color:#111;"><strong>Total : ${formatEur(order.total_cents)}</strong></p>
    <p style="color:#888;font-size:12px;margin-top:32px;">${escapeHtml(brandName)}</p>
  </div>
</body>
</html>`
}

module.exports = {
  createOrderConfirmationEmail,
  formatEur,
}
