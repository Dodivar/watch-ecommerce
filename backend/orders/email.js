const { getMailjetClient, MissingSecretsError } = require('../utils/siteClients')
const { createOrderConfirmationEmail } = require('../templates/orderConfirmationEmail')
const { createRefundEmail, createReturnRequestEmail } = require('../templates/orderReturnEmail')
const { generateOrderReceiptPdf, receiptPdfFilename } = require('./receiptPdf')

/**
 * Client Mailjet + expéditeur du site, ou `null` si le site n'est pas configuré
 * pour envoyer (Mailjet absent, adresse manquante).
 *
 * Un e-mail transactionnel ne doit jamais faire échouer l'action métier qui le
 * déclenche : une commande payée le reste, un remboursement émis le reste.
 *
 * @param {object} site
 * @param {string} label Action tracée dans le log quand l'envoi est ignoré
 * @returns {{ mailjet: object, fromAddress: string, emailCfg: object }|null}
 */
function resolveMailer(site, label) {
  let mailjet
  try {
    mailjet = getMailjetClient(site)
  } catch (e) {
    if (e instanceof MissingSecretsError) {
      console.warn(`[${site.id}] Mailjet non configuré — ${label} ignoré`)
      return null
    }
    throw e
  }

  const emailCfg = site.config.backend.email
  const fromAddress = site.secrets.emailFrom || emailCfg.fromAddress
  if (!fromAddress || !emailCfg.toAddress) {
    console.warn(`[${site.id}] Email from/to manquant — ${label} ignoré`)
    return null
  }

  return { mailjet, fromAddress, emailCfg }
}

/**
 * @param {object} site
 * @param {object} order
 * @param {object[]} lines
 * @param {{ shipping?: object|null, discount?: object|null, followUpUrl?: string|null }} [extras]
 */
async function sendOrderConfirmationEmails(site, order, lines, extras = {}) {
  if (!order.customer_email) {
    return
  }

  const mailer = resolveMailer(site, 'email commande')
  if (!mailer) return
  const { mailjet, fromAddress, emailCfg } = mailer

  const customerHtml = createOrderConfirmationEmail(site, order, lines, false, extras)
  const merchantHtml = createOrderConfirmationEmail(site, order, lines, true, extras)

  /** @type {object[]} */
  const customerAttachments = []
  try {
    const pdfBuffer =
      extras.pdfBuffer !== undefined
        ? extras.pdfBuffer
        : await generateOrderReceiptPdf(site, order, lines, extras)
    if (pdfBuffer) {
      customerAttachments.push({
        ContentType: 'application/pdf',
        Filename: receiptPdfFilename(order.id),
        Base64Content: pdfBuffer.toString('base64'),
      })
    }
  } catch (pdfErr) {
    console.error(`[${site.id}] PDF reçu commande ${order.id}:`, pdfErr)
  }

  await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: fromAddress, Name: emailCfg.fromName },
        To: [{ Email: order.customer_email, Name: order.customer_email }],
        Subject: `Confirmation de commande — ${emailCfg.fromName}`,
        HTMLPart: customerHtml,
        ...(customerAttachments.length ? { Attachments: customerAttachments } : {}),
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

/**
 * Accusé de rétractation : un exemplaire au client, un au commerçant.
 *
 * Le courrier au client n'est pas de la courtoisie : il matérialise la date de
 * notification, point de départ des 14 jours dont dispose le vendeur pour
 * rembourser (art. L221-24).
 *
 * @param {object} site
 * @param {object} order Ligne `orders`
 * @param {{ reason?: string|null, refundDeadline?: Date|string|null, trackingUrl?: string|null }} [extras]
 */
async function sendReturnRequestEmails(site, order, extras = {}) {
  const mailer = resolveMailer(site, 'email rétractation')
  if (!mailer) return
  const { mailjet, fromAddress, emailCfg } = mailer

  const messages = [
    {
      From: { Email: fromAddress, Name: emailCfg.fromName },
      To: [{ Email: emailCfg.toAddress, Name: emailCfg.fromName }],
      Subject: `Demande de rétractation — ${order.id}`,
      HTMLPart: createReturnRequestEmail(site, order, { ...extras, forMerchant: true }),
    },
  ]

  if (order.customer_email) {
    messages.unshift({
      From: { Email: fromAddress, Name: emailCfg.fromName },
      To: [{ Email: order.customer_email, Name: order.customer_email }],
      Subject: `Votre demande de rétractation — ${emailCfg.fromName}`,
      HTMLPart: createReturnRequestEmail(site, order, { ...extras, forMerchant: false }),
    })
  }

  await mailjet.post('send', { version: 'v3.1' }).request({ Messages: messages })
  console.log(`[${site.id}] ✅ Emails rétractation commande ${order.id} envoyés`)
}

/**
 * Confirmation de remboursement au client.
 *
 * @param {object} site
 * @param {object} order Ligne `orders`
 * @param {{ amountCents: number, refundedTotalCents?: number, isPartial?: boolean,
 *   trackingUrl?: string|null }} refund
 */
async function sendRefundEmail(site, order, refund) {
  if (!order.customer_email) return

  const mailer = resolveMailer(site, 'email remboursement')
  if (!mailer) return
  const { mailjet, fromAddress, emailCfg } = mailer

  await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: fromAddress, Name: emailCfg.fromName },
        To: [{ Email: order.customer_email, Name: order.customer_email }],
        Subject: `Remboursement de votre commande — ${emailCfg.fromName}`,
        HTMLPart: createRefundEmail(site, order, refund),
      },
    ],
  })

  console.log(`[${site.id}] ✅ Email remboursement commande ${order.id} envoyé`)
}

module.exports = {
  sendOrderConfirmationEmails,
  sendRefundEmail,
  sendReturnRequestEmails,
}
