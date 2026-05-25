const express = require('express')
const router = express.Router()
const FormData = require('form-data')

const { verifyAdminBearerToken } = require('../admin/adminRoutes')

const isProduction = () =>
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'

/**
 * Résout l'URL du workflow n8n pour le site courant. Priorité :
 *   1. Variable d'env `SITE_<ID>__N8N_WORKFLOW_URL` (override d'urgence par client)
 *   2. site.config.backend.n8n.{production,test}WorkflowUrl
 *   3. Variable d'env legacy `N8N_WORKFLOW_URL` (uniquement pour Sauvage en rétrocompat)
 */
function resolveN8nUrl(site) {
  const cfg = (site && site.config && site.config.backend && site.config.backend.n8n) || {}
  if (isProduction()) {
    return cfg.productionWorkflowUrl || process.env.N8N_WORKFLOW_URL || ''
  }
  return cfg.testWorkflowUrl || cfg.productionWorkflowUrl || process.env.N8N_WORKFLOW_URL || ''
}

router.post('/generate-article', async (req, res) => {
  try {
    const site = req.site
    const authHeader = req.headers.authorization
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null
    const auth = await verifyAdminBearerToken(site, bearerToken)
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    const { watchName } = req.body

    if (!watchName || !watchName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le nom de la montre ou de la marque est obligatoire',
      })
    }

    const url = resolveN8nUrl(site)
    if (!url) {
      return res.status(503).json({
        success: false,
        error: `Workflow n8n non configuré pour le site "${site.id}"`,
      })
    }

    console.log(
      `[${site.id}] Appel du workflow n8n pour générer un article: ${watchName} — ${url} (mode: ${isProduction() ? 'production' : 'debug/test'})`,
    )

    const formData = new FormData()
    formData.append('watchName', watchName.trim())

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[${site.id}] Erreur n8n (${response.status}):`, errorText)
      return res.status(response.status).json({
        success: false,
        error: errorText || `Erreur HTTP ${response.status}`,
      })
    }

    const contentType = response.headers.get('content-type')
    let result

    if (contentType && contentType.includes('application/json')) {
      result = await response.json()

      if (Array.isArray(result) && result.length > 0) {
        result = result[0]
      }

      if (result && typeof result === 'object' && result.body && !result.id && !result.articleId) {
        result = result.body
      }
    } else {
      const text = await response.text()
      result = { success: true, message: text || 'Article généré avec succès' }
    }

    console.log(`[${site.id}] Workflow n8n exécuté avec succès:`, result)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error("Erreur lors de l'appel au workflow n8n:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue lors de la génération de l'article",
    })
  }
})

module.exports = router
