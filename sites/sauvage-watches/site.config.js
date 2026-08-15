/**
 * First-site manifest: current production storefront (Sauvage).
 * Template extraction — all brand-specific defaults for `sites/sauvage-watches` live here.
 */
import faq from './faq.config.js'

export default {
  siteId: 'sauvage-watches',

  faq,

  locale: 'fr',

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
      daysLabel: 'Lundi – samedi',
      hoursLabel: 'Sur rendez-vous',
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
    production: 'https://sauvage-watches.fr',
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
    footerTagline:
      "Votre partenaire pour l'achat et la mise à disposition de montres de luxe authentifiées. Recherche personnalisée, estimation rapide, transparence garantie.",
    /** Footer legal line (verbatim for template parity). */
    copyrightLine: '© 2026 Sauvage Watches. Tous droits réservés.',
    estimationProcessLead:
      'Chez Sauvage, nous croyons que la transparence est la clé de la confiance.',
    watchSecurityAuthentic:
      "Toutes les montres vendues sur Sauvage sont authentiques. Chaque montre est vérifiée par nos experts avant la mise en vente. Si vous avez le moindre doute sur l'authenticité de votre montre, contactez-nous dans les 14 jours suivant la réception pour un remboursement complet.",
    watchSecurityInsurance:
      "Chaque montre vendue est assurée pour sa valeur totale par Sauvage. Cela garantit qu'il n'y a aucun risque pour l'acheteur, même en cas de résidence à l'étranger. Votre montre est protégée de bout en bout.",
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
          label: 'Livraison assurée à domicile',
          countries: ['FR', 'MC', 'BE', 'CH', 'LU'],
          fee: { type: 'flat', amount: 0 },
          estimatedDays: 'Sous 5 à 10 jours ouvrés après validation du paiement',
        },
        {
          id: 'pickup_robertsau',
          type: 'pickup',
          label: 'Retrait en boutique — Robertsau',
          fee: { type: 'flat', amount: 0 },
          estimatedDays: 'Prêt en boutique sous 48 h après validation du paiement',
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
      eyebrow: 'Revendeur horloger — Strasbourg',
      title: 'Des montres authentifiées, choisies une par une.',
      subtitle:
        'Nous achetons, vérifions et détenons nos montres. Chaque pièce est contrôlée par nos experts, garantie un an et disponible immédiatement.',
      primaryCta: { label: 'Voir les montres en stock', to: '/collection' },
      secondaryCta: { label: 'Recherche personnalisée', to: '/recherche' },
      /** Trois points de réassurance maximum : le variant `vitrine` leur associe une icône. */
      highlights: [
        'Authenticité vérifiée par nos experts',
        'Garantie un an sur chaque montre',
        'Boutique à Strasbourg, sur rendez-vous',
      ],
    },
    nouvelles: {
      title: 'Nouvelles arrivées',
      // subtitle: 'Découvrez nos dernières pièces ajoutées à notre sélection',
    },
    sections: [
      'hero',
      'nouvelles',
      'trust',
      'ventes',
      'suivezNous',
      'services',
      'faq',
    ],
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
      { type: 'link', label: 'Nos montres', to: '/collection', feature: 'collection' },
      { type: 'link', label: 'Nos ventes', to: '/ventes', feature: 'soldArchive' },
      {
        type: 'group',
        label: 'Nos services',
        items: [
          { label: 'Recherche personnalisée', to: '/recherche', feature: 'recherche' },
          { label: 'Estimation', to: '/estimation', feature: 'estimation' },
        ],
      },
      { type: 'link', label: 'Blog', to: '/blog', feature: 'blog' },
      { type: 'link', label: 'À propos', to: '/a-propos', feature: 'about' },
      { type: 'link', label: 'FAQ', to: '/faq', feature: 'faq' },
      { type: 'link', label: 'Contact', to: '/contact', feature: 'contact' },
    ],
    footer: [
      { label: 'Accueil', to: '/#accueil' },
      { label: 'Nos montres', to: '/collection', feature: 'collection' },
      { label: 'Nos ventes', to: '/ventes', feature: 'soldArchive' },
      { label: 'Recherche personnalisée', to: '/recherche', feature: 'recherche' },
      { label: 'Estimation', to: '/estimation', feature: 'estimation' },
      { label: 'Blog', to: '/blog', feature: 'blog' },
      { label: 'À propos', to: '/a-propos', feature: 'about' },
      { label: 'Contact', to: '/contact', feature: 'contact' },
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
    'Oméga': { image: '/brands/omega/omega-brand.jpg', alt: 'Bracelet à maillons d’argent Montre analogique ronde' } 
  },

  /**
   * Logos couleur — grille /collection/marques (clés = libellé exact `brand` en base).
   * Si absent, la tuile utilise l’image `brandHero` ou un libellé texte.
   */
  brandLogos: {},

  seo: {
    /** Static shell before Vue hydrates @vueuse/head (fallback / crawlers). */
    indexHtml: {
      title: 'Sauvage - Montres de luxe',
      metaDescription:
        'Sauvage - Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite. Rolex, Breitling, Tag Heuer, Cartier et plus.',
      keywords:
        'recherche personnalisée de montre, rachat montre, montre de luxe, montre occasion, Rolex, Breitling, Tag Heuer, Cartier, montre garantie',
      author: 'Sauvage',
      ogTitle: 'Sauvage - Montres de luxe',
      ogDescription:
        'Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite.',
      twitterCard: 'summary_large_image',
      twitterTitle: 'Sauvage - Montres de luxe',
      twitterDescription:
        'Expert en services de montres de luxe. Collection de montres garanties 1 an, estimation gratuite.',
      ogLocale: 'fr_FR',
      ogSiteName: 'Sauvage',
      appleMobileWebAppTitle: 'Sauvage Watches',
      ogImagePath: '/logo500x500.png',
    },
    home: {
      title: 'Sauvage - Rachat de Montres de Luxe | Collection Garantie',
      metaDescription:
        'Découvrez notre collection de montres de luxe garanties 1 an. Rolex, Breitling, Tag Heuer, Cartier et plus. Estimation gratuite, recherche personnalisée et accompagnement expert.',
      ogTitle: 'Sauvage - Rachat de Montres de Luxe | Collection Garantie',
      ogDescription:
        'Découvrez notre collection de montres de luxe garanties 1 an. Estimation gratuite, recherche personnalisée et accompagnement expert.',
      twitterTitle: 'Sauvage - Rachat de Montres de Luxe',
      twitterDescription:
        'Découvrez notre collection de montres de luxe garanties 1 an. Estimation gratuite, recherche personnalisée.',
    },
    blog: {
      title: 'Blog Horlogerie | Articles sur les Montres | Sauvage',
      metaDescription:
        "Découvrez nos articles sur les montres et l'horlogerie. Guides, actualités, conseils d'achat et expertise sur les montres de luxe.",
      ogTitle: 'Blog Horlogerie | Articles sur les Montres | Sauvage',
      ogDescription:
        "Découvrez nos articles sur les montres et l'horlogerie. Guides, actualités et conseils d'achat.",
      twitterTitle: 'Blog Horlogerie | Sauvage',
      twitterDescription: "Découvrez nos articles sur les montres et l'horlogerie.",
      articleFallbackTitle: 'Article - Sauvage',
      articleTitleBlogSuffix: '| Blog Sauvage',
      structuredDataPublisherName: 'Sauvage',
    },
    collection: {
      title: 'Collection de Montres de Luxe | Sauvage',
      metaDescription:
        'Découvrez notre collection complète de montres de luxe. Rolex, Breitling, Tag Heuer, Cartier et plus. Toutes nos montres sont garanties 1 an et authentifiées.',
      ogTitle: 'Collection de Montres de Luxe | Sauvage',
      ogDescription:
        'Découvrez notre collection complète de montres de luxe garanties 1 an et authentifiées.',
      twitterTitle: 'Collection de Montres de Luxe | Sauvage',
      twitterDescription:
        'Découvrez notre collection complète de montres de luxe garanties 1 an.',
    },
    brandsIndex: {
      h1: 'Toutes les marques',
      title: 'Marques de montres de luxe | Sauvage',
      metaDescription:
        'Explorez les maisons horlogères présentes dans notre sélection et accédez à chaque collection : pièces authentifiées, garantie un an, expertise Sauvage.',
      ogTitle: 'Marques | Sauvage',
      ogDescription:
        'Une sélection exigeante par marque : parcourez les collections et trouvez votre montre.',
      twitterTitle: 'Marques | Sauvage',
      twitterDescription:
        'Les grandes maisons et nos collections — montres de luxe authentifiées.',
    },
    brandCollection: {
      title: '{brand} | Collection | Sauvage',
      metaDescription:
        'Montres {brand} sélectionnées : filtres par public et budget. Pièces authentifiées et garanties.',
      titleFallback: 'Collection par marque | Sauvage',
      metaDescriptionFallback: 'Montres de luxe par marque — filtres par public et prix.',
    },
    watchDetail: {
      titleFallback: 'Montre - Sauvage',
      titlePriceSuffix: ' | Sauvage',
      descriptionFallback: 'Découvrez cette montre de luxe sur Sauvage',
      structuredDataSellerName: 'Sauvage',
    },
    faq: {
      title: 'FAQ | Questions fréquentes | Sauvage',
      metaDescription:
        'Réponses aux questions les plus fréquentes sur Sauvage : recherche personnalisée, estimation gratuite, collection, garanties et services horlogers.',
      ogTitle: 'FAQ | Sauvage Watches',
      ogDescription:
        'Estimation, recherche personnalisée, collection et garanties — retrouvez toutes les réponses à vos questions.',
      twitterTitle: 'FAQ — Sauvage Watches',
      twitterDescription:
        'Questions fréquentes sur nos services de montres de luxe, estimation et collection garantie.',
    },
    aPropos: {
      title: 'À propos de Sauvage - Votre partenaire de confiance pour les montres de luxe',
      metaDescription:
        'Découvrez Sauvage, une entreprise spécialisée dans le rachat et la vente de montres de luxe. Nous possédons directement notre stock, garantissant authenticité, qualité et disponibilité immédiate.',
      ogTitle: 'À propos de Sauvage - Votre partenaire de confiance',
      ogDescription:
        'Découvrez Sauvage, une entreprise spécialisée dans le rachat et la vente de montres de luxe. Stock direct, authenticité garantie.',
      twitterTitle: 'À propos de Sauvage',
      twitterDescription:
        'Découvrez Sauvage, votre partenaire de confiance pour les montres de luxe.',
    },
    politique: {
      title: 'Politique de confidentialité | Sauvage Watches',
      metaDescription:
        'Politique de confidentialité de Sauvage Watches : traitements des données, cookies et analytics, formulaires, paiements Stripe, vos droits RGPD.',
      ogTitle: 'Politique de confidentialité | Sauvage Watches',
      ogDescription:
        'Transparence sur le traitement des données : audience (Google Analytics), formulaires, paiement Stripe, exercice de vos droits.',
      twitterTitle: 'Politique de confidentialité | Sauvage Watches',
      twitterDescription:
        'Traitement des données personnelles, cookies, vos droits et contact RGPD.',
    },
    mentions: {
      title: 'Mentions légales | Sauvage Watches',
      metaDescription:
        'Mentions légales du site Sauvage Watches : éditeur, hébergement, propriété intellectuelle, données personnelles.',
      ogTitle: 'Mentions légales | Sauvage Watches',
      ogDescription:
        'Informations sur l’éditeur du site, l’hébergeur Vercel et le cadre applicable.',
      twitterTitle: 'Mentions légales | Sauvage Watches',
      twitterDescription: 'Éditeur, publication, hébergement et propriété intellectuelle.',
    },
    cgu: {
      title: 'Conditions générales d’utilisation | Sauvage Watches',
      metaDescription:
        'CGU du site Sauvage Watches : accès, services, commande et paiement, responsabilité, droit applicable.',
      ogTitle: 'Conditions générales d’utilisation | Sauvage Watches',
      ogDescription:
        'Modalités d’utilisation du site, services proposés, propriété intellectuelle et contact.',
      twitterTitle: 'Conditions générales d’utilisation | Sauvage Watches',
      twitterDescription: 'Règles d’accès et d’usage du site Sauvage Watches.',
    },
  },
}
