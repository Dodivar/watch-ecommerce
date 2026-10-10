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
const {
  buildWatchMatchAlertsRouter,
  buildSiteAlertUnsubscribeRouter,
  buildLegacyAlertUnsubscribeRouter,
} = require('./routes/watchMatchAlerts')
const { buildHealthRouter } = require('./routes/health')
const { buildReviewsRouter } = require('./routes/reviews')
const { startNewsletterScheduler } = require('./newsletter/scheduler')
const { startWatchMatchAlertScheduler } = require('./watchMatchAlerts/scheduler')
const { startAbandonedCheckoutScheduler } = require('./orders/recovery')

const isProductionBoot = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'

function logBootWarnings(registry) {
  if (!isProductionBoot) return
  if (!process.env.HEALTH_CHECK_TOKEN) {
    console.warn(
      '⚠️  HEALTH_CHECK_TOKEN absent : /api/health/deep et /api/health/payments répondront 503 (supervision désactivée).',
    )
  }
  if (!process.env.HEALTH_REQUIRED_SITES) {
    console.warn(
      "⚠️  HEALTH_REQUIRED_SITES absent : aucun site n'est déclaré en production, donc un secret effacé passera pour « site non configuré » et non pour une panne. Renseigner la liste des sites live (CSV).",
    )
  }
  for (const site of registry.list()) {
    const missing = []
    if (!site.secrets.stripe.secretKey) missing.push('STRIPE_SECRET_KEY')
    if (!site.secrets.stripe.webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET')
    if (!site.secrets.paymentCancelSecret) missing.push('PAYMENT_CANCEL_SECRET')
    if (!site.secrets.supabase.url) missing.push('SUPABASE_URL')
    if (!site.secrets.supabase.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!site.secrets.mailjet.apiKey) missing.push('MAILJET_API_KEY')
    if (!site.secrets.mailjet.secretKey) missing.push('MAILJET_SECRET_KEY')
    // Uniquement pour les sites qui ont activé les avis : ailleurs, l'absence de clé est le
    // comportement attendu. Sans cette ligne, un `placeId` renseigné sans clé serveur laissait
    // /api/reviews répondre 503 en silence — aucune trace au boot ni à l'appel.
    if (site.config.googleReviews?.enabled && !site.secrets.googlePlaces.apiKey) {
      missing.push('GOOGLE_PLACES_API_KEY')
    }
    if (missing.length > 0) {
      console.warn(
        `⚠️  [${site.id}] secrets manquants : ${missing.join(', ')}. Les routes correspondantes renverront 503 pour ce site.`,
      )
    }
  }
}

/**
 * Application Express, routes montées, sans écoute ni planificateurs : `main` l'utilise, et les
 * tests y jouent des requêtes réelles — l'ordre des montages compte (voir `/api` ci-dessous),
 * et seul un test sur l'application entière le voit.
 * @param {*} registry
 */
function createApp(registry) {
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
  // Regex plutôt que `'*'` : même sens sous Express 4 (prod, `backend/package.json`) et sous
  // l'Express 5 de la racine, que résolvent les tests en CI — où `'*'` lève à la construction.
  app.options(/.*/, corsMiddleware)

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
  // Liveness seule : ne prouve que « le process répond ». L'état réel des tiers
  // (Supabase, Stripe, Mailjet) est sur /api/health/deep, protégé par jeton.
  // La liste des sites n'est plus exposée publiquement.
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Server is running',
      sitesLoaded: registry.byId.size,
    })
  })

  // Supervision (jeton HEALTH_CHECK_TOKEN) : /api/health/deep et /api/health/payments.
  app.use('/api/health', buildHealthRouter(registry))

  // Liens d'e-mail « coup de foudre » : ouverts hors du navigateur de la vitrine (messagerie,
  // POST one-click de Gmail), ils n'ont ni Origin ni X-Site-Id. Montés AVANT le routeur
  // `/api/watch-match-alerts` ci-dessous, dont le `resolveSite` répondrait « Unknown site ».
  app.use('/api/watch-match-alerts', buildLegacyAlertUnsubscribeRouter(registry))
  app.use(
    '/api/sites/:siteId/watch-match-alerts',
    resolveSite(registry),
    buildSiteAlertUnsubscribeRouter(),
  )

  // Routes nécessitant un site — site résolu via Origin/header.
  // Mailjet est monté à la racine de `/api` : son `resolveSite` ne garde que ses propres
  // chemins. Posé sur tout `/api`, il répondait « Unknown site » à tout appelant sans Origin
  // ni X-Site-Id monté plus bas — dont Stripe, dont aucun webhook n'atteignait son routeur.
  // Chemins lus sur le routeur : une route Mailjet ajoutée est gardée sans y penser.
  const mailjetPaths = mailjetRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => `/api${layer.route.path}`)
  app.use(mailjetPaths, resolveSite(registry))
  app.use('/api', mailjetRoutes)
  app.use('/api/n8n', resolveSite(registry), n8nRoutes)
  app.use('/api/admin', resolveSite(registry), buildAdminRouter(registry))
  app.use('/api/newsletter', resolveSite(registry), buildNewsletterRouter(registry))
  // Alertes « coup de foudre » (opt-in public + désinscription par jeton).
  app.use('/api/watch-match-alerts', resolveSite(registry), buildWatchMatchAlertsRouter())
  // Avis Google publics (lecture seule, cache mémoire partagé) — voir routes/reviews.js.
  app.use('/api/reviews', resolveSite(registry), buildReviewsRouter(registry))

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

  return app
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

  const app = createApp(registry)

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })

  // Envoi différé des newsletters programmées (boucle interne au process).
  startNewsletterScheduler(registry)

  // Relance email des paniers abandonnés (sites avec checkout.abandonedCart.enabled).
  startAbandonedCheckoutScheduler(registry)

  // Alertes « coup de foudre » (sites avec features.watchMatchAlerts) : ne démarre pas tant
  // qu'aucun site n'a levé le drapeau.
  startWatchMatchAlertScheduler(registry)
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Échec du démarrage du serveur :', err)
    process.exit(1)
  })
}

module.exports = { createApp }
