import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  resolveEmailBranding,
  contrastRatio,
  lineItemsTable,
  photoGrid,
} = require('../../backend/templates/emailCommon.js')
const {
  createAppointmentVendorEmail,
  createAppointmentCustomerEmail,
} = require('../../backend/templates/appointmentEmail.js')
const {
  createOrderConfirmationEmail,
} = require('../../backend/templates/orderConfirmationEmail.js')
const {
  createAbandonedCheckoutEmail,
} = require('../../backend/templates/abandonedCheckoutEmail.js')
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

describe("photos des montres dans les e-mails de commande", () => {
  const lines = [
    {
      name: 'Rolex Submariner',
      reference: '116610LN',
      quantity: 1,
      unit_price_cents: 850000,
      image_url: 'https://cdn.example.com/watch-images/submariner.jpg',
    },
    {
      name: 'Omega Speedmaster',
      reference: '311.30',
      quantity: 2,
      unit_price_cents: 420000,
      image_url: 'https://cdn.example.com/watch-images/speedmaster.jpg',
    },
  ]
  const order = {
    id: 'CMD-1',
    subtotal_cents: 1690000,
    shipping_cents: 0,
    total_cents: 1690000,
  }

  describe('lineItemsTable', () => {
    it("affiche la photo de chaque ligne qui en porte une", () => {
      const branding = resolveEmailBranding(mockSite())
      const html = lineItemsTable(branding, [
        { name: 'Rolex Submariner', imageUrl: 'https://cdn.example.com/a.jpg', amountLabel: '8 500 €' },
      ])

      expect(html).toContain('src="https://cdn.example.com/a.jpg"')
      // Le nom sert d'`alt` : c'est lui qui tient la place tant que le lecteur n'a pas
      // autorisé les images distantes, ce que Gmail et Outlook refusent par défaut.
      expect(html).toContain('alt="Rolex Submariner"')
    })

    it("supprime la colonne des vignettes quand aucune ligne n'a de photo", () => {
      const branding = resolveEmailBranding(mockSite())
      const withImage = lineItemsTable(
        branding,
        [{ name: 'A', imageUrl: 'https://cdn.example.com/a.jpg', amountLabel: '1 €' }],
        { totals: [{ label: 'Total', amountLabel: '1 €' }] },
      )
      const withoutImage = lineItemsTable(branding, [{ name: 'A', amountLabel: '1 €' }], {
        totals: [{ label: 'Total', amountLabel: '1 €' }] },
      )

      expect(withoutImage).not.toContain('<img')
      // Le libellé du total s'étale sur une colonne de moins : pas de gouttière vide.
      expect(withImage).toContain('colspan="3"')
      expect(withoutImage).toContain('colspan="2"')
    })

    it("garde la colonne alignée quand une seule montre du lot n'a pas de photo", () => {
      const branding = resolveEmailBranding(mockSite())
      const html = lineItemsTable(branding, [
        { name: 'Avec', imageUrl: 'https://cdn.example.com/a.jpg', amountLabel: '1 €' },
        { name: 'Sans', amountLabel: '2 €' },
      ])

      expect(html.match(/<img/g)).toHaveLength(1)
      expect(html.match(/class="li-thumb"/g)).toHaveLength(2)
    })

    it('échappe une URL d\'image hostile plutôt que de fermer l\'attribut', () => {
      const branding = resolveEmailBranding(mockSite())
      const html = lineItemsTable(branding, [
        { name: 'X', imageUrl: 'https://x.test/a.jpg" onerror="alert(1)', amountLabel: '1 €' },
      ])

      expect(html).not.toContain('onerror="alert(1)"')
      expect(html).toContain('&quot; onerror=&quot;')
    })
  })

  it('porte les photos dans la relance de panier abandonné', () => {
    const html = createAbandonedCheckoutEmail(mockSite(), order, lines, 'https://x.test/checkout')

    expect(html).toContain('https://cdn.example.com/watch-images/submariner.jpg')
    expect(html).toContain('https://cdn.example.com/watch-images/speedmaster.jpg')
    expect(html).toContain('Reprendre ma commande')
  })

  it('porte les photos dans la confirmation de commande, client comme commerçant', () => {
    const site = mockSite()
    const forCustomer = createOrderConfirmationEmail(site, order, lines, false)
    const forMerchant = createOrderConfirmationEmail(site, order, lines, true)

    for (const html of [forCustomer, forMerchant]) {
      expect(html).toContain('https://cdn.example.com/watch-images/submariner.jpg')
      expect(html).toContain('Rolex Submariner')
      expect(html).toContain('116610LN')
    }
  })

  it("compose la confirmation aux couleurs du site, plus avec les gris d'origine", () => {
    const html = createOrderConfirmationEmail(mockSite(), order, lines, false)

    expect(html).toContain('#7c6300')
    // Les gris en dur de l'ancien gabarit : ils sortaient aux couleurs d'aucun site.
    expect(html).not.toContain('#f5f5f5')
    expect(html).not.toContain('border-bottom:1px solid #eee')
  })

  it('récapitule les montants payés', () => {
    const html = createOrderConfirmationEmail(
      mockSite(),
      { ...order, discount_cents: 50000, total_cents: 1640000 },
      lines,
      false,
    )

    expect(html).toContain('Sous-total')
    expect(html).toContain('Livraison')
    expect(html).toContain('Réduction')
    expect(html).toContain('Total')
  })

  it("n'ouvre pas de panneau d'articles pour une commande sans ligne relue", () => {
    const html = createOrderConfirmationEmail(mockSite(), order, [], false)

    expect(html).not.toContain('VOTRE COMMANDE')
    expect(html).not.toContain('Votre commande</div>')
    expect(html).toContain('CMD-1')
  })
})

describe('photos jointes et photo catalogue', () => {
  describe('photoGrid', () => {
    it('centre une photo seule', () => {
      const branding = resolveEmailBranding(mockSite())
      const html = photoGrid(branding, [{ src: 'cid:photo1', alt: 'cadran.jpg' }])

      expect(html).toContain('src="cid:photo1"')
      expect(html).toContain('alt="cadran.jpg"')
      expect(html.match(/<img/g)).toHaveLength(1)
    })

    it('range les photos deux par rangée, dernière case comprise', () => {
      const branding = resolveEmailBranding(mockSite())
      const html = photoGrid(branding, [
        { src: 'cid:photo1' },
        { src: 'cid:photo2' },
        { src: 'cid:photo3' },
      ])

      expect(html.match(/<img/g)).toHaveLength(3)
      // Trois photos tiennent en deux rangées : la case orpheline reste vide, sans image.
      expect(html.match(/<tr>/g)).toHaveLength(2)
    })

    it('ne rend rien sans photo exploitable', () => {
      const branding = resolveEmailBranding(mockSite())
      expect(photoGrid(branding, [])).toBe('')
      expect(photoGrid(branding, undefined)).toBe('')
      expect(photoGrid(branding, [{ alt: 'sans source' }, null])).toBe('')
    })

    it("échappe une source hostile plutôt que de fermer l'attribut", () => {
      const branding = resolveEmailBranding(mockSite())
      const html = photoGrid(branding, [{ src: 'cid:x" onerror="alert(1)', alt: 'x' }])

      expect(html).not.toContain('onerror="alert(1)"')
      expect(html).toContain('&quot; onerror=&quot;')
    })
  })

  describe('rendez-vous', () => {
    const appointment = {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      tel: '0600000000',
      date: '2026-09-19',
      time_slot: 'morning',
      watch_id: 'w1',
      watch_name: 'Rolex Submariner',
      watch_price: '8500',
      watch_image_url: 'https://cdn.example.com/watch-images/submariner.jpg',
    }

    it('montre la photo catalogue au commerçant comme au client', () => {
      const site = mockSite()

      for (const html of [
        createAppointmentVendorEmail(site, appointment),
        createAppointmentCustomerEmail(site, appointment),
      ]) {
        expect(html).toContain('https://cdn.example.com/watch-images/submariner.jpg')
        expect(html).toContain('alt="Rolex Submariner"')
      }
    })

    it("part sans image quand la montre n'a pas de photo", () => {
      const site = mockSite()
      const sansPhoto = { ...appointment, watch_image_url: '' }
      const html = createAppointmentVendorEmail(site, sansPhoto)

      expect(html).not.toContain('<img src="cid:')
      expect(html).toContain('Rolex Submariner')
      expect(html).toContain('Nouvelle demande de rendez-vous')
    })
  })

  describe('estimation', () => {
    const estimation = {
      type: 'estimation',
      nickname: 'Jean',
      name: 'Dupont',
      email: 'jean@example.com',
      brand: 'Omega',
      model: 'Speedmaster',
    }

    it('affiche les clichés du client dans le corps du message', () => {
      const html = createEmailTemplate(mockSite(), {
        ...estimation,
        photos: [
          { cid: 'photo1', name: 'cadran.jpg' },
          { cid: 'photo2', name: 'dos.jpg' },
        ],
      })

      expect(html).toContain('Photos envoyées par le client')
      expect(html).toContain('src="cid:photo1"')
      expect(html).toContain('src="cid:photo2"')
    })

    it("n'ouvre pas de panneau quand le client n'a rien joint", () => {
      const html = createEmailTemplate(mockSite(), estimation)

      expect(html).not.toContain('Photos envoyées par le client')
      expect(html).toContain('Speedmaster')
    })
  })

  describe('atelier', () => {
    const repair = {
      name: 'Dupont',
      email: 'jean@example.com',
      service_type: 'Changement de pile',
      message: 'La montre retarde.',
      brand: 'Tissot',
      model: 'PRX',
    }

    it('affiche les photos et ne garde en liste que les fichiers non affichables', () => {
      const html = createRepairVendorEmail(
        mockSite(),
        repair,
        [{ name: 'cadran.jpg' }, { name: 'facture.pdf' }],
        [{ cid: 'photo1', name: 'cadran.jpg' }],
      )

      expect(html).toContain('src="cid:photo1"')
      // Le PDF ne s'affiche pas dans un corps d'e-mail : il reste annoncé par son nom.
      expect(html).toContain('facture.pdf')
      expect(html).not.toContain('cadran.jpg, facture.pdf')
    })

    it('reste compatible avec un appel sans photos inline', () => {
      const html = createRepairVendorEmail(mockSite(), repair, [{ name: 'facture.pdf' }])

      expect(html).toContain('facture.pdf')
      expect(html).not.toContain('cid:')
    })
  })
})
