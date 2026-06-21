const {
  escapeHtml,
  emailShell,
  fieldRow,
  optionalFieldRow,
} = require('./emailCommon')

const SLOT_LABELS = {
  morning: 'Matin',
  afternoon: 'Après-midi',
}

function formatSlotLabel(timeSlot) {
  if (!timeSlot?.trim()) return null
  return SLOT_LABELS[timeSlot] || timeSlot
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function createAppointmentVendorEmail(site, formData) {
  const f = (v) => escapeHtml(v)
  const bodyHtml = `
    <div class="section">
        <div class="section-title">Client</div>
        ${fieldRow('Nom', formData.name)}
        ${fieldRow('Email', formData.email)}
        ${fieldRow('Téléphone', formData.tel || 'Non renseigné')}
    </div>
    <div class="section">
        <div class="section-title">Rendez-vous</div>
        ${fieldRow('Date', formatDateLabel(formData.date))}
        ${optionalFieldRow('Créneau', formatSlotLabel(formData.time_slot))}
    </div>
    <div class="section">
        <div class="section-title">Montre concernée</div>
        ${fieldRow('Modèle', formData.watch_name)}
        ${fieldRow('Prix affiché', formData.watch_price ? `${formData.watch_price} €` : 'Non renseigné')}
        ${
          formData.watch_url
            ? `<p><a class="cta" href="${f(formData.watch_url)}">Voir la fiche produit</a></p>`
            : ''
        }
    </div>
  `
  return emailShell(site, 'Nouvelle demande de rendez-vous', bodyHtml, { badge: 'Rendez-vous' })
}

function createAppointmentCustomerEmail(site, formData) {
  const storeAddress =
    site.config.contact?.footerAddressHtml?.replace(/<br\s*\/?>/gi, ', ') ||
    site.config.legal?.address ||
    ''
  const directionsUrl = formData.directions_url || ''

  const bodyHtml = `
    <div class="section">
        <p>Bonjour ${escapeHtml(formData.name || '')},</p>
        <p>Nous avons bien reçu votre demande de rendez-vous pour découvrir la montre suivante en boutique :</p>
        ${fieldRow('Montre', formData.watch_name)}
    </div>
    <div class="section">
        <div class="section-title">Votre rendez-vous</div>
        ${fieldRow('Date', formatDateLabel(formData.date))}
        ${optionalFieldRow('Créneau', formatSlotLabel(formData.time_slot))}
        ${fieldRow('Adresse', storeAddress.replace(/<[^>]+>/g, ''))}
        ${
          directionsUrl
            ? `<p><a class="cta" href="${escapeHtml(directionsUrl)}">Itinéraire GPS vers la boutique</a></p>`
            : ''
        }
    </div>
    <div class="section">
        <p>Notre équipe vous contactera si nécessaire pour confirmer ce rendez-vous. À très bientôt en boutique !</p>
    </div>
  `
  return emailShell(site, 'Confirmation de votre rendez-vous', bodyHtml)
}

function formatAppointmentVendorText(formData) {
  let content = ''
  content += `Nom: ${formData.name}\n`
  content += `Email: ${formData.email}\n`
  content += `Téléphone: ${formData.tel || 'Non renseigné'}\n`
  content += `\nDate: ${formatDateLabel(formData.date)}\n`
  const slotLabel = formatSlotLabel(formData.time_slot)
  if (slotLabel) content += `Créneau: ${slotLabel}\n`
  content += `\nMontre: ${formData.watch_name}\n`
  if (formData.watch_price) content += `Prix: ${formData.watch_price} €\n`
  if (formData.watch_url) content += `Fiche: ${formData.watch_url}\n`
  return content
}

function formatAppointmentCustomerText(site, formData) {
  const storeAddress =
    site.config.contact?.footerAddressHtml?.replace(/<br\s*\/?>/gi, ', ') ||
    site.config.legal?.address ||
    ''
  let content = ''
  content += `Bonjour ${formData.name},\n\n`
  content += `Votre demande de rendez-vous a bien été enregistrée.\n\n`
  content += `Montre: ${formData.watch_name}\n`
  content += `Date: ${formatDateLabel(formData.date)}\n`
  const slotLabel = formatSlotLabel(formData.time_slot)
  if (slotLabel) content += `Créneau: ${slotLabel}\n`
  content += `Adresse: ${storeAddress.replace(/<[^>]+>/g, '')}\n`
  return content
}

module.exports = {
  createAppointmentVendorEmail,
  createAppointmentCustomerEmail,
  formatAppointmentVendorText,
  formatAppointmentCustomerText,
}
