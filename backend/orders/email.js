const { getMailjetClient, MissingSecretsError } = require('../utils/siteClients')
const { createOrderConfirmationEmail } = require('../templates/orderConfirmationEmail')

/**
 * @param {object} site
 * @param {object} order
 * @param {object[]} lines
 */
async function sendOrderConfirmationEmails(site, order, lines) {
  if (!order.customer_email) {
    return
  }

  let mailjet
  try {
    mailjet = getMailjetClient(site)
  } catch (e) {
    if (e instanceof MissingSecretsError) {
      console.warn(`[${site.id}] Mailjet non configuré — email commande ignoré`)
      return
    }
    throw e
  }

  const emailCfg = site.config.backend.email
  const fromAddress = site.secrets.emailFrom || emailCfg.fromAddress
  if (!fromAddress || !emailCfg.toAddress) {
    console.warn(`[${site.id}] Email from/to manquant — notification commande ignorée`)
    return
  }

  const customerHtml = createOrderConfirmationEmail(site, order, lines, false)
  const merchantHtml = createOrderConfirmationEmail(site, order, lines, true)

  await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: fromAddress, Name: emailCfg.fromName },
        To: [{ Email: order.customer_email, Name: order.customer_email }],
        Subject: `Confirmation de commande — ${emailCfg.fromName}`,
        HTMLPart: customerHtml,
      },
      {
        From: { Email: fromAddress, Name: emailCfg.fromName },
        To: [{ Email: emailCfg.toAddress, Name: emailCfg.fromName }],
        Subject: `Nouvelle commande — ${order.id}`,
        HTMLPart: merchantHtml,
      },
    ],
  })

  console.log(`[${site.id}] ✅ Emails commande ${order.id} envoyés`)
}

module.exports = {
  sendOrderConfirmationEmails,
}
