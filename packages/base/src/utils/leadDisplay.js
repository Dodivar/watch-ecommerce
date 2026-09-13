import { SLOT_LABELS } from '@/composables/useRetailAppointmentSlots.js'

/** Mode de prise en charge choisi dans le formulaire atelier (payload `handling`). */
export const LEAD_HANDLING_LABELS = {
  dropoff: 'Dépôt en boutique',
  shipping: 'Envoi postal',
  unsure: 'Non décidé',
}

/**
 * Présentation d'un type de message : libellé, icône (nom Lucide résolu par le
 * composant) et teintes Tailwind. Centralisé ici pour que la liste, le détail
 * et le tableau de bord parlent la même langue visuelle — un RDV est ambre
 * partout, une estimation violette partout.
 *
 * Les aplats choisis (`bg-*-50/100`) font partie de ceux que `theme-dark.css`
 * traite comme des surfaces claires : ils restent lisibles en thème sombre.
 */
export const LEAD_TYPE_PRESENTATION = {
  contact: {
    label: 'Contact',
    icon: 'MessageSquare',
    chip: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  appointment: {
    label: 'RDV',
    icon: 'CalendarClock',
    chip: 'bg-amber-50 text-amber-800 border-amber-100',
  },
  estimation: {
    label: 'Estimation',
    icon: 'BadgeEuro',
    chip: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  search: {
    label: 'Recherche',
    icon: 'Telescope',
    chip: 'bg-green-50 text-green-700 border-green-100',
  },
  repair: {
    label: 'Atelier',
    icon: 'Wrench',
    chip: 'bg-orange-100 text-orange-800 border-orange-200',
  },
}

/** Libellés courts, dérivés de la table de présentation : une seule source. */
export const LEAD_TYPE_LABELS = Object.fromEntries(
  Object.entries(LEAD_TYPE_PRESENTATION).map(([type, presentation]) => [type, presentation.label]),
)

const FALLBACK_PRESENTATION = {
  label: 'Message',
  icon: 'MessageSquare',
  chip: 'bg-gray-100 text-gray-700 border-gray-200',
}

/**
 * @param {string | null | undefined} type
 */
export function getLeadTypePresentation(type) {
  return LEAD_TYPE_PRESENTATION[type] || { ...FALLBACK_PRESENTATION, label: type || 'Message' }
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
  return Object.keys(payload).filter(
    (key) => !known.has(key) && payload[key] != null && payload[key] !== '',
  )
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

/**
 * Clé de jour local (`YYYY-MM-DD`) — `toISOString()` bascule sur la veille pour
 * un message reçu en soirée à Paris, ce qui casserait le regroupement.
 *
 * @param {Date} date
 */
function toDayKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Heure seule (`14:32`), pour une liste déjà regroupée par jour.
 *
 * @param {string | null | undefined} iso
 */
export function formatLeadTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * En-tête d'un groupe de jour : « Aujourd'hui », « Hier », puis la date longue.
 *
 * @param {string | null | undefined} iso
 * @param {Date} [now]
 */
export function formatLeadDayLabel(iso, now = new Date()) {
  if (!iso) return 'Date inconnue'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'

  const key = toDayKey(date)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (key === toDayKey(now)) return "Aujourd'hui"
  if (key === toDayKey(yesterday)) return 'Hier'
  return formatLeadDate(key)
}

/**
 * Découpe une liste déjà triée (plus récent d'abord) en groupes de jours.
 *
 * @param {Array<{ createdAt?: string | null }>} leads
 * @param {Date} [now]
 * @returns {Array<{ key: string, label: string, leads: Array<object> }>}
 */
export function groupLeadsByDay(leads, now = new Date()) {
  /** @type {Array<{ key: string, label: string, leads: Array<object> }>} */
  const groups = []
  for (const lead of leads || []) {
    const date = lead.createdAt ? new Date(lead.createdAt) : null
    const key = date && !Number.isNaN(date.getTime()) ? toDayKey(date) : 'unknown'
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.leads.push(lead)
      continue
    }
    groups.push({ key, label: formatLeadDayLabel(lead.createdAt, now), leads: [lead] })
  }
  return groups
}

/**
 * Normalisation pour la recherche : minuscules, sans accents — « Jérôme » se
 * trouve en tapant « jerome ».
 *
 * @param {unknown} value
 */
function normalizeSearchable(value) {
  if (value == null) return ''
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Filtre client d'un message sur nom, contact et contenu du formulaire.
 *
 * @param {{ customerName?: string | null, customerEmail?: string | null, type?: string, payload?: Record<string, unknown> }} lead
 * @param {string} term
 */
export function matchesLeadSearch(lead, term) {
  const needle = normalizeSearchable(term).trim()
  if (!needle) return true

  const p = lead.payload || {}
  const haystack = [
    lead.customerName,
    lead.customerEmail,
    p.name,
    p.nickname,
    p.email,
    p.tel,
    p.brand,
    p.model,
    p.reference,
    p.watch_name,
    p.service_type,
    p.message,
    getLeadSummary(lead),
  ]
    .map(normalizeSearchable)
    .join(' ')

  return needle.split(/\s+/).every((word) => haystack.includes(word))
}

/** Ordre d'affichage des créneaux dans l'agenda. */
const SLOT_ORDER = { morning: 0, afternoon: 1 }

/**
 * Agenda des rendez-vous : les jours à venir en premier (du plus proche au plus
 * lointain), l'historique à part (du plus récent au plus ancien). Un RDV passé
 * n'a plus rien à faire en haut de page.
 *
 * @param {Record<string, Array<object>>} byDate - Sortie de `getAppointmentsByDate`.
 * @param {Date} [now]
 * @returns {{ upcoming: Array<{ date: string, label: string, items: Array<object> }>,
 *   past: Array<{ date: string, label: string, items: Array<object> }> }}
 */
export function organizeAppointmentsByDate(byDate, now = new Date()) {
  const todayKey = toDayKey(now)
  const entries = Object.entries(byDate || {}).map(([date, items]) => ({
    date,
    label: formatLeadDate(date),
    items: [...(items || [])].sort((a, b) => {
      const slotDiff =
        (SLOT_ORDER[a.payload?.time_slot] ?? 9) - (SLOT_ORDER[b.payload?.time_slot] ?? 9)
      if (slotDiff !== 0) return slotDiff
      return (a.customerName || '').localeCompare(b.customerName || '', 'fr')
    }),
  }))

  return {
    upcoming: entries
      .filter((entry) => entry.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date)),
    past: entries
      .filter((entry) => entry.date < todayKey)
      .sort((a, b) => b.date.localeCompare(a.date)),
  }
}
