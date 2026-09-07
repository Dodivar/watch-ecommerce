const {
  escapeHtml,
  emailShell,
  section,
  fieldRow,
  fieldTable,
  optionalFieldRow,
  linkFieldRow,
  paragraph,
  button,
  buttonRow,
  resolveEmailBranding,
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
  const branding = resolveEmailBranding(site)
  const email = String(formData.email || '').trim()
  const tel = String(formData.tel || '').trim()

  const actionsHtml = buttonRow([
    email
      ? button(
          branding,
          `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Votre demande de rendez-vous')}`,
          `Répondre à ${formData.name || email}`,
        )
      : '',
    tel ? button(branding, `tel:${encodeURIComponent(tel)}`, 'Appeler', { variant: 'secondary' }) : '',
    formData.watch_url
      ? button(branding, formData.watch_url, 'Voir la fiche produit', { variant: 'secondary' })
      : '',
  ])

  const bodyHtml = `
    ${section(
      branding,
      'Client',
      fieldTable(`
        ${fieldRow(branding, 'Nom', formData.name)}
        ${linkFieldRow(branding, 'Email', formData.email, 'mailto:')}
        ${linkFieldRow(branding, 'Téléphone', formData.tel, 'tel:')}
      `),
    )}
    ${section(
      branding,
      'Rendez-vous',
      fieldTable(`
        ${fieldRow(branding, 'Date', formatDateLabel(formData.date))}
        ${optionalFieldRow(branding, 'Créneau', formatSlotLabel(formData.time_slot))}
      `),
    )}
    ${section(
      branding,
      'Montre concernée',
      fieldTable(`
        ${fieldRow(branding, 'Modèle', formData.watch_name)}
        ${fieldRow(branding, 'Prix affiché', formData.watch_price ? `${formData.watch_price} €` : '')}
      `),
    )}
    ${actionsHtml}
  `

  return emailShell(site, 'Nouvelle demande de rendez-vous', bodyHtml, {
    badge: 'Rendez-vous',
    preheader: [formData.name, formatDateLabel(formData.date), formData.watch_name]
      .filter(Boolean)
      .join(' · '),
  })
}

function createAppointmentCustomerEmail(site, formData) {
  const branding = resolveEmailBranding(site)
  const storeAddress = (
    site.config.contact?.footerAddressHtml?.replace(/<br\s*\/?>/gi, ', ') ||
    site.config.legal?.address ||
    ''
  ).replace(/<[^>]+>/g, '')
  const directionsUrl = formData.directions_url || ''

  const bodyHtml = `
    ${paragraph(branding, `Bonjour ${escapeHtml(formData.name || '')},`)}
    ${paragraph(
      branding,
      'Nous avons bien reçu votre demande de rendez-vous pour découvrir cette montre en boutique.',
    )}
    ${section(
      branding,
      'Votre rendez-vous',
      fieldTable(`
        ${fieldRow(branding, 'Montre', formData.watch_name)}
        ${fieldRow(branding, 'Date', formatDateLabel(formData.date))}
        ${optionalFieldRow(branding, 'Créneau', formatSlotLabel(formData.time_slot))}
        ${optionalFieldRow(branding, 'Adresse', storeAddress)}
      `),
    )}
    ${buttonRow([
      directionsUrl ? button(branding, directionsUrl, 'Itinéraire vers la boutique') : '',
    ])}
    ${paragraph(
      branding,
      'Notre équipe vous contactera si nécessaire pour confirmer ce rendez-vous. À très bientôt en boutique !',
      { muted: true, small: true },
    )}
  `

  return emailShell(site, 'Confirmation de votre rendez-vous', bodyHtml, {
    preheader: [formData.watch_name, formatDateLabel(formData.date)].filter(Boolean).join(' · '),
  })
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
