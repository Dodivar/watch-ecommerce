import { SLOT_LABELS } from '@/composables/useRetailAppointmentSlots.js'

export const LEAD_TYPE_LABELS = {
  contact: 'Contact',
  appointment: 'RDV',
  estimation: 'Estimation',
  search: 'Recherche',
  repair: 'Atelier',
}

/** Mode de prise en charge choisi dans le formulaire atelier (payload `handling`). */
export const LEAD_HANDLING_LABELS = {
  dropoff: 'Dépôt en boutique',
  shipping: 'Envoi postal',
  unsure: 'Non décidé',
}

export const LEAD_STATUS_LABELS = {
  new: 'Non lu',
  read: 'Lu',
  archived: 'Archivé',
}

/**
 * @param {string | null | undefined} timeSlot
 */
export function formatLeadSlot(timeSlot) {
  if (!timeSlot) return '—'
  return SLOT_LABELS[timeSlot] || timeSlot
}

/**
 * @param {string | null | undefined} handling
 */
export function formatLeadHandling(handling) {
  if (!handling) return '—'
  return LEAD_HANDLING_LABELS[handling] || handling
}

/**
 * @param {string | null | undefined} isoOrYmd
 */
export function formatLeadDate(isoOrYmd) {
  if (!isoOrYmd) return '—'
  const datePart = isoOrYmd.slice(0, 10)
  const [y, m, d] = datePart.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return isoOrYmd
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * @param {string | null | undefined} iso
 */
export function formatLeadDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('fr-FR')
}

/**
 * @param {string | number | null | undefined} value
 */
export function formatLeadPrice(value) {
  if (value == null || value === '') return '—'
  const num = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, ''))
  if (Number.isNaN(num)) return `${value} €`
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * @param {{ watchId?: string | null, payload?: Record<string, unknown> }} lead
 */
export function getLeadWatchLink(lead) {
  const url = lead.payload?.watch_url
  if (typeof url === 'string' && url.trim()) return url.trim()
  if (lead.watchId) return `/watch/${lead.watchId}`
  return null
}

/**
 * @param {{ type: string, payload?: Record<string, unknown> }} lead
 */
export function getLeadSummary(lead) {
  const p = lead.payload || {}
  switch (lead.type) {
    case 'appointment':
      return p.watch_name || '—'
    case 'estimation':
    case 'search': {
      const parts = [p.brand, p.model].filter(Boolean)
      return parts.length ? parts.join(' ') : '—'
    }
    case 'repair': {
      const parts = [p.service_type, [p.brand, p.model].filter(Boolean).join(' ')].filter(Boolean)
      return parts.length ? parts.join(' — ') : '—'
    }
    case 'contact': {
      const msg = typeof p.message === 'string' ? p.message.trim() : ''
      if (!msg) return '—'
      return msg.length > 60 ? `${msg.slice(0, 60)}…` : msg
    }
    default:
      return '—'
  }
}

/**
 * @param {Record<string, unknown>} payload
 * @param {string} type
 */
export function getUnmappedPayloadKeys(payload) {
  const known = new Set([
    'type',
    'name',
    'email',
    'tel',
    'message',
    'nickname',
    'contact_mode',
    'brand',
    'model',
    'serienumber',
    'year',
    'etat',
    'condition',
    'possession',
    'budget_min',
    'budget_max',
    'delai',
    'date',
    'time_slot',
    'watch_name',
    'watch_price',
    'watch_url',
    'watch_id',
    'attachments',
    'directions_url',
    'service_type',
    'handling',
    'source',
  ])
  return Object.keys(payload).filter((key) => !known.has(key) && payload[key] != null && payload[key] !== '')
}

/**
 * @param {string | number | null | undefined} min
 * @param {string | number | null | undefined} max
 */
export function formatLeadBudget(min, max) {
  const hasMin = min != null && min !== ''
  const hasMax = max != null && max !== ''
  if (hasMin && hasMax) return `${formatLeadPrice(min)} à ${formatLeadPrice(max)}`
  if (hasMin) return `À partir de ${formatLeadPrice(min)}`
  if (hasMax) return `Jusqu'à ${formatLeadPrice(max)}`
  return '—'
}
