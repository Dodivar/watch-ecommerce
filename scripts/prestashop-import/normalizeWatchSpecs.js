import { parseCaseSizeMm, normalizeCaseSizeValue } from '../../packages/base/src/utils/caseSize.js'

/** @typedef {'automatic' | 'manual' | 'quartz' | 'solar' | 'kinetic' | 'smart' | 'hybrid' | 'unknown'} MovementTypeSlug */

/** @typedef {'neuf' | 'comme_neuf' | 'tres_bon' | 'bon' | 'correct' | 'unknown'} ConditionSlug */

/**
 * @typedef {Object} NormalizationResult
 * @property {boolean} ok
 * @property {unknown} [value]
 * @property {string} [reason]
 * @property {string} [raw]
 */

const MOVEMENT_PATTERNS = [
  { slug: 'automatic', patterns: [/\bautomatique\b/i, /\bautomatic\b/i, /\bauto\b/i, /remontage\s+auto/i] },
  { slug: 'manual', patterns: [/\bmanuel(le)?\b/i, /\bmanual\b/i, /remontage\s+manuel/i, /\bmécanique\s+manuel/i] },
  { slug: 'quartz', patterns: [/\bquartz\b/i, /à\s+quartz/i] },
  { slug: 'solar', patterns: [/\bsolaire\b/i, /\bsolar\b/i] },
  { slug: 'kinetic', patterns: [/\bcinétique\b/i, /\bkinetic\b/i, /\bautoquartz\b/i] },
  { slug: 'smart', patterns: [/\bsmart\b/i, /\bconnectée?\b/i, /smartwatch/i] },
  { slug: 'hybrid', patterns: [/\bhybride\b/i, /\bhybrid\b/i] },
]

/** @type {Record<string, string>} */
const FUNCTION_ALIASES = {
  chronographe: 'chronograph',
  chronograph: 'chronograph',
  chrono: 'chronograph',
  date: 'date',
  dateur: 'date',
  'date du jour': 'date',
  gmt: 'gmt',
  'double fuseau': 'gmt',
  tachymetre: 'tachymeter',
  tachymètre: 'tachymeter',
  tachymeter: 'tachymeter',
  'phase de lune': 'moon_phase',
  'phases de lune': 'moon_phase',
  alarme: 'alarm',
  répétition: 'minute_repeater',
  repetition: 'minute_repeater',
  'réserve de marche': 'power_reserve_indicator',
  'indicateur de réserve': 'power_reserve_indicator',
  'petite seconde': 'small_seconds',
  'seconde centrale': 'central_seconds',
  'jour de la semaine': 'day_of_week',
  'affichage 24h': 'display_24h',
  '24 heures': 'display_24h',
  'boussole': 'compass',
  'altimètre': 'altimeter',
  'baromètre': 'barometer',
  'thermomètre': 'thermometer',
  'radio-pilotée': 'radio_controlled',
  'radio pilotée': 'radio_controlled',
  'squelette': 'skeleton',
  skeleton: 'skeleton',
  'tourbillon': 'tourbillon',
  tourbillon: 'tourbillon',
}

const CONDITION_PATTERNS = [
  { slug: 'neuf', patterns: [/^neuf$/i, /\bjamais portée?\b/i, /\bnew\b/i] },
  { slug: 'comme_neuf', patterns: [/comme\s+neuf/i, /like\s+new/i] },
  { slug: 'tres_bon', patterns: [/très\s+bon/i, /tres\s+bon/i, /very\s+good/i, /excellent/i] },
  { slug: 'bon', patterns: [/^bon$/i, /\bbon\s+état/i, /good/i] },
  { slug: 'correct', patterns: [/correct/i, /fair/i, /moyen/i] },
]

/**
 * @param {unknown} raw
 * @returns {NormalizationResult & { movementType?: MovementTypeSlug, movementCaliber?: string | null }}
 */
export function normalizeMovementType(raw) {
  const text = cleanRaw(raw)
  if (!text) return { ok: false, reason: 'empty', raw: String(raw ?? '') }

  for (const { slug, patterns } of MOVEMENT_PATTERNS) {
    if (patterns.some((re) => re.test(text))) {
      return {
        ok: true,
        value: slug,
        movementType: /** @type {MovementTypeSlug} */ (slug),
        movementCaliber: extractMovementCaliber(text),
        raw: text,
      }
    }
  }

  if (/\bmécanique\b/i.test(text) && !/\bquartz\b/i.test(text)) {
    return {
      ok: true,
      value: 'manual',
      movementType: 'manual',
      movementCaliber: extractMovementCaliber(text),
      raw: text,
      reason: 'inferred_mechanical',
    }
  }

  return { ok: false, reason: 'unmapped', raw: text }
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function extractMovementCaliber(text) {
  const patterns = [
    /\b(?:calibre|cal\.)\s+((?:ETA|Sellita|Miyota|Ronda)\s*[\w./-]+)/i,
    /\b(?:calibre|cal\.)\s+([A-Za-z]{2,}[\w./-]*\s*[\d][\w./-]*)/i,
    /\b(ETA\s*[\w.-]+)/i,
    /\b(Sellita\s*[\w.-]+)/i,
    /\b(Miyota\s*[\w.-]+)/i,
    /\b(Ronda\s*[\w.-]+)/i,
    /\b(Sw\d{3,4}[A-Za-z]?)/i,
  ]

  for (const re of patterns) {
    const match = text.match(re)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

/**
 * @param {unknown} raw
 * @returns {NormalizationResult & { meters?: number | null }}
 */
export function parseWaterResistanceM(raw) {
  const text = cleanRaw(raw)
  if (!text) return { ok: false, reason: 'empty', raw: String(raw ?? '') }

  const normalized = text
    .replace(/étanchéité/gi, '')
    .replace(/water\s*resist(?:ant|ance)?/gi, '')
    .replace(/\bwr\s*/gi, '')
    .trim()

  const wrMatch = text.match(/\bwr\s*(\d+(?:[.,]\d+)?)/i)
  if (wrMatch) {
    const meters = Math.round(parseFloat(wrMatch[1].replace(',', '.')))
    if (Number.isFinite(meters) && meters > 0) {
      return { ok: true, value: meters, meters, raw: text, reason: 'wr_prefix' }
    }
  }

  const atmMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:atm|atmosphères?)/i)
  if (atmMatch) {
    const atm = parseFloat(atmMatch[1].replace(',', '.'))
    if (Number.isFinite(atm) && atm > 0) {
      const meters = Math.round(atm * 10)
      return { ok: true, value: meters, meters, raw: text }
    }
  }

  const barMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*bar\b/i)
  if (barMatch) {
    const bar = parseFloat(barMatch[1].replace(',', '.'))
    if (Number.isFinite(bar) && bar > 0) {
      const meters = Math.round(bar * 10)
      return { ok: true, value: meters, meters, raw: text }
    }
  }

  const meterMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*m(?:ètres?)?\b/i)
  if (meterMatch) {
    const meters = Math.round(parseFloat(meterMatch[1].replace(',', '.')))
    if (Number.isFinite(meters) && meters > 0) {
      return { ok: true, value: meters, meters, raw: text }
    }
  }

  const bareNumber = normalized.match(/^(\d+(?:[.,]\d+)?)$/)
  if (bareNumber) {
    const meters = Math.round(parseFloat(bareNumber[1].replace(',', '.')))
    if (Number.isFinite(meters) && meters > 0) {
      return { ok: true, value: meters, meters, raw: text, reason: 'bare_number_assumed_meters' }
    }
  }

  return { ok: false, reason: 'unmapped', raw: text }
}

/**
 * @param {unknown} raw
 * @returns {NormalizationResult & { mm?: number | null, stored?: string }}
 */
export function normalizeCaseSizeMm(raw) {
  const text = cleanRaw(raw)
  if (!text) return { ok: false, reason: 'empty', raw: String(raw ?? '') }

  if (/\d\s*[-–]\s*\d/.test(text)) {
    return { ok: false, reason: 'range', raw: text }
  }

  const mm = parseCaseSizeMm(text)
  if (mm === null || mm <= 0 || mm > 80) {
    return { ok: false, reason: 'unmapped', raw: text }
  }

  return {
    ok: true,
    value: mm,
    mm,
    stored: normalizeCaseSizeValue(text),
    raw: text,
  }
}

/**
 * @param {unknown} raw
 * @returns {NormalizationResult & { slugs?: string[] }}
 */
export function normalizeFunctionSlugs(raw) {
  const text = cleanRaw(raw)
  if (!text) return { ok: false, reason: 'empty', raw: String(raw ?? '') }

  const tokens = splitFunctionTokens(text)
  /** @type {string[]} */
  const slugs = []
  /** @type {string[]} */
  const unknown = []

  for (const token of tokens) {
    const slug = mapFunctionToken(token)
    if (slug) {
      if (!slugs.includes(slug)) slugs.push(slug)
    } else if (token.length >= 2) {
      unknown.push(token)
    }
  }

  if (slugs.length === 0) {
    return { ok: false, reason: unknown.length ? 'unmapped' : 'empty_tokens', raw: text, slugs: [] }
  }

  return {
    ok: true,
    value: slugs,
    slugs,
    raw: text,
    reason: unknown.length ? 'partial' : undefined,
  }
}

/**
 * @param {unknown} raw
 * @returns {NormalizationResult & { slug?: ConditionSlug }}
 */
export function normalizeConditionSlug(raw) {
  const text = cleanRaw(raw)
  if (!text) return { ok: false, reason: 'empty', raw: String(raw ?? '') }

  for (const { slug, patterns } of CONDITION_PATTERNS) {
    if (patterns.some((re) => re.test(text))) {
      return { ok: true, value: slug, slug: /** @type {ConditionSlug} */ (slug), raw: text }
    }
  }

  return { ok: false, reason: 'unmapped', raw: text }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function splitFunctionTokens(text) {
  return text
    .split(/[,;/•|+]|(?:\bet\b)|(?:\band\b)/i)
    .map((part) => part.trim().toLowerCase())
    .map((part) => part.replace(/^[\s-]+|[\s-]+$/g, ''))
    .filter(Boolean)
}

/**
 * @param {string} token
 * @returns {string | null}
 */
function mapFunctionToken(token) {
  const compact = token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (FUNCTION_ALIASES[token]) return FUNCTION_ALIASES[token]
  if (FUNCTION_ALIASES[compact]) return FUNCTION_ALIASES[compact]

  if (/chronograph/.test(compact)) return 'chronograph'
  if (/^date\b/.test(compact) || compact === 'dateur') return 'date'
  if (/gmt|fuseau/.test(compact)) return 'gmt'
  if (/tachym/.test(compact)) return 'tachymeter'
  if (/^heures?$|^minutes?$|^secondes?$/.test(compact)) return null
  if (/^heures?,?\s*minutes?,?\s*secondes?$/i.test(token)) return null

  return null
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function cleanRaw(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}
