/**
 * Templates d'email pour les formulaires "estimation" et "recherche personnalisée".
 *
 * Branding (logo, couleurs d'accent, fond de section) dérivé de la config site
 * via `resolveEmailBranding` : `backend.email.template`, `theme.colors`, assets publics.
 */

const {
  escapeHtml,
  emailShell,
  fieldRow,
  linkFieldRow,
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
 * @param {object} site Site normalisé (registry.byId).
 * @param {object} formData
 * @returns {string} HTML
 */
function createEmailTemplate(site, formData) {
  const isContact = formData.type === 'contact'
  const isEstimation = formData.type === 'estimation'
  const branding = resolveEmailBranding(site)
  const accent = branding.accentColor

  const title = isContact
    ? 'Nouveau message de contact'
    : isEstimation
      ? "Nouvelle demande d'estimation"
      : 'Nouvelle recherche personnalisée'

  const badge = TYPE_BADGES[formData.type] || ''

  const watchBrand = String(formData.brand || '').trim()
  const watchModel = String(formData.model || '').trim()
  const watchTitle = [watchBrand, watchModel].filter(Boolean).join(' ')

  const watchHeroHtml =
    isContact || !watchTitle
      ? ''
      : `
    <div class="watch-hero">
        <div class="watch-hero-label">Montre concernée</div>
        <div class="watch-hero-title">${escapeHtml(watchTitle)}</div>
    </div>
  `

  const contactInfoHtml = isContact
    ? `
        ${fieldRow('Nom', formData.name, { accentColor: accent })}
        ${linkFieldRow('Email', formData.email, 'mailto:', accent)}
        ${linkFieldRow('Téléphone', formData.tel, 'tel:', accent)}
    `
    : `
        ${fieldRow('Prénom', formData.nickname, { accentColor: accent })}
        ${fieldRow('Nom', formData.name, { accentColor: accent })}
        ${linkFieldRow('Email', formData.email, 'mailto:', accent)}
        ${linkFieldRow('Téléphone', formData.tel, 'tel:', accent)}
        ${fieldRow('Préférence de contact', formData.contact_mode || 'Pas de préférence', {
          accentColor: accent,
        })}
    `

  const watchDetailsHtml = isContact
    ? ''
    : `
    <div class="section">
        <div class="section-title">Détails de la montre</div>
        ${fieldRow('Marque', watchBrand || 'Non renseigné', { accentColor: accent })}
        ${fieldRow('Modèle', watchModel || 'Non renseigné', { accentColor: accent })}
        ${
          isEstimation
            ? `
        ${fieldRow('Numéro de série', formData.serienumber, { accentColor: accent })}
        ${fieldRow('Année', formData.year, { accentColor: accent })}
        ${fieldRow('État général', formData.etat || formData.condition, { accentColor: accent })}
        ${fieldRow('État de possession', formData.possession, { accentColor: accent })}
        `
            : `
        ${(() => {
          const budget = formatBudgetRange(formData.budget_min, formData.budget_max)
          return budget ? fieldRow('Budget', budget, { accentColor: accent }) : ''
        })()}
        ${fieldRow('État souhaité', formData.condition, { accentColor: accent })}
        ${formData.delai ? fieldRow('Délai souhaité', formData.delai, { accentColor: accent }) : ''}
        `
        }
    </div>
  `

  const messageHtml = formData.message
    ? `
    <div class="section">
        <div class="section-title">Message du client</div>
        <div class="message-text">${escapeHtml(formData.message)}</div>
    </div>
  `
    : ''

  const bodyHtml = `
    ${watchHeroHtml}
    <div class="section">
        <div class="section-title">Informations de contact</div>
        ${contactInfoHtml}
    </div>
    ${watchDetailsHtml}
    ${messageHtml}
  `

  return emailShell(site, title, bodyHtml, { badge })
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
