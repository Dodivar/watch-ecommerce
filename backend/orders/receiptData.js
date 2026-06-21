const { resolveReceiptBranding } = require('./receiptBranding')

const DISCOUNT_TYPE_LABELS = {
  percent: 'Pourcentage',
  fixed: 'Montant fixe',
  free_shipping: 'Livraison offerte',
}

const LABELS_FR = {
  receiptSubtitle: 'Receipt / Reçu de paiement',
  orderNumber: 'N° de commande',
  paymentDate: 'Date de paiement',
  seller: 'Vendeur',
  customer: 'Client',
  billingAddress: 'Adresse de facturation',
  shipping: 'Livraison',
  deliveryAddress: 'Adresse de livraison',
  pickupLocation: 'Point de retrait',
  method: 'Mode',
  item: 'Article',
  reference: 'Réf.',
  quantity: 'Qté',
  unitPrice: 'Prix unit.',
  lineTotal: 'Total',
  subtotal: 'Sous-total',
  shippingLine: 'Livraison',
  discount: 'Réduction',
  promoCode: 'Code promo',
  netExclVat: 'Montant HT',
  vat: 'TVA',
  totalInclVat: 'Total TTC',
  payment: 'Paiement',
  paymentMethod: 'Mode de paiement',
  paymentRef: 'Référence paiement',
  cardViaStripe: 'Carte bancaire (Stripe)',
  siret: 'SIRET',
  vatNumber: 'N° TVA intracommunautaire',
  free: 'Gratuite',
  cgv: 'CGV',
}

/**
 * @param {number} totalCents
 * @param {number} vatRate
 */
function computeVatBreakdown(totalCents, vatRate) {
  const total = Math.max(0, totalCents || 0)
  const rate = vatRate > 0 ? vatRate : 20
  if (total <= 0) {
    return { netCents: 0, vatCents: 0, vatRate: rate }
  }
  const netCents = Math.round(total / (1 + rate / 100))
  const vatCents = total - netCents
  return { netCents, vatCents, vatRate: rate }
}

/**
 * @param {string} locale
 * @param {string} currency
 * @param {number} cents
 */
function formatMoney(locale, currency, cents) {
  const formatted = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : locale, {
    style: 'currency',
    currency: (currency || 'EUR').toUpperCase(),
  }).format((cents || 0) / 100)
  // PDFKit built-in fonts lack U+202F/U+00A0 — they render as "/" in receipt PDFs.
  return formatted.replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ')
}

/**
 * @param {string} locale
 * @param {string|null|undefined} isoDate
 */
function formatDate(locale, isoDate) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

/**
 * @param {object|null|undefined} address
 */
function formatAddressLines(address) {
  if (!address || typeof address !== 'object') return []
  const recipient = [address.firstName, address.lastName].filter(Boolean).join(' ').trim()
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ').trim()
  return [recipient, address.line1, address.line2, cityLine, address.country]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
}

/**
 * @param {object} site Registry entry
 * @param {object} order
 * @param {object[]} lines
 * @param {{ shipping?: object|null, discount?: object|null }} [extras]
 */
function buildReceiptData(site, order, lines, extras = {}) {
  const branding = resolveReceiptBranding(site)
  const shipping = extras.shipping || null
  const discount = extras.discount || null
  const labels = LABELS_FR

  const subtotalCents = order.subtotal_cents ?? 0
  const shippingCents = order.shipping_cents ?? 0
  const discountCents = discount?.discount_cents ?? order.discount_cents ?? 0
  const totalCents = order.total_cents ?? 0
  const vat = computeVatBreakdown(totalCents, branding.vatRate)

  const paymentIntentId = order.stripe_payment_intent_id || ''
  const paymentRefShort = paymentIntentId ? paymentIntentId.slice(-12) : ''

  const mappedLines = (lines || []).map((line) => ({
    name: line.name,
    reference: line.reference || '',
    quantity: line.quantity || 1,
    unitPriceCents: line.unit_price_cents ?? 0,
    lineTotalCents: (line.unit_price_cents ?? 0) * (line.quantity || 1),
    imageUrl: line.image_url || null,
  }))

  const billingLines = formatAddressLines(order.billing_address)
  const shippingLines = formatAddressLines(order.shipping_address)
  const pickupLocation = shipping?.metadata?.pickupLocation || null

  return {
    branding,
    labels,
    order: {
      id: order.id,
      status: order.status,
      currency: order.currency || branding.currency,
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      paidAt: order.paid_at,
      paymentIntentId,
      paymentRefShort,
    },
    seller: {
      name: branding.legalName,
      address: branding.sellerAddress,
      siret: branding.siret,
      vatNumber: branding.vatNumber,
      email: branding.contactEmail,
    },
    customer: {
      billingLines,
      shippingLines,
      email: order.customer_email || '',
      phone: order.customer_phone || '',
    },
    lines: mappedLines,
    shipping: shipping
      ? {
          methodLabel: shipping.method_label || shipping.method_type || '',
          methodType: shipping.method_type || '',
          feeCents: shipping.fee_cents ?? shippingCents,
          pickupLocation,
        }
      : null,
    discount: discountCents > 0
      ? {
          code: discount?.promo_code || null,
          type: discount?.discount_type || null,
          typeLabel: DISCOUNT_TYPE_LABELS[discount?.discount_type] || discount?.discount_type || '',
          discountCents,
        }
      : null,
    totals: {
      subtotalCents,
      shippingCents,
      discountCents,
      totalCents,
      netCents: vat.netCents,
      vatCents: vat.vatCents,
      vatRate: vat.vatRate,
    },
    formatMoney: (cents) => formatMoney(branding.locale, branding.currency, cents),
    formatDate: (iso) => formatDate(branding.locale, iso),
    showHeroImage: mappedLines.length === 1 && branding.showWatchImages,
  }
}

module.exports = {
  buildReceiptData,
  computeVatBreakdown,
  formatAddressLines,
  formatMoney,
  formatDate,
  DISCOUNT_TYPE_LABELS,
  LABELS_FR,
}
