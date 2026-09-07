/**
 * Templates d'email pour les formulaires « estimation », « recherche personnalisée » et « contact ».
 *
 * Ce sont des courriers de prospect, lus par le commerçant, souvent sur un téléphone, entre deux
 * clients : la mise en page est donc pensée pour qu'on sache en trois secondes de qui il s'agit et
 * ce qu'il veut, et pour qu'on puisse répondre ou appeler d'un geste (boutons `mailto:` / `tel:`).
 *
 * Le branding (logo, accent, beiges, typographie, arrondis) est dérivé de la config site par
 * `resolveEmailBranding` — voir `emailCommon.js`.
 */

const {
  escapeHtml,
  emailShell,
  section,
  fieldRow,
  fieldTable,
  linkFieldRow,
  heroBlock,
  messageBlock,
  button,
  buttonRow,
  resolveEmailBranding,
} = require('./emailCommon')

const TYPE_BADGES = {
  estimation: 'Estimation',
  search: 'Recherche personnalisée',
  contact: 'Contact',
}

/**
 * @param {string | number | null | undefined} value
 */
function formatBudgetAmount(value) {
  if (value == null || value === '') return null
  const num = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, ''))
  if (Number.isNaN(num)) return `${value} €`
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * @param {string | number | null | undefined} min
 * @param {string | number | null | undefined} max
 */
function formatBudgetRange(min, max) {
  const minLabel = formatBudgetAmount(min)
  const maxLabel = formatBudgetAmount(max)
  if (minLabel && maxLabel) return `${minLabel} à ${maxLabel}`
  if (minLabel) return `À partir de ${minLabel}`
  if (maxLabel) return `Jusqu'à ${maxLabel}`
  return null
}

/**
 * Nom d'usage du prospect, pour l'aperçu et l'objet de la réponse.
 * @param {Record<string, any>} formData
 */
function contactName(formData) {
  return [formData.nickname, formData.name]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * Objet pré-rempli de la réponse : le commerçant tape sa réponse, pas l'en-tête.
 * @param {string} type
 * @param {string} watchTitle
 */
function replySubject(type, watchTitle) {
  if (type === 'contact') return 'Votre message'
  const suffix = watchTitle ? ` — ${watchTitle}` : ''
  return type === 'estimation'
    ? `Votre demande d'estimation${suffix}`
    : `Votre recherche personnalisée${suffix}`
}

/**
 * Ligne d'aperçu en boîte de réception : qui, quelle montre, quel budget.
 * @param {Record<string, any>} formData
 * @param {string} watchTitle
 */
function buildPreheader(formData, watchTitle) {
  const parts = [contactName(formData) || formData.email]
  if (watchTitle) parts.push(watchTitle)
  const budget = formatBudgetRange(formData.budget_min, formData.budget_max)
  if (budget) parts.push(budget)
  else if (formData.message) parts.push(String(formData.message).replace(/\s+/g, ' ').slice(0, 90))
  return parts.filter(Boolean).join(' · ')
}

/**
 * @param {object} site Site normalisé (registry.byId).
 * @param {object} formData
 * @returns {string} HTML
 */
function createEmailTemplate(site, formData) {
  const isContact = formData.type === 'contact'
  const isEstimation = formData.type === 'estimation'
  const branding = resolveEmailBranding(site)

  const title = isContact
    ? 'Nouveau message de contact'
    : isEstimation
      ? "Nouvelle demande d'estimation"
      : 'Nouvelle recherche personnalisée'

  const badge = TYPE_BADGES[formData.type] || ''

  const watchBrand = String(formData.brand || '').trim()
  const watchModel = String(formData.model || '').trim()
  const watchTitle = [watchBrand, watchModel].filter(Boolean).join(' ')

  const watchHeroHtml = isContact ? '' : heroBlock(branding, 'Montre concernée', watchTitle)

  // Répondre / appeler en un geste : c'est tout l'intérêt de recevoir le prospect par e-mail.
  const email = String(formData.email || '').trim()
  const tel = String(formData.tel || '').trim()
  const actionsHtml = buttonRow([
    email
      ? button(
          branding,
          `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(replySubject(formData.type, watchTitle))}`,
          `Répondre à ${contactName(formData) || email}`,
        )
      : '',
    tel ? button(branding, `tel:${encodeURIComponent(tel)}`, 'Appeler', { variant: 'secondary' }) : '',
  ])

  const contactRows = isContact
    ? `
        ${fieldRow(branding, 'Nom', formData.name)}
        ${linkFieldRow(branding, 'Email', formData.email, 'mailto:')}
        ${linkFieldRow(branding, 'Téléphone', formData.tel, 'tel:')}
    `
    : `
        ${fieldRow(branding, 'Prénom', formData.nickname)}
        ${fieldRow(branding, 'Nom', formData.name)}
        ${linkFieldRow(branding, 'Email', formData.email, 'mailto:')}
        ${linkFieldRow(branding, 'Téléphone', formData.tel, 'tel:')}
        ${fieldRow(branding, 'Préférence de contact', formData.contact_mode || 'Pas de préférence')}
    `

  const budget = formatBudgetRange(formData.budget_min, formData.budget_max)
  const watchRows = isEstimation
    ? `
        ${fieldRow(branding, 'Marque', watchBrand)}
        ${fieldRow(branding, 'Modèle', watchModel)}
        ${fieldRow(branding, 'Numéro de série', formData.serienumber)}
        ${fieldRow(branding, 'Année', formData.year)}
        ${fieldRow(branding, 'État général', formData.etat || formData.condition)}
        ${fieldRow(branding, 'État de possession', formData.possession)}
    `
    : `
        ${fieldRow(branding, 'Marque', watchBrand)}
        ${fieldRow(branding, 'Modèle', watchModel)}
        ${budget ? fieldRow(branding, 'Budget', budget) : ''}
        ${fieldRow(branding, 'État souhaité', formData.condition)}
        ${formData.delai ? fieldRow(branding, 'Délai souhaité', formData.delai) : ''}
    `

  const watchDetailsHtml = isContact
    ? ''
    : section(branding, 'Détails de la montre', fieldTable(watchRows))

  const messageHtml = formData.message
    ? section(branding, 'Message du client', messageBlock(branding, formData.message))
    : ''

  const bodyHtml = `
    ${watchHeroHtml}
    ${section(branding, 'Informations de contact', fieldTable(contactRows))}
    ${actionsHtml}
    ${watchDetailsHtml}
    ${messageHtml}
  `

  return emailShell(site, title, bodyHtml, {
    badge,
    preheader: buildPreheader(formData, watchTitle),
  })
}

/**
 * Pendant texte du template HTML (fallback).
 */
function formatEmailContent(formData) {
  if (formData.type === 'contact') {
    let content = ''
    content += `Nom: ${formData.name}\n`
    content += `Email: ${formData.email}\n`
    content += `Téléphone: ${formData.tel || 'Non renseigné'}\n`
    content += `\nMessage: ${formData.message}\n`
    return content
  }

  let content = ''
  content += `Prénom: ${formData.nickname}\n`
  content += `Nom: ${formData.name}\n`
  content += `Email: ${formData.email}\n`
  content += `Téléphone: ${formData.tel}\n`
  content += `Préférence de contact: ${formData.contact_mode || 'pas de préférence'}\n`

  content += `\nMarque: ${formData.brand}\n`
  content += `Modèle: ${formData.model}\n`

  if (formData.type === 'estimation') {
    content += `Numéro de série: ${formData.serienumber}\n`
    content += `Année: ${formData.year}\n`
    content += `État général: ${formData.etat || formData.condition}\n`
    content += `État de possession: ${formData.possession}\n`
  } else if (formData.type === 'search') {
    const budget = formatBudgetRange(formData.budget_min, formData.budget_max)
    if (budget) content += `Budget: ${budget}\n`
    content += `État souhaité: ${formData.condition}\n`
    if (formData.delai) {
      content += `Délai souhaité: ${formData.delai}\n`
    }
  }

  content += `\nMessage: ${formData.message}\n`
  return content
}

module.exports = {
  createEmailTemplate,
  formatEmailContent,
  escapeHtml,
}
