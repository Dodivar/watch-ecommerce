/**
 * Aperçu HTML de la newsletter côté admin — reflet visuel du template backend
 * (`backend/templates/newsletterEmail.js`). L'assainissement réel du corps se
 * fait côté serveur avant envoi ; ici on affiche tel quel dans un iframe sandbox.
 *
 * @param {{ logoText?: string, accentColor?: string, headerHtml?: string, footerHtml?: string, senderName?: string }} settings
 * @param {string} bodyHtml
 * @returns {string}
 */
export function buildNewsletterPreview(settings = {}, bodyHtml = '') {
  const accent = settings.accentColor || '#d4af37'
  const logoText = settings.logoText || settings.senderName || ''
  const senderName = settings.senderName || ''

  const header = settings.headerHtml
    ? settings.headerHtml
    : `<div style="font-size:26px;font-weight:bold;color:${accent};letter-spacing:0.5px;">${logoText}</div>`

  const footer = settings.footerHtml || ''

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:16px;background:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.08);overflow:hidden;">
    <div style="text-align:center;border-bottom:3px solid ${accent};padding:28px 30px 20px;">${header}</div>
    <div style="padding:30px;color:#333;">${bodyHtml || '<p style="color:#999;">(Aucun contenu)</p>'}</div>
    <div style="text-align:center;padding:20px 30px 28px;border-top:1px solid #ddd;color:#666;font-size:13px;">
      ${footer}
      <p style="margin:8px 0;"><a href="#" style="color:#666;text-decoration:underline;">Se désinscrire</a></p>
      <p style="margin:8px 0;">${senderName}</p>
    </div>
  </div>
</body></html>`
}
