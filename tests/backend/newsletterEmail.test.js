import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  createNewsletterEmail,
  sanitizeNewsletterHtml,
  defaultNewsletterSettings,
} = require('../../backend/templates/newsletterEmail.js')

function mockSite(overrides = {}) {
  return {
    id: overrides.id || 'demo-store',
    config: {
      raw: {
        brand: {
          displayName: 'Demo',
          legalName: 'Demo Watches SARL',
          logoAlt: 'Demo',
        },
        theme: {
          colors: {
            primary: '#0f2a1d',
            textMain: '#111111',
            textMuted: '#666666',
            cream: '#f7f3e8',
          },
        },
        ...overrides.raw,
      },
      urls: { production: 'https://demo.example.fr' },
      backend: {
        email: {
          fromName: 'Demo Watches',
          fromAddress: 'contact@demo.example.fr',
          template: {
            logoText: 'DEMO WATCHES',
            accentColor: '#0f2a1d',
          },
        },
      },
    },
  }
}

describe('sanitizeNewsletterHtml', () => {
  it('removes <script> tags and event handlers', () => {
    const dirty = '<p onclick="steal()">Bonjour<script>alert(1)</script></p>'
    const clean = sanitizeNewsletterHtml(dirty)
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('onclick')
    expect(clean).toContain('Bonjour')
  })

  it('keeps allowed formatting tags', () => {
    const html = '<h2>Titre</h2><p><strong>Gras</strong></p><ul><li>Item</li></ul>'
    const clean = sanitizeNewsletterHtml(html)
    expect(clean).toContain('<h2>Titre</h2>')
    expect(clean).toContain('<strong>Gras</strong>')
    expect(clean).toContain('<li>Item</li>')
  })

  it('forces links to open safely in a new tab', () => {
    const clean = sanitizeNewsletterHtml('<a href="https://x.co">lien</a>')
    expect(clean).toContain('href="https://x.co"')
    expect(clean).toContain('target="_blank"')
    expect(clean).toContain('rel="noopener noreferrer"')
  })

  it('drops javascript: URLs', () => {
    const clean = sanitizeNewsletterHtml('<a href="javascript:alert(1)">x</a>')
    expect(clean).not.toContain('javascript:')
  })

  it('returns an empty string for empty/undefined input', () => {
    expect(sanitizeNewsletterHtml('')).toBe('')
    expect(sanitizeNewsletterHtml(undefined)).toBe('')
    expect(sanitizeNewsletterHtml(null)).toBe('')
  })
})

describe('createNewsletterEmail', () => {
  const baseParams = {
    subject: 'Nos nouveautés',
    bodyHtml: '<h2>Grande vente</h2><p>Bonjour</p>',
    settings: {},
    unsubscribeUrl: 'https://demo.example.fr/api/newsletter/unsubscribe?token=abc123',
  }

  it('embeds the sanitized body', () => {
    const html = createNewsletterEmail(mockSite(), {
      ...baseParams,
      bodyHtml: '<p>Bonjour<script>alert(1)</script></p>',
    })
    expect(html).toContain('Bonjour')
    expect(html).not.toContain('<script')
  })

  it('always includes the unsubscribe link (RGPD)', () => {
    const html = createNewsletterEmail(mockSite(), baseParams)
    expect(html).toContain('Se désinscrire')
    expect(html).toContain(baseParams.unsubscribeUrl)
  })

  it('uses settings sender name and accent color when provided', () => {
    const html = createNewsletterEmail(mockSite(), {
      ...baseParams,
      settings: { sender_name: 'Ma Boutique', accent_color: '#ff0000' },
    })
    expect(html).toContain('Ma Boutique')
    expect(html).toContain('#ff0000')
  })

  it('falls back to site branding (accent + sender) when settings are empty', () => {
    const html = createNewsletterEmail(mockSite(), baseParams)
    expect(html).toContain('#0f2a1d')
    expect(html).toContain('Demo Watches')
  })

  it('renders the logo text in the header when no logo image resolves', () => {
    const site = mockSite()
    site.config.urls.production = '' // sans URL de prod, pas d'image → logo texte
    const html = createNewsletterEmail(site, baseParams)
    expect(html).toContain('DEMO WATCHES')
  })

  it('uses a custom header when provided and sanitizes it', () => {
    const html = createNewsletterEmail(mockSite(), {
      ...baseParams,
      settings: { header_html: '<p>En-tête maison</p><script>x</script>' },
    })
    expect(html).toContain('En-tête maison')
    expect(html).not.toContain('<script')
  })

  it('renders custom footer content', () => {
    const html = createNewsletterEmail(mockSite(), {
      ...baseParams,
      settings: { footer_html: '<p>12 rue des Montres, Paris</p>' },
    })
    expect(html).toContain('12 rue des Montres, Paris')
  })
})

describe('defaultNewsletterSettings', () => {
  it('derives defaults from the site email config', () => {
    const settings = defaultNewsletterSettings(mockSite())
    expect(settings.logo_text).toBe('DEMO WATCHES')
    expect(settings.accent_color).toBe('#0f2a1d')
    expect(settings.sender_name).toBe('Demo Watches')
    expect(settings.reply_to).toBe('contact@demo.example.fr')
    expect(settings.header_html).toBe('')
    expect(settings.footer_html).toBe('')
  })
})
