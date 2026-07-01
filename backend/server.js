const express = require('express')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const { buildRegistry } = require('./sites/registry')
const { corsFromRegistry } = require('./middleware/corsFromRegistry')
const { resolveSite } = require('./middleware/resolveSite')

const mailjetRoutes = require('./routes/mailjet')
const { buildStripeRouter } = require('./routes/stripe')
const { buildOrdersRouter } = require('./routes/orders')
const n8nRoutes = require('./routes/n8n')
const { buildAdminRouter } = require('./admin/adminRoutes')
const { buildNewsletterRouter } = require('./routes/newsletter')

const isProductionBoot =
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'

function logBootWarnings(registry) {
  if (!isProductionBoot) return
  for (const site of registry.list()) {
    const missing = []
    if (!site.secrets.stripe.secretKey) missing.push('STRIPE_SECRET_KEY')
    if (!site.secrets.stripe.webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET')
    if (!site.secrets.paymentCancelSecret) missing.push('PAYMENT_CANCEL_SECRET')
    if (!site.secrets.supabase.url) missing.push('SUPABASE_URL')
    if (!site.secrets.supabase.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!site.secrets.mailjet.apiKey) missing.push('MAILJET_API_KEY')
    if (!site.secrets.mailjet.secretKey) missing.push('MAILJET_SECRET_KEY')
    if (missing.length > 0) {
      console.warn(
        `⚠️  [${site.id}] secrets manquants : ${missing.join(', ')}. Les routes correspondantes renverront 503 pour ce site.`,
      )
    }
  }
}

async function main() {
  const registry = await buildRegistry()
  if (registry.byId.size === 0) {
    console.error('❌ Aucun site chargé dans `sites/`. Arrêt.')
    process.exit(1)
  }

  console.log(
    `🌐 Sites chargés (${registry.byId.size}) :`,
    Array.from(registry.byId.keys()).join(', '),
  )
  logBootWarnings(registry)

  const app = express()

  // Render (et la plupart des PaaS) passent par un reverse proxy qui envoie X-Forwarded-For.
  if (isProductionBoot) {
    app.set('trust proxy', 1)
  }

  // CORS dynamique (origines = registre + BACKEND_CORS_ORIGINS + dev defaults).
  const { middleware: corsMiddleware, options: corsOptions, allowed } = corsFromRegistry(registry)
  console.log('🔧 Configuration CORS dynamique :', {
    isProduction: isProductionBoot,
    allowedOriginsCount: allowed.size,
    allowedOrigins: Array.from(allowed),
  })

  app.use(corsMiddleware)
  app.options('*', corsMiddleware)

  if (isProductionBoot) {
    app.use((req, res, next) => {
      if (req.method === 'OPTIONS') {
        console.log('🔍 Requête OPTIONS (preflight) reçue:', {
          origin: req.headers.origin,
          method: req.method,
          path: req.path,
        })
      }
      next()
    })
  }

  // Body parser : JSON sauf pour les webhooks Stripe (body brut requis pour signature).
  app.use((req, res, next) => {
    if (req.path === '/api/stripe/webhook' || req.path.startsWith('/api/stripe/webhook/')) {
      return next()
    }
    express.json()(req, res, next)
  })

  // Routes publiques sans contexte de site.
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Server is running',
      sites: Array.from(registry.byId.keys()),
    })
  })

  // Routes nécessitant un site (Mailjet + n8n) — site résolu via Origin/header.
  app.use('/api', resolveSite(registry), mailjetRoutes)
  app.use('/api/n8n', resolveSite(registry), n8nRoutes)
  app.use('/api/admin', resolveSite(registry), buildAdminRouter(registry))
  app.use('/api/newsletter', resolveSite(registry), buildNewsletterRouter(registry))

  // Stripe webhooks (:siteId) — PaymentIntent
  app.use('/api/stripe', buildStripeRouter(registry))

  // Commandes (checkout personnalisé)
  app.use('/api/orders', buildOrdersRouter(registry))

  // Fallback CORS : transformer les erreurs CORS en 403 propres.
  app.use((err, req, res, next) => {
    if (err && /CORS/.test(String(err.message))) {
      return res.status(403).json({ success: false, error: err.message })
    }
    return next(err)
  })

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

main().catch((err) => {
  console.error('❌ Échec du démarrage du serveur :', err)
  process.exit(1)
})
