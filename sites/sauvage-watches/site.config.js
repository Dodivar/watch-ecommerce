/**
 * First-site manifest: current production storefront (Sauvage).
 * Template extraction — all brand-specific defaults for `sites/sauvage-watches` live here.
 */
import faq from './faq.config.js'
import { t } from '../../packages/base/src/site/i18nValue.js'

export default {
  siteId: 'sauvage-watches',

  faq,

  locale: 'fr',

  /**
   * Langues du site. Le client ne déclare que des codes : libellés, formats de nombre/date
   * et `og:locale` viennent du socle (`packages/base/src/i18n/locales.js`).
   *
   * `defaultLocale` sert quand le navigateur du visiteur ne dit rien d'exploitable, et
   * garde les URLs sans préfixe (`/collection`) ; les autres langues sont servies sous
   * `/en/...` et `/de/...`.
   *
   * Un texte se traduit sur place avec `t({ fr, en, de })` ; une chaîne simple reste
   * valide et sert pour les trois langues.
   */
  i18n: {
    enabled: true,
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'de'],
  },

  /** Design tokens → CSS variables via vite/site-from-config.mjs + Tailwind theme.extend */
  theme: {
    /**
     * `dark` = fond de page vert, contenu sur surfaces blanches.
     * Le rendu est piloté par `packages/base/src/assets/theme-dark.css`.
     */
    colorScheme: 'dark',
    colors: {
      primary: '#0f2a1d',
      primaryHover: '#163d2a',
      cream: '#f7ede0',
      cream100: '#ede4d8',
      cream200: '#e3d9cc',
      cream300: '#d9cec0',
      textMain: '#000000',
      textOnDark: '#ffffff',
      browserChrome: '#0f2a1d',
    },
    /**
     * Surfaces du thème vert. Quatre déclinaisons du vert de marque : fond de
     * page, bande alternée, panneau posé sur la bande, filet de séparation.
     * Sans ce bloc, un site retombe sur ses beiges (`colors.cream*`).
     */
    surfaces: {
      page: '#0f2a1d',
      pageAlt: '#163d2a',
      pageRaised: '#234c38',
      pageLine: '#315d47',
    },
    /** Typographie de référence du socle — fichiers dans `public/fonts/`. */
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
    legalName: 'Sauvage Watches',
    displayName: 'Sauvage',
    /** Short name for JSON-LD Organization / seller */
    schemaOrgName: 'Sauvage',
    logoAlt: 'Sauvage Watches',
    loginLogoAlt: 'Sauvage',
  },

  contact: {
    whatsappE164: '+33612843926',
    email: 'contact@sauvage-watches.fr',
    footerAddressHtml: '32 Allée de la Robertsau<br />67000 Strasbourg, France',
  },

  storeMap: {
    enabled: true,
    provider: 'google',
    /** Bonhomme Street View (vue 360°) — facturation Google « Dynamic Street View » si utilisé */
    streetViewControl: false,
    center: { lat: 48.5946, lng: 7.7769 },
    zoom: 16,
    markerLabel: 'Sauvage Watches',
    directionsAddress: '32 Allée de la Robertsau, 67000 Strasbourg, France',
    /** Horaires boutique — affichés dans la popup prise de rendez-vous */
    openingHours: {
      daysLabel: t({ fr: 'Lundi – samedi', en: 'Monday – Saturday', de: 'Montag – Samstag' }),
      hoursLabel: t({
        fr: 'Sur rendez-vous',
        en: 'By appointment',
        de: 'Nach Vereinbarung',
      }),
    },
    /** Logo bulle carte — remplacer par un PNG horizontal dans `public/` si besoin */
    popupLogoSrc: '/web-app-manifest-512x512.png',
  },

  legal: {
    companyName: 'Sauvage Watches',
    address: '32 Allée de la Robertsau, 67000 Strasbourg, France',
    siret: '931 523 393 00011',
  },

  urls: {
    production: 'https://www.sauvage-watches.fr',
    staging: 'https://recette.sauvage-watches.fr',
    development: 'http://localhost:5173',
    previewFallbackHost: 'recette.sauvage-watches.fr',
  },

  social: {
    footerTiktokUrl: 'https://www.tiktok.com/@sauvagewatches',
    suivezNous: {
      instagramUrl: 'https://www.instagram.com/sauvage_watches',
      instagramHandle: '@sauvage_watches',
      tiktokUrl: 'https://www.tiktok.com/@sauvagewatches',
      tiktokHandle: '@sauvagewatches',
    },
  },

  copy: {
    footerTagline: t({
      fr: "Votre partenaire pour l'achat et la mise à disposition de montres de luxe authentifiées. Recherche personnalisée, estimation rapide, transparence garantie.",
      en: 'Your partner for buying and sourcing authenticated luxury watches. Personalised sourcing, fast valuation, guaranteed transparency.',
      de: 'Ihr Partner für den Kauf und die Beschaffung authentifizierter Luxusuhren. Persönliche Suche, schnelle Schätzung, garantierte Transparenz.',
    }),
    /** Footer legal line (verbatim for template parity). */
    copyrightLine: t({
      fr: '© 2026 Sauvage Watches. Tous droits réservés.',
      en: '© 2026 Sauvage Watches. All rights reserved.',
      de: '© 2026 Sauvage Watches. Alle Rechte vorbehalten.',
    }),
    estimationProcessLead: t({
      fr: 'Chez Sauvage, nous croyons que la transparence est la clé de la confiance.',
      en: 'At Sauvage, we believe transparency is the key to trust.',
      de: 'Bei Sauvage sind wir überzeugt: Transparenz schafft Vertrauen.',
    }),
    watchSecurityAuthentic: t({
      fr: "Toutes les montres vendues sur Sauvage sont authentiques. Chaque montre est vérifiée avant la mise en vente. Si vous avez le moindre doute sur l'authenticité de votre montre, contactez-nous dans les 14 jours suivant la réception pour un remboursement complet.",
      en: 'Every watch sold by Sauvage is authentic. Each one is checked before going on sale. Should you have the slightest doubt about your watch’s authenticity, contact us within 14 days of delivery for a full refund.',
      de: 'Alle bei Sauvage verkauften Uhren sind authentisch. Jede Uhr wird vor dem Verkauf geprüft. Sollten Sie den geringsten Zweifel an der Echtheit Ihrer Uhr haben, kontaktieren Sie uns innerhalb von 14 Tagen nach Erhalt für eine vollständige Rückerstattung.',
    }),
    watchSecurityInsurance: t({
      fr: "Chaque montre vendue est assurée pour sa valeur totale par Sauvage. Cela garantit qu'il n'y a aucun risque pour l'acheteur, même en cas de résidence à l'étranger. Votre montre est protégée de bout en bout.",
      en: 'Every watch sold is insured by Sauvage for its full value. There is therefore no risk for the buyer, including from abroad. Your watch is protected end to end.',
      de: 'Jede verkaufte Uhr ist von Sauvage zum vollen Wert versichert. Für den Käufer besteht damit kein Risiko, auch nicht aus dem Ausland. Ihre Uhr ist von Anfang bis Ende geschützt.',
    }),
  },

  /** Mot de passe page « site en construction » (voir `MaintenancePage.vue`). */
  maintenance: {
    password: 'dodi',
  },

  integrations: {
    cookieConsentStorageKey: 'sauvage_cookie_consent_v1',
    gaInitFlag: '__sauvage_ga_initialized',
    gaPendingWaitersKey: '__sauvage_ga_pending_waiters',
    gaDevLogPrefix: '[Sauvage]',
    metaPixelInitFlag: '__sauvage_meta_pixel_initialized',
  },

  /**
   * Fonctionnalités et pages publiques (voir packages/base/src/site/siteFeatures.js pour les clés).
   * Passer une clé à false désactive la route et les liens de navigation associés.
   */
  features: {
    /** Achats en ligne (Stripe) sur les fiches montre ; désactiver aussi `VITE_PURCHASE_ENABLED=false` en prod si besoin. */
    purchase: true,
    paymentReturn: true,
    adminWatchPromotions: true,
    /** Archive publique des montres vendues (`/ventes`) — preuve sociale + SEO. */
    soldArchive: true,
  },

  /** Profil catalogue revente : année, état, contenu et référence visibles sur cartes et fiches. */
  watchCatalog: {
    mode: 'resale',
    /** Bouton « Prendre rendez-vous » sur les fiches montre (boutique Robertsau). */
    appointment: true,
    /** Année affichée en badge dans le coin haut-gauche de l'image ('corner') ou à droite du prix ('inline'). */
    yearBadgePosition: 'corner',
  },

  checkout: {
    reserveMinutes: 30,
    currency: 'EUR',
    vatRate: 20,
    shipping: {
      defaultCountry: 'FR',
      freeShippingFrom: null,
      /** Proposer le retrait en boutique au checkout (les méthodes `type: 'pickup'` sont ignorées si false). */
      pickupEnabled: true,
      methods: [
        {
          id: 'colissimo_insured',
          type: 'home',
          label: t({
            fr: 'Livraison assurée à domicile',
            en: 'Insured home delivery',
            de: 'Versicherte Lieferung nach Hause',
          }),
          countries: ['FR', 'MC', 'BE', 'CH', 'LU'],
          fee: { type: 'flat', amount: 0 },
          estimatedDays: t({
            fr: 'Sous 5 à 10 jours ouvrés après validation du paiement',
            en: 'Within 5 to 10 business days of payment confirmation',
            de: 'Innerhalb von 5 bis 10 Werktagen nach Zahlungsbestätigung',
          }),
        },
        {
          id: 'pickup_robertsau',
          type: 'pickup',
          label: t({
            fr: 'Retrait sur rendez-vous',
            en: 'Collection by appointment',
            de: 'Abholung nach Vereinbarung',
          }),
          fee: { type: 'flat', amount: 0 },
          estimatedDays: t({
            fr: 'Disponible sous 48 h après validation du paiement, sur rendez-vous',
            en: 'Ready within 48 h of payment confirmation, by appointment',
            de: 'Innerhalb von 48 Std. nach Zahlungsbestätigung verfügbar, nach Vereinbarung',
          }),
          pickupLocation: {
            name: 'Sauvage Watches',
            address: '32 Allée de la Robertsau, 67000 Strasbourg',
          },
        },
      ],
    },
    promo: { enabled: true },
    legal: {
      cgvUrl: '/conditions-generales-utilisation',
      requireAcceptance: true,
    },
    /**
     * Relance email des paniers abandonnés (une seule relance par commande,
     * `delayMinutes` sans activité). Nécessite la migration
     * « Relance panier abandonné » — voir supabase/migrations/README.md.
     */
    abandonedCart: {
      enabled: true,
      delayMinutes: 60,
    },
  },

  /**
   * Sections affichées sur la page d’accueil et leur ordre.
   * Ids reconnus : voir `packages/base/src/site/homeSections.js` (`KNOWN_HOME_SECTION_IDS`).
   * Sans clé `home` ou sans `sections`, l’accueil est vide (pas de défaut dans le socle).
   */
  home: {
    /**
     * Hero d'accueil « vitrine » : discours à gauche, panneau blanc à droite.
     * La montre exposée n'est pas configurée ici — c'est la première du catalogue
     * encore en vente, chargée à l'affichage (voir `HomeHeroVitrineSection.vue`).
     * `variant: 'parallax'` remet le hero historique au cadran animé.
     */
    hero: {
      variant: 'vitrine',
      eyebrow: t({
        fr: 'Revendeur horloger — Strasbourg',
        en: 'Watch dealer — Strasbourg',
        de: 'Uhrenhändler — Straßburg',
      }),
      title: t({
        fr: 'Des montres authentifiées, choisies une par une.',
        en: 'Authenticated watches, chosen one by one.',
        de: 'Authentifizierte Uhren, Stück für Stück ausgewählt.',
      }),
      subtitle: t({
        fr: 'Nous achetons, vérifions et détenons nos montres. Chaque pièce est contrôlée, garantie un an et disponible immédiatement.',
        en: 'We buy, check and hold our watches ourselves. Every piece is inspected, comes with a one-year warranty and is available immediately.',
        de: 'Wir kaufen, prüfen und besitzen unsere Uhren selbst. Jedes Stück wird kontrolliert, hat ein Jahr Garantie und ist sofort verfügbar.',
      }),
      primaryCta: {
        label: t({
          fr: 'Voir les montres en stock',
          en: 'See watches in stock',
          de: 'Uhren auf Lager ansehen',
        }),
        to: '/collection',
      },
      secondaryCta: {
        label: t({ fr: 'Recherche personnalisée', en: 'Watch sourcing', de: 'Uhrensuche' }),
        to: '/recherche',
      },
      /** Trois points de réassurance maximum : le variant `vitrine` leur associe une icône. */
      highlights: [
        t({ fr: 'Montre certifiée', en: 'Certified watch', de: 'Zertifizierte Uhr' }),
        t({
          fr: 'Garantie un an sur chaque montre',
          en: 'One-year warranty on every watch',
          de: 'Ein Jahr Garantie auf jede Uhr',
        }),
        t({
          fr: 'Visite sur rendez-vous',
          en: 'Viewings by appointment',
          de: 'Besichtigung nach Vereinbarung',
        }),
      ],
    },
    nouvelles: {
      title: t({ fr: 'Nouvelles arrivées', en: 'New arrivals', de: 'Neuzugänge' }),
    },
    sections: ['hero', 'nouvelles', 'trust', 'ventes', 'suivezNous', 'services', 'faq'],
  },

  /** Filtres collection — passer une clé à `false` pour masquer la section dans le tiroir. */
  collection: {
    /** Nombre de montres par page sur `/collection` (défaut socle : 12, bornes 4–96). */
    pageSize: 12,
    filters: {
      price: true,
      brand: true,
      audience: true,
      caseSize: true,
    },
  },

  /**
   * Menu principal (header) et liens colonne « Navigation » du footer.
   * Les clés absentes du bloc `features` héritent des défauts du socle (voir siteFeatures.js).
   */
  navigation: {
    main: [
      {
        type: 'link',
        label: t({ fr: 'Nos montres', en: 'Our watches', de: 'Unsere Uhren' }),
        to: '/collection',
        feature: 'collection',
      },
      {
        type: 'link',
        label: t({ fr: 'Nos ventes', en: 'Past sales', de: 'Verkaufte Uhren' }),
        to: '/ventes',
        feature: 'soldArchive',
      },
      {
        type: 'group',
        label: t({ fr: 'Nos services', en: 'Our services', de: 'Unsere Leistungen' }),
        items: [
          {
            label: t({ fr: 'Recherche personnalisée', en: 'Watch sourcing', de: 'Uhrensuche' }),
            to: '/recherche',
            feature: 'recherche',
          },
          {
            label: t({ fr: 'Estimation', en: 'Valuation', de: 'Schätzung' }),
            to: '/estimation',
            feature: 'estimation',
          },
        ],
      },
      { type: 'link', label: 'Blog', to: '/blog', feature: 'blog' },
      {
        type: 'link',
        label: t({ fr: 'À propos', en: 'About', de: 'Über uns' }),
        to: '/a-propos',
        feature: 'about',
      },
      { type: 'link', label: 'FAQ', to: '/faq', feature: 'faq' },
      {
        type: 'link',
        label: t({ fr: 'Contact', en: 'Contact', de: 'Kontakt' }),
        to: '/contact',
        feature: 'contact',
      },
    ],
    footer: [
      {
        label: t({ fr: 'Accueil', en: 'Home', de: 'Startseite' }),
        to: '/#accueil',
      },
      {
        label: t({ fr: 'Nos montres', en: 'Our watches', de: 'Unsere Uhren' }),
        to: '/collection',
        feature: 'collection',
      },
      {
        label: t({ fr: 'Nos ventes', en: 'Past sales', de: 'Verkaufte Uhren' }),
        to: '/ventes',
        feature: 'soldArchive',
      },
      {
        label: t({ fr: 'Recherche personnalisée', en: 'Watch sourcing', de: 'Uhrensuche' }),
        to: '/recherche',
        feature: 'recherche',
      },
      {
        label: t({ fr: 'Estimation', en: 'Valuation', de: 'Schätzung' }),
        to: '/estimation',
        feature: 'estimation',
      },
      { label: 'Blog', to: '/blog', feature: 'blog' },
      {
        label: t({ fr: 'À propos', en: 'About', de: 'Über uns' }),
        to: '/a-propos',
        feature: 'about',
      },
      {
        label: t({ fr: 'Contact', en: 'Contact', de: 'Kontakt' }),
        to: '/contact',
        feature: 'contact',
      },
    ],
  },

  /**
   * Configuration du backend Render multi-tenant.
   * Les défauts non spécifiés sont calculés à partir de `brand`, `contact`, `urls` et `theme.colors`
   * dans `backend/sites/normalize.js`. Les secrets restent dans les variables d'environnement
   * `SITE_<UPPER_SITE_ID>__<KEY>` (voir `backend/sites/secrets.js`).
   */
  backend: {
    /** Backend Render multi-tenant — fallback au build si VITE_BACKEND_URL n'est pas fournie. */
    publicApiUrl: 'https://watch-ecommerce-mp9l.onrender.com',
    cors: {
      /** Origines additionnelles à autoriser au-delà des urls.production/staging/development (et leur variante www). */
      extraAllowedOrigins: [],
    },
    email: {
      /** Override de brand.legalName pour le "From Name" Mailjet. */
      fromName: 'Sauvage Watches',
      /** Override de contact.email pour l'expéditeur Mailjet. */
      fromAddress: 'contact@sauvage-watches.fr',
      /** Override de contact.email pour le destinataire interne Mailjet. */
      toAddress: 'doryandillen@gmail.com',
      //toAddress: 'contact@sauvage-watches.fr',
      template: {
        /** Override du logo texte affiché en en-tête de l'email (sinon brand.displayName.toUpperCase()). */
        logoText: 'SAUVAGE WATCHES',
        /** Couleur d'accent du template email (bordures, titres). Sinon theme.colors.primary. */
        accentColor: '#d4af37',
      },
    },
    n8n: {
      productionWorkflowUrl:
        'https://n8n.srv1166238.hstgr.cloud/webhook/0adc09a6-a55c-4cd6-be94-f99c3036d441',
      testWorkflowUrl:
        'https://n8n.srv1166238.hstgr.cloud/webhook-test/0adc09a6-a55c-4cd6-be94-f99c3036d441',
    },
  },

  /** Bandeaux hero — une seule marque sélectionnée sur /collection ; clés = libellé exact du champ `brand` en base. */
  brandHero: {
    Oméga: {
      image: '/brands/omega/omega-brand.jpg',
      alt: t({
      fr: 'Bracelet à maillons d’argent, montre analogique ronde',
      en: 'Silver link bracelet, round analogue watch',
      de: 'Silbernes Gliederarmband, runde Analoguhr',
    }),
    },
  },

  /**
   * Logos couleur — grille /collection/marques (clés = libellé exact `brand` en base).
   * Si absent, la tuile utilise l’image `brandHero` ou un libellé texte.
   */
  brandLogos: {},

  seo: {
    /** Static shell before Vue hydrates @vueuse/head (fallback / crawlers). */
    indexHtml: {
      title: t({
        fr: 'Sauvage - Montres de luxe',
        en: 'Sauvage - Luxury watches',
        de: 'Sauvage - Luxusuhren',
      }),
      metaDescription: t({
        fr: 'Sauvage - Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite. Rolex, Breitling, Tag Heuer, Cartier et plus.',
        en: 'Sauvage - Luxury watch specialists. A collection of watches with a 1-year warranty, free valuation. Rolex, Breitling, Tag Heuer, Cartier and more.',
        de: 'Sauvage - Spezialist für Luxusuhren. Uhrenkollektion mit 1 Jahr Garantie, kostenlose Schätzung. Rolex, Breitling, Tag Heuer, Cartier und mehr.',
      }),
      keywords: t({
        fr: 'recherche personnalisée de montre, rachat montre, montre de luxe, montre occasion, Rolex, Breitling, Tag Heuer, Cartier, montre garantie',
        en: 'watch sourcing, watch buy-back, luxury watch, pre-owned watch, Rolex, Breitling, Tag Heuer, Cartier, warranted watch',
        de: 'Uhrensuche, Uhrenankauf, Luxusuhr, gebrauchte Uhr, Rolex, Breitling, Tag Heuer, Cartier, Uhr mit Garantie',
      }),
      author: 'Sauvage',
      ogTitle: t({
        fr: 'Sauvage - Montres de luxe',
        en: 'Sauvage - Luxury watches',
        de: 'Sauvage - Luxusuhren',
      }),
      ogDescription: t({
        fr: 'Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite.',
        en: 'Luxury watch specialists. A collection of watches with a 1-year warranty, free valuation.',
        de: 'Spezialist für Luxusuhren. Uhrenkollektion mit 1 Jahr Garantie, kostenlose Schätzung.',
      }),
      twitterCard: 'summary_large_image',
      twitterTitle: t({
        fr: 'Sauvage - Montres de luxe',
        en: 'Sauvage - Luxury watches',
        de: 'Sauvage - Luxusuhren',
      }),
      twitterDescription: t({
        fr: 'Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite.',
        en: 'Luxury watch specialists. A collection of watches with a 1-year warranty, free valuation.',
        de: 'Spezialist für Luxusuhren. Uhrenkollektion mit 1 Jahr Garantie, kostenlose Schätzung.',
      }),
      /** Repli : `og:locale` réel est dérivé de la langue active (voir `i18n/locales.js`). */
      ogLocale: 'fr_FR',
      ogSiteName: 'Sauvage',
      appleMobileWebAppTitle: 'Sauvage Watches',
      ogImagePath: '/logo500x500.png',
    },
    home: {
      title: t({
        fr: 'Sauvage - Rachat de Montres de Luxe | Collection Garantie',
        en: 'Sauvage - Luxury Watch Buy-Back | Warranted Collection',
        de: 'Sauvage - Ankauf von Luxusuhren | Kollektion mit Garantie',
      }),
      metaDescription: t({
        fr: 'Découvrez notre collection de montres de luxe garanties 1 an. Rolex, Breitling, Tag Heuer, Cartier et plus. Estimation gratuite, recherche personnalisée et accompagnement expert.',
        en: 'Discover our collection of luxury watches with a 1-year warranty. Rolex, Breitling, Tag Heuer, Cartier and more. Free valuation, personalised sourcing and expert guidance.',
        de: 'Entdecken Sie unsere Kollektion von Luxusuhren mit 1 Jahr Garantie. Rolex, Breitling, Tag Heuer, Cartier und mehr. Kostenlose Schätzung, persönliche Suche und fachkundige Beratung.',
      }),
      ogTitle: t({
        fr: 'Sauvage - Rachat de Montres de Luxe | Collection Garantie',
        en: 'Sauvage - Luxury Watch Buy-Back | Warranted Collection',
        de: 'Sauvage - Ankauf von Luxusuhren | Kollektion mit Garantie',
      }),
      ogDescription: t({
        fr: 'Découvrez notre collection de montres de luxe garanties 1 an. Estimation gratuite, recherche personnalisée et accompagnement expert.',
        en: 'Discover our collection of luxury watches with a 1-year warranty. Free valuation, personalised sourcing and expert guidance.',
        de: 'Entdecken Sie unsere Kollektion von Luxusuhren mit 1 Jahr Garantie. Kostenlose Schätzung, persönliche Suche und fachkundige Beratung.',
      }),
      twitterTitle: t({
        fr: 'Sauvage - Rachat de Montres de Luxe',
        en: 'Sauvage - Luxury Watch Buy-Back',
        de: 'Sauvage - Ankauf von Luxusuhren',
      }),
      twitterDescription: t({
        fr: 'Découvrez notre collection de montres de luxe garanties 1 an. Estimation gratuite, recherche personnalisée.',
        en: 'Discover our collection of luxury watches with a 1-year warranty. Free valuation, personalised sourcing.',
        de: 'Entdecken Sie unsere Kollektion von Luxusuhren mit 1 Jahr Garantie. Kostenlose Schätzung, persönliche Suche.',
      }),
    },
    blog: {
      title: t({
        fr: 'Blog Horlogerie | Articles sur les Montres | Sauvage',
        en: 'Watchmaking Blog | Articles on Watches | Sauvage',
        de: 'Uhrmacher-Blog | Artikel über Uhren | Sauvage',
      }),
      metaDescription: t({
        fr: "Découvrez nos articles sur les montres et l'horlogerie. Guides, actualités, conseils d'achat et expertise sur les montres de luxe.",
        en: 'Read our articles on watches and watchmaking: guides, news, buying advice and luxury watch expertise.',
        de: 'Lesen Sie unsere Artikel über Uhren und Uhrmacherkunst: Ratgeber, Neuigkeiten, Kauftipps und Expertise zu Luxusuhren.',
      }),
      ogTitle: t({
        fr: 'Blog Horlogerie | Articles sur les Montres | Sauvage',
        en: 'Watchmaking Blog | Articles on Watches | Sauvage',
        de: 'Uhrmacher-Blog | Artikel über Uhren | Sauvage',
      }),
      ogDescription: t({
        fr: "Découvrez nos articles sur les montres et l'horlogerie. Guides, actualités et conseils d'achat.",
        en: 'Read our articles on watches and watchmaking: guides, news and buying advice.',
        de: 'Lesen Sie unsere Artikel über Uhren und Uhrmacherkunst: Ratgeber, Neuigkeiten und Kauftipps.',
      }),
      twitterTitle: t({
        fr: 'Blog Horlogerie | Sauvage',
        en: 'Watchmaking Blog | Sauvage',
        de: 'Uhrmacher-Blog | Sauvage',
      }),
      twitterDescription: t({
        fr: "Découvrez nos articles sur les montres et l'horlogerie.",
        en: 'Read our articles on watches and watchmaking.',
        de: 'Lesen Sie unsere Artikel über Uhren und Uhrmacherkunst.',
      }),
      articleFallbackTitle: t({
        fr: 'Article - Sauvage',
        en: 'Article - Sauvage',
        de: 'Artikel - Sauvage',
      }),
      articleTitleBlogSuffix: t({
        fr: '| Blog Sauvage',
        en: '| Sauvage Blog',
        de: '| Sauvage Blog',
      }),
      structuredDataPublisherName: 'Sauvage',
    },
    collection: {
      title: t({
        fr: 'Collection de Montres de Luxe | Sauvage',
        en: 'Luxury Watch Collection | Sauvage',
        de: 'Luxusuhren-Kollektion | Sauvage',
      }),
      metaDescription: t({
        fr: 'Découvrez notre collection complète de montres de luxe. Rolex, Breitling, Tag Heuer, Cartier et plus. Toutes nos montres sont garanties 1 an et authentifiées.',
        en: 'Browse our full collection of luxury watches. Rolex, Breitling, Tag Heuer, Cartier and more. Every watch is authenticated and carries a 1-year warranty.',
        de: 'Entdecken Sie unsere gesamte Luxusuhren-Kollektion. Rolex, Breitling, Tag Heuer, Cartier und mehr. Alle Uhren sind authentifiziert und haben 1 Jahr Garantie.',
      }),
      ogTitle: t({
        fr: 'Collection de Montres de Luxe | Sauvage',
        en: 'Luxury Watch Collection | Sauvage',
        de: 'Luxusuhren-Kollektion | Sauvage',
      }),
      ogDescription: t({
        fr: 'Découvrez notre collection complète de montres de luxe garanties 1 an et authentifiées.',
        en: 'Browse our full collection of authenticated luxury watches with a 1-year warranty.',
        de: 'Entdecken Sie unsere gesamte Kollektion authentifizierter Luxusuhren mit 1 Jahr Garantie.',
      }),
      twitterTitle: t({
        fr: 'Collection de Montres de Luxe | Sauvage',
        en: 'Luxury Watch Collection | Sauvage',
        de: 'Luxusuhren-Kollektion | Sauvage',
      }),
      twitterDescription: t({
        fr: 'Découvrez notre collection complète de montres de luxe garanties 1 an.',
        en: 'Browse our full collection of luxury watches with a 1-year warranty.',
        de: 'Entdecken Sie unsere gesamte Luxusuhren-Kollektion mit 1 Jahr Garantie.',
      }),
    },
    brandsIndex: {
      h1: t({
        fr: 'Toutes les marques',
        en: 'All brands',
        de: 'Alle Marken',
      }),
      title: t({
        fr: 'Marques de montres de luxe | Sauvage',
        en: 'Luxury watch brands | Sauvage',
        de: 'Luxusuhren-Marken | Sauvage',
      }),
      metaDescription: t({
        fr: 'Explorez les maisons horlogères présentes dans notre sélection et accédez à chaque collection : pièces authentifiées, garantie un an, expertise Sauvage.',
        en: 'Explore the watchmaking houses in our selection and browse each collection: authenticated pieces, one-year warranty, Sauvage expertise.',
        de: 'Entdecken Sie die Uhrenmanufakturen unserer Auswahl und stöbern Sie in jeder Kollektion: authentifizierte Stücke, ein Jahr Garantie, Sauvage-Expertise.',
      }),
      ogTitle: t({
        fr: 'Marques | Sauvage',
        en: 'Brands | Sauvage',
        de: 'Marken | Sauvage',
      }),
      ogDescription: t({
        fr: 'Une sélection exigeante par marque : parcourez les collections et trouvez votre montre.',
        en: 'A carefully curated selection by brand: browse the collections and find your watch.',
        de: 'Eine sorgfältige Auswahl nach Marke: Durchstöbern Sie die Kollektionen und finden Sie Ihre Uhr.',
      }),
      twitterTitle: t({
        fr: 'Marques | Sauvage',
        en: 'Brands | Sauvage',
        de: 'Marken | Sauvage',
      }),
      twitterDescription: t({
        fr: 'Les grandes maisons et nos collections — montres de luxe authentifiées.',
        en: 'The great houses and our collections — authenticated luxury watches.',
        de: 'Die großen Manufakturen und unsere Kollektionen — authentifizierte Luxusuhren.',
      }),
    },
    brandCollection: {
      title: t({
        fr: '{brand} | Collection | Sauvage',
        en: '{brand} | Collection | Sauvage',
        de: '{brand} | Kollektion | Sauvage',
      }),
      metaDescription: t({
        fr: 'Montres {brand} sélectionnées : filtres par public et budget. Pièces authentifiées et garanties.',
        en: 'Selected {brand} watches: filter by audience and budget. Authenticated pieces under warranty.',
        de: 'Ausgewählte {brand}-Uhren: Filter nach Zielgruppe und Budget. Authentifizierte Stücke mit Garantie.',
      }),
      titleFallback: t({
        fr: 'Collection par marque | Sauvage',
        en: 'Collection by brand | Sauvage',
        de: 'Kollektion nach Marke | Sauvage',
      }),
      metaDescriptionFallback: t({
        fr: 'Montres de luxe par marque — filtres par public et prix.',
        en: 'Luxury watches by brand — filter by audience and price.',
        de: 'Luxusuhren nach Marke — Filter nach Zielgruppe und Preis.',
      }),
    },
    watchDetail: {
      titleFallback: t({
        fr: 'Montre - Sauvage',
        en: 'Watch - Sauvage',
        de: 'Uhr - Sauvage',
      }),
      titlePriceSuffix: ' | Sauvage',
      descriptionFallback: t({
        fr: 'Découvrez cette montre de luxe sur Sauvage',
        en: 'Discover this luxury watch at Sauvage',
        de: 'Entdecken Sie diese Luxusuhr bei Sauvage',
      }),
      structuredDataSellerName: 'Sauvage',
    },
    faq: {
      title: t({
        fr: 'FAQ | Questions fréquentes | Sauvage',
        en: 'FAQ | Frequently asked questions | Sauvage',
        de: 'FAQ | Häufige Fragen | Sauvage',
      }),
      metaDescription: t({
        fr: 'Réponses aux questions les plus fréquentes sur Sauvage : recherche personnalisée, estimation gratuite, collection, garanties et services horlogers.',
        en: 'Answers to the most common questions about Sauvage: personalised sourcing, free valuation, collection, warranties and watchmaking services.',
        de: 'Antworten auf die häufigsten Fragen zu Sauvage: persönliche Suche, kostenlose Schätzung, Kollektion, Garantien und Uhrmacherleistungen.',
      }),
      ogTitle: t({
        fr: 'FAQ | Sauvage Watches',
        en: 'FAQ | Sauvage Watches',
        de: 'FAQ | Sauvage Watches',
      }),
      ogDescription: t({
        fr: 'Estimation, recherche personnalisée, collection et garanties — retrouvez toutes les réponses à vos questions.',
        en: 'Valuation, personalised sourcing, collection and warranties — find all the answers here.',
        de: 'Schätzung, persönliche Suche, Kollektion und Garantien — hier finden Sie alle Antworten.',
      }),
      twitterTitle: t({
        fr: 'FAQ — Sauvage Watches',
        en: 'FAQ — Sauvage Watches',
        de: 'FAQ — Sauvage Watches',
      }),
      twitterDescription: t({
        fr: 'Questions fréquentes sur nos services de montres de luxe, estimation et collection garantie.',
        en: 'Frequently asked questions about our luxury watch services, valuation and warranted collection.',
        de: 'Häufige Fragen zu unseren Luxusuhren-Leistungen, zur Schätzung und zur Kollektion mit Garantie.',
      }),
    },
    aPropos: {
      title: t({
        fr: 'À propos de Sauvage - Votre partenaire de confiance pour les montres de luxe',
        en: 'About Sauvage - Your trusted partner for luxury watches',
        de: 'Über Sauvage - Ihr vertrauensvoller Partner für Luxusuhren',
      }),
      metaDescription: t({
        fr: 'Découvrez Sauvage, une entreprise spécialisée dans le rachat et la vente de montres de luxe. Nous possédons directement notre stock, garantissant authenticité, qualité et disponibilité immédiate.',
        en: 'Discover Sauvage, a company specialising in buying and selling luxury watches. We own our stock outright, which guarantees authenticity, quality and immediate availability.',
        de: 'Lernen Sie Sauvage kennen, ein Unternehmen für An- und Verkauf von Luxusuhren. Unser Bestand gehört uns selbst — das sichert Echtheit, Qualität und sofortige Verfügbarkeit.',
      }),
      ogTitle: t({
        fr: 'À propos de Sauvage - Votre partenaire de confiance',
        en: 'About Sauvage - Your trusted partner',
        de: 'Über Sauvage - Ihr vertrauensvoller Partner',
      }),
      ogDescription: t({
        fr: 'Découvrez Sauvage, une entreprise spécialisée dans le rachat et la vente de montres de luxe. Stock direct, authenticité garantie.',
        en: 'Discover Sauvage, a company specialising in buying and selling luxury watches. Own stock, guaranteed authenticity.',
        de: 'Lernen Sie Sauvage kennen, ein Unternehmen für An- und Verkauf von Luxusuhren. Eigener Bestand, garantierte Echtheit.',
      }),
      twitterTitle: t({
        fr: 'À propos de Sauvage',
        en: 'About Sauvage',
        de: 'Über Sauvage',
      }),
      twitterDescription: t({
        fr: 'Découvrez Sauvage, votre partenaire de confiance pour les montres de luxe.',
        en: 'Discover Sauvage, your trusted partner for luxury watches.',
        de: 'Lernen Sie Sauvage kennen, Ihren vertrauensvollen Partner für Luxusuhren.',
      }),
    },
    politique: {
      title: t({
        fr: 'Politique de confidentialité | Sauvage Watches',
        en: 'Privacy policy | Sauvage Watches',
        de: 'Datenschutzerklärung | Sauvage Watches',
      }),
      metaDescription: t({
        fr: 'Politique de confidentialité de Sauvage Watches : traitements des données, cookies et analytics, formulaires, paiements Stripe, vos droits RGPD.',
        en: 'Sauvage Watches privacy policy: data processing, cookies and analytics, forms, Stripe payments, your GDPR rights.',
        de: 'Datenschutzerklärung von Sauvage Watches: Datenverarbeitung, Cookies und Analytics, Formulare, Stripe-Zahlungen, Ihre DSGVO-Rechte.',
      }),
      ogTitle: t({
        fr: 'Politique de confidentialité | Sauvage Watches',
        en: 'Privacy policy | Sauvage Watches',
        de: 'Datenschutzerklärung | Sauvage Watches',
      }),
      ogDescription: t({
        fr: 'Transparence sur le traitement des données : audience (Google Analytics), formulaires, paiement Stripe, exercice de vos droits.',
        en: 'Transparency on data processing: audience measurement (Google Analytics), forms, Stripe payments, exercising your rights.',
        de: 'Transparenz bei der Datenverarbeitung: Reichweitenmessung (Google Analytics), Formulare, Stripe-Zahlungen, Wahrnehmung Ihrer Rechte.',
      }),
      twitterTitle: t({
        fr: 'Politique de confidentialité | Sauvage Watches',
        en: 'Privacy policy | Sauvage Watches',
        de: 'Datenschutzerklärung | Sauvage Watches',
      }),
      twitterDescription: t({
        fr: 'Traitement des données personnelles, cookies, vos droits et contact RGPD.',
        en: 'Personal data processing, cookies, your rights and GDPR contact.',
        de: 'Verarbeitung personenbezogener Daten, Cookies, Ihre Rechte und DSGVO-Kontakt.',
      }),
    },
    mentions: {
      title: t({
        fr: 'Mentions légales | Sauvage Watches',
        en: 'Legal notice | Sauvage Watches',
        de: 'Impressum | Sauvage Watches',
      }),
      metaDescription: t({
        fr: 'Mentions légales du site Sauvage Watches : éditeur, hébergement, propriété intellectuelle, données personnelles.',
        en: 'Legal notice for the Sauvage Watches site: publisher, hosting, intellectual property, personal data.',
        de: 'Impressum der Website Sauvage Watches: Herausgeber, Hosting, geistiges Eigentum, personenbezogene Daten.',
      }),
      ogTitle: t({
        fr: 'Mentions légales | Sauvage Watches',
        en: 'Legal notice | Sauvage Watches',
        de: 'Impressum | Sauvage Watches',
      }),
      ogDescription: t({
        fr: 'Informations sur l’éditeur du site, l’hébergeur Vercel et le cadre applicable.',
        en: 'Information about the site publisher, the host Vercel and the applicable framework.',
        de: 'Angaben zum Herausgeber der Website, zum Hoster Vercel und zum geltenden Rahmen.',
      }),
      twitterTitle: t({
        fr: 'Mentions légales | Sauvage Watches',
        en: 'Legal notice | Sauvage Watches',
        de: 'Impressum | Sauvage Watches',
      }),
      twitterDescription: t({
        fr: 'Éditeur, publication, hébergement et propriété intellectuelle.',
        en: 'Publisher, publication, hosting and intellectual property.',
        de: 'Herausgeber, Veröffentlichung, Hosting und geistiges Eigentum.',
      }),
    },
    cgu: {
      title: t({
        fr: 'Conditions générales d’utilisation | Sauvage Watches',
        en: 'Terms of use | Sauvage Watches',
        de: 'Nutzungsbedingungen | Sauvage Watches',
      }),
      metaDescription: t({
        fr: 'CGU du site Sauvage Watches : accès, services, commande et paiement, responsabilité, droit applicable.',
        en: 'Sauvage Watches terms of use: access, services, ordering and payment, liability, governing law.',
        de: 'Nutzungsbedingungen von Sauvage Watches: Zugang, Leistungen, Bestellung und Zahlung, Haftung, anwendbares Recht.',
      }),
      ogTitle: t({
        fr: 'Conditions générales d’utilisation | Sauvage Watches',
        en: 'Terms of use | Sauvage Watches',
        de: 'Nutzungsbedingungen | Sauvage Watches',
      }),
      ogDescription: t({
        fr: 'Modalités d’utilisation du site, services proposés, propriété intellectuelle et contact.',
        en: 'Site usage terms, services offered, intellectual property and contact.',
        de: 'Nutzungsmodalitäten der Website, angebotene Leistungen, geistiges Eigentum und Kontakt.',
      }),
      twitterTitle: t({
        fr: 'Conditions générales d’utilisation | Sauvage Watches',
        en: 'Terms of use | Sauvage Watches',
        de: 'Nutzungsbedingungen | Sauvage Watches',
      }),
      twitterDescription: t({
        fr: 'Règles d’accès et d’usage du site Sauvage Watches.',
        en: 'Rules for accessing and using the Sauvage Watches site.',
        de: 'Regeln für Zugang und Nutzung der Website Sauvage Watches.',
      }),
    },
  },
}
