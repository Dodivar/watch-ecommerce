/**
 * Démo multi-site : même socle que Demo Store, identité et URLs fictives pour valider SITE_ID / build.
 */
import faq from './faq.config.js'

export default {
  siteId: 'demo-store',

  faq,

  locale: 'fr',

  /** Design tokens → CSS variables via vite/site-from-config.mjs + Tailwind theme.extend */
  theme: {
    colors: {
      primary: '#1a2744',
      primaryHover: '#243556',
      cream: '#f7ede0',
      cream100: '#ede4d8',
      cream200: '#e3d9cc',
      cream300: '#d9cec0',
      textMain: '#000000',
    },
    /** Exemple de typographie personnalisable — fichiers dans `public/fonts/`. */
    typography: {
      sans: {
        family: 'HK Grotesk',
        faces: [
          { weight: 400, style: 'normal', file: 'HK Grotesk Regular.woff2' },
          { weight: 400, style: 'italic', file: 'HK Grotesk Italic.woff2' },
          { weight: 800, style: 'normal', file: 'HK Grotesk ExtraBold.woff2' },
        ],
      },
      heading: {
        family: 'Poppins',
        faces: [{ weight: 700, style: 'normal', file: 'Poppins Bold.woff2' }],
      },
      subheading: {
        role: 'sans',
        weight: 800,
      },
      headingWeight: 700,
    },
  },

  brand: {
    legalName: 'Demo Store Watches',
    displayName: 'Demo Store',
    /** Short name for JSON-LD Organization / seller */
    schemaOrgName: 'DemoStore',
    logoAlt: 'Demo Store Watches',
    loginLogoAlt: 'Demo Store',
  },

  contact: {
    whatsappE164: '+33123456789',
    email: 'contact@demo-store.example',
    footerAddressHtml: 'Adresse fictive<br />75000 Paris, France',
  },

  storeMap: {
    enabled: true,
    provider: 'google',
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 12,
    markerLabel: 'Demo Store',
  },

  legal: {
    companyName: 'Demo Store Watches',
    address: 'Adresse fictive 75000 Paris',
    siret: '000 000 000 00000',
  },

  urls: {
    production: 'https://demo-store.example.com',
    staging: 'https://recette.demo-store.example.com',
    development: 'http://localhost:5173',
    previewFallbackHost: 'recette.demo-store.example.com',
  },

  social: {
    footerTiktokUrl: 'https://www.tiktok.com/',
    suivezNous: {
      instagramUrl: 'https://www.instagram.com/',
      instagramHandle: '@demostore',
      tiktokUrl: 'https://www.tiktok.com/',
      tiktokHandle: '@demostore',
    },
  },

  copy: {
    footerTagline:
      "Site de démonstration du template multi-instance : montres de luxe, textes et mentions sont des placeholders.",
    /** Footer legal line (verbatim for template parity). */
    copyrightLine: '© 2026 Demo Store. Tous droits réservés.',
    estimationProcessLead:
      'Chez Demo Store, nous croyons que la transparence est la clé de la confiance.',
    watchSecurityAuthentic:
      "Toutes les montres vendues sur Demo Store sont authentiques. Chaque montre est vérifiée avant la mise en vente. Si vous avez le moindre doute sur l'authenticité de votre montre, contactez-nous dans les 14 jours suivant la réception pour un remboursement complet.",
    watchSecurityInsurance:
      "Chaque montre vendue est assurée pour sa valeur totale par Demo Store. Cela garantit qu'il n'y a aucun risque pour l'acheteur, même en cas de résidence à l'étranger. Votre montre est protégée de bout en bout.",
  },

  /**
   * Bandeaux hero lorsque une seule marque est sélectionnée sur /collection — clés = libellé `brand` exact en base.
   * Ex. : 'Rolex': { image: '/brands/rolex.jpg', alt: 'Rolex' }
   */
  brandHero: {},

  /**
   * Logos couleur — grille /collection/marques (clés = libellé exact `brand` en base).
   * Ex. : 'Rolex': { image: '/brands/rolex/logo.png', alt: 'Rolex' }
   */
  brandLogos: {},

  integrations: {
    cookieConsentStorageKey: 'demo_store_cookie_consent_v1',
    gaInitFlag: '__demo_store_ga_initialized',
    gaPendingWaitersKey: '__demo_store_ga_pending_waiters',
    gaDevLogPrefix: '[DemoStore]',
    metaPixelInitFlag: '__demo_store_meta_pixel_initialized',
  },

  /**
   * Fonctionnalités et pages publiques (voir packages/base/src/site/siteFeatures.js pour les clés).
   * Passer une clé à false désactive la route et les liens de navigation associés.
   */
  /**
   * Page « site en construction » : mot de passe pour débloquer l’accès public.
   * Définir `password` par client dans son `site.config.js` ; sinon le défaut du socle s’applique.
   *
   * maintenance: {
   *   password: 'mot-de-passe-client',
   * },
   */

  features: {
    collection: true,
    blog: true,
    recherche: true,
    estimation: true,
    estimationProcess: true,
    merci: true,
    about: true,
    legal: true,
    purchase: true,
    paymentReturn: true,
    admin: true,
    adminWatchPromotions: true,
    newsletter: true,
  },

  /** Profil catalogue revente (démo plateforme). */
  watchCatalog: {
    mode: 'resale',
  },

  checkout: {
    reserveMinutes: 30,
    currency: 'EUR',
    vatRate: 20,
    shipping: {
      defaultCountry: 'FR',
      freeShippingFrom: null,
      pickupEnabled: true,
      methods: [
        {
          id: 'standard_home',
          type: 'home',
          label: 'Livraison standard',
          countries: ['FR'],
          fee: { type: 'flat', amount: 9.9 },
          estimatedDays: '3 à 7 jours ouvrés',
        },
        {
          id: 'pickup_demo',
          type: 'pickup',
          label: 'Retrait en boutique (démo)',
          fee: { type: 'flat', amount: 0 },
          pickupLocation: {
            name: 'Demo Store',
            address: 'Adresse fictive, 75000 Paris',
          },
        },
      ],
    },
    promo: { enabled: true },
    legal: {
      cgvUrl: '/conditions-generales-utilisation',
      requireAcceptance: true,
    },
  },

  collection: {
    /**
     * Format du catalogue : 'grid' (défaut, grille 2/3/4 colonnes) | 'list'
     * (une montre par ligne, caractéristiques visibles) | 'showcase' (grands
     * visuels portrait, 1 à 2 par rangée) | 'compact' (grille dense jusqu'à
     * 6 colonnes). Valeurs dans `packages/base/src/site/collectionFilters.js`.
     */
    displayMode: 'grid',
    filters: {
      price: true,
      brand: true,
      audience: true,
      caseSize: true,
    },
  },

  /**
   * Configuration du backend Render multi-tenant.
   * Les défauts non spécifiés sont calculés à partir de `brand`, `contact`, `urls` et `theme.colors`.
   * Les secrets sont fournis via `SITE_DEMO_STORE__<KEY>` côté Render.
   */
  backend: {
    publicApiUrl: 'https://watch-ecommerce-mp9l.onrender.com',
    cors: {
      extraAllowedOrigins: [],
    },
    email: {
      // fromName, fromAddress, toAddress dérivés de brand.legalName et contact.email.
      template: {
        // logoText dérivé de brand.displayName.toUpperCase() ; accentColor dérivé de theme.colors.primary.
      },
    },
    n8n: {
      // Configurer une fois le workflow n8n du client provisionné.
      productionWorkflowUrl: '',
      testWorkflowUrl: '',
    },
  },

  seo: {
    /** Static shell before Vue hydrates @vueuse/head (fallback / crawlers). */
    indexHtml: {
      title: 'Demo Store - Montres de luxe',
      metaDescription:
        'Demo Store - Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite. Rolex, Breitling, Tag Heuer, Cartier et plus.',
      keywords:
        'recherche personnalisée de montre, rachat montre, montre de luxe, montre occasion, Rolex, Breitling, Tag Heuer, Cartier, montre garantie',
      author: 'Demo Store',
      ogTitle: 'Demo Store - Montres de luxe',
      ogDescription:
        'Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite.',
      twitterCard: 'summary_large_image',
      twitterTitle: 'Demo Store - Montres de luxe',
      twitterDescription:
        'Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite.',
      ogLocale: 'fr_FR',
      ogSiteName: 'Demo Store',
      appleMobileWebAppTitle: 'Demo Store Watches',
      ogImagePath: '/logo500x500.png',
    },
    home: {
      title: 'Demo Store - Rachat de Montres de Luxe | Collection Garantie',
      metaDescription:
        'Découvrez notre collection de montres de luxe garanties 1 an. Rolex, Breitling, Tag Heuer, Cartier et plus. Estimation gratuite, recherche personnalisée et accompagnement expert.',
      ogTitle: 'Demo Store - Rachat de Montres de Luxe | Collection Garantie',
      ogDescription:
        'Découvrez notre collection de montres de luxe garanties 1 an. Estimation gratuite, recherche personnalisée et accompagnement expert.',
      twitterTitle: 'Demo Store - Rachat de Montres de Luxe',
      twitterDescription:
        'Découvrez notre collection de montres de luxe garanties 1 an. Estimation gratuite, recherche personnalisée.',
    },
    blog: {
      title: 'Blog Horlogerie | Articles sur les Montres | Demo Store',
      metaDescription:
        "Découvrez nos articles sur les montres et l'horlogerie. Guides, actualités, conseils d'achat et expertise sur les montres de luxe.",
      ogTitle: 'Blog Horlogerie | Articles sur les Montres | Demo Store',
      ogDescription:
        "Découvrez nos articles sur les montres et l'horlogerie. Guides, actualités et conseils d'achat.",
      twitterTitle: 'Blog Horlogerie | Demo Store',
      twitterDescription: "Découvrez nos articles sur les montres et l'horlogerie.",
      articleFallbackTitle: 'Article - Demo Store',
      articleTitleBlogSuffix: '| Blog Demo Store',
      structuredDataPublisherName: 'Demo Store',
    },
    collection: {
      title: 'Collection de Montres de Luxe | Demo Store',
      metaDescription:
        'Découvrez notre collection complète de montres de luxe. Rolex, Breitling, Tag Heuer, Cartier et plus. Toutes nos montres sont garanties 1 an et authentifiées.',
      ogTitle: 'Collection de Montres de Luxe | Demo Store',
      ogDescription:
        'Découvrez notre collection complète de montres de luxe garanties 1 an et authentifiées.',
      twitterTitle: 'Collection de Montres de Luxe | Demo Store',
      twitterDescription:
        'Découvrez notre collection complète de montres de luxe garanties 1 an.',
    },
    brandsIndex: {
      h1: 'Toutes les marques',
      title: 'Marques de montres de luxe | Demo Store',
      metaDescription:
        'Parcourez les marques disponibles sur Demo Store et ouvrez chaque collection : montres authentifiées, garanties et sélectionnées avec soin.',
      ogTitle: 'Marques | Demo Store',
      ogDescription:
        'Accédez aux collections par marque : Rolex, Omega, Cartier et bien d’autres références.',
      twitterTitle: 'Marques | Demo Store',
      twitterDescription:
        'Découvrez nos marques et leurs collections de montres de luxe.',
    },
    brandCollection: {
      title: '{brand} | Collection | Demo Store',
      metaDescription:
        'Montres {brand} sélectionnées : filtres par public (homme, femme, enfant) et budget. Montres garanties et authentifiées.',
      titleFallback: 'Collection par marque | Demo Store',
      metaDescriptionFallback:
        'Parcourez nos montres par marque : filtres par public et prix.',
    },
    watchDetail: {
      titleFallback: 'Montre - Demo Store',
      titlePriceSuffix: ' | Demo Store',
      descriptionFallback: 'Découvrez cette montre de luxe sur Demo Store',
      structuredDataSellerName: 'Demo Store',
    },
    aPropos: {
      title: 'À propos de Demo Store - Votre partenaire de confiance pour les montres de luxe',
      metaDescription:
        'Découvrez Demo Store, une entreprise spécialisée dans le rachat et la vente de montres de luxe. Nous possédons directement notre stock, garantissant authenticité, qualité et disponibilité immédiate.',
      ogTitle: 'À propos de Demo Store - Votre partenaire de confiance',
      ogDescription:
        'Découvrez Demo Store, une entreprise spécialisée dans le rachat et la vente de montres de luxe. Stock direct, authenticité garantie.',
      twitterTitle: 'À propos de Demo Store',
      twitterDescription:
        'Découvrez Demo Store, votre partenaire de confiance pour les montres de luxe.',
    },
    politique: {
      title: 'Politique de confidentialité | Demo Store Watches',
      metaDescription:
        'Politique de confidentialité de Demo Store Watches : traitements des données, cookies et analytics, formulaires, paiements Stripe, vos droits RGPD.',
      ogTitle: 'Politique de confidentialité | Demo Store Watches',
      ogDescription:
        'Transparence sur le traitement des données : audience (Google Analytics), formulaires, paiement Stripe, exercice de vos droits.',
      twitterTitle: 'Politique de confidentialité | Demo Store Watches',
      twitterDescription:
        'Traitement des données personnelles, cookies, vos droits et contact RGPD.',
    },
    mentions: {
      title: 'Mentions légales | Demo Store Watches',
      metaDescription:
        'Mentions légales du site Demo Store Watches : éditeur, hébergement, propriété intellectuelle, données personnelles.',
      ogTitle: 'Mentions légales | Demo Store Watches',
      ogDescription:
        'Informations sur l’éditeur du site, l’hébergeur Vercel et le cadre applicable.',
      twitterTitle: 'Mentions légales | Demo Store Watches',
      twitterDescription: 'Éditeur, publication, hébergement et propriété intellectuelle.',
    },
    cgu: {
      title: 'Conditions générales d’utilisation | Demo Store Watches',
      metaDescription:
        'CGU du site Demo Store Watches : accès, services, commande et paiement, responsabilité, droit applicable.',
      ogTitle: 'Conditions générales d’utilisation | Demo Store Watches',
      ogDescription:
        'Modalités d’utilisation du site, services proposés, propriété intellectuelle et contact.',
      twitterTitle: 'Conditions générales d’utilisation | Demo Store Watches',
      twitterDescription: 'Règles d’accès et d’usage du site Demo Store Watches.',
    },
  },
}
