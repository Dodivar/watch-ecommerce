const sanitizeHtml = require('sanitize-html')

const { escapeHtml, resolveEmailBranding } = require('./emailCommon')

/**
 * Balises/attributs autorisés dans le corps WYSIWYG d'une newsletter.
 * Volontairement restrictif : correspond à ce que produit l'éditeur Tiptap
 * (StarterKit + Link) et neutralise tout HTML injecté malveillant.
 */
const SANITIZE_OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
    'a', 'img', 'hr', 'span', 'div', 'code', 'pre',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    span: ['style'],
    p: ['style'],
    div: ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // N'autorise que des propriétés CSS inoffensives (couleur, alignement).
  allowedStyles: {
    '*': {
      color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z]+$/i],
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'font-weight': [/^bold$/, /^normal$/, /^\d+$/],
      'text-decoration': [/^underline$/, /^line-through$/, /^none$/],
    },
  },
  transformTags: {
    // Force l'ouverture des liens dans un nouvel onglet + rel sécurisé.
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, true),
  },
}

/**
 * Nettoie le corps HTML issu de l'éditeur admin avant envoi.
 * @param {string} html
 * @returns {string}
 */
function sanitizeNewsletterHtml(html) {
  if (!html) return ''
  return sanitizeHtml(String(html), SANITIZE_OPTIONS)
}

/**
 * Réglages par défaut d'une newsletter, dérivés de la config email du site.
 * Utilisé pour amorcer `newsletter_settings` à la première ouverture.
 * @param {object} site Registry entry
 */
function defaultNewsletterSettings(site) {
  const branding = resolveEmailBranding(site)
  return {
    logo_text: branding.logoText,
    accent_color: branding.accentColor,
    header_html: '',
    footer_html: '',
    sender_name: branding.brandName,
    reply_to: site.config?.backend?.email?.fromAddress || '',
  }
}

/**
 * Construit l'email HTML complet d'une newsletter avec en-tête/pied de page
 * de marque (éditables par le client) et lien de désinscription obligatoire.
 *
 * @param {object} site Registry entry
 * @param {object} params
 * @param {string} params.subject
 * @param {string} params.bodyHtml Corps WYSIWYG (sera assaini)
 * @param {object} [params.settings] Ligne newsletter_settings
 * @param {string} params.unsubscribeUrl Lien de désinscription (obligatoire, RGPD)
 * @returns {string}
 */
function createNewsletterEmail(site, { subject, bodyHtml, settings = {}, unsubscribeUrl }) {
  const branding = resolveEmailBranding(site)
  const accent = settings.accent_color || branding.accentColor
  const logoText = settings.logo_text || branding.logoText
  const senderName = settings.sender_name || branding.brandName
  const textColor = branding.textColor
  const mutedColor = branding.mutedColor

  const logoBlock = branding.logoImageUrl
    ? `<img src="${escapeHtml(branding.logoImageUrl)}" alt="${escapeHtml(branding.logoAlt)}" width="180" style="display:block;margin:0 auto;max-height:72px;max-width:200px;width:auto;height:auto;" />`
    : `<div style="font-size:26px;font-weight:bold;color:${accent};letter-spacing:0.5px;">${escapeHtml(logoText)}</div>`

  // En-tête : HTML personnalisé du client, sinon logo par défaut.
  const headerHtml = settings.header_html
    ? sanitizeNewsletterHtml(settings.header_html)
    : logoBlock

  const safeBody = sanitizeNewsletterHtml(bodyHtml)

  // Pied de page : HTML client + désinscription obligatoire + identité expéditeur.
  const customFooter = settings.footer_html ? sanitizeNewsletterHtml(settings.footer_html) : ''
  const unsubscribeHtml = unsubscribeUrl
    ? `<p style="margin:8px 0;">
         <a href="${escapeHtml(unsubscribeUrl)}" style="color:${mutedColor};text-decoration:underline;">Se désinscrire</a>
       </p>`
    : ''

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject || senderName)}</title>
</head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:${textColor};margin:0;padding:20px;background-color:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.08);overflow:hidden;">
    <div style="text-align:center;border-bottom:3px solid ${accent};padding:28px 30px 20px;">
      ${headerHtml}
    </div>
    <div style="padding:30px;color:${textColor};">
      ${safeBody}
    </div>
    <div style="text-align:center;padding:20px 30px 28px;border-top:1px solid #dddddd;color:${mutedColor};font-size:13px;">
      ${customFooter}
      ${unsubscribeHtml}
      <p style="margin:8px 0;">${escapeHtml(senderName)}</p>
    </div>
  </div>
</body>
</html>`
}

module.exports = {
  createNewsletterEmail,
  sanitizeNewsletterHtml,
  defaultNewsletterSettings,
}
