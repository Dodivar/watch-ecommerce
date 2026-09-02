/**
 * E-mail « une montre pour vous » de l'alerte coup de foudre.
 *
 * Autonome plutôt que bâti sur `emailShell` : celui-ci fixe `lang="fr"` et signe en français.
 * Une alerte part dans la langue où le visiteur a laissé son adresse (`watch_match_alerts.locale`),
 * donc le squelette doit être traduisible de bout en bout. Le branding, lui, vient bien de
 * `emailCommon.js` — le même que la newsletter et les e-mails de commande.
 *
 * Le lien de désinscription est obligatoire dans chaque envoi (RGPD), et doublé des en-têtes
 * `List-Unsubscribe` / `List-Unsubscribe-Post` posés par la route (RFC 8058).
 */

const { escapeHtml, resolveEmailBranding } = require('./emailCommon')

/** Au-delà, l'e-mail devient un catalogue : le reste est annoncé en une ligne. */
const MAX_WATCH_CARDS = 4

/**
 * Prix affichable, dans la langue de l'alerte. Sans prix, la ligne disparaît plutôt que
 * d'afficher « 0 € » — le catalogue tolère les montres au prix non renseigné.
 *
 * @param {{ price?: number | null, promotionPrice?: number | null }} watch
 * @param {string} lang
 * @param {string} currency
 * @returns {string}
 */
function formatWatchPrice(watch, lang, currency = 'EUR') {
  const effective = Number(watch?.promotionPrice) > 0 ? watch.promotionPrice : watch?.price
  const value = Number(effective)
  if (!Number.isFinite(value) || value <= 0) return ''
  try {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : 'en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${Math.round(value)} ${currency}`
  }
}

/**
 * Carte d'une montre : image, marque, nom, prix, lien.
 *
 * @param {object} watch     Montre (`buildMatchWatchFromRow`) enrichie d'`imageUrl` et `url`
 * @param {object} branding
 * @param {{ seeWatch: string }} copy
 * @param {string} lang
 * @param {string} currency
 * @returns {string}
 */
function watchCard(watch, branding, copy, lang, currency) {
  const price = formatWatchPrice(watch, lang, currency)
  const title = [watch.brand, watch.name].filter(Boolean).join(' ')
  const image = watch.imageUrl
    ? `<td width="120" style="padding:0 16px 0 0;vertical-align:top;">
         <a href="${escapeHtml(watch.url)}"><img src="${escapeHtml(watch.imageUrl)}" alt="${escapeHtml(title)}" width="120" style="display:block;width:120px;height:auto;border-radius:6px;" /></a>
       </td>`
    : ''

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background-color:${branding.panelColor};border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            ${image}
            <td style="vertical-align:top;">
              <div style="font-size:17px;font-weight:bold;color:${branding.textColor};line-height:1.3;">${escapeHtml(title)}</div>
              ${watch.reference ? `<div style="font-size:13px;color:${branding.mutedColor};margin-top:4px;">${escapeHtml(watch.reference)}</div>` : ''}
              ${price ? `<div style="font-size:16px;color:${branding.accentColor};font-weight:bold;margin-top:8px;">${escapeHtml(price)}</div>` : ''}
              <a href="${escapeHtml(watch.url)}" style="display:inline-block;margin-top:12px;padding:9px 16px;background-color:${branding.accentColor};color:#ffffff;text-decoration:none;border-radius:5px;font-weight:bold;font-size:13px;">${escapeHtml(copy.seeWatch)}</a>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>`
}

/**
 * @param {object} site Registry entry
 * @param {object} params
 * @param {object[]} params.watches       Montres correspondantes, avec `url` et `imageUrl`
 * @param {object} params.copy            Sortie de `buildMatchAlertEmailCopy`
 * @param {string} params.unsubscribeUrl  Lien de désinscription (obligatoire, RGPD)
 * @param {string} [params.browseUrl]     Lien vitrine vers la collection
 * @param {string} [params.currency]
 * @returns {string}
 */
function createWatchMatchAlertEmail(
  site,
  { watches, copy, unsubscribeUrl, browseUrl = '', currency = 'EUR' },
) {
  const branding = resolveEmailBranding(site)
  const shown = (watches || []).slice(0, MAX_WATCH_CARDS)

  const headerLogo = branding.logoImageUrl
    ? `<img src="${escapeHtml(branding.logoImageUrl)}" alt="${escapeHtml(branding.logoAlt)}" width="180" style="display:block;margin:0 auto;max-height:72px;max-width:200px;width:auto;height:auto;" />`
    : `<div style="font-size:26px;font-weight:bold;color:${branding.accentColor};letter-spacing:0.5px;">${escapeHtml(branding.logoText)}</div>`

  const cards = shown.map((watch) => watchCard(watch, branding, copy, copy.lang, currency)).join('')

  const moreHtml = copy.more
    ? `<p style="color:${branding.mutedColor};font-size:14px;margin:4px 0 16px;">${escapeHtml(copy.more)}</p>`
    : ''

  const browseHtml = browseUrl
    ? `<p style="margin:20px 0 0;text-align:center;">
         <a href="${escapeHtml(browseUrl)}" style="color:${branding.accentColor};font-size:14px;">${escapeHtml(copy.browse)}</a>
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="${escapeHtml(copy.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(copy.subject)}</title>
</head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:${branding.textColor};margin:0;padding:20px;background-color:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.08);overflow:hidden;">
    <div style="text-align:center;border-bottom:3px solid ${branding.accentColor};padding:28px 30px 20px;">
      ${headerLogo}
    </div>
    <div style="padding:30px;">
      <h1 style="font-size:22px;color:${branding.textColor};margin:0 0 10px;line-height:1.3;">${escapeHtml(copy.title)}</h1>
      <p style="color:${branding.mutedColor};font-size:15px;margin:0 0 22px;">${escapeHtml(copy.intro)}</p>
      ${cards}
      ${moreHtml}
      ${browseHtml}
    </div>
    <div style="text-align:center;padding:20px 30px 28px;border-top:1px solid #dddddd;color:${branding.mutedColor};font-size:13px;">
      <p style="margin:8px 0;">${escapeHtml(copy.reason)}</p>
      <p style="margin:8px 0;">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:${branding.mutedColor};text-decoration:underline;">${escapeHtml(copy.unsubscribe)}</a>
      </p>
      <p style="margin:8px 0;">${escapeHtml(branding.brandName)}</p>
    </div>
  </div>
</body>
</html>`
}

module.exports = { createWatchMatchAlertEmail, formatWatchPrice, MAX_WATCH_CARDS }
