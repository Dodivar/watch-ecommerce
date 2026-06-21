const path = require('path')

const { SITES_DIR } = require('../sites/registry')
const { resolveLogoPath } = require('../orders/receiptBranding')

function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Branding email dérivé de la config site (couleurs thème, logo, nom commercial).
 * @param {object} site Registry entry
 */
function resolveEmailBranding(site) {
  const raw = site.config?.raw || {}
  const themeColors = raw.theme?.colors || {}
  const emailTemplate = site.config?.backend?.email?.template || {}

  const accentColor = emailTemplate.accentColor || themeColors.primary || '#d4af37'
  const logoText =
    emailTemplate.logoText ||
    (raw.brand?.displayName ? String(raw.brand.displayName).toUpperCase() : String(site.id || '').toUpperCase())
  const brandName =
    site.config?.backend?.email?.fromName ||
    raw.brand?.legalName ||
    raw.brand?.displayName ||
    site.id

  const productionUrl = (site.config?.urls?.production || '').replace(/\/+$/, '')
  let logoImageUrl = null
  const logoFsPath = resolveLogoPath(site)
  if (logoFsPath && productionUrl) {
    const publicDir = path.join(SITES_DIR, site.id, 'public')
    const relative = path.relative(publicDir, logoFsPath).replace(/\\/g, '/')
    if (relative && !relative.startsWith('..')) {
      logoImageUrl = `${productionUrl}/${relative}`
    }
  }

  return {
    accentColor,
    logoText,
    brandName,
    logoImageUrl,
    logoAlt: raw.brand?.logoAlt || logoText,
    panelColor: themeColors.cream || '#f9f9f9',
    textColor: themeColors.textMain || '#333333',
    mutedColor: themeColors.textMuted || '#666666',
    labelColor: themeColors.textMuted || '#555555',
  }
}

/**
 * @param {string} label
 * @param {string} value
 * @param {{ html?: boolean, accentColor?: string }} [options]
 */
function fieldRow(label, value, options = {}) {
  const displayValue = value || 'Non renseigné'
  const valueHtml = options.html
    ? displayValue
    : escapeHtml(displayValue)
  const accent = options.accentColor || ''

  return `
    <div class="field">
        <span class="field-label">${escapeHtml(label)}:</span>
        <span class="field-value">${valueHtml}</span>
    </div>
  `
}

function optionalFieldRow(label, value, options = {}) {
  if (!value?.trim()) return ''
  return fieldRow(label, value, options)
}

function linkFieldRow(label, value, hrefPrefix, accentColor) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return fieldRow(label, 'Non renseigné', { accentColor })
  const href = `${hrefPrefix}${encodeURIComponent(trimmed)}`
  return fieldRow(
    label,
    `<a href="${escapeHtml(href)}" style="color:${accentColor};text-decoration:none;font-weight:600;">${escapeHtml(trimmed)}</a>`,
    { html: true, accentColor },
  )
}

/**
 * @param {object} site
 * @param {string} title
 * @param {string} bodyHtml
 * @param {{ badge?: string }} [options]
 */
function emailShell(site, title, bodyHtml, options = {}) {
  const branding = resolveEmailBranding(site)
  const {
    accentColor,
    logoText,
    brandName,
    logoImageUrl,
    logoAlt,
    panelColor,
    textColor,
    mutedColor,
    labelColor,
  } = branding
  const badge = options.badge

  const headerLogo = logoImageUrl
    ? `<img src="${escapeHtml(logoImageUrl)}" alt="${escapeHtml(logoAlt)}" width="180" style="display:block;margin:0 auto 12px;max-height:72px;max-width:200px;width:auto;height:auto;" />`
    : `<div class="logo">${escapeHtml(logoText)}</div>`

  const badgeHtml = badge
    ? `<span class="type-badge" style="display:inline-block;margin-top:12px;padding:6px 14px;background-color:${accentColor};color:#ffffff;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-radius:20px;">${escapeHtml(badge)}</span>`
    : ''

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: ${textColor};
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.08);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid ${accentColor};
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 26px;
                font-weight: bold;
                color: ${accentColor};
                margin-bottom: 10px;
                letter-spacing: 0.5px;
            }
            .title {
                font-size: 22px;
                color: ${textColor};
                margin: 0;
                line-height: 1.3;
            }
            .section {
                margin-bottom: 22px;
                padding: 16px 18px;
                background-color: ${panelColor};
                border-radius: 8px;
                border-left: 4px solid ${accentColor};
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: ${accentColor};
                margin-bottom: 14px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
            }
            .field {
                margin-bottom: 10px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px 10px;
            }
            .field-label {
                font-weight: 600;
                color: ${labelColor};
                min-width: 148px;
            }
            .field-value {
                color: ${textColor};
                flex: 1;
            }
            .watch-hero {
                text-align: center;
                margin-bottom: 22px;
                padding: 22px 18px;
                background-color: ${panelColor};
                border-radius: 8px;
                border: 1px solid ${accentColor}33;
            }
            .watch-hero-label {
                font-size: 12px;
                font-weight: 600;
                color: ${mutedColor};
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }
            .watch-hero-title {
                font-size: 24px;
                font-weight: bold;
                color: ${accentColor};
                line-height: 1.25;
            }
            .message-text {
                color: ${textColor};
                white-space: pre-wrap;
                line-height: 1.65;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #dddddd;
                color: ${mutedColor};
                font-size: 13px;
            }
            .cta {
                display: inline-block;
                margin-top: 12px;
                padding: 10px 18px;
                background-color: ${accentColor};
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
            a {
                color: ${accentColor};
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${headerLogo}
                <h1 class="title">${escapeHtml(title)}</h1>
                ${badgeHtml}
            </div>
            ${bodyHtml}
            <div class="footer">
                <p>Email envoyé automatiquement depuis le site ${escapeHtml(brandName)}</p>
                <p>Date : ${new Date().toLocaleString('fr-FR')}</p>
            </div>
        </div>
    </body>
    </html>
  `
}

module.exports = {
  escapeHtml,
  resolveEmailBranding,
  emailShell,
  fieldRow,
  optionalFieldRow,
  linkFieldRow,
}
