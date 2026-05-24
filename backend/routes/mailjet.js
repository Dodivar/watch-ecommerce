const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')

const { getMailjetClient, MissingSecretsError } = require('../utils/siteClients')
const { createEmailTemplate, formatEmailContent } = require('../templates/estimationEmail')
const {
  createAppointmentVendorEmail,
  createAppointmentCustomerEmail,
  formatAppointmentVendorText,
  formatAppointmentCustomerText,
} = require('../templates/appointmentEmail')
const { validateAppointmentSubmission } = require('../utils/appointmentSlots')
const { buildGoogleMapsDirectionsUrl } = require('../utils/googleMapsLinks')

const upload = multer({ dest: 'uploads/' })

function cleanupFiles(files) {
  if (!files) return
  for (const file of files) {
    fs.unlink(file.path, (err) => {
      if (err) console.error('Erreur lors de la suppression du fichier:', err)
    })
  }
}

router.post('/send-email', upload.array('attachments', 10), async (req, res) => {
  const site = req.site
  const files = req.files || []

  try {
    console.log(`[${site.id}] --- Nouvelle requête d'envoi d'email reçue ---`)
    const { type, ...formData } = req.body
    console.log(`[${site.id}] Type de formulaire:`, type)
    console.log(`[${site.id}] Données reçues:`, JSON.stringify(formData, null, 2))

    if (type === 'contact') {
      const missing = ['name', 'email', 'message'].filter((field) => !formData[field]?.trim())
      if (missing.length > 0) {
        cleanupFiles(files)
        return res.status(400).json({
          success: false,
          message: `Champs obligatoires manquants : ${missing.join(', ')}`,
        })
      }
    }

    if (type === 'appointment') {
      const missing = ['name', 'email', 'date', 'time_slot', 'watch_name'].filter(
        (field) => !formData[field]?.trim(),
      )
      if (missing.length > 0) {
        cleanupFiles(files)
        return res.status(400).json({
          success: false,
          message: `Champs obligatoires manquants : ${missing.join(', ')}`,
        })
      }

      const slotValidation = validateAppointmentSubmission({
        date: formData.date,
        time_slot: formData.time_slot,
      })
      if (!slotValidation.valid) {
        cleanupFiles(files)
        return res.status(400).json({
          success: false,
          message: slotValidation.message,
        })
      }
    }
    console.log(
      `[${site.id}] Fichiers reçus:`,
      files.map((f) => f.originalname),
    )

    let mailjet
    try {
      mailjet = getMailjetClient(site)
    } catch (e) {
      cleanupFiles(files)
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({
          success: false,
          message: e.message,
        })
      }
      throw e
    }

    const attachments = files.map((file) => {
      const fileContent = fs.readFileSync(file.path)
      return {
        ContentType: file.mimetype || 'application/octet-stream',
        Filename: file.originalname,
        Base64Content: fileContent.toString('base64'),
      }
    })

    const emailCfg = site.config.backend.email
    const fromAddress = site.secrets.emailFrom || emailCfg.fromAddress
    if (!fromAddress) {
      cleanupFiles(files)
      return res.status(503).json({
        success: false,
        message: `Aucune adresse "from" configurée pour le site "${site.id}".`,
      })
    }
    if (!emailCfg.toAddress) {
      cleanupFiles(files)
      return res.status(503).json({
        success: false,
        message: `Aucune adresse "to" configurée pour le site "${site.id}".`,
      })
    }

    if (type === 'appointment') {
      const storeMap = site.config.storeMap || {}
      const directionsUrl =
        buildGoogleMapsDirectionsUrl({
          address: storeMap.directionsAddress || site.config.legal?.address,
          placeId: storeMap.googlePlaceId,
          lat: storeMap.center?.lat,
          lng: storeMap.center?.lng,
          query: storeMap.googlePlaceQuery,
        }) || ''

      const appointmentData = { type, ...formData, directions_url: directionsUrl }
      const vendorSubject = `Nouvelle demande de rendez-vous — ${formData.watch_name}`.trim()
      const customerSubject = `Confirmation de votre rendez-vous — ${emailCfg.fromName}`

      const appointmentEmailData = {
        Messages: [
          {
            From: {
              Email: fromAddress,
              Name: emailCfg.fromName,
            },
            To: [
              {
                Email: emailCfg.toAddress,
                Name: emailCfg.fromName,
              },
            ],
            Subject: vendorSubject,
            TextPart: formatAppointmentVendorText(appointmentData),
            HTMLPart: createAppointmentVendorEmail(site, appointmentData),
          },
          {
            From: {
              Email: fromAddress,
              Name: emailCfg.fromName,
            },
            To: [
              {
                Email: formData.email.trim(),
                Name: formData.name.trim(),
              },
            ],
            Subject: customerSubject,
            TextPart: formatAppointmentCustomerText(site, appointmentData),
            HTMLPart: createAppointmentCustomerEmail(site, appointmentData),
          },
        ],
      }

      console.log(`[${site.id}] Préparation de l'envoi des emails rendez-vous via Mailjet...`)
      const appointmentResult = await mailjet
        .post('send', { version: 'v3.1' })
        .request(appointmentEmailData)

      console.log(`[${site.id}] ✅ Emails rendez-vous envoyés avec succès via Mailjet`)
      cleanupFiles(files)

      return res.json({
        success: true,
        message: 'Demande de rendez-vous envoyée avec succès',
        mailjetResponse: appointmentResult.body,
      })
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: fromAddress,
            Name: emailCfg.fromName,
          },
          To: [
            {
              Email: emailCfg.toAddress,
              Name: emailCfg.fromName,
            },
          ],
          Subject:
            type === 'estimation'
              ? `Nouvelle demande d'estimation - ${formData.brand || ''} ${formData.model || ''}`.trim()
              : type === 'contact'
                ? `Nouveau message de contact — ${formData.name || 'visiteur'}`.trim()
                : 'Nouvelle recherche personnalisée',
          TextPart: formatEmailContent({ type, ...formData }),
          HTMLPart: createEmailTemplate(site, { type, ...formData }),
          Attachments: attachments,
        },
      ],
    }

    console.log(`[${site.id}] Préparation de l'envoi du mail avec Mailjet...`)

    const result = await mailjet.post('send', { version: 'v3.1' }).request(emailData)

    console.log(`[${site.id}] ✅ Email envoyé avec succès via Mailjet`)

    cleanupFiles(files)

    res.json({
      success: true,
      message: 'Email envoyé avec succès',
      mailjetResponse: result.body,
    })
  } catch (error) {
    console.error(`[${site.id}] ❌ Erreur lors de l'envoi de l'email:`, error)
    cleanupFiles(files)
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email",
      error: error.message,
      details: error.response?.body || error.stack,
    })
  }
})

router.get('/config-check', (req, res) => {
  const site = req.site
  const apiKey = site.secrets?.mailjet?.apiKey
  const secretKey = site.secrets?.mailjet?.secretKey

  res.json({
    siteId: site.id,
    apiKeyExists: !!apiKey,
    secretKeyExists: !!secretKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    secretKeyLength: secretKey ? secretKey.length : 0,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'Non défini',
    secretKeyPreview: secretKey ? `${secretKey.substring(0, 8)}...` : 'Non défini',
  })
})

router.get('/test-mailjet', async (req, res) => {
  const site = req.site
  try {
    let mailjet
    try {
      mailjet = getMailjetClient(site)
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({
          success: false,
          message: e.message,
        })
      }
      throw e
    }
    const result = await mailjet.get('user').request()
    res.json({
      success: true,
      siteId: site.id,
      message: 'Mailjet configuration is valid',
      user: result.body,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      siteId: site.id,
      message: 'Mailjet configuration error',
      error: error.message,
      details: error.response?.data || error.stack,
    })
  }
})

module.exports = router
