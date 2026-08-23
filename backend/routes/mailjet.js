const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const rateLimit = require('express-rate-limit')

const { getMailjetClient, getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { persistLeadSubmission, requireAdminAuth } = require('../admin/adminRoutes')
const { recordNewsletterOptIn, isOptInTruthy } = require('../newsletter/optIn')
const { createEmailTemplate, formatEmailContent } = require('../templates/estimationEmail')
const {
  createAppointmentVendorEmail,
  createAppointmentCustomerEmail,
  formatAppointmentVendorText,
  formatAppointmentCustomerText,
} = require('../templates/appointmentEmail')
const {
  createRepairVendorEmail,
  createRepairCustomerEmail,
  formatRepairVendorText,
  formatRepairCustomerText,
} = require('../templates/repairEmail')
const { validateAppointmentSubmission } = require('../utils/appointmentSlots')
const { buildGoogleMapsDirectionsUrl } = require('../utils/googleMapsLinks')

// Limites d'upload : le formulaire d'estimation accepte images + PDF uniquement
// (accept="image/*,application/pdf" côté front). Sans `limits`, multer accepte
// des fichiers de taille illimitée → risque de saturation disque/mémoire.
const MAX_ATTACHMENT_FILES = 10
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 Mo par fichier

const attachmentUpload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: MAX_ATTACHMENT_FILES },
  fileFilter: (req, file, cb) => {
    const type = String(file.mimetype || '')
    if (type.startsWith('image/') || type === 'application/pdf') {
      return cb(null, true)
    }
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname)
    err.message = 'Type de pièce jointe non autorisé (images et PDF uniquement)'
    cb(err)
  },
}).array('attachments', MAX_ATTACHMENT_FILES)

/** Wrapper multer : convertit les erreurs d'upload en 400 JSON + nettoie les fichiers déjà écrits. */
function uploadAttachments(req, res, next) {
  attachmentUpload(req, res, (err) => {
    if (!err) return next()
    cleanupFiles(req.files)
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Pièce jointe trop volumineuse (${MAX_ATTACHMENT_BYTES / (1024 * 1024)} Mo max par fichier)`
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? err.message || 'Pièces jointes invalides'
          : 'Pièces jointes invalides'
    return res.status(400).json({ success: false, message })
  })
}

// Anti-abus : sans limite, ce endpoint permet d'épuiser le quota Mailjet et
// d'envoyer des confirmations à des adresses arbitraires (flux rendez-vous).
const sendEmailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => Number(req.site?.config?.backend?.email?.rateLimitMax) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: 'Trop de requêtes. Réessayez dans quelques instants.',
    })
  },
})

function cleanupFiles(files) {
  if (!files) return
  for (const file of files) {
    fs.unlink(file.path, (err) => {
      if (err) console.error('Erreur lors de la suppression du fichier:', err)
    })
  }
}

router.post('/send-email', sendEmailRateLimiter, uploadAttachments, async (req, res) => {
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

    if (type === 'repair') {
      const missing = ['name', 'email', 'service_type', 'message'].filter(
        (field) => !formData[field]?.trim(),
      )
      if (missing.length > 0) {
        cleanupFiles(files)
        return res.status(400).json({
          success: false,
          message: `Champs obligatoires manquants : ${missing.join(', ')}`,
        })
      }
    }

    if (type === 'appointment') {
      const missing = ['name', 'email', 'date', 'watch_name'].filter(
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
      await mailjet.post('send', { version: 'v3.1' }).request(appointmentEmailData)

      console.log(`[${site.id}] ✅ Emails rendez-vous envoyés avec succès via Mailjet`)
      cleanupFiles(files)

      try {
        const supabase = getSupabaseClient(site)
        await persistLeadSubmission(supabase, site.id, type, formData, files)
        if (isOptInTruthy(formData.newsletter_opt_in)) {
          await recordNewsletterOptIn(supabase, site.id, {
            email: formData.email,
            name: formData.name,
          })
        }
      } catch (persistErr) {
        console.error(`[${site.id}] persistLeadSubmission (appointment):`, persistErr.message)
      }

      return res.json({
        success: true,
        message: 'Demande de rendez-vous envoyée avec succès',
      })
    }

    if (type === 'repair') {
      const attachmentNames = files.map((file) => ({ name: file.originalname }))
      const serviceLabel = String(formData.service_type || '').trim()
      const vendorSubject = serviceLabel
        ? `Nouvelle demande de prise en charge — ${serviceLabel}`
        : 'Nouvelle demande de prise en charge'

      const repairEmailData = {
        Messages: [
          {
            From: { Email: fromAddress, Name: emailCfg.fromName },
            To: [{ Email: emailCfg.toAddress, Name: emailCfg.fromName }],
            Subject: vendorSubject,
            TextPart: formatRepairVendorText(formData, attachmentNames),
            HTMLPart: createRepairVendorEmail(site, formData, attachmentNames),
            Attachments: attachments,
          },
          {
            From: { Email: fromAddress, Name: emailCfg.fromName },
            To: [{ Email: formData.email.trim(), Name: formData.name.trim() }],
            Subject: `Votre demande de prise en charge — ${emailCfg.fromName}`,
            TextPart: formatRepairCustomerText(formData),
            HTMLPart: createRepairCustomerEmail(site, formData),
          },
        ],
      }

      console.log(`[${site.id}] Préparation de l'envoi des emails atelier via Mailjet...`)
      await mailjet.post('send', { version: 'v3.1' }).request(repairEmailData)

      console.log(`[${site.id}] ✅ Emails atelier envoyés avec succès via Mailjet`)
      cleanupFiles(files)

      try {
        const supabase = getSupabaseClient(site)
        await persistLeadSubmission(supabase, site.id, type, formData, files)
        if (isOptInTruthy(formData.newsletter_opt_in)) {
          await recordNewsletterOptIn(supabase, site.id, {
            email: formData.email,
            name: formData.name,
          })
        }
      } catch (persistErr) {
        console.error(`[${site.id}] persistLeadSubmission (repair):`, persistErr.message)
      }

      return res.json({
        success: true,
        message: 'Demande de prise en charge envoyée avec succès',
      })
    }

    const watchSubjectLabel = [formData.brand, formData.model].filter(Boolean).join(' ')

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
              ? watchSubjectLabel
                ? `Nouvelle demande d'estimation — ${watchSubjectLabel}`
                : "Nouvelle demande d'estimation"
              : type === 'contact'
                ? `Nouveau message de contact — ${formData.name || 'visiteur'}`.trim()
                : watchSubjectLabel
                  ? `Nouvelle recherche personnalisée — ${watchSubjectLabel}`
                  : 'Nouvelle recherche personnalisée',
          TextPart: formatEmailContent({ type, ...formData }),
          HTMLPart: createEmailTemplate(site, { type, ...formData }),
          Attachments: attachments,
        },
      ],
    }

    console.log(`[${site.id}] Préparation de l'envoi du mail avec Mailjet...`)

    await mailjet.post('send', { version: 'v3.1' }).request(emailData)

    console.log(`[${site.id}] ✅ Email envoyé avec succès via Mailjet`)

    cleanupFiles(files)

    try {
      const supabase = getSupabaseClient(site)
      await persistLeadSubmission(supabase, site.id, type, formData, files)
      if (isOptInTruthy(formData.newsletter_opt_in)) {
        await recordNewsletterOptIn(supabase, site.id, {
          email: formData.email,
          name: formData.name,
        })
      }
    } catch (persistErr) {
      console.error(`[${site.id}] persistLeadSubmission:`, persistErr.message)
    }

    res.json({
      success: true,
      message: 'Email envoyé avec succès',
    })
  } catch (error) {
    // Détail (stack, réponse Mailjet) uniquement côté serveur : ne pas l'exposer au client.
    console.error(
      `[${site.id}] ❌ Erreur lors de l'envoi de l'email:`,
      error,
      error.response?.body || '',
    )
    cleanupFiles(files)
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email",
    })
  }
})

// Diagnostics de configuration : réservés aux admins (exposent des aperçus de
// clés et l'état du compte Mailjet — jamais accessibles publiquement).
router.get('/config-check', requireAdminAuth(), (req, res) => {
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

router.get('/test-mailjet', requireAdminAuth(), async (req, res) => {
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
    console.error(`[${site.id}] test-mailjet:`, error)
    res.status(500).json({
      success: false,
      siteId: site.id,
      message: 'Mailjet configuration error',
      error: error.message,
    })
  }
})

module.exports = router
