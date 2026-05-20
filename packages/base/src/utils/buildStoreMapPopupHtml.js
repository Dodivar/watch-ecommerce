import { BASE_URL } from '@/config'

/**
 * URL absolue d'un asset public pour la bulle carte (Google InfoWindow exige une URL complète).
 * @param {string} path
 * @returns {string | null}
 */
export function resolveStoreMapPopupLogoUrl(path) {
  const trimmed = String(path || '').trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const base = BASE_URL.replace(/\/$/, '')
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${base}${normalized}`
}

/**
 * HTML de la bulle boutique (logo + nom + adresse). Styles inline pour Google InfoWindow.
 * @param {{
 *   title: string,
 *   addressHtml?: string,
 *   logoUrl?: string | null,
 *   logoAlt?: string,
 * }} options
 * @returns {string}
 */
export function buildStoreMapPopupHtml({ title, addressHtml = '', logoUrl = null, logoAlt = '' }) {
  const safeTitle = escapeHtml(title)
  const safeAlt = escapeHtml(logoAlt || title)
  const addressBlock = addressHtml?.trim()
    ? `<div style="font-size:13px;color:#4b5563;line-height:1.45;margin-top:4px;">${addressHtml}</div>`
    : ''

  if (logoUrl) {
    return `<div class="store-map-popup" style="font-family:system-ui,-apple-system,sans-serif;min-width:220px;max-width:300px;padding:2px 0;">
  <div style="display:flex;gap:12px;align-items:flex-start;">
    <img src="${escapeHtml(logoUrl)}" alt="${safeAlt}" width="56" height="56" style="width:56px;height:56px;object-fit:contain;flex-shrink:0;border-radius:8px;background:#f9fafb;padding:4px;box-sizing:border-box;" />
    <div style="flex:1;min-width:0;">
      <div style="font-weight:600;font-size:15px;color:#111827;line-height:1.3;">${safeTitle}</div>
      ${addressBlock}
    </div>
  </div>
</div>`
  }

  return `<div class="store-map-popup" style="font-family:system-ui,-apple-system,sans-serif;min-width:180px;max-width:280px;padding:2px 0;">
  <div style="font-weight:600;font-size:15px;color:#111827;line-height:1.3;">${safeTitle}</div>
  ${addressBlock}
</div>`
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
