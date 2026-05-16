/**
 * Templates d'email pour les formulaires "estimation" et "recherche personnalisée".
 *
 * Tout ce qui était auparavant codé en dur (logo "SAUVAGE WATCHES", couleur d'accent
 * #d4af37, mention "Sauvage Watches" en pied de page) est désormais paramétré à partir
 * de la configuration normalisée du site (`site.config.backend.email.template`,
 * `site.config.brand`).
 */

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
 * @param {object} site Site normalisé (registry.byId).
 * @param {object} formData
 * @returns {string} HTML
 */
function createEmailTemplate(site, formData) {
  const isContact = formData.type === 'contact'
  const isEstimation = formData.type === 'estimation'
  const title = isContact
    ? 'Nouveau message de contact'
    : isEstimation
      ? "Nouvelle demande d'estimation"
      : 'Nouvelle recherche personnalisée'

  const accent = site.config.backend.email.template.accentColor
  const logoText = site.config.backend.email.template.logoText
  const brandName = site.config.backend.email.fromName

  const f = (v) => escapeHtml(v)

  const contactInfoHtml = isContact
    ? `
                <div class="field">
                    <span class="field-label">Nom:</span>
                    <span class="field-value">${f(formData.name || 'Non renseigné')}</span>
                </div>
                <div class="field">
                    <span class="field-label">Email:</span>
                    <span class="field-value">${f(formData.email || 'Non renseigné')}</span>
                </div>
                <div class="field">
                    <span class="field-label">Téléphone:</span>
                    <span class="field-value">${f(formData.tel || 'Non renseigné')}</span>
                </div>
    `
    : `
                <div class="field">
                    <span class="field-label">Prénom:</span>
                    <span class="field-value">${f(formData.nickname || 'Non renseigné')}</span>
                </div>
                <div class="field">
                    <span class="field-label">Nom:</span>
                    <span class="field-value">${f(formData.name || 'Non renseigné')}</span>
                </div>
                <div class="field">
                    <span class="field-label">Email:</span>
                    <span class="field-value">${f(formData.email || 'Non renseigné')}</span>
                </div>
                <div class="field">
                    <span class="field-label">Téléphone:</span>
                    <span class="field-value">${f(formData.tel || 'Non renseigné')}</span>
                </div>
                <div class="field">
                    <span class="field-label">Préférence de contact:</span>
                    <span class="field-value">${f(formData.contact_mode || 'Pas de préférence')}</span>
                </div>
    `

  const watchDetailsHtml = isContact
    ? ''
    : `
            <div class="section">
                <div class="section-title">Détails de la montre</div>
                <div class="field">
                    <span class="field-label">Marque:</span>
                    <span class="field-value">${f(formData.brand || 'Non renseigné')}</span>
                </div>
                <div class="field">
                    <span class="field-label">Modèle:</span>
                    <span class="field-value">${f(formData.model || 'Non renseigné')}</span>
                </div>
                ${
                  isEstimation
                    ? `
                    <div class="field">
                        <span class="field-label">Numéro de série:</span>
                        <span class="field-value">${f(formData.serienumber || 'Non renseigné')}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Année:</span>
                        <span class="field-value">${f(formData.year || 'Non renseigné')}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">État général:</span>
                        <span class="field-value">${f(formData.etat || formData.condition || 'Non renseigné')}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">État de possession:</span>
                        <span class="field-value">${f(formData.possession || 'Non renseigné')}</span>
                    </div>
                `
                    : `
                    ${
                      formData.budget_min && formData.budget_max
                        ? `
                        <div class="field">
                            <span class="field-label">Budget:</span>
                            <span class="field-value">${f(formData.budget_min)} € à ${f(formData.budget_max)} €</span>
                        </div>
                    `
                        : ''
                    }
                    ${
                      formData.budget_min && !formData.budget_max
                        ? `
                        <div class="field">
                            <span class="field-label">Budget minimum:</span>
                            <span class="field-value">${f(formData.budget_min)} €</span>
                        </div>
                    `
                        : ''
                    }
                    ${
                      formData.budget_max && !formData.budget_min
                        ? `
                        <div class="field">
                            <span class="field-label">Budget maximum:</span>
                            <span class="field-value">${f(formData.budget_max)} €</span>
                        </div>
                    `
                        : ''
                    }
                    <div class="field">
                        <span class="field-label">État souhaité:</span>
                        <span class="field-value">${f(formData.condition || 'Non renseigné')}</span>
                    </div>
                    ${
                      formData.delai
                        ? `
                        <div class="field">
                            <span class="field-label">Délai souhaité:</span>
                            <span class="field-value">${f(formData.delai)}</span>
                        </div>
                    `
                        : ''
                    }
                `
                }
            </div>
    `

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${f(title)}</title>
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
            .message-section {
                background-color: #fff;
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 5px;
                margin-top: 20px;
            }
            .message-text {
                font-style: italic;
                color: #666;
                white-space: pre-wrap;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">${f(logoText)}</div>
                <h1 class="title">${f(title)}</h1>
            </div>

            <div class="section">
                <div class="section-title">Informations de contact</div>
                ${contactInfoHtml}
            </div>

            ${watchDetailsHtml}

            ${
              formData.message
                ? `
                <div class="message-section">
                    <div class="section-title">Message</div>
                    <div class="message-text">${f(formData.message)}</div>
                </div>
            `
                : ''
            }

            <div class="footer">
                <p>Email envoyé automatiquement depuis le site ${f(brandName)}</p>
                <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            </div>
        </div>
    </body>
    </html>
  `
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
    if (formData.budget_min && formData.budget_max) {
      content += `Budget: ${formData.budget_min} € à ${formData.budget_max} €\n`
    } else if (formData.budget_min) {
      content += `Budget minimum: ${formData.budget_min} €\n`
    } else if (formData.budget_max) {
      content += `Budget maximum: ${formData.budget_max} €\n`
    }
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
