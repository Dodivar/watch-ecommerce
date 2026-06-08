const { escapeHtml } = require('./estimationEmail')

const SLOT_LABELS = {
  morning: 'Matin',
  afternoon: 'Après-midi',
}

function formatSlotLabel(timeSlot) {
  if (!timeSlot?.trim()) return null
  return SLOT_LABELS[timeSlot] || timeSlot
}

function optionalFieldRow(label, value) {
  if (!value?.trim()) return ''
  return fieldRow(label, value)
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

function emailShell(site, title, bodyHtml) {
  const accent = site.config.backend.email.template.accentColor
  const logoText = site.config.backend.email.template.logoText
  const brandName = site.config.backend.email.fromName

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
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid ${accent};
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: ${accent};
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                color: #333;
                margin: 0;
            }
            .section {
                margin-bottom: 25px;
                padding: 15px;
                background-color: #f9f9f9;
                border-radius: 5px;
                border-left: 4px solid ${accent};
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: ${accent};
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .field {
                margin-bottom: 10px;
                display: flex;
                flex-wrap: wrap;
            }
            .field-label {
                font-weight: bold;
                color: #555;
                min-width: 150px;
                margin-right: 10px;
            }
            .field-value {
                color: #333;
                flex: 1;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 14px;
            }
            .cta {
                display: inline-block;
                margin-top: 12px;
                padding: 10px 18px;
                background-color: ${accent};
                color: #fff !important;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">${escapeHtml(logoText)}</div>
                <h1 class="title">${escapeHtml(title)}</h1>
            </div>
            ${bodyHtml}
            <div class="footer">
                <p>Email envoyé automatiquement depuis le site ${escapeHtml(brandName)}</p>
                <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            </div>
        </div>
    </body>
    </html>
  `
}

function fieldRow(label, value) {
  return `
    <div class="field">
        <span class="field-label">${escapeHtml(label)}:</span>
        <span class="field-value">${escapeHtml(value || 'Non renseigné')}</span>
    </div>
  `
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
  return emailShell(site, 'Nouvelle demande de rendez-vous', bodyHtml)
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
