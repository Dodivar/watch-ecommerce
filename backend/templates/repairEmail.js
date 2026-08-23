/**
 * Templates d'email du formulaire « demande de prise en charge » de l'atelier (type `repair`).
 *
 * Deux messages : la demande vers l'atelier (avec les photos en pièces jointes) et un accusé de
 * réception au client. Sans cet accusé, une demande de devis envoyée le samedi soir ressemble à
 * un formulaire qui n'a rien fait — c'est exactement là qu'on perd le client au profit d'un appel
 * chez le concurrent.
 */

const {
  escapeHtml,
  emailShell,
  fieldRow,
  optionalFieldRow,
  linkFieldRow,
  resolveEmailBranding,
} = require('./emailCommon')

const HANDLING_LABELS = {
  dropoff: 'Dépôt en boutique',
  shipping: 'Envoi postal',
  unsure: 'Non décidé',
}

/** @param {string | undefined} handling */
function formatHandling(handling) {
  const key = String(handling || '').trim()
  if (!key) return ''
  return HANDLING_LABELS[key] || key
}

/** Titre lisible de la montre concernée. @param {Record<string, any>} formData */
function watchLabel(formData) {
  return [formData.brand, formData.model]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * @param {object} site Site normalisé (registry.byId).
 * @param {Record<string, any>} formData
 * @param {{ name: string }[]} [files]
 * @returns {string} HTML
 */
function createRepairVendorEmail(site, formData, files = []) {
  const branding = resolveEmailBranding(site)
  const accent = branding.accentColor
  const service = String(formData.service_type || '').trim()
  const handling = formatHandling(formData.handling)
  const title = watchLabel(formData)

  const heroHtml = title
    ? `
    <div class="watch-hero">
        <div class="watch-hero-label">Montre concernée</div>
        <div class="watch-hero-title">${escapeHtml(title)}</div>
    </div>
  `
    : ''

  const attachmentsHtml = files.length
    ? `
    <div class="section">
        <div class="section-title">Photos jointes</div>
        ${fieldRow('Fichiers', files.map((file) => file.name).join(', '), { accentColor: accent })}
    </div>
  `
    : ''

  const bodyHtml = `
    ${heroHtml}
    <div class="section">
        <div class="section-title">Prestation demandée</div>
        ${fieldRow('Prestation', service, { accentColor: accent })}
        ${optionalFieldRow('Prise en charge', handling, { accentColor: accent })}
        ${optionalFieldRow('Page d’origine', formData.source, { accentColor: accent })}
    </div>
    <div class="section">
        <div class="section-title">Client</div>
        ${fieldRow('Nom', formData.name, { accentColor: accent })}
        ${linkFieldRow('Email', formData.email, 'mailto:', accent)}
        ${linkFieldRow('Téléphone', formData.tel, 'tel:', accent)}
    </div>
    <div class="section">
        <div class="section-title">Problème décrit</div>
        <div class="message-text">${escapeHtml(formData.message || '')}</div>
    </div>
    ${attachmentsHtml}
  `

  return emailShell(site, 'Nouvelle demande de prise en charge', bodyHtml, {
    badge: 'Atelier',
  })
}

/**
 * Accusé de réception adressé au client.
 * @param {object} site
 * @param {Record<string, any>} formData
 * @returns {string} HTML
 */
function createRepairCustomerEmail(site, formData) {
  const branding = resolveEmailBranding(site)
  const accent = branding.accentColor
  const service = String(formData.service_type || '').trim()
  const title = watchLabel(formData)
  const handling = formatHandling(formData.handling)

  const storeAddress = (
    site.config.contact?.footerAddressHtml?.replace(/<br\s*\/?>/gi, ', ') ||
    site.config.legal?.address ||
    ''
  ).replace(/<[^>]+>/g, '')

  // L'adresse n'est rappelée que si le client vient déposer sa montre, et jamais pour un site
  // qui garde son adresse privée (`storeMap.enabled: false`).
  const showAddress =
    handling === HANDLING_LABELS.dropoff && site.config.storeMap?.enabled && storeAddress

  const bodyHtml = `
    <div class="section">
        <p>Bonjour ${escapeHtml(formData.name || '')},</p>
        <p>
          Nous avons bien reçu votre demande de prise en charge. Notre horloger l’examine et revient
          vers vous sous 48 h ouvrées avec un délai et un ordre de prix. Aucune intervention n’est
          lancée sans votre accord.
        </p>
    </div>
    <div class="section">
        <div class="section-title">Votre demande</div>
        ${fieldRow('Prestation', service, { accentColor: accent })}
        ${optionalFieldRow('Montre', title, { accentColor: accent })}
        ${optionalFieldRow('Prise en charge', handling, { accentColor: accent })}
        ${showAddress ? fieldRow('Adresse', storeAddress, { accentColor: accent }) : ''}
    </div>
    <div class="section">
        <div class="section-title">Ce que vous nous avez écrit</div>
        <div class="message-text">${escapeHtml(formData.message || '')}</div>
    </div>
  `

  return emailShell(site, 'Votre demande a bien été reçue', bodyHtml)
}

/** Pendant texte du mail atelier. @param {Record<string, any>} formData */
function formatRepairVendorText(formData, files = []) {
  let content = ''
  content += `Prestation: ${formData.service_type || 'Non renseigné'}\n`
  const handling = formatHandling(formData.handling)
  if (handling) content += `Prise en charge: ${handling}\n`
  if (formData.source) content += `Page d'origine: ${formData.source}\n`
  content += `\nNom: ${formData.name}\n`
  content += `Email: ${formData.email}\n`
  content += `Téléphone: ${formData.tel || 'Non renseigné'}\n`
  content += `\nMarque: ${formData.brand || 'Non renseigné'}\n`
  content += `Modèle: ${formData.model || 'Non renseigné'}\n`
  content += `\nProblème: ${formData.message || ''}\n`
  if (files.length) {
    content += `\nPhotos: ${files.map((file) => file.name).join(', ')}\n`
  }
  return content
}

/** Pendant texte de l'accusé de réception. @param {Record<string, any>} formData */
function formatRepairCustomerText(formData) {
  let content = ''
  content += `Bonjour ${formData.name},\n\n`
  content += `Nous avons bien reçu votre demande de prise en charge.\n`
  content += `Notre horloger revient vers vous sous 48 h ouvrées avec un délai et un ordre de prix.\n\n`
  content += `Prestation: ${formData.service_type || 'Non renseigné'}\n`
  const title = watchLabel(formData)
  if (title) content += `Montre: ${title}\n`
  const handling = formatHandling(formData.handling)
  if (handling) content += `Prise en charge: ${handling}\n`
  content += `\nVotre message: ${formData.message || ''}\n`
  return content
}

module.exports = {
  HANDLING_LABELS,
  createRepairVendorEmail,
  createRepairCustomerEmail,
  formatRepairVendorText,
  formatRepairCustomerText,
}
