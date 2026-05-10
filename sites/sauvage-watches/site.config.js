/**
 * First-site manifest: current production storefront (Sauvage).
 * Template extraction — all brand-specific defaults for `sites/sauvage-watches` live here.
 */
export default {
  siteId: 'sauvage-watches',

  locale: 'fr',

  /** Design tokens → CSS variables via vite/site-from-config.mjs + Tailwind theme.extend */
  theme: {
    colors: {
      primary: '#0f2a1d',
      primaryHover: '#163d2a',
      cream: '#f7ede0',
      cream100: '#ede4d8',
      cream200: '#e3d9cc',
      cream300: '#d9cec0',
      textMain: '#000000',
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
    footerAddressHtml: '32 All. de la Robertsau<br />67000 Strasbourg, France',
  },

  storeMap: {
    enabled: true,
    center: { lat: 48.5946, lng: 7.7769 },
    zoom: 16,
    markerLabel: 'Sauvage Watches',
  },

  legal: {
    companyName: 'Sauvage Watches',
    address: '32 Allée de la Robertsau 67000 Strasbourg',
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
    copyrightLine: '© 2025 Sauvage. Tous droits réservés.',
    estimationProcessLead:
      'Chez Sauvage, nous croyons que la transparence est la clé de la confiance.',
    watchSecurityAuthentic:
      "Toutes les montres vendues sur Sauvage sont authentiques. Chaque montre est vérifiée par nos experts avant la mise en vente. Si vous avez le moindre doute sur l'authenticité de votre montre, contactez-nous dans les 14 jours suivant la réception pour un remboursement complet.",
    watchSecurityInsurance:
      "Chaque montre vendue est assurée pour sa valeur totale par Sauvage. Cela garantit qu'il n'y a aucun risque pour l'acheteur, même en cas de résidence à l'étranger. Votre montre est protégée de bout en bout.",
  },

  /** Mot de passe page « site en construction » (voir `Maintenance.vue`). */
  maintenance: {
    password: '@sauvagE2025!',
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
  },

  /**
   * Menu principal (header) et liens colonne « Navigation » du footer.
   * Les clés absentes du bloc `features` héritent des défauts du socle (voir siteFeatures.js).
   */
  navigation: {
    main: [
      { type: 'link', label: 'Accueil', to: '/' },
      { type: 'link', label: 'Nos montres', to: '/collection', feature: 'collection' },
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
      { type: 'link', label: 'FAQ', to: '/#faq' },
      { type: 'link', label: 'Contact', to: '/#contact' },
    ],
    footer: [
      { label: 'Accueil', to: '/#accueil' },
      { label: 'Nos montres', to: '/collection', feature: 'collection' },
      { label: 'Recherche personnalisée', to: '/recherche', feature: 'recherche' },
      { label: 'Estimation', to: '/estimation', feature: 'estimation' },
      { label: 'Blog', to: '/blog', feature: 'blog' },
      { label: 'À propos', to: '/a-propos', feature: 'about' },
    ],
  },

  /**
   * Configuration du backend Render multi-tenant.
   * Les défauts non spécifiés sont calculés à partir de `brand`, `contact`, `urls` et `theme.colors`
   * dans `backend/sites/normalize.js`. Les secrets restent dans les variables d'environnement
   * `SITE_<UPPER_SITE_ID>__<KEY>` (voir `backend/sites/secrets.js`).
   */
  backend: {
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
      toAddress: 'contact@sauvage-watches.fr',
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
    watchDetail: {
      titleFallback: 'Montre - Sauvage',
      titlePriceSuffix: ' | Sauvage',
      descriptionFallback: 'Découvrez cette montre de luxe sur Sauvage',
      structuredDataSellerName: 'Sauvage',
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
