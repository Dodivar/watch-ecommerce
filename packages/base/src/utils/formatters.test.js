/**
 * Les formats suivent la langue active. Le manifest de test (`tests/fixtures/stub-site-config.js`)
 * est monolingue français : on force donc la langue via un mock pour couvrir les trois cas.
 *
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * @param {string} locale
 * @param {{ currency?: string }} [site]
 */
async function loadFormatters(locale, site = {}) {
  vi.resetModules()
  vi.doMock('@/i18n/activeLocale.js', () => ({ getActiveLocale: () => locale }))
  vi.doMock('@/site/getSiteConfig.js', () => ({
    getSiteConfig: () => ({ checkout: { currency: site.currency ?? 'EUR' } }),
  }))
  return import('./formatters.js')
}

afterEach(() => vi.restoreAllMocks())

/** Les formats `Intl` insèrent des espaces insécables : on compare sur du texte normalisé. */
const normalize = (value) => value.replace(/[\u00a0\u202f]/g, ' ')

describe('formatPrice()', () => {
  it('formate en français', async () => {
    const { formatPrice } = await loadFormatters('fr')
    expect(normalize(formatPrice(1234))).toBe('1 234 €')
  })

  it('formate en anglais', async () => {
    const { formatPrice } = await loadFormatters('en')
    expect(normalize(formatPrice(1234))).toBe('€1,234')
  })

  it('formate en allemand', async () => {
    const { formatPrice } = await loadFormatters('de')
    expect(normalize(formatPrice(1234))).toBe('1.234 €')
  })

  it('affiche les centimes sur demande', async () => {
    const { formatPrice } = await loadFormatters('fr')
    expect(normalize(formatPrice(1234.5, { decimals: true }))).toBe('1 234,50 €')
  })

  it('suit la devise déclarée par le client', async () => {
    const { formatPrice } = await loadFormatters('en', { currency: 'CHF' })
    expect(normalize(formatPrice(1234))).toContain('CHF')
  })

  it('renvoie une chaîne vide pour une valeur non numérique', async () => {
    const { formatPrice } = await loadFormatters('fr')
    expect(formatPrice(null)).toBe('')
    expect(formatPrice('abc')).toBe('')
  })
})

describe('formatNumber()', () => {
  it('utilise les séparateurs de la langue', async () => {
    expect(normalize((await loadFormatters('fr')).formatNumber(12345))).toBe('12 345')
    expect(normalize((await loadFormatters('en')).formatNumber(12345))).toBe('12,345')
    expect(normalize((await loadFormatters('de')).formatNumber(12345))).toBe('12.345')
  })
})

describe('formatDate()', () => {
  it('écrit le mois dans la langue active', async () => {
    expect((await loadFormatters('fr')).formatDate('2026-03-03')).toBe('3 mars 2026')
    expect((await loadFormatters('en')).formatDate('2026-03-03')).toBe('3 March 2026')
    expect((await loadFormatters('de')).formatDate('2026-03-03')).toBe('3. März 2026')
  })

  it('renvoie une chaîne vide pour une date absente ou invalide', async () => {
    const { formatDate } = await loadFormatters('fr')
    expect(formatDate(null)).toBe('')
    expect(formatDate('pas-une-date')).toBe('')
  })
})

describe('formatWeekdayDate()', () => {
  it('conserve le format historique en français', async () => {
    const { formatWeekdayDate } = await loadFormatters('fr')
    expect(formatWeekdayDate('2026-07-20T00:00:00')).toBe('lundi 20 juillet 2026')
  })

  it('traduit le jour de la semaine', async () => {
    const { formatWeekdayDate } = await loadFormatters('de')
    expect(formatWeekdayDate('2026-07-20T00:00:00')).toBe('Montag, 20. Juli 2026')
  })
})
