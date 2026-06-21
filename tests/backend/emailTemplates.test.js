import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { resolveEmailBranding } = require('../../backend/templates/emailCommon.js')
const { createEmailTemplate } = require('../../backend/templates/estimationEmail.js')

function mockSite(overrides = {}) {
  return {
    id: overrides.id || 'place-des-montres',
    config: {
      raw: {
        brand: {
          displayName: 'Place des Montres',
          legalName: 'Place des Montres',
          logoAlt: 'Place des Montres — horlogerie',
        },
        theme: {
          colors: {
            primary: '#7c6300',
            textMain: '#111111',
            textMuted: '#666666',
            cream: '#f7f3e8',
          },
        },
        receipt: { logoPath: '/brand-logo.jpg' },
        ...overrides.raw,
      },
      urls: { production: overrides.productionUrl || 'https://www.placedesmontres.fr' },
      backend: {
        email: {
          fromName: 'Place des Montres',
          template: {
            logoText: 'PLACE DES MONTRES',
            accentColor: '#7c6300',
            ...overrides.emailTemplate,
          },
        },
      },
      contact: { email: 'service.client@placedesmontres.fr' },
    },
  }
}

describe('resolveEmailBranding', () => {
  it('uses site accent color and theme panel color', () => {
    const branding = resolveEmailBranding(mockSite())
    expect(branding.accentColor).toBe('#7c6300')
    expect(branding.panelColor).toBe('#f7f3e8')
    expect(branding.logoText).toBe('PLACE DES MONTRES')
    expect(branding.logoImageUrl).toContain('https://www.placedesmontres.fr/brand-logo.jpg')
  })

  it('falls back to theme primary when accent is not set', () => {
    const branding = resolveEmailBranding(
      mockSite({
        emailTemplate: { accentColor: undefined },
        raw: { theme: { colors: { primary: '#d4af37' } } },
      }),
    )
    expect(branding.accentColor).toBe('#d4af37')
  })
})

describe('createEmailTemplate', () => {
  it('renders estimation email with brand colors and watch hero', () => {
    const html = createEmailTemplate(mockSite(), {
      type: 'estimation',
      nickname: 'Jean',
      name: 'Dupont',
      email: 'jean@example.com',
      tel: '0600000000',
      brand: 'Rolex',
      model: 'Submariner',
      serienumber: 'ABC123',
      year: '2020',
      etat: 'Très bon',
      possession: 'Papiers et boîte',
      message: 'Bonjour',
    })

    expect(html).toContain('#7c6300')
    expect(html).toContain('Rolex Submariner')
    expect(html).toContain('mailto:jean%40example.com')
    expect(html).toContain('Estimation')
    expect(html).toContain('brand-logo.jpg')
  })

  it('renders search email with formatted budget', () => {
    const html = createEmailTemplate(mockSite(), {
      type: 'search',
      nickname: 'Marie',
      name: 'Martin',
      email: 'marie@example.com',
      tel: '0700000000',
      brand: 'Omega',
      model: 'Speedmaster',
      budget_min: '5000',
      budget_max: '8000',
      condition: 'Très bon',
      delai: '2 mois',
      message: 'Recherche urgente',
    })

    expect(html).toContain('Recherche personnalisée')
    expect(html).toContain('Omega Speedmaster')
    expect(html).toContain('5')
    expect(html).toContain('8')
    expect(html).toContain('Délai souhaité')
  })
})
