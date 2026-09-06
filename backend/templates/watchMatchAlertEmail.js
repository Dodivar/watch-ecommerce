/**
 * E-mail « une montre pour vous » de l'alerte coup de foudre.
 *
 * Autonome plutôt que bâti sur `emailShell` : celui-ci fixe la langue du site et signe en
 * français. Une alerte part dans la langue où le visiteur a laissé son adresse
 * (`watch_match_alerts.locale`), donc le squelette doit être traduisible de bout en bout.
 * Le branding, lui, vient bien de `emailCommon.js` — le même que la newsletter et les e-mails
 * de commande : couleurs de la marque, beiges, typographie du site, coins droits ou arrondis.
 *
 * C'est le seul e-mail que le destinataire n'a pas demandé à l'instant : il doit se lire d'un
 * coup d'œil sur un téléphone (une carte par montre, prix lisible, un bouton par montre) et
 * porter son lien de désinscription sans le faire chercher.
 *
 * Le lien de désinscription est obligatoire dans chaque envoi (RGPD), et doublé des en-têtes
 * `List-Unsubscribe` / `List-Unsubscribe-Post` posés par la route (RFC 8058).
 */

const { escapeHtml, resolveEmailBranding, preheaderBlock } = require('./emailCommon')

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
 * @param {object} branding  Sortie de `resolveEmailBranding`
 * @param {{ seeWatch: string }} copy
 * @param {string} lang
 * @param {string} currency
 * @returns {string}
 */
function watchCard(watch, branding, copy, lang, currency) {
  const price = formatWatchPrice(watch, lang, currency)
  const title = [watch.brand, watch.name].filter(Boolean).join(' ')
  const font = branding.fonts.bodyStack

  const image = watch.imageUrl
    ? `<td class="stack" width="132" style="width:132px;padding:0 18px 0 0;vertical-align:top;">
         <a href="${escapeHtml(watch.url)}"><img src="${escapeHtml(watch.imageUrl)}" alt="${escapeHtml(title)}" width="132" style="display:block;width:132px;height:auto;border:0;border-radius:${branding.radius.image};" /></a>
       </td>`
    : ''

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;margin:0 0 16px;">
      <tr>
        <td style="background-color:${branding.panelColor};border:1px solid ${branding.borderColor};border-radius:${branding.radius.panel};padding:18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              ${image}
              <td class="stack" style="vertical-align:top;">
                <div style="font-family:${branding.fonts.headingStack};font-size:18px;font-weight:${branding.fonts.headingWeight};color:${branding.textColor};line-height:1.3;">
                  <a href="${escapeHtml(watch.url)}" style="color:${branding.textColor};text-decoration:none;">${escapeHtml(title)}</a>
                </div>
                ${watch.reference ? `<div style="font-family:${font};font-size:13px;color:${branding.mutedColor};margin-top:5px;">${escapeHtml(watch.reference)}</div>` : ''}
                ${price ? `<div style="font-family:${font};font-size:17px;font-weight:700;color:${branding.accentText};margin-top:10px;">${escapeHtml(price)}</div>` : ''}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin-top:14px;">
                  <tr>
                    <td align="center" bgcolor="${branding.accentColor}" style="border-radius:${branding.radius.button};">
                      <a href="${escapeHtml(watch.url)}" style="display:inline-block;padding:10px 18px;font-family:${font};font-size:13px;font-weight:700;line-height:1;color:${branding.accentContrast};text-decoration:none;border-radius:${branding.radius.button};">${escapeHtml(copy.seeWatch)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
  const font = branding.fonts.bodyStack
  const shown = (watches || []).slice(0, MAX_WATCH_CARDS)

  const headerLogo = branding.logoImageUrl
    ? `<img src="${escapeHtml(branding.logoImageUrl)}" alt="${escapeHtml(branding.logoAlt)}" width="180" style="display:block;margin:0 auto;max-height:64px;max-width:200px;width:auto;height:auto;border:0;" />`
    : `<div style="font-family:${branding.fonts.headingStack};font-size:24px;font-weight:${branding.fonts.headingWeight};color:${branding.headerTextColor};letter-spacing:1.5px;text-transform:uppercase;line-height:1.2;">${escapeHtml(branding.logoText)}</div>`

  const cards = shown.map((watch) => watchCard(watch, branding, copy, copy.lang, currency)).join('')

  const moreHtml = copy.more
    ? `<p style="font-family:${font};color:${branding.mutedColor};font-size:14px;margin:4px 0 18px;">${escapeHtml(copy.more)}</p>`
    : ''

  const browseHtml = browseUrl
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
         <tr><td align="center" style="padding:8px 0 4px;">
           <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
             <tr><td align="center" bgcolor="${branding.cardColor}" style="border:1px solid ${branding.accentColor};border-radius:${branding.radius.button};">
               <a href="${escapeHtml(browseUrl)}" style="display:inline-block;padding:11px 20px;font-family:${font};font-size:14px;font-weight:700;line-height:1;color:${branding.accentText};text-decoration:none;border-radius:${branding.radius.button};">${escapeHtml(copy.browse)}</a>
             </td></tr>
           </table>
         </td></tr>
       </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="${escapeHtml(copy.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(copy.subject)}</title>
  <style>
    ${branding.fonts.fontFaceCss}
    body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
    img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
    a{color:${branding.accentText};}
    @media only screen and (max-width:620px){
      .px{padding-left:20px!important;padding-right:20px!important;}
      .stack{display:block!important;width:100%!important;padding:0 0 14px 0!important;}
      .stack img{width:100%!important;max-width:260px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${branding.pageColor};">
  ${preheaderBlock(copy.intro)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${branding.pageColor};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${branding.cardColor};border-radius:${branding.radius.card};overflow:hidden;">
          <tr><td style="height:4px;line-height:4px;font-size:0;background-color:${branding.accentColor};">&nbsp;</td></tr>
          <tr>
            <td class="px" align="center" bgcolor="${branding.headerColor}" style="background-color:${branding.headerColor};padding:28px 32px 24px;border-bottom:3px solid ${branding.accentColor};">
              ${headerLogo}
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:30px 32px 12px;">
              <h1 style="font-family:${branding.fonts.headingStack};font-size:22px;font-weight:${branding.fonts.headingWeight};color:${branding.textColor};margin:0 0 10px;line-height:1.3;">${escapeHtml(copy.title)}</h1>
              <p style="font-family:${font};color:${branding.mutedColor};font-size:15px;line-height:1.6;margin:0 0 22px;">${escapeHtml(copy.intro)}</p>
              ${cards}
              ${moreHtml}
              ${browseHtml}
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:22px 32px 28px;border-top:1px solid ${branding.borderColor};">
              <div style="font-family:${branding.fonts.headingStack};font-size:14px;font-weight:${branding.fonts.headingWeight};color:${branding.textColor};margin:0 0 6px;">${escapeHtml(branding.brandName)}</div>
              <p style="font-family:${font};margin:6px 0;font-size:12px;color:${branding.mutedColor};line-height:1.6;">${escapeHtml(copy.reason)}</p>
              <p style="font-family:${font};margin:6px 0;font-size:12px;">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:${branding.mutedColor};text-decoration:underline;">${escapeHtml(copy.unsubscribe)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

module.exports = { createWatchMatchAlertEmail, formatWatchPrice, MAX_WATCH_CARDS }
