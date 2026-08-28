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
 * Ligne « note Google » de la bulle : « ★ 4,8 · 127 avis · Voir sur Google ».
 *
 * Rien n'est rendu sans note : la bulle garde alors exactement son HTML d'origine.
 *
 * `ratingLabel` est déjà formaté dans la langue active par l'appelant (`formatRating`) : ce module
 * reste une pure fabrique de HTML, sans dépendance i18n.
 *
 * @param {{ ratingLabel?: string, countLabel?: string, reviewsUrl?: string, reviewsLabel?: string }} options
 * @returns {string}
 */
function buildRatingBlock({ ratingLabel = '', countLabel = '', reviewsUrl = '', reviewsLabel = '' }) {
  if (!ratingLabel) return ''

  const formatted = escapeHtml(ratingLabel)
  const countBlock = countLabel
    ? `<span style="color:#4b5563;"> · ${escapeHtml(countLabel)}</span>`
    : ''
  const linkBlock = reviewsUrl
    ? ` · <a href="${escapeHtml(reviewsUrl)}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;">${escapeHtml(reviewsLabel || 'Google')}</a>`
    : ''

  return `<div style="font-size:13px;line-height:1.45;margin-top:6px;"><span style="color:#f59e0b;">★</span> <strong style="color:#111827;">${formatted}</strong>${countBlock}${linkBlock}</div>`
}

/**
 * HTML de la bulle boutique (logo + nom + adresse + note Google). Styles inline pour Google InfoWindow.
 * @param {{
 *   title: string,
 *   addressHtml?: string,
 *   logoUrl?: string | null,
 *   logoAlt?: string,
 *   ratingLabel?: string,
 *   countLabel?: string,
 *   reviewsUrl?: string,
 *   reviewsLabel?: string,
 * }} options
 * @returns {string}
 */
export function buildStoreMapPopupHtml({
  title,
  addressHtml = '',
  logoUrl = null,
  logoAlt = '',
  ratingLabel = '',
  countLabel = '',
  reviewsUrl = '',
  reviewsLabel = '',
}) {
  const safeTitle = escapeHtml(title)
  const safeAlt = escapeHtml(logoAlt || title)
  const addressBlock = addressHtml?.trim()
    ? `<div style="font-size:13px;color:#4b5563;line-height:1.45;margin-top:4px;">${addressHtml}</div>`
    : ''
  const ratingBlock = buildRatingBlock({ ratingLabel, countLabel, reviewsUrl, reviewsLabel })

  if (logoUrl) {
    return `<div class="store-map-popup" style="font-family:system-ui,-apple-system,sans-serif;min-width:220px;max-width:300px;padding:10px 12px;">
  <div style="display:flex;gap:12px;align-items:flex-start;">
    <img src="${escapeHtml(logoUrl)}" alt="${safeAlt}" width="48" height="48" style="width:48px;height:48px;object-fit:contain;flex-shrink:0;border-radius:8px;background:#f9fafb;padding:4px;box-sizing:border-box;" />
    <div style="flex:1;min-width:0;">
      <div style="font-weight:600;font-size:15px;color:#111827;line-height:1.3;">${safeTitle}</div>
      ${addressBlock}${ratingBlock}
    </div>
  </div>
</div>`
  }

  return `<div class="store-map-popup" style="font-family:system-ui,-apple-system,sans-serif;min-width:180px;max-width:280px;padding:10px 12px;">
  <div style="font-weight:600;font-size:15px;color:#111827;line-height:1.3;">${safeTitle}</div>
  ${addressBlock}${ratingBlock}
</div>`
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
