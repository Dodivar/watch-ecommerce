const fs = require('fs')
const path = require('path')

const { SITES_DIR } = require('../sites/registry')

const DEFAULT_RECEIPT = {
  enabled: true,
  documentTitle: 'Reçu de paiement',
  footerNote: '',
  showWatchImages: true,
  logoPath: null,
}

const LOGO_CANDIDATES = [
  '/brand-logo.jpg',
  '/web-app-manifest-512x512.png',
  '/logo500x500.png',
  '/favicon-96x96.png',
]

/**
 * @param {object} site Registry entry
 */
function resolveReceiptConfig(site) {
  const raw = site.config?.raw?.receipt || {}
  const receipt = { ...DEFAULT_RECEIPT, ...raw }
  if (raw.enabled === false) {
    receipt.enabled = false
  }
  if (raw.documentTitle) {
    receipt.documentTitle = String(raw.documentTitle)
  }
  return receipt
}

/**
 * @param {string} siteId
 * @param {string} relativePath
 * @returns {string|null}
 */
function resolvePublicAssetPath(siteId, relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return null
  const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  const absolute = path.join(SITES_DIR, siteId, 'public', normalized)
  return fs.existsSync(absolute) ? absolute : null
}

/**
 * @param {object} site Registry entry
 * @returns {string|null}
 */
function resolveLogoPath(site) {
  const receiptCfg = resolveReceiptConfig(site)
  const raw = site.config?.raw || {}
  const candidates = [
    receiptCfg.logoPath,
    raw.seo?.indexHtml?.ogImagePath,
    ...LOGO_CANDIDATES,
  ].filter(Boolean)

  for (const candidate of candidates) {
    const resolved = resolvePublicAssetPath(site.id, candidate)
    if (resolved) return resolved
  }
  return null
}

/**
 * @param {object} site Registry entry
 */
function resolveReceiptBranding(site) {
  const raw = site.config?.raw || {}
  const theme = raw.theme || {}
  const colors = theme.colors || {}
  const receiptCfg = resolveReceiptConfig(site)

  const productionUrl = (site.config?.urls?.production || '').replace(/\/+$/, '')
  const cgvPath = site.config?.checkout?.legal?.cgvUrl || '/conditions-generales-utilisation'
  const cgvUrl = productionUrl && cgvPath.startsWith('/')
    ? `${productionUrl}${cgvPath}`
    : cgvPath

  return {
    siteId: site.id,
    enabled: receiptCfg.enabled !== false,
    documentTitle: receiptCfg.documentTitle || DEFAULT_RECEIPT.documentTitle,
    footerNote: receiptCfg.footerNote || '',
    showWatchImages: receiptCfg.showWatchImages !== false,
    logoPath: resolveLogoPath(site),
    brandName: raw.brand?.displayName || raw.brand?.legalName || site.id,
    legalName: raw.legal?.companyName || raw.brand?.legalName || raw.brand?.displayName || site.id,
    sellerAddress: raw.legal?.address || '',
    siret: raw.legal?.siret || '',
    vatNumber: raw.legal?.vatNumber || '',
    contactEmail: raw.contact?.email || site.config?.contact?.email || '',
    copyrightLine: raw.copy?.copyrightLine || '',
    accentColor: colors.primary || site.config?.backend?.email?.template?.accentColor || '#333333',
    textColor: colors.textMain || '#111111',
    panelColor: colors.cream || '#f5f5f5',
    locale: raw.locale || 'fr',
    currency: site.config?.checkout?.currency || 'EUR',
    vatRate: Number(raw.checkout?.vatRate) > 0 ? Number(raw.checkout.vatRate) : 20,
    cgvUrl,
    productionUrl,
  }
}

module.exports = {
  resolveReceiptBranding,
  resolveReceiptConfig,
  resolveLogoPath,
  resolvePublicAssetPath,
  DEFAULT_RECEIPT,
}
