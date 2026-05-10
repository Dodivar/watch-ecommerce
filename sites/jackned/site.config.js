/**
 * Manifest client — Jack'N'Ed (jackned.com), horlogerie-bijouterie à Strasbourg.
 * Données publiques issues du site vitrine : adresse, horaires, contact, texte « À propos ».
 * SIRET : à renseigner depuis les mentions légales officielles du client.
 */
export default {
  siteId: 'jackned',

  locale: 'fr',

  /** Design tokens — palette boutique / cathédrale (neutre luxe) */
  theme: {
    colors: {
      primary: '#3d2914',
      primaryHover: '#52361a',
      cream: '#f7ede0',
      cream100: '#ede4d8',
      cream200: '#e3d9cc',
      cream300: '#d9cec0',
      textMain: '#000000',
    },
  },

  brand: {
    legalName: "Jack'N'Ed",
    displayName: "Jack'N'Ed",
    schemaOrgName: "Jack'N'Ed",
    logoAlt: "Jack'N'Ed — montres à Strasbourg",
    loginLogoAlt: "Jack'N'Ed",
  },

  contact: {
    whatsappE164: '+33390413057',
    email: 'sa@jackned.com',
    footerAddressHtml: '14 Place de la Cathédrale<br />67000 Strasbourg, France',
  },

  /** Carte boutique (Leaflet + OSM) — coordonnées à ajuster au besoin après géocodage précis */
  storeMap: {
    enabled: true,
    center: { lat: 48.58185, lng: 7.74875 },
    zoom: 16,
    markerLabel: "Jack'N'Ed",
  },

  legal: {
    companyName: "Jack'N'Ed",
    address: '14 Place de la Cathédrale 67000 Strasbourg',
    siret: '000 000 000 00000',
  },

  urls: {
    production: 'https://www.jackned.com',
    staging: 'https://recette.jackned.com',
    development: 'http://localhost:5173',
    previewFallbackHost: 'recette.jackned.com',
  },

  social: {
    footerTiktokUrl: 'https://www.tiktok.com/',
    suivezNous: {
      instagramUrl: 'https://www.instagram.com/',
      instagramHandle: '@jackned',
      tiktokUrl: 'https://www.tiktok.com/',
      tiktokHandle: '@jackned',
    },
  },

  copy: {
    footerTagline:
      "Au pied de la cathédrale de Strasbourg, une entreprise familiale : montres et bijoux, conseils, service après-vente (réparations, piles). Ouvert du lundi au samedi, 10h–19h.",
    copyrightLine: "© 2026 Jack'N'Ed. Tous droits réservés.",
    estimationProcessLead:
      "Chez Jack'N'Ed, nous accordons une importance particulière à l'accueil et à la transparence pour vous accompagner dans votre choix.",
    watchSecurityAuthentic:
      "Les montres et bijoux proposés sont sélectionnés avec soin. Pour toute question sur un achat ou un service, notre équipe est à votre disposition en boutique ou par contact.",
    watchSecurityInsurance:
      "Nous vous informons sur les garanties et services associés à votre achat. Pour les modalités précises, adressez-vous à notre équipe en magasin.",
  },

  /** Bandeaux /collection/marque/:slug — clés = libellé exact du champ `brand` en base. */
  brandHero: {},

  /**
   * Logos couleur — grille /collection/marques (clés = libellé exact `brand` en base).
   * Ex. : 'Rolex': { image: '/brands/rolex/logo.png', alt: 'Rolex' }
   */
  brandLogos: {},

  integrations: {
    cookieConsentStorageKey: 'jackned_cookie_consent_v1',
    gaInitFlag: '__jackned_ga_initialized',
    gaPendingWaitersKey: '__jackned_ga_pending_waiters',
    gaDevLogPrefix: "[Jack'N'Ed]",
  },

  maintenance: {
    password: 'dodi',
  },

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
  },

  collection: {
    filters: {
      price: true,
      brand: true,
      audience: true,
    },
  },

  backend: {
    cors: {
      extraAllowedOrigins: [],
    },
    email: {
      template: {},
    },
    n8n: {
      productionWorkflowUrl: '',
      testWorkflowUrl: '',
    },
  },

  seo: {
    indexHtml: {
      title: "Jack'N'Ed — Montres et horlogerie à Strasbourg",
      metaDescription:
        "Horlogerie-bijouterie au 14 place de la Cathédrale à Strasbourg. Large choix de marques, conseils, service après-vente. Ouvert du lundi au samedi 10h–19h.",
      keywords:
        'montres Strasbourg, horlogerie Strasbourg, bijouterie cathédrale, Jackned, Jack N Ed, réparation montre, pile montre',
      author: "Jack'N'Ed",
      ogTitle: "Jack'N'Ed — Montres à Strasbourg",
      ogDescription:
        'Boutique familiale au pied de la cathédrale : montres, bijoux et service après-vente.',
      twitterCard: 'summary_large_image',
      twitterTitle: "Jack'N'Ed — Montres à Strasbourg",
      twitterDescription:
        'Horlogerie-bijouterie à Strasbourg — conseils, garanties et SAV.',
      ogLocale: 'fr_FR',
      ogSiteName: "Jack'N'Ed",
      appleMobileWebAppTitle: "Jack'N'Ed",
      ogImagePath: '/logo500x500.png',
    },
    home: {
      title: "Jack'N'Ed — Horlogerie & montres à Strasbourg | Place de la Cathédrale",
      metaDescription:
        "Découvrez Jack'N'Ed : montres et bijoux au cœur de Strasbourg, vue sur la cathédrale. Entreprise familiale, personnel accueillant, SAV sur place.",
      ogTitle: "Jack'N'Ed — Horlogerie à Strasbourg",
      ogDescription:
        'Large choix de marques, garanties, réparations et changements de piles.',
      twitterTitle: "Jack'N'Ed — Montres Strasbourg",
      twitterDescription: 'Boutique familiale place de la Cathédrale. Lun–Sam 10h–19h.',
    },
    blog: {
      title: "Blog Horlogerie | Jack'N'Ed Strasbourg",
      metaDescription:
        "Articles et actualités autour des montres et de l'horlogerie, par l'équipe Jack'N'Ed.",
      ogTitle: "Blog | Jack'N'Ed",
      ogDescription: 'Horlogerie et conseils depuis Strasbourg.',
      twitterTitle: "Blog Jack'N'Ed",
      twitterDescription: 'Montres, bijoux et expertise.',
      articleFallbackTitle: "Article - Jack'N'Ed",
      articleTitleBlogSuffix: "| Blog Jack'N'Ed",
      structuredDataPublisherName: "Jack'N'Ed",
    },
    collection: {
      title: "Collection montres & bijoux | Jack'N'Ed Strasbourg",
      metaDescription:
        'Parcourez la sélection : montres et créations pour tous les styles. Retrait et conseils en boutique.',
      ogTitle: "Collection | Jack'N'Ed",
      ogDescription: "Montres et bijoux — Jack'N'Ed, Strasbourg.",
      twitterTitle: "Collection Jack'N'Ed",
      twitterDescription: 'Découvrez nos montres et bijoux.',
    },
    brandsIndex: {
      h1: 'Toutes les marques',
      title: "Marques de montres | Jack'N'Ed Strasbourg",
      metaDescription:
        'Retrouvez les marques représentées chez Jack’N’Ed et accédez à chaque collection : filtres par public et budget, conseils en boutique.',
      ogTitle: "Marques | Jack'N'Ed",
      ogDescription:
        'Découvrez les marques disponibles et parcourez les collections au pied de la cathédrale de Strasbourg.',
      twitterTitle: "Marques | Jack'N'Ed",
      twitterDescription:
        'Les marques du moment — collections et disponibilité à Strasbourg.',
    },
    brandCollection: {
      title: "{brand} | Collection | Jack'N'Ed",
      metaDescription:
        'Montres {brand} : filtres par public et budget. Conseils et retrait en boutique à Strasbourg.',
      titleFallback: "Collection par marque | Jack'N'Ed",
      metaDescriptionFallback: 'Montres par marque — filtres par public et prix.',
    },
    watchDetail: {
      titleFallback: "Montre - Jack'N'Ed",
      titlePriceSuffix: " | Jack'N'Ed",
      descriptionFallback: "Découvrez cette montre chez Jack'N'Ed.",
      structuredDataSellerName: "Jack'N'Ed",
    },
    aPropos: {
      title: "À propos de Jack'N'Ed — Horlogerie familiale à Strasbourg",
      metaDescription:
        "Située au cœur historique de Strasbourg, au pied de la cathédrale, Jack'N'Ed est une entreprise familiale : montres, bijoux, garanties et service après-vente.",
      ogTitle: "À propos | Jack'N'Ed",
      ogDescription:
        'Vue sur la cathédrale, équipe qualifiée, réparations et piles — du lundi au samedi.',
      twitterTitle: "À propos Jack'N'Ed",
      twitterDescription: 'Une boutique familiale au pied de la cathédrale.',
    },
    politique: {
      title: "Politique de confidentialité | Jack'N'Ed",
      metaDescription:
        "Politique de confidentialité Jack'N'Ed : données personnelles, cookies, formulaires et vos droits RGPD.",
      ogTitle: "Politique de confidentialité | Jack'N'Ed",
      ogDescription: 'Traitement des données et exercice de vos droits.',
      twitterTitle: "Confidentialité | Jack'N'Ed",
      twitterDescription: 'RGPD et protection des données.',
    },
    mentions: {
      title: "Mentions légales | Jack'N'Ed",
      metaDescription:
        "Mentions légales du site Jack'N'Ed : éditeur, hébergement, propriété intellectuelle.",
      ogTitle: "Mentions légales | Jack'N'Ed",
      ogDescription: 'Informations légales sur le site jackned.com.',
      twitterTitle: "Mentions légales | Jack'N'Ed",
      twitterDescription: 'Éditeur et cadre juridique.',
    },
    cgu: {
      title: "Conditions générales d'utilisation | Jack'N'Ed",
      metaDescription:
        "CGU du site Jack'N'Ed : accès aux services, commandes, responsabilités.",
      ogTitle: "CGU | Jack'N'Ed",
      ogDescription: "Modalités d'utilisation du site.",
      twitterTitle: "CGU | Jack'N'Ed",
      twitterDescription: "Règles d'accès et d'usage.",
    },
  },
}
