/**
 * Socle commun des e-mails transactionnels : jetons de marque + squelette HTML.
 *
 * Un e-mail doit ressembler au site qui l'envoie. Tout ce que le manifest client décrit déjà
 * pour la vitrine — couleur d'accent, beiges, surfaces d'un thème sombre, familles de
 * caractères, coins droits ou arrondis — est repris ici par `resolveEmailBranding`, de sorte
 * qu'un nouveau site hérite de son identité sans écrire une ligne de CSS d'e-mail.
 *
 * Deux contraintes propres au courrier électronique guident le reste :
 *
 * 1. **Tout est en styles en ligne, sur des tableaux.** Outlook (moteur Word) ignore `flex`,
 *    `max-width` sur `<body>` et une partie des feuilles `<style>` ; Yahoo et certains webmails
 *    suppriment carrément le bloc `<style>`. Les classes ne servent donc qu'aux media queries.
 * 2. **Les contrastes se calculent.** L'or `#d4af37` de Sauvage en texte blanc est illisible :
 *    `accentContrast` (texte posé sur l'accent) et `accentText` (accent posé sur du blanc) sont
 *    dérivés du rapport WCAG plutôt que fixés à `#ffffff`.
 *
 * La newsletter (`newsletterEmail.js`) n'utilise d'ici que `resolveEmailBranding` : sa mise en
 * page reste pilotée par les réglages client de `newsletter_settings`.
 */

const path = require('path')

const { SITES_DIR } = require('../sites/registry')
const { resolvePublicAssetPath } = require('../orders/receiptBranding')

function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* ------------------------------------------------------------------ Couleurs */

/**
 * @param {string} color `#rgb` ou `#rrggbb`
 * @returns {{ r: number, g: number, b: number } | null}
 */
function parseHexColor(color) {
  const raw = String(color || '').trim()
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(raw)
  if (short) {
    return {
      r: parseInt(short[1] + short[1], 16),
      g: parseInt(short[2] + short[2], 16),
      b: parseInt(short[3] + short[3], 16),
    }
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(raw)
  if (!long) return null
  return {
    r: parseInt(long[1], 16),
    g: parseInt(long[2], 16),
    b: parseInt(long[3], 16),
  }
}

/** @param {{ r: number, g: number, b: number }} rgb */
function toHexColor({ r, g, b }) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}

/** Luminance relative WCAG. @param {{ r: number, g: number, b: number }} rgb */
function relativeLuminance({ r, g, b }) {
  const channel = (value) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Rapport de contraste WCAG entre deux couleurs (1 → identiques, 21 → noir sur blanc).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function contrastRatio(a, b) {
  const rgbA = parseHexColor(a)
  const rgbB = parseHexColor(b)
  if (!rgbA || !rgbB) return 1
  const lumA = relativeLuminance(rgbA)
  const lumB = relativeLuminance(rgbB)
  const [light, dark] = lumA >= lumB ? [lumA, lumB] : [lumB, lumA]
  return (light + 0.05) / (dark + 0.05)
}

/**
 * Mélange `color` et `target` — sert à éclaircir (target blanc) ou assombrir (target noir).
 * @param {string} color
 * @param {string} target
 * @param {number} weight Part de `target`, entre 0 et 1
 * @returns {string}
 */
function mixColors(color, target, weight) {
  const from = parseHexColor(color)
  const to = parseHexColor(target)
  if (!from || !to) return color
  const w = Math.max(0, Math.min(1, weight))
  return toHexColor({
    r: from.r + (to.r - from.r) * w,
    g: from.g + (to.g - from.g) * w,
    b: from.b + (to.b - from.b) * w,
  })
}

/**
 * Couleur de texte lisible posée *sur* `background` — blanc ou quasi-noir, au meilleur contraste.
 * @param {string} background
 * @returns {string}
 */
function readableTextOn(background) {
  const dark = '#111111'
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, dark) ? '#ffffff' : dark
}

/**
 * Assombrit `color` juste assez pour rester lisible sur `background` (texte, liens).
 * La teinte est conservée : on n'ajoute que du noir, par paliers de 4 %.
 *
 * @param {string} color
 * @param {string} [background]
 * @param {number} [target] Rapport WCAG visé (4.5 = AA texte courant)
 * @returns {string}
 */
function ensureReadable(color, background = '#ffffff', target = 4.5) {
  if (!parseHexColor(color)) return color
  let candidate = color
  for (let step = 0; step <= 25; step += 1) {
    if (contrastRatio(candidate, background) >= target) return candidate
    candidate = mixColors(color, '#000000', step * 0.04)
  }
  return candidate
}

/* ---------------------------------------------------------------- Typographie */

/**
 * Piles de repli d'e-mail : ni `ui-sans-serif` ni `system-ui`, mal reconnus par les clients
 * de messagerie. Le socle vitrine a les siennes (`site/defaultTypography.js`) ; cette
 * duplication est assumée, comme pour `utils/googleMapsLinks.js`.
 */
const EMAIL_FONT_FALLBACKS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

/** Familles déjà présentes sur les machines des destinataires : inutile de les télécharger. */
const SYSTEM_FONT_FAMILIES = new Set([
  'arial',
  'georgia',
  'helvetica',
  'helvetica neue',
  'segoe ui',
  'tahoma',
  'times new roman',
  'trebuchet ms',
  'verdana',
])

const FONT_FORMATS = {
  '.woff2': 'woff2',
  '.woff': 'woff',
  '.ttf': 'truetype',
  '.otf': 'opentype',
}

function quoteFontFamily(family) {
  return /\s/.test(family) ? `'${family}'` : family
}

/**
 * Piles de caractères de l'e-mail + règles `@font-face` pointant sur les fichiers déjà servis
 * par la vitrine (`<production>/fonts/…`). Apple Mail, iOS et Outlook macOS les chargent ;
 * les autres retombent sur la pile de repli — d'où l'importance de la garder crédible.
 *
 * @param {Record<string, any>} raw Manifest brut du site
 * @param {string} productionUrl Sans slash final
 */
function resolveEmailTypography(raw, productionUrl) {
  const typography = raw?.theme?.typography || {}
  const fontsPath = typography.fontsPath || '/fonts/'
  const sansFamily = typography.sans?.family || ''
  const headingFamily = typography.heading?.family || sansFamily

  const stackFor = (family) =>
    family ? `${quoteFontFamily(family)}, ${EMAIL_FONT_FALLBACKS}` : EMAIL_FONT_FALLBACKS

  const rules = []
  const seen = new Set()
  for (const role of [typography.sans, typography.heading]) {
    const family = role?.family
    if (!family || !productionUrl) continue
    if (SYSTEM_FONT_FAMILIES.has(family.toLowerCase())) continue
    for (const face of role.faces || []) {
      if (!face?.file) continue
      const format = FONT_FORMATS[path.extname(face.file).toLowerCase()]
      if (!format) continue
      const src = `${productionUrl}${fontsPath}${encodeURIComponent(face.file)}`
      if (seen.has(src)) continue
      seen.add(src)
      rules.push(
        `@font-face{font-family:'${family}';font-style:${face.style || 'normal'};` +
          `font-weight:${face.weight || 400};font-display:swap;src:url('${src}') format('${format}');}`,
      )
    }
  }

  return {
    bodyStack: stackFor(sansFamily),
    headingStack: stackFor(headingFamily),
    headingWeight: typography.headingWeight || 700,
    fontFaceCss: rules.join(''),
  }
}

/* -------------------------------------------------------------------- Arrondis */

/**
 * Échelle d'arrondis de l'e-mail, calquée sur `theme.radius` de la vitrine : `sharp` rend des
 * angles droits (Jack'N'Ed, Place des Montres), l'absence de réglage des angles adoucis.
 *
 * @param {Record<string, any>} raw
 * @returns {{ card: string, panel: string, button: string, image: string }}
 */
function resolveEmailRadius(raw) {
  const radius = raw?.theme?.radius
  if (radius === 'sharp') {
    return { card: '0', panel: '0', button: '0', image: '0' }
  }
  return { card: '10px', panel: '8px', button: '6px', image: '6px' }
}

/* -------------------------------------------------------------------- Branding */

/**
 * Logo d'en-tête : uniquement un fichier **déclaré** par le client
 * (`backend.email.template.logoPath`, ou à défaut `receipt.logoPath`).
 *
 * La chaîne de repli générique de `resolveLogoPath` (favicon, icône de manifeste) ne convient
 * pas ici : ces fichiers sont livrés avec le squelette de site et sont souvent restés ceux du
 * site modèle — Jack'N'Ed signait ainsi ses e-mails du logo de Sauvage Watches. Sans logo
 * déclaré, on signe avec le nom de la marque composé dans sa propre typographie, ce qui est
 * juste dans tous les cas.
 *
 * @param {object} site Registry entry
 * @param {string} productionUrl
 * @returns {string|null}
 */
function resolveEmailLogoUrl(site, productionUrl) {
  const emailTemplate = site.config?.backend?.email?.template || {}
  if (emailTemplate.logoUrl) return String(emailTemplate.logoUrl)
  if (!productionUrl) return null

  const declared = emailTemplate.logoPath || site.config?.raw?.receipt?.logoPath
  if (!declared) return null

  const logoFsPath = resolvePublicAssetPath(site.id, declared)
  if (!logoFsPath) return null

  const publicDir = path.join(SITES_DIR, site.id, 'public')
  const relative = path.relative(publicDir, logoFsPath).replace(/\\/g, '/')
  if (!relative || relative.startsWith('..')) return null
  return `${productionUrl}/${relative}`
}

/**
 * Jetons de marque de l'e-mail, dérivés de la config site (couleurs, surfaces, typographie,
 * arrondis, logo, nom commercial).
 *
 * @param {object} site Registry entry
 */
function resolveEmailBranding(site) {
  const raw = site.config?.raw || {}
  const themeColors = raw.theme?.colors || {}
  const surfaces = raw.theme?.surfaces || {}
  const emailTemplate = site.config?.backend?.email?.template || {}

  const accentColor = emailTemplate.accentColor || themeColors.primary || '#d4af37'
  const logoText =
    emailTemplate.logoText ||
    (raw.brand?.displayName
      ? String(raw.brand.displayName).toUpperCase()
      : String(site.id || '').toUpperCase())
  const brandName =
    site.config?.backend?.email?.fromName ||
    raw.brand?.legalName ||
    raw.brand?.displayName ||
    site.id

  const productionUrl = (site.config?.urls?.production || '').replace(/\/+$/, '')
  const logoImageUrl = resolveEmailLogoUrl(site, productionUrl)

  const textColor = themeColors.textMain || '#333333'
  const mutedColor = themeColors.textMuted || '#666666'
  const cardColor = '#ffffff'

  // `colorScheme: 'dark'` décrit un site à fond de marque et contenu sur surfaces blanches
  // (Sauvage). L'e-mail reprend le même parti : bandeau et pourtour à la couleur de page,
  // carte blanche au centre — plutôt qu'un e-mail sombre, mal rendu par les webmails.
  const isDarkScheme = raw.theme?.colorScheme === 'dark'
  const pageColor = surfaces.page || themeColors.cream100 || '#f1f1f1'
  const headerColor = isDarkScheme ? surfaces.page || themeColors.primary : cardColor
  const headerTextColor = isDarkScheme
    ? themeColors.textOnDark || '#ffffff'
    : ensureReadable(accentColor, cardColor)

  return {
    // — identité
    accentColor,
    /** Accent assombri le temps qu'il faut pour rester lisible sur blanc (texte, liens). */
    accentText: ensureReadable(accentColor, cardColor),
    /** Texte posé *sur* un aplat d'accent (bouton, badge). */
    accentContrast: readableTextOn(accentColor),
    /** Accent très dilué : fonds de badge, filets. */
    accentSoft: mixColors(accentColor, '#ffffff', 0.88),
    logoText,
    brandName,
    logoImageUrl,
    logoAlt: raw.brand?.logoAlt || logoText,

    // — surfaces
    pageColor,
    cardColor,
    headerColor,
    headerTextColor,
    isDarkScheme,
    panelColor: themeColors.cream || '#f9f9f9',
    borderColor: themeColors.cream300 || '#e2e2e2',

    // — texte
    textColor,
    mutedColor,
    labelColor: themeColors.textMuted || '#555555',

    // — mise en forme
    fonts: resolveEmailTypography(raw, productionUrl),
    radius: resolveEmailRadius(raw),

    // — liens utiles au pied de page
    productionUrl,
    contactEmail: site.config?.contact?.email || raw.contact?.email || '',
    contactPhone: raw.contact?.phoneDisplay || '',
  }
}

/* --------------------------------------------------------------- Blocs de mise en page */

/**
 * Ligne « libellé / valeur » d'un panneau. Rendue en `<tr>` d'un tableau : `display:flex`,
 * qu'utilisait la version précédente, est ignoré par Outlook, qui empilait alors les champs.
 *
 * @param {object} branding Sortie de `resolveEmailBranding`
 * @param {string} label
 * @param {string} value
 * @param {{ html?: boolean, placeholder?: string }} [options] `html` : valeur déjà échappée
 * @returns {string}
 */
function fieldRow(branding, label, value, options = {}) {
  const placeholder = options.placeholder ?? 'Non renseigné'
  const raw = value === 0 ? '0' : value
  const displayValue = raw || placeholder
  const isPlaceholder = !raw
  const valueHtml = options.html ? displayValue : escapeHtml(displayValue)
  const font = branding.fonts.bodyStack

  return `
      <tr>
        <td class="fl" style="padding:5px 14px 5px 0;width:38%;font-family:${font};font-size:13px;font-weight:600;color:${branding.labelColor};vertical-align:top;line-height:1.5;">${escapeHtml(label)}</td>
        <td class="fv" style="padding:5px 0;font-family:${font};font-size:14px;color:${isPlaceholder ? branding.mutedColor : branding.textColor};vertical-align:top;line-height:1.5;">${valueHtml}</td>
      </tr>`
}

/**
 * Même chose, mais la ligne disparaît quand la valeur est vide.
 * @returns {string}
 */
function optionalFieldRow(branding, label, value, options = {}) {
  if (!String(value ?? '').trim()) return ''
  return fieldRow(branding, label, value, options)
}

/**
 * Ligne cliquable (`mailto:`, `tel:`) — l'adresse et le téléphone d'un prospect doivent
 * s'ouvrir d'un geste depuis le téléphone du commerçant.
 * @returns {string}
 */
function linkFieldRow(branding, label, value, hrefPrefix) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return fieldRow(branding, label, '')
  const href = `${hrefPrefix}${encodeURIComponent(trimmed)}`
  return fieldRow(
    branding,
    label,
    `<a href="${escapeHtml(href)}" style="color:${branding.accentText};text-decoration:none;font-weight:600;">${escapeHtml(trimmed)}</a>`,
    { html: true },
  )
}

/**
 * Tableau qui porte les `fieldRow`.
 * @param {string} rowsHtml
 * @returns {string}
 */
function fieldTable(rowsHtml) {
  if (!rowsHtml.trim()) return ''
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      <tbody>${rowsHtml}
      </tbody>
    </table>`
}

/**
 * Panneau titré : le bloc de base du corps d'un e-mail.
 *
 * @param {object} branding
 * @param {string|null} title Titre en capitales, ou `null` pour un panneau nu
 * @param {string} contentHtml
 * @returns {string}
 */
function section(branding, title, contentHtml) {
  const titleHtml = title
    ? `<div style="font-family:${branding.fonts.headingStack};font-size:14px;font-weight:${branding.fonts.headingWeight};color:${branding.accentText};text-transform:uppercase;letter-spacing:0.8px;margin:0 0 12px;">${escapeHtml(title)}</div>`
    : ''

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;margin:0 0 18px;">
      <tr>
        <td style="background-color:${branding.panelColor};border-left:3px solid ${branding.accentColor};border-radius:${branding.radius.panel};padding:18px 20px;">
          ${titleHtml}${contentHtml}
        </td>
      </tr>
    </table>`
}

/**
 * Bandeau de mise en avant : la montre dont parle le message, lisible avant toute lecture.
 * @returns {string}
 */
function heroBlock(branding, label, title) {
  if (!String(title || '').trim()) return ''
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;margin:0 0 20px;">
      <tr>
        <td align="center" style="background-color:${branding.accentSoft};border:1px solid ${branding.borderColor};border-radius:${branding.radius.panel};padding:22px 20px;">
          <div style="font-family:${branding.fonts.bodyStack};font-size:11px;font-weight:600;color:${branding.mutedColor};text-transform:uppercase;letter-spacing:1.2px;margin:0 0 8px;">${escapeHtml(label)}</div>
          <div class="hero-title" style="font-family:${branding.fonts.headingStack};font-size:24px;font-weight:${branding.fonts.headingWeight};color:${branding.accentText};line-height:1.25;">${escapeHtml(title)}</div>
        </td>
      </tr>
    </table>`
}

/**
 * Bouton d'action. Construit en tableau : un `<a>` seul perd ses marges intérieures sur Outlook.
 *
 * @param {object} branding
 * @param {string} href
 * @param {string} label
 * @param {{ variant?: 'primary' | 'secondary' }} [options]
 * @returns {string}
 */
function button(branding, href, label, options = {}) {
  if (!href) return ''
  const secondary = options.variant === 'secondary'
  const background = secondary ? branding.cardColor : branding.accentColor
  const color = secondary ? branding.accentText : branding.accentContrast
  const border = secondary ? `1px solid ${branding.accentColor}` : `1px solid ${branding.accentColor}`

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;display:inline-block;vertical-align:top;margin:0 8px 8px 0;">
      <tr>
        <td align="center" bgcolor="${background}" style="border:${border};border-radius:${branding.radius.button};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 20px;font-family:${branding.fonts.bodyStack};font-size:14px;font-weight:700;line-height:1;color:${color};text-decoration:none;border-radius:${branding.radius.button};">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`
}

/**
 * Rangée de boutons centrée.
 * @param {string[]} buttonsHtml
 * @returns {string}
 */
function buttonRow(buttonsHtml) {
  const inner = buttonsHtml.filter(Boolean).join('')
  if (!inner) return ''
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr><td align="center" style="padding:4px 0 12px;">${inner}</td></tr></table>`
}

/**
 * Message libre du visiteur, cité tel qu'il l'a écrit (retours à la ligne conservés).
 * @returns {string}
 */
function messageBlock(branding, text) {
  const content = String(text ?? '')
  if (!content.trim()) return ''
  return `<div style="font-family:${branding.fonts.bodyStack};font-size:14px;color:${branding.textColor};line-height:1.65;white-space:pre-wrap;">${escapeHtml(content)}</div>`
}

/**
 * Paragraphe courant du corps de l'e-mail.
 * @param {object} branding
 * @param {string} html Déjà échappé par l'appelant s'il contient du balisage
 * @param {{ muted?: boolean, small?: boolean }} [options]
 * @returns {string}
 */
function paragraph(branding, html, options = {}) {
  const size = options.small ? '13px' : '15px'
  const color = options.muted ? branding.mutedColor : branding.textColor
  return `<p style="font-family:${branding.fonts.bodyStack};font-size:${size};color:${color};line-height:1.65;margin:0 0 14px;">${html}</p>`
}

/* ----------------------------------------------------------------- Squelette */

/**
 * Texte d'aperçu affiché par la boîte de réception à côté de l'objet. Sans lui, les clients
 * affichent le premier texte trouvé — souvent « Voir la montre » ou le nom du logo.
 * @param {string} text
 * @returns {string}
 */
function preheaderBlock(text) {
  if (!text) return ''
  // Les entités qui suivent rembourrent l'aperçu pour que le début du corps ne déborde pas.
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:transparent;">${escapeHtml(text)}${'&#847;&zwnj;&nbsp;'.repeat(30)}</div>`
}

/**
 * En-tête : logo déclaré, sinon nom de marque composé dans la typographie du site.
 * @returns {string}
 */
function headerBlock(branding, badge) {
  const logoHtml = branding.logoImageUrl
    ? `<img src="${escapeHtml(branding.logoImageUrl)}" alt="${escapeHtml(branding.logoAlt)}" width="180" style="display:block;margin:0 auto;max-height:64px;max-width:200px;width:auto;height:auto;border:0;" />`
    : `<div style="font-family:${branding.fonts.headingStack};font-size:24px;font-weight:${branding.fonts.headingWeight};color:${branding.headerTextColor};letter-spacing:1.5px;text-transform:uppercase;line-height:1.2;">${escapeHtml(branding.logoText)}</div>`

  const badgeHtml = badge
    ? `<div style="margin:14px 0 0;"><span style="display:inline-block;padding:6px 14px;background-color:${branding.accentColor};color:${branding.accentContrast};font-family:${branding.fonts.bodyStack};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:${branding.radius.button === '0' ? '0' : '20px'};">${escapeHtml(badge)}</span></div>`
    : ''

  return `
        <tr>
          <td class="px" align="center" bgcolor="${branding.headerColor}" style="background-color:${branding.headerColor};padding:28px 32px 24px;border-bottom:3px solid ${branding.accentColor};">
            ${logoHtml}${badgeHtml}
          </td>
        </tr>`
}

/**
 * Pied de page : qui écrit, comment répondre, et depuis quel site.
 * @returns {string}
 */
function footerBlock(branding, footerNote) {
  const font = branding.fonts.bodyStack
  const line = (html) =>
    `<div style="font-family:${font};font-size:12px;color:${branding.mutedColor};line-height:1.6;margin:0 0 4px;">${html}</div>`

  const contactBits = [
    branding.contactEmail
      ? `<a href="mailto:${escapeHtml(branding.contactEmail)}" style="color:${branding.mutedColor};text-decoration:underline;">${escapeHtml(branding.contactEmail)}</a>`
      : '',
    branding.contactPhone ? escapeHtml(branding.contactPhone) : '',
  ].filter(Boolean)

  const siteLink = branding.productionUrl
    ? `<a href="${escapeHtml(branding.productionUrl)}" style="color:${branding.mutedColor};text-decoration:underline;">${escapeHtml(branding.productionUrl.replace(/^https?:\/\//, ''))}</a>`
    : ''

  return `
        <tr>
          <td class="px" align="center" style="padding:22px 32px 28px;border-top:1px solid ${branding.borderColor};">
            <div style="font-family:${branding.fonts.headingStack};font-size:14px;font-weight:${branding.fonts.headingWeight};color:${branding.textColor};margin:0 0 6px;">${escapeHtml(branding.brandName)}</div>
            ${contactBits.length ? line(contactBits.join(' · ')) : ''}
            ${siteLink ? line(siteLink) : ''}
            ${footerNote ? line(escapeHtml(footerNote)) : ''}
            ${line(`Message automatique — ${escapeHtml(new Date().toLocaleString('fr-FR'))}`)}
          </td>
        </tr>`
}

/**
 * Squelette commun : pourtour à la couleur de page du site, carte centrée de 600 px,
 * en-tête de marque, corps, pied de page.
 *
 * @param {object} site Registry entry
 * @param {string} title
 * @param {string} bodyHtml
 * @param {{ badge?: string, preheader?: string, footerNote?: string, lang?: string }} [options]
 * @returns {string}
 */
function emailShell(site, title, bodyHtml, options = {}) {
  const branding = resolveEmailBranding(site)
  const lang = options.lang || site.config?.raw?.locale || 'fr'
  const font = branding.fonts.bodyStack

  const titleHtml = `<h1 style="font-family:${branding.fonts.headingStack};font-size:22px;font-weight:${branding.fonts.headingWeight};color:${branding.textColor};line-height:1.3;margin:0 0 20px;">${escapeHtml(title)}</h1>`

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
  <style>
    ${branding.fonts.fontFaceCss}
    body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
    img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
    a{color:${branding.accentText};}
    @media only screen and (max-width:620px){
      .px{padding-left:20px!important;padding-right:20px!important;}
      .fl,.fv{display:block!important;width:100%!important;padding-right:0!important;}
      .fl{padding-bottom:0!important;}
      .fv{padding-top:0!important;}
      .hero-title{font-size:20px!important;}
      .stack{display:block!important;width:100%!important;padding:0 0 14px 0!important;}
      .stack img{width:100%!important;max-width:260px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${branding.pageColor};">
  ${preheaderBlock(options.preheader)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${branding.pageColor};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${branding.cardColor};border-radius:${branding.radius.card};overflow:hidden;">
          <tr><td style="height:4px;line-height:4px;font-size:0;background-color:${branding.accentColor};">&nbsp;</td></tr>
          ${headerBlock(branding, options.badge)}
          <tr>
            <td class="px" style="padding:30px 32px 12px;font-family:${font};color:${branding.textColor};">
              ${titleHtml}${bodyHtml}
            </td>
          </tr>
          ${footerBlock(branding, options.footerNote)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

module.exports = {
  escapeHtml,
  resolveEmailBranding,
  emailShell,
  section,
  fieldRow,
  optionalFieldRow,
  linkFieldRow,
  fieldTable,
  heroBlock,
  messageBlock,
  paragraph,
  button,
  buttonRow,
  preheaderBlock,
  /** Exposé pour les tests : vérifie qu'un couple accent / texte reste lisible. */
  contrastRatio,
}
