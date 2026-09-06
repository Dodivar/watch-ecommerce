import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  resolveEmailBranding,
  contrastRatio,
} = require('../../backend/templates/emailCommon.js')
const { createEmailTemplate } = require('../../backend/templates/estimationEmail.js')
const {
  createRepairVendorEmail,
  createRepairCustomerEmail,
  formatRepairVendorText,
  formatRepairCustomerText,
} = require('../../backend/templates/repairEmail.js')

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

describe("resolveEmailBranding — identité de marque", () => {
  it('reprend les coins droits du site (theme.radius: sharp)', () => {
    const sharp = resolveEmailBranding(
      mockSite({ raw: { theme: { colors: { primary: '#111111' }, radius: 'sharp' } } }),
    )
    expect(sharp.radius).toEqual({ card: '0', panel: '0', button: '0', image: '0' })

    const rounded = resolveEmailBranding(mockSite())
    expect(rounded.radius.card).not.toBe('0')
  })

  it('reprend la typographie du site, avec une pile de repli pour les clients mail', () => {
    const branding = resolveEmailBranding(
      mockSite({
        raw: {
          theme: {
            colors: { primary: '#7c6300' },
            typography: {
              sans: { family: 'Tahoma', faces: [{ weight: 400, file: 'tahoma.ttf' }] },
              heading: {
                family: 'FjallaOne-Regular',
                faces: [{ weight: 400, file: 'FjallaOne-Regular.ttf' }],
              },
            },
          },
        },
      }),
    )

    expect(branding.fonts.bodyStack).toContain('Tahoma')
    expect(branding.fonts.bodyStack).toContain('Arial')
    expect(branding.fonts.headingStack).toContain('FjallaOne-Regular')
    // Tahoma est déjà installée chez le destinataire : inutile de la télécharger.
    expect(branding.fonts.fontFaceCss).not.toContain('tahoma.ttf')
    expect(branding.fonts.fontFaceCss).toContain(
      "src:url('https://www.placedesmontres.fr/fonts/FjallaOne-Regular.ttf') format('truetype')",
    )
  })

  it("pose le contenu sur une page de marque quand le site est en thème sombre", () => {
    const branding = resolveEmailBranding(
      mockSite({
        raw: {
          theme: {
            colorScheme: 'dark',
            colors: { primary: '#0f2a1d', textOnDark: '#ffffff', cream: '#f7ede0' },
            surfaces: { page: '#0f2a1d' },
          },
        },
      }),
    )

    expect(branding.pageColor).toBe('#0f2a1d')
    expect(branding.headerColor).toBe('#0f2a1d')
    expect(branding.headerTextColor).toBe('#ffffff')
    // La carte reste blanche : un e-mail sombre est mal rendu par les webmails.
    expect(branding.cardColor).toBe('#ffffff')
  })

  it('calcule des contrastes lisibles au lieu de supposer du blanc sur accent', () => {
    const gold = resolveEmailBranding(
      mockSite({ emailTemplate: { accentColor: '#d4af37' }, raw: {} }),
    )
    // Blanc sur or : 1,9:1. Le texte du bouton passe donc au sombre.
    expect(contrastRatio('#d4af37', gold.accentContrast)).toBeGreaterThanOrEqual(4.5)
    // Et l'or en texte sur blanc est assombri juste ce qu'il faut, sans changer de teinte.
    expect(contrastRatio(gold.accentText, '#ffffff')).toBeGreaterThanOrEqual(4.5)

    const black = resolveEmailBranding(
      mockSite({ emailTemplate: { accentColor: '#111111' }, raw: {} }),
    )
    expect(black.accentContrast).toBe('#ffffff')
    expect(black.accentText).toBe('#111111')
  })

  it("ne signe jamais d'un logo non déclaré par le client", () => {
    // Les icônes livrées dans `public/` (favicon, manifeste) sont souvent restées celles du
    // site modèle : sans déclaration explicite, l'e-mail signe du nom de la marque.
    const branding = resolveEmailBranding(mockSite({ raw: { receipt: {} } }))
    expect(branding.logoImageUrl).toBeNull()
    expect(branding.logoText).toBe('PLACE DES MONTRES')

    const declared = resolveEmailBranding(
      mockSite({ raw: { receipt: {} }, emailTemplate: { logoPath: '/brand-logo.jpg' } }),
    )
    expect(declared.logoImageUrl).toBe('https://www.placedesmontres.fr/brand-logo.jpg')
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

  it('donne au commerçant de quoi répondre et appeler en un geste', () => {
    const html = createEmailTemplate(mockSite(), {
      type: 'search',
      nickname: 'Marie',
      name: 'Martin',
      email: 'marie@example.com',
      tel: '0700000000',
      brand: 'Omega',
      model: 'Speedmaster',
      budget_min: '5000',
      message: 'Recherche urgente',
    })

    expect(html).toContain('Répondre à Marie Martin')
    expect(html).toContain('subject=Votre%20recherche%20personnalis%C3%A9e')
    expect(html).toContain('href="tel:0700000000"')
  })

  it('résume la demande dans l’aperçu de la boîte de réception', () => {
    const html = createEmailTemplate(mockSite(), {
      type: 'search',
      nickname: 'Marie',
      name: 'Martin',
      email: 'marie@example.com',
      brand: 'Omega',
      model: 'Speedmaster',
      budget_min: '5000',
      budget_max: '8000',
    })
    expect(html).toMatch(/mso-hide:all[^>]*>Marie Martin · Omega Speedmaster ·/)
  })

  it('habille le message aux couleurs et aux formes du site, en styles en ligne', () => {
    const site = mockSite({
      raw: {
        theme: {
          colors: { primary: '#7c6300', textMain: '#2c2412', cream: '#f9f7f1' },
          radius: 'sharp',
        },
      },
    })
    const html = createEmailTemplate(site, {
      type: 'contact',
      name: 'Paul',
      email: 'paul@example.com',
      message: 'Bonjour',
    })

    expect(html).toContain('background-color:#f9f7f1')
    expect(html).toContain('border-radius:0')
    // Outlook ignore `display:flex` et les feuilles `<style>` : la mise en page tient en tableaux.
    expect(html).not.toContain('display:flex')
    expect(html).not.toContain('class="section"')
    expect(html).toContain('role="presentation"')
  })
})

const repairForm = {
  type: 'repair',
  name: 'Dupont',
  email: 'jean@example.com',
  tel: '0600000000',
  service_type: 'Changement de pile',
  handling: 'dropoff',
  brand: 'Tissot',
  model: 'PRX',
  message: 'La montre est arrêtée depuis une semaine.',
  source: 'changement-pile-montre',
}

describe('emails de prise en charge atelier', () => {
  it("récapitule la demande pour l'atelier, photos comprises", () => {
    const html = createRepairVendorEmail(mockSite(), repairForm, [{ name: 'cadran.jpg' }])

    expect(html).toContain('Tissot PRX')
    expect(html).toContain('Changement de pile')
    expect(html).toContain('Dépôt en boutique')
    expect(html).toContain('La montre est arrêtée depuis une semaine.')
    expect(html).toContain('cadran.jpg')
    expect(html).toContain('mailto:jean%40example.com')
  })

  it('accuse réception auprès du client sans rien promettre', () => {
    const html = createRepairCustomerEmail(mockSite(), repairForm)

    expect(html).toContain('Bonjour Dupont')
    expect(html).toContain('Changement de pile')
    expect(html).toContain('48 h ouvrées')
    expect(html).toContain('sans votre accord')
  })

  it("ne rappelle l'adresse que pour un dépôt et un magasin public", () => {
    const site = mockSite()
    site.config.storeMap = { enabled: true }
    site.config.legal = { address: '24 Place des Halles, 67000 Strasbourg' }

    expect(createRepairCustomerEmail(site, repairForm)).toContain('24 Place des Halles')
    expect(
      createRepairCustomerEmail(site, { ...repairForm, handling: 'shipping' }),
    ).not.toContain('24 Place des Halles')

    const privateSite = mockSite()
    privateSite.config.storeMap = { enabled: false }
    privateSite.config.legal = { address: '24 Place des Halles, 67000 Strasbourg' }
    expect(createRepairCustomerEmail(privateSite, repairForm)).not.toContain('24 Place des Halles')
  })

  it('produit un pendant texte pour les deux messages', () => {
    const vendorText = formatRepairVendorText(repairForm, [{ name: 'cadran.jpg' }])
    expect(vendorText).toContain('Prestation: Changement de pile')
    expect(vendorText).toContain('Prise en charge: Dépôt en boutique')
    expect(vendorText).toContain("Page d'origine: changement-pile-montre")
    expect(vendorText).toContain('Photos: cadran.jpg')

    const customerText = formatRepairCustomerText(repairForm)
    expect(customerText).toContain('Bonjour Dupont')
    expect(customerText).toContain('Montre: Tissot PRX')
  })
})
