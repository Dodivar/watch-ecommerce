#!/usr/bin/env node
/**
 * Envoi d'un exemplaire de CHAQUE email transactionnel, pour CHAQUE site, vers
 * UNE SEULE adresse de test.
 *
 * Objectif : relire d'un coup le rendu et le style de tous les emails que le
 * site sait envoyer, sans avoir à rejouer chaque parcours (formulaire, paiement
 * Stripe, planificateur de relance, campagne newsletter…).
 *
 * Garde-fou : le destinataire est **toujours** l'adresse `--to`. Les adresses
 * réelles des clients (`backend.email.toAddress`, email d'une commande…) ne
 * servent que d'affichage dans le corps du message — aucun message ne part vers
 * une boîte tierce.
 *
 * Usage :
 *   node scripts/send-email-previews.cjs --to moi@exemple.fr            # envoi réel
 *   node scripts/send-email-previews.cjs --dry-run --out reports/emails # rendu HTML seul
 *   node scripts/send-email-previews.cjs --to moi@exemple.fr --sites jackned --types repair-customer
 *
 * Options :
 *   --to <email>      Destinataire unique (obligatoire hors --dry-run).
 *   --sites <a,b>     Sites à traiter (défaut : tous ceux de sites/).
 *   --types <a,b>     Variantes à envoyer (défaut : toutes, voir VARIANTS).
 *   --from <email>    Force l'expéditeur (utile si les adresses des sites ne
 *                     sont pas validées dans le compte Mailjet utilisé).
 *   --dry-run         N'envoie rien : écrit les HTML dans --out.
 *   --out <dir>       Dossier de sortie du --dry-run (défaut : reports/email-previews).
 *   --list            Affiche les variantes disponibles et sort.
 *
 *   --env <fichier>   Fichier .env supplémentaire à charger, avant les emplacements
 *                     habituels (`backend/.env` puis `.env` à la racine).
 *
 * Secrets Mailjet : résolus par `backend/sites/secrets.js`, donc
 * `SITE_<ID>__MAILJET_API_KEY` / `_SECRET_KEY` si la vitrine a ses propres clés,
 * sinon le compte partagé `MAILJET_API_KEY` / `MAILJET_SECRET_KEY`.
 *
 * Ces variables viennent de l'environnement du shell **ou** d'un fichier `.env` :
 * `server.js` lit `backend/.env`, les autres scripts du dépôt lisent `.env` à la
 * racine. Ce script charge les deux (sans jamais écraser une variable déjà posée
 * dans l'environnement) et affiche lesquels il a trouvés — sans quoi un `.env`
 * correctement rempli mais rangé ailleurs ressemble à des clés absentes.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

/**
 * Charge les `.env` du dépôt AVANT tout require lisant `process.env` — `registry.js`
 * résout les secrets de chaque site au chargement. `dotenv` n'écrase jamais une
 * variable déjà définie : le shell garde le dernier mot, et `backend/.env` (celui
 * du serveur) prime sur le `.env` de la racine.
 *
 * @returns {{ loaded: string[], missing: string[] }} chemins relatifs à la racine
 */
function loadEnvFiles() {
  const dotenv = require('dotenv')
  const explicit = []
  const flagIndex = process.argv.indexOf('--env')
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    explicit.push(path.resolve(process.cwd(), process.argv[flagIndex + 1]))
  }

  // Un `--env` hors du dépôt s'afficherait en `../../../tmp/…` : garder l'absolu.
  const label = (file) => {
    const relative = path.relative(ROOT, file)
    return relative.startsWith('..') ? file : relative
  }

  const candidates = [...explicit, path.join(ROOT, 'backend/.env'), path.join(ROOT, '.env')]
  const loaded = []
  const missing = []
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file })
      loaded.push(label(file))
    } else {
      missing.push(label(file))
    }
  }
  return { loaded, missing }
}

const ENV_FILES = loadEnvFiles()

const { buildRegistry } = require(path.join(ROOT, 'backend/sites/registry'))
const { createEmailTemplate, formatEmailContent } = require(
  path.join(ROOT, 'backend/templates/estimationEmail'),
)
const {
  createAppointmentVendorEmail,
  createAppointmentCustomerEmail,
  formatAppointmentVendorText,
  formatAppointmentCustomerText,
} = require(path.join(ROOT, 'backend/templates/appointmentEmail'))
const {
  createRepairVendorEmail,
  createRepairCustomerEmail,
  formatRepairVendorText,
  formatRepairCustomerText,
} = require(path.join(ROOT, 'backend/templates/repairEmail'))
const { createOrderConfirmationEmail } = require(
  path.join(ROOT, 'backend/templates/orderConfirmationEmail'),
)
const { createAbandonedCheckoutEmail } = require(
  path.join(ROOT, 'backend/templates/abandonedCheckoutEmail'),
)
const { createNewsletterEmail, defaultNewsletterSettings } = require(
  path.join(ROOT, 'backend/templates/newsletterEmail'),
)
const { createWatchMatchAlertEmail } = require(
  path.join(ROOT, 'backend/templates/watchMatchAlertEmail'),
)
const { generateOrderReceiptPdf, receiptPdfFilename } = require(
  path.join(ROOT, 'backend/orders/receiptPdf'),
)
const { resolveStorefrontBase, buildResumeCheckoutUrl, buildOrderFollowUpUrl } = require(
  path.join(ROOT, 'backend/orders/orderLinks'),
)
const { buildGoogleMapsDirectionsUrl } = require(path.join(ROOT, 'backend/utils/googleMapsLinks'))

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { dryRun: false, list: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--list') args.list = true
    else if (arg === '--to') args.to = argv[++i]
    else if (arg === '--from') args.from = argv[++i]
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--sites') args.sites = argv[++i]
    else if (arg === '--types') args.types = argv[++i]
    else if (arg === '--env')
      args.env = argv[++i] // déjà consommé par loadEnvFiles
    else throw new Error(`Option inconnue : ${arg}`)
  }
  return args
}

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

// ---------------------------------------------------------------------------
// Jeu de données de démonstration
// ---------------------------------------------------------------------------

/** Date de rendez-vous : un mardi à venir, pour que le libellé reste plausible. */
function upcomingWeekday(daysAhead = 9) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  while (d.getDay() === 0 || d.getDay() === 1) d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** PNG 8×8 gris — pièce jointe factice du formulaire atelier. */
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAKklEQVR42mNkYPhfz0AEYBxVSF+' +
  'FjIyM/xkYGBiIUcjEQCQYVUhfhQCq0AYFvXeQBQAAAABJRU5ErkJggg=='

const CUSTOMER = {
  name: 'Dorian Dillen',
  firstName: 'Dorian',
  lastName: 'Dillen',
  tel: '+33 6 12 34 56 78',
}

/**
 * Toutes les données factices d'un site, dérivées de sa config (marque, URLs,
 * devise) pour que chaque email ressemble à ce que le client recevrait vraiment.
 * @param {object} site
 * @param {string} recipient
 */
function buildFixtures(site, recipient) {
  const brandName = site.config.backend.email.fromName
  const storefront = resolveStorefrontBase(site) || 'https://example.com'
  const apiBase = site.config.backend?.publicApiUrl || 'https://watch-ecommerce-mp9l.onrender.com'
  const orderId = 'DEMO-EMAIL-0001'

  const lines = [
    {
      watch_id: 'demo-1',
      name: 'Omega Speedmaster Professional',
      reference: '310.30.42.50.01.002',
      unit_price_cents: 689000,
      quantity: 1,
      image_url: null,
    },
    {
      watch_id: 'demo-2',
      name: 'Tudor Black Bay 58',
      reference: 'M79030N-0001',
      unit_price_cents: 349000,
      quantity: 1,
      image_url: null,
    },
  ]

  const subtotal = lines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0)
  const shippingCents = 2500
  const discountCents = 50000

  const order = {
    id: orderId,
    status: 'paid',
    customer_email: recipient,
    customer_phone: CUSTOMER.tel,
    subtotal_cents: subtotal,
    shipping_cents: shippingCents,
    discount_cents: discountCents,
    total_cents: subtotal + shippingCents - discountCents,
    paid_at: new Date().toISOString(),
    payment_intent_id: 'pi_demo_email_preview',
    shipping_address: {
      firstName: CUSTOMER.firstName,
      lastName: CUSTOMER.lastName,
      line1: '14 place de la Cathédrale',
      line2: 'Bâtiment B, 3e étage',
      postalCode: '67000',
      city: 'Strasbourg',
      country: 'France',
    },
  }

  const extras = {
    shipping: { method_type: 'delivery', method_label: 'Livraison assurée à domicile (24-48 h)' },
    discount: { promo_code: 'BIENVENUE10', discount_type: 'fixed', discount_cents: discountCents },
    followUpUrl: buildOrderFollowUpUrl(site, orderId, 'jeton-de-demonstration'),
  }

  const draftOrder = {
    ...order,
    id: 'DEMO-EMAIL-0002',
    status: 'draft',
    total_cents: subtotal,
    discount_cents: 0,
  }

  const directionsUrl =
    buildGoogleMapsDirectionsUrl({
      address: site.config.storeMap?.directionsAddress || site.config.legal?.address,
      placeId: site.config.storeMap?.googlePlaceId,
      lat: site.config.storeMap?.center?.lat,
      lng: site.config.storeMap?.center?.lng,
      query: site.config.storeMap?.googlePlaceQuery,
    }) || ''

  return {
    brandName,
    storefront,
    apiBase,
    order,
    draftOrder,
    lines,
    extras,
    resumeUrl: buildResumeCheckoutUrl(site, draftOrder.id, 'jeton-de-demonstration'),
    unsubscribeUrl: `${apiBase}/api/newsletter/unsubscribe?token=apercu`,
    alertUnsubscribeUrl: `${apiBase}/api/watch-match-alerts/unsubscribe?token=apercu`,

    contact: {
      type: 'contact',
      name: CUSTOMER.name,
      email: recipient,
      tel: CUSTOMER.tel,
      message:
        "Bonjour,\n\nJ'ai vu une Speedmaster sur votre site et j'aimerais savoir si elle est " +
        "toujours disponible, et si vous acceptez une reprise en échange.\n\nMerci d'avance.",
    },

    estimation: {
      type: 'estimation',
      nickname: CUSTOMER.firstName,
      name: CUSTOMER.lastName,
      email: recipient,
      tel: CUSTOMER.tel,
      contact_mode: 'Email, Téléphone',
      brand: 'Rolex',
      model: 'Datejust 36',
      serienumber: 'Z123456',
      year: '2007',
      etat: 'Très bon état, quelques micro-rayures sur le fermoir',
      possession: 'Boîte et papiers d’origine, achetée en concession',
      message:
        'Montre portée avec soin, révisée en 2021. Je souhaite connaître votre offre de reprise.',
    },

    search: {
      type: 'search',
      nickname: CUSTOMER.firstName,
      name: CUSTOMER.lastName,
      email: recipient,
      tel: CUSTOMER.tel,
      contact_mode: 'Email',
      brand: 'Patek Philippe',
      model: 'Aquanaut 5167A',
      budget_min: 35000,
      budget_max: 55000,
      condition: 'Neuve ou très bon état',
      delai: 'Sous 3 mois',
      message: 'Je cherche une pièce complète (boîte + papiers), acier, cadran noir de préférence.',
    },

    appointment: {
      type: 'appointment',
      name: CUSTOMER.name,
      email: recipient,
      tel: CUSTOMER.tel,
      date: upcomingWeekday(),
      time_slot: 'afternoon',
      watch_id: 'demo-1',
      watch_name: 'Omega Speedmaster Professional',
      watch_price: '6 890',
      watch_url: `${storefront}/montre/omega-speedmaster-professional`,
      directions_url: directionsUrl,
    },

    repair: {
      type: 'repair',
      name: CUSTOMER.name,
      email: recipient,
      tel: CUSTOMER.tel,
      service_type: 'Révision complète du mouvement',
      handling: 'dropoff',
      source: 'services/revision',
      brand: 'Longines',
      model: 'Conquest Heritage',
      message:
        "La montre retarde d'environ 3 minutes par jour et la couronne est devenue dure à " +
        'remonter. Elle n’a jamais été révisée depuis son achat en 2016.',
    },

    newsletter: {
      subject: `Les nouveautés du mois — ${brandName}`,
      bodyHtml: `
        <h2>Trois pièces viennent d'arriver</h2>
        <p>
          Bonjour,<br>
          Voici la sélection du mois : trois montres entrées en vitrine cette semaine,
          toutes révisées par notre atelier et garanties 24 mois.
        </p>
        <ul>
          <li><strong>Omega Speedmaster Professional</strong> — 6 890 €</li>
          <li><strong>Tudor Black Bay 58</strong> — 3 490 €</li>
          <li><strong>Longines Conquest Heritage</strong> — 1 250 €</li>
        </ul>
        <p>
          <a href="${storefront}/collection">Découvrir la collection complète</a>
        </p>
        <blockquote>
          Chaque montre est vendue avec sa garantie maison et son certificat d'authenticité.
        </blockquote>
        <p><em>À très bientôt en boutique,</em><br>L'équipe ${brandName}</p>`,
    },

    matchWatches: [
      {
        brand: 'Omega',
        name: 'Speedmaster Professional',
        reference: '310.30.42.50.01.002',
        price: 6890,
        promotionPrice: null,
        url: `${storefront}/montre/omega-speedmaster-professional`,
        imageUrl: null,
      },
      {
        brand: 'Tudor',
        name: 'Black Bay 58',
        reference: 'M79030N-0001',
        price: 3490,
        promotionPrice: 3290,
        url: `${storefront}/montre/tudor-black-bay-58`,
        imageUrl: null,
      },
    ],
  }
}

/**
 * Textes de l'alerte « coup de foudre ». Recopiés depuis
 * `packages/base/src/i18n/watchMatchAlertEmail.js` (ESM, non requérable ici) —
 * le rendu HTML, lui, passe bien par le template de production.
 * @param {string} brandName
 * @param {number} count
 */
function matchAlertCopy(brandName, count) {
  return {
    lang: 'fr',
    subject: `${count} montre${count > 1 ? 's' : ''} pour vous — ${brandName}`,
    title: count > 1 ? 'De nouvelles montres pour vous' : 'Une nouvelle montre pour vous',
    intro: 'Elles correspondent aux critères que vous nous avez laissés.',
    seeWatch: 'Voir la montre',
    more: '',
    browse: 'Parcourir toute la collection',
    reason: 'Vous recevez cet e-mail parce que vous avez créé une alerte sur notre site.',
    unsubscribe: 'Me désinscrire des alertes',
  }
}

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

/**
 * Une variante = un message réellement envoyable par la production.
 * `build(site, fx)` renvoie { subject, html, text?, attachments?, realRecipient }
 * où `realRecipient` documente qui l'aurait reçu en vrai (jamais utilisé pour l'envoi).
 */
const VARIANTS = [
  {
    id: 'contact-vendor',
    label: 'Formulaire contact → commerçant',
    source: 'POST /api/send-email (type=contact)',
    build: (site, fx) => ({
      realRecipient: site.config.backend.email.toAddress,
      subject: `Nouveau message de contact — ${fx.contact.name}`,
      text: formatEmailContent(fx.contact),
      html: createEmailTemplate(site, fx.contact),
    }),
  },
  {
    id: 'estimation-vendor',
    label: 'Formulaire estimation → commerçant',
    source: 'POST /api/send-email (type=estimation)',
    build: (site, fx) => ({
      realRecipient: site.config.backend.email.toAddress,
      subject: `Nouvelle demande d'estimation — ${fx.estimation.brand} ${fx.estimation.model}`,
      text: formatEmailContent(fx.estimation),
      html: createEmailTemplate(site, fx.estimation),
    }),
  },
  {
    id: 'search-vendor',
    label: 'Formulaire recherche personnalisée → commerçant',
    source: 'POST /api/send-email (type=search)',
    build: (site, fx) => ({
      realRecipient: site.config.backend.email.toAddress,
      subject: `Nouvelle recherche personnalisée — ${fx.search.brand} ${fx.search.model}`,
      text: formatEmailContent(fx.search),
      html: createEmailTemplate(site, fx.search),
    }),
  },
  {
    id: 'appointment-vendor',
    label: 'Prise de rendez-vous → commerçant',
    source: 'POST /api/send-email (type=appointment)',
    build: (site, fx) => ({
      realRecipient: site.config.backend.email.toAddress,
      subject: `Nouvelle demande de rendez-vous — ${fx.appointment.watch_name}`,
      text: formatAppointmentVendorText(fx.appointment),
      html: createAppointmentVendorEmail(site, fx.appointment),
    }),
  },
  {
    id: 'appointment-customer',
    label: 'Prise de rendez-vous → client',
    source: 'POST /api/send-email (type=appointment)',
    build: (site, fx) => ({
      realRecipient: fx.appointment.email,
      subject: `Confirmation de votre rendez-vous — ${fx.brandName}`,
      text: formatAppointmentCustomerText(site, fx.appointment),
      html: createAppointmentCustomerEmail(site, fx.appointment),
    }),
  },
  {
    id: 'repair-vendor',
    label: 'Demande de prise en charge atelier → commerçant (avec photo jointe)',
    source: 'POST /api/send-email (type=repair)',
    build: (site, fx) => {
      const files = [{ name: 'cadran-longines.png' }]
      return {
        realRecipient: site.config.backend.email.toAddress,
        subject: `Nouvelle demande de prise en charge — ${fx.repair.service_type}`,
        text: formatRepairVendorText(fx.repair, files),
        html: createRepairVendorEmail(site, fx.repair, files),
        attachments: [
          {
            ContentType: 'image/png',
            Filename: 'cadran-longines.png',
            Base64Content: SAMPLE_PNG_BASE64,
          },
        ],
      }
    },
  },
  {
    id: 'repair-customer',
    label: 'Demande de prise en charge atelier → client',
    source: 'POST /api/send-email (type=repair)',
    build: (site, fx) => ({
      realRecipient: fx.repair.email,
      subject: `Votre demande de prise en charge — ${fx.brandName}`,
      text: formatRepairCustomerText(fx.repair),
      html: createRepairCustomerEmail(site, fx.repair),
    }),
  },
  {
    id: 'order-customer',
    label: 'Confirmation de commande → client (reçu PDF joint)',
    source: 'backend/orders/email.js (webhook Stripe)',
    build: async (site, fx) => {
      const attachments = []
      try {
        const pdf = await generateOrderReceiptPdf(site, fx.order, fx.lines, fx.extras)
        if (pdf) {
          attachments.push({
            ContentType: 'application/pdf',
            Filename: receiptPdfFilename(fx.order.id),
            Base64Content: pdf.toString('base64'),
          })
        }
      } catch (e) {
        console.warn(`   ⚠️  reçu PDF non généré : ${e.message}`)
      }
      return {
        realRecipient: fx.order.customer_email,
        subject: `Confirmation de commande — ${fx.brandName}`,
        html: createOrderConfirmationEmail(site, fx.order, fx.lines, false, fx.extras),
        attachments,
      }
    },
  },
  {
    id: 'order-merchant',
    label: 'Confirmation de commande → commerçant',
    source: 'backend/orders/email.js (webhook Stripe)',
    build: (site, fx) => ({
      realRecipient: site.config.backend.email.toAddress,
      subject: `Nouvelle commande — ${fx.order.id}`,
      html: createOrderConfirmationEmail(site, fx.order, fx.lines, true, fx.extras),
    }),
  },
  {
    id: 'abandoned-checkout',
    label: 'Relance panier abandonné → client',
    source: 'backend/orders/recovery.js (planificateur)',
    build: (site, fx) => ({
      realRecipient: fx.draftOrder.customer_email,
      subject: `Votre commande vous attend — ${fx.brandName}`,
      html: createAbandonedCheckoutEmail(site, fx.draftOrder, fx.lines, fx.resumeUrl),
    }),
  },
  {
    id: 'newsletter',
    label: 'Campagne newsletter → abonné',
    source: 'POST /api/newsletter/campaigns/:id/send',
    build: (site, fx) => ({
      realRecipient: 'abonnés newsletter (table newsletter_subscribers)',
      subject: fx.newsletter.subject,
      html: createNewsletterEmail(site, {
        subject: fx.newsletter.subject,
        bodyHtml: fx.newsletter.bodyHtml,
        settings: defaultNewsletterSettings(site),
        unsubscribeUrl: fx.unsubscribeUrl,
      }),
      headers: {
        'List-Unsubscribe': `<${fx.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  },
  {
    id: 'watch-match-alert',
    label: 'Alerte « coup de foudre » → abonné',
    source: 'backend/watchMatchAlerts/scheduler.js (planificateur)',
    build: (site, fx) => {
      const copy = matchAlertCopy(fx.brandName, fx.matchWatches.length)
      return {
        realRecipient: 'abonnés alertes (table watch_match_alerts)',
        subject: copy.subject,
        html: createWatchMatchAlertEmail(site, {
          watches: fx.matchWatches,
          copy,
          unsubscribeUrl: fx.alertUnsubscribeUrl,
          browseUrl: `${fx.storefront}/collection`,
          currency: site.config.checkout?.currency || 'EUR',
        }),
        headers: {
          'List-Unsubscribe': `<${fx.alertUnsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Envoi
// ---------------------------------------------------------------------------

/** Un message Mailjet v3.1, destinataire forcé sur l'adresse de test. */
function toMailjetMessage(site, variant, built, { recipient, fromOverride }) {
  const emailCfg = site.config.backend.email
  const from = fromOverride || site.secrets.emailFrom || emailCfg.fromAddress
  return {
    From: { Email: from, Name: `${emailCfg.fromName} (aperçu)` },
    To: [{ Email: recipient, Name: CUSTOMER.name }],
    Subject: `[${site.id} · ${variant.id}] ${built.subject}`,
    ...(built.text ? { TextPart: built.text } : {}),
    HTMLPart: built.html,
    ...(built.attachments?.length ? { Attachments: built.attachments } : {}),
    ...(built.headers ? { Headers: built.headers } : {}),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.list) {
    console.log('Variantes disponibles :\n')
    for (const v of VARIANTS) {
      console.log(`  ${v.id.padEnd(22)} ${v.label}\n  ${' '.repeat(22)} ↳ ${v.source}\n`)
    }
    return
  }

  const recipient = args.to || process.env.EMAIL_PREVIEW_TO || null
  if (!args.dryRun && !recipient) {
    throw new Error('Destinataire manquant : passer --to <email> (ou --dry-run).')
  }

  const registry = await buildRegistry()
  const wantedSites = args.sites ? splitList(args.sites) : null
  const sites = registry.list().filter((s) => !wantedSites || wantedSites.includes(s.id))
  if (sites.length === 0) {
    throw new Error(`Aucun site ne correspond à --sites ${args.sites}`)
  }

  const wantedTypes = args.types ? splitList(args.types) : null
  const variants = VARIANTS.filter((v) => !wantedTypes || wantedTypes.includes(v.id))
  if (variants.length === 0) {
    throw new Error(`Aucune variante ne correspond à --types ${args.types}`)
  }

  const outDir = path.resolve(ROOT, args.out || 'reports/email-previews')
  if (args.dryRun) fs.mkdirSync(outDir, { recursive: true })

  if (!args.dryRun) {
    console.log(
      ENV_FILES.loaded.length
        ? `Fichiers .env chargés : ${ENV_FILES.loaded.join(', ')}`
        : `Aucun fichier .env trouvé (cherchés : ${ENV_FILES.missing.join(', ')}) — les clés doivent venir du shell.`,
    )
  }

  console.log(
    args.dryRun
      ? `Rendu de ${sites.length} site(s) × ${variants.length} variante(s) → ${outDir}\n`
      : `Envoi de ${sites.length} site(s) × ${variants.length} variante(s) → ${recipient}\n`,
  )

  const summary = []

  for (const site of sites) {
    console.log(`── ${site.id} (${site.config.backend.email.fromName})`)
    const fx = buildFixtures(site, recipient || 'client@exemple.fr')

    /** @type {object[]} */
    const messages = []
    for (const variant of variants) {
      let built
      try {
        built = await variant.build(site, fx)
      } catch (e) {
        console.log(`   ❌ ${variant.id} — rendu impossible : ${e.message}`)
        summary.push({
          site: site.id,
          variant: variant.id,
          status: 'render-error',
          detail: e.message,
        })
        continue
      }

      if (args.dryRun) {
        const file = path.join(outDir, `${site.id}--${variant.id}.html`)
        fs.writeFileSync(file, built.html)
        console.log(`   ✅ ${variant.id} → ${path.relative(ROOT, file)}`)
        summary.push({ site: site.id, variant: variant.id, status: 'rendered' })
        continue
      }

      messages.push({
        variant,
        message: toMailjetMessage(site, variant, built, {
          recipient,
          fromOverride: args.from,
        }),
      })
    }

    if (args.dryRun || messages.length === 0) {
      console.log('')
      continue
    }

    // `getSiteSecrets` retombe déjà sur le compte Mailjet partagé (`MAILJET_API_KEY`)
    // quand la vitrine n'a pas de clé dédiée : rien à rattraper ici.
    const { apiKey, secretKey } = site.secrets.mailjet
    if (!apiKey || !secretKey) {
      const segment = site.id.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
      console.log(
        `   ❌ clés Mailjet absentes : ni SITE_${segment}__MAILJET_API_KEY/_SECRET_KEY, ` +
          `ni le compte partagé MAILJET_API_KEY/MAILJET_SECRET_KEY.`,
      )
      console.log(
        ENV_FILES.loaded.length
          ? `      Lu depuis : ${ENV_FILES.loaded.join(', ')} — vérifier que les deux clés y figurent, sans guillemets ni espace autour du "=".`
          : `      Aucun .env chargé. Le placer en ${ENV_FILES.missing.join(' ou ')}, ou le désigner avec --env <fichier>.`,
      )
      for (const { variant } of messages) {
        summary.push({ site: site.id, variant: variant.id, status: 'no-credentials' })
      }
      console.log('')
      continue
    }

    const Mailjet = require('node-mailjet')
    const client = Mailjet.apiConnect(apiKey, secretKey)

    // Lots de 50 : limite d'un appel `send` v3.1.
    for (let i = 0; i < messages.length; i += 50) {
      const batch = messages.slice(i, i + 50)
      let response
      try {
        response = await client
          .post('send', { version: 'v3.1' })
          .request({ Messages: batch.map((m) => m.message) })
      } catch (e) {
        const detail = e.response?.body ? JSON.stringify(e.response.body) : e.message
        for (const { variant } of batch) {
          console.log(`   ❌ ${variant.id} — ${detail}`)
          summary.push({ site: site.id, variant: variant.id, status: 'send-error', detail })
        }
        continue
      }

      const results = response?.body?.Messages || []
      batch.forEach(({ variant }, idx) => {
        const result = results[idx]
        if (result?.Status === 'success') {
          console.log(`   ✅ ${variant.id}`)
          summary.push({ site: site.id, variant: variant.id, status: 'sent' })
        } else {
          const detail = (result?.Errors || [])
            .map((err) => err.ErrorMessage || err.ErrorCode)
            .join(' ; ')
          console.log(`   ❌ ${variant.id} — ${detail || 'refusé par Mailjet'}`)
          summary.push({ site: site.id, variant: variant.id, status: 'rejected', detail })
        }
      })
    }
    console.log('')
  }

  const counts = summary.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})
  console.log('Bilan :', counts)

  const failed = summary.filter((r) => !['sent', 'rendered'].includes(r.status))
  if (failed.length > 0) {
    console.log('\nÉchecs :')
    for (const row of failed) {
      console.log(
        `  ${row.site} / ${row.variant} — ${row.status}${row.detail ? ` : ${row.detail}` : ''}`,
      )
    }
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
