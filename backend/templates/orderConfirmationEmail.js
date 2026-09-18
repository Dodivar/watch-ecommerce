/**
 * E-mails de confirmation de commande — un exemplaire au client, un au commerçant.
 *
 * Ces deux courriers partagent le corps : le client garde le détail de ce qu'il a payé, le
 * commerçant lit la même chose pour préparer l'envoi. Seuls diffèrent le titre, la phrase
 * d'accroche et le lien de suivi, réservé au client.
 *
 * Le branding (logo, accent, beiges, typographie, arrondis) vient de `resolveEmailBranding` —
 * voir `emailCommon.js`. Ce fichier composait auparavant son propre HTML avec des gris en dur,
 * et sortait donc aux couleurs d'aucun site.
 */

const {
  escapeHtml,
  emailShell,
  section,
  fieldRow,
  optionalFieldRow,
  fieldTable,
  lineItemsTable,
  paragraph,
  button,
  buttonRow,
  resolveEmailBranding,
} = require('./emailCommon')

function formatEur(cents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100,
  )
}

const DISCOUNT_TYPE_LABELS = {
  percent: 'Pourcentage',
  fixed: 'Montant fixe',
  free_shipping: 'Livraison offerte',
}

/**
 * Adresse de livraison sur plusieurs lignes.
 * @param {object|null} address
 * @returns {string} HTML déjà échappé, ou chaîne vide
 */
function buildAddressHtml(address) {
  if (!address || typeof address !== 'object') return ''
  const recipient = [address.firstName, address.lastName].filter(Boolean).join(' ').trim()
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ').trim()
  const parts = [recipient, address.line1, address.line2, cityLine, address.country]
    .map((p) => String(p || '').trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  return parts.map((p) => escapeHtml(p)).join('<br>')
}

/**
 * Lien WhatsApp pré-rempli vers le vendeur, pour les remises en main propre dont le lieu
 * se convient avec l'acheteur (`pickupLocation.whatsapp` du manifest).
 *
 * Le message nomme la montre et le numéro de commande : le vendeur sait de quoi il s'agit
 * dès la première ligne, sans faire répéter le client.
 *
 * @param {object} site Site registry entry
 * @param {object} order
 * @param {object[]} lines Lignes `order_lines`
 * @param {object|null} shipping Ligne `order_shipping`
 * @returns {string} URL wa.me, ou chaîne vide si le cas ne s'applique pas
 */
function buildPickupWhatsappUrl(site, order, lines, shipping) {
  if (shipping?.method_type !== 'pickup') return ''

  const methods = site.config?.checkout?.shipping?.methods || []
  const method = methods.find((m) => m.id === shipping.method_id)
  if (!method?.pickupLocation?.whatsapp) return ''

  const number = String(site.config?.contact?.whatsappE164 || '').replace(/[^0-9]/g, '')
  if (!number) return ''

  const watchLabel = (lines || [])
    .map((l) => [l.name, l.reference].filter(Boolean).join(' — '))
    .filter(Boolean)
    .join(', ')

  const message = [
    'Bonjour, je viens de passer la commande ' + order.id + '.',
    watchLabel ? 'Montre : ' + watchLabel + '.' : '',
    'Je souhaite convenir d’un rendez-vous pour la remise en main propre.',
  ]
    .filter(Boolean)
    .join(' ')

  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message)
}

/**
 * @param {object} site Site registry entry
 * @param {object} order
 * @param {object[]} lines Lignes `order_lines` (`image_url` porte l'instantané de la fiche)
 * @param {boolean} forMerchant
 * @param {{ shipping?: object|null, discount?: object|null, followUpUrl?: string|null }} [extras]
 * @returns {string} HTML
 */
function createOrderConfirmationEmail(site, order, lines, forMerchant = false, extras = {}) {
  const branding = resolveEmailBranding(site)
  const title = forMerchant ? 'Nouvelle commande en ligne' : 'Confirmation de votre commande'

  const shipping = extras.shipping || null
  const discount = extras.discount || null
  // Lien de suivi durable — la trace que le client garde de sa commande, sans compte
  // ni mot de passe. Réservé à l'email client : le commerçant passe par l'admin.
  const followUpUrl = !forMerchant && extras.followUpUrl ? String(extras.followUpUrl) : ''

  const hasDiscount = Boolean(discount) || (order.discount_cents || 0) > 0
  const discountCents = discount?.discount_cents ?? order.discount_cents ?? 0

  const totals = [
    { label: 'Sous-total', amountLabel: formatEur(order.subtotal_cents) },
    { label: 'Livraison', amountLabel: formatEur(order.shipping_cents) },
    ...(hasDiscount
      ? [{ label: 'Réduction', amountLabel: `-${formatEur(discountCents)}`, tone: 'positive' }]
      : []),
    { label: 'Total', amountLabel: formatEur(order.total_cents), strong: true },
  ]

  // `image_url` est l'instantané de la fiche au moment de la commande, écrit sur `order_lines`
  // à la création : la photo reste celle que le client a vue, même si la montre est retirée du
  // catalogue ensuite. Le reçu PDF joint à cet e-mail montre déjà les mêmes vignettes.
  const itemsHtml = lineItemsTable(
    branding,
    (lines || []).map((l) => ({
      name: l.name,
      reference: l.reference,
      imageUrl: l.image_url,
      quantity: Number(l.quantity) || 1,
      amountLabel: formatEur(l.unit_price_cents * (Number(l.quantity) || 1)),
    })),
    { totals },
  )

  const orderHtml = section(
    branding,
    'Commande',
    fieldTable(
      fieldRow(branding, 'N° de commande', order.id) +
        optionalFieldRow(branding, 'Client', order.customer_email) +
        optionalFieldRow(branding, 'Téléphone', order.customer_phone),
    ),
  )

  const discountHtml = hasDiscount
    ? section(
        branding,
        'Réduction appliquée',
        fieldTable(
          optionalFieldRow(branding, 'Code promo', discount?.promo_code) +
            optionalFieldRow(
              branding,
              'Type',
              discount?.discount_type
                ? DISCOUNT_TYPE_LABELS[discount.discount_type] || discount.discount_type
                : '',
            ) +
            fieldRow(branding, 'Montant économisé', `-${formatEur(discountCents)}`),
        ),
      )
    : ''

  const addressHtml = buildAddressHtml(order.shipping_address)
  const shippingHtml =
    shipping || addressHtml
      ? section(
          branding,
          'Livraison',
          fieldTable(
            optionalFieldRow(
              branding,
              'Méthode',
              shipping?.method_label || shipping?.method_type || '',
            ) +
              (addressHtml
                ? fieldRow(branding, 'Adresse de livraison', addressHtml, { html: true })
                : ''),
          ),
        )
      : ''

  // Réservé au client : le commerçant a déjà le numéro et l'admin sous la main.
  const pickupWhatsappUrl = forMerchant
    ? ''
    : buildPickupWhatsappUrl(site, order, lines, shipping)
  const pickupWhatsappHtml = pickupWhatsappUrl
    ? section(
        branding,
        'Convenir du rendez-vous',
        paragraph(
          branding,
          `La remise se fait en main propre, en un lieu convenu ensemble. Écrivez-nous sur
           WhatsApp pour fixer le rendez-vous — le message est déjà rédigé, il ne reste
           qu'à l'envoyer.`,
        ) + buttonRow([button(branding, pickupWhatsappUrl, 'Prendre rendez-vous sur WhatsApp')]),
      )
    : ''

  const followUpHtml = followUpUrl
    ? section(
        branding,
        'Suivre votre commande',
        paragraph(
          branding,
          `Retrouvez à tout moment le détail de votre commande et retéléchargez votre reçu
           depuis ce lien — sans compte ni mot de passe. Conservez cet email.`,
        ) + buttonRow([button(branding, followUpUrl, 'Voir ma commande')]),
      )
    : ''

  const intro = forMerchant
    ? paragraph(branding, 'Une commande vient d\'être payée sur la boutique en ligne.')
    : paragraph(
        branding,
        `Merci pour votre commande. Voici le détail de ce qui a été payé ; votre reçu est joint
         à cet email au format PDF.`,
      )

  // Une commande sans ligne ne doit pas rendre un panneau vide : le cas se produit sur les
  // envois de rattrapage, quand les lignes n'ont pas pu être relues.
  const itemsSectionHtml = itemsHtml
    ? section(branding, forMerchant ? 'Articles commandés' : 'Votre commande', itemsHtml)
    : ''

  const body = `
    ${intro}
    ${orderHtml}
    ${itemsSectionHtml}
    ${discountHtml}
    ${shippingHtml}
    ${pickupWhatsappHtml}
    ${followUpHtml}
  `

  return emailShell(site, title, body, {
    preheader: `${forMerchant ? 'Commande' : 'Commande confirmée'} ${order.id} — ${formatEur(order.total_cents)}`,
  })
}

module.exports = {
  createOrderConfirmationEmail,
  formatEur,
}
