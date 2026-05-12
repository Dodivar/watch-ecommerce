/**
 * Manifest client — Place des Montres (placedesmontres.fr), horlogerie e-commerce à Strasbourg.
 * Données publiques issues du site vitrine (PrestaShop) : contact, adresse magasin, livraison, réseaux.
 * SIRET : placeholder — à remplacer par les mentions légales officielles.
 *
 * FAQ : inline uniquement (pas de faq.config.js) — exigence démo monorepo.
 */
export default {
  siteId: 'place-des-montres',

  faq: {
    enabled: true,
    heading: 'Questions fréquentes',
    subheading:
      'Livraison, retrait magasin, garanties et service client — les informations essentielles pour commander en confiance.',
    items: [
      {
        id: 1,
        question: 'Quelles sont les modalités de livraison en France ?',
        answer:
          'Pour la France métropolitaine, la livraison en <strong>Colissimo suivi</strong> est <strong>offerte à partir de 80&nbsp;€</strong> d’achat. En dessous de ce seuil, les frais de port s’affichent avant validation du panier. Les délais indicatifs communiqués sur le site historique évoquent une expédition sous environ <strong>48&nbsp;h</strong> après réception du paiement — à confirmer dans vos conditions de vente à jour.',
      },
      {
        id: 2,
        question: 'Puis-je retirer ma commande au magasin à Strasbourg ?',
        answer:
          'Le site historique propose un retrait au <strong>Centre commercial Place des Halles</strong> pour les clients situés à Strasbourg, dans le Bas-Rhin ou en Alsace : commande en ligne puis retrait en boutique. Cette démo reproduit l’expérience premium du socle ; le flux <strong>Click&nbsp;& Collect</strong> métier exact (créneaux, préparation) reste à caler avec vos outils de caisse et logistique.',
      },
      {
        id: 3,
        question: 'Comment contacter le service client ?',
        answer:
          'Vous pouvez écrire à <strong>service.client@placedesmontres.fr</strong> ou appeler le <strong>03&nbsp;88&nbsp;22&nbsp;40&nbsp;40</strong> du lundi au samedi, 9h–20h (prix d’un appel local). Ce bandeau de contact est repris des informations publiques du site actuel.',
      },
      {
        id: 4,
        question: 'Les montres sont-elles neuves et couvertes par une garantie ?',
        answer:
          'Place des Montres est un <strong>spécialiste de la montre depuis 1995</strong> avec un large choix en stock. Les modalités précises (garantie constructeur, garantie vendeur, montres neuve / démonstration) doivent figurer sur chaque fiche produit et dans vos <strong>CGV</strong> — ce texte est une reformulation marketing ; validez-le juridiquement avant mise en production.',
      },
      {
        id: 5,
        question: 'Proposez-vous la réparation de montres ?',
        answer:
          'Le site source met en avant la <strong>vente et la réparation toutes marques</strong> dans son titre et sa description. Le présent template e-commerce du monorepo est centré catalogue ; les parcours dédiés « atelier réparation » (devis en ligne, suivi d’intervention) sont listés dans le fichier MISSING_FEATURES.md à la racine du dossier site.',
      },
    ],
  },

  locale: 'fr',

  /**
   * Couleurs alignées sur le thème PrestaShop `themes/placedesmontres/css/global.css` :
   * barre haut / footer `#top_bar`, boutons `.btn_primary` → #7c6300, survol #b39006.
   */
  theme: {
    colors: {
      primary: '#7c6300',
      primaryHover: '#b39006',
      cream: '#f9f7f1',
      cream100: '#f0ebe2',
      cream200: '#e8e0d4',
      cream300: '#dfd5c6',
      textMain: '#2c2412',
    },
  },

  brand: {
    legalName: 'Place des Montres',
    displayName: 'Place des Montres',
    schemaOrgName: 'PlaceDesMontres',
    logoAlt: 'Place des Montres — horlogerie à Strasbourg',
    loginLogoAlt: 'Place des Montres',
  },

  contact: {
    whatsappE164: '+33388224040',
    email: 'service.client@placedesmontres.fr',
    footerAddressHtml:
      'Centre commercial Place des Halles<br />67000 Strasbourg, France',
  },

  storeMap: {
    enabled: true,
    center: { lat: 48.5842, lng: 7.7449 },
    zoom: 16,
    markerLabel: 'Place des Montres — Place des Halles',
  },

  legal: {
    companyName: 'Place des Montres',
    address: 'Centre commercial Place des Halles 67000 Strasbourg',
    siret: '000 000 000 00000',
  },

  urls: {
    production: 'https://www.placedesmontres.fr',
    staging: 'https://recette.placedesmontres.fr',
    development: 'http://localhost:5173',
    previewFallbackHost: 'recette.placedesmontres.fr',
  },

  social: {
    footerTiktokUrl: 'https://www.tiktok.com/',
    suivezNous: {
      instagramUrl: 'https://www.facebook.com/252531501590681',
      instagramHandle: 'Facebook — Place des Montres',
      tiktokUrl: 'https://www.tiktok.com/',
      tiktokHandle: '@placedesmontres',
    },
  },

  copy: {
    footerTagline:
      "Spécialiste de la montre depuis 1995 : vente en ligne et au magasin Place des Halles à Strasbourg, grand choix de marques, livraison Colissimo offerte dès 80 € en France métropolitaine (hors offres ponctuelles). Service client du lundi au samedi, 9h–20h.",
    copyrightLine: '© 2026 Place des Montres. Tous droits réservés.',
    estimationProcessLead:
      "Une question sur un modèle, une taille de bracelet ou une disponibilité ? Notre équipe vous répond par e-mail ou par téléphone avec la même exigence que derrière le comptoir du centre commercial Place des Halles.",
    watchSecurityAuthentic:
      "Nous travaillons avec des montres issues de circuits professionnels. Chaque fiche produit de cette démo reflète les données du catalogue connecté : référence, état annoncé et garanties doivent être validés avant toute campagne commerciale.",
    watchSecurityInsurance:
      "Les colis sont expédiés en Colissimo suivi. Pour toute commande sensible ou livraison à l’international, adaptez vos conditions d’assurance transport et vos partenaires logistiques — le site historique mentionne notamment la Corse et Monaco pour la gratuité à partir du seuil d’achat.",
  },

  brandHero: {},
  brandLogos: {},

  integrations: {
    cookieConsentStorageKey: 'pdm_cookie_consent_v1',
    gaInitFlag: '__pdm_ga_initialized',
    gaPendingWaitersKey: '__pdm_ga_pending_waiters',
    gaDevLogPrefix: '[Place des Montres]',
  },

  maintenance: {
    password: 'dodi',
  },

  features: {
    collection: true,
    blog: true,
    recherche: true,
    estimation: false,
    estimationProcess: false,
    merci: true,
    about: true,
    legal: true,
    faq: true,
    purchase: false,
    paymentReturn: false,
    admin: true,
  },

  collection: {
    pageSize: 12,
    filters: {
      price: true,
      brand: true,
      audience: true,
    },
  },

  home: {
    sections: ['hero', 'nouvelles', 'trust', 'ventes', 'suivezNous', 'services', 'faq'],
  },

  navigation: {
    main: [
      { type: 'link', label: 'Accueil', to: '/' },
      { type: 'link', label: 'Nos montres', to: '/collection', feature: 'collection' },
      {
        type: 'group',
        label: 'Univers',
        items: [
          { label: 'Homme', to: '/collection', feature: 'collection' },
          { label: 'Femme', to: '/collection', feature: 'collection' },
          { label: 'Enfant', to: '/collection', feature: 'collection' },
        ],
      },
      { type: 'link', label: 'Marques', to: '/collection/marques', feature: 'collection' },
      { type: 'link', label: 'Recherche', to: '/recherche', feature: 'recherche' },
      { type: 'link', label: 'Blog', to: '/blog', feature: 'blog' },
      { type: 'link', label: 'À propos', to: '/a-propos', feature: 'about' },
      { type: 'link', label: 'FAQ', to: '/#faq', feature: 'faq' },
      { type: 'link', label: 'Contact', to: '/#contact' },
    ],
    footer: [
      { label: 'Accueil', to: '/#accueil' },
      { label: 'Nos montres', to: '/collection', feature: 'collection' },
      { label: 'Marques', to: '/collection/marques', feature: 'collection' },
      { label: 'Recherche', to: '/recherche', feature: 'recherche' },
      { label: 'Blog', to: '/blog', feature: 'blog' },
      { label: 'À propos', to: '/a-propos', feature: 'about' },
    ],
  },

  backend: {
    cors: {
      extraAllowedOrigins: [],
    },
    email: {
      fromName: 'Place des Montres',
      fromAddress: 'service.client@placedesmontres.fr',
      toAddress: 'service.client@placedesmontres.fr',
      template: {
        logoText: 'PLACE DES MONTRES',
        accentColor: '#7c6300',
      },
    },
    n8n: {
      productionWorkflowUrl: '',
      testWorkflowUrl: '',
    },
  },

  seo: {
    indexHtml: {
      title: 'Place des Montres — Montres à Strasbourg depuis 1995',
      metaDescription:
        "Spécialiste montres à Strasbourg (Place des Halles) : homme, femme, enfant. Large choix, livraison Colissimo offerte dès 80 € en France métropolitaine, service client du lundi au samedi (9h–20h).",
      keywords:
        'montres Strasbourg, Place des Halles, horlogerie, montre homme, femme, enfant, Swiss Made, Colissimo, Place des Montres',
      author: 'Place des Montres',
      ogTitle: 'Place des Montres — Horlogerie & e-commerce',
      ogDescription:
        'Depuis 1995, votre spécialiste montre à Strasbourg : catalogue en ligne, retrait magasin, conseils experts.',
      twitterCard: 'summary_large_image',
      twitterTitle: 'Place des Montres — Strasbourg',
      twitterDescription:
        'Montres pour toute la famille, livraison suivie, équipe joignable du lundi au samedi.',
      ogLocale: 'fr_FR',
      ogSiteName: 'Place des Montres',
      appleMobileWebAppTitle: 'Place des Montres',
      ogImagePath: '/brand-logo.jpg',
    },
    home: {
      title: 'Place des Montres — Montres de marque à Strasbourg & en ligne',
      metaDescription:
        "Plus de 3 000 montres en stock, une trentaine de marques : découvrez l'offre Place des Montres. Retrait au centre commercial Place des Halles ou livraison Colissimo offerte dès 80 € (France métropolitaine).",
      ogTitle: 'Place des Montres — Strasbourg & e-commerce',
      ogDescription:
        'Expert montres depuis 1995 : sélection large, prix transparents, service client réactif.',
      twitterTitle: 'Place des Montres — Accueil',
      twitterDescription:
        'Montres homme, femme, enfant — boutique Place des Halles et boutique en ligne.',
    },
    blog: {
      title: 'Blog Horlogerie | Place des Montres',
      metaDescription:
        "Conseils d'achat, tendances et actu montres par l'équipe Place des Montres à Strasbourg.",
      ogTitle: 'Blog | Place des Montres',
      ogDescription: 'Articles et guides pour bien choisir sa montre.',
      twitterTitle: 'Blog Place des Montres',
      twitterDescription: 'Horlogerie et lifestyle montre.',
      articleFallbackTitle: 'Article - Place des Montres',
      articleTitleBlogSuffix: '| Blog Place des Montres',
      structuredDataPublisherName: 'Place des Montres',
    },
    collection: {
      title: 'Collection montres | Place des Montres',
      metaDescription:
        'Parcourez les montres homme, femme et enfant : filtres par marque, public et budget. Stock mis à jour depuis notre catalogue.',
      ogTitle: 'Collection | Place des Montres',
      ogDescription: 'Montres de marque — Strasbourg et livraison France.',
      twitterTitle: 'Collection Place des Montres',
      twitterDescription: 'Trouvez la montre adaptée à votre style.',
    },
    brandsIndex: {
      h1: 'Toutes les marques',
      title: 'Marques de montres | Place des Montres Strasbourg',
      metaDescription:
        'Découvrez les maisons présentes chez Place des Montres : accès rapide à chaque univers de collection.',
      ogTitle: 'Marques | Place des Montres',
      ogDescription: 'Du grand classique aux montres tendance — sélection expert.',
      twitterTitle: 'Marques | Place des Montres',
      twitterDescription: 'Les marques du moment à Strasbourg.',
    },
    brandCollection: {
      title: '{brand} | Collection | Place des Montres',
      metaDescription:
        'Montres {brand} : filtres par public et budget. Conseils et disponibilité auprès de notre équipe.',
      titleFallback: 'Collection par marque | Place des Montres',
      metaDescriptionFallback: 'Montres par marque — filtres par public et prix.',
    },
    watchDetail: {
      titleFallback: 'Montre - Place des Montres',
      titlePriceSuffix: ' | Place des Montres',
      descriptionFallback: 'Découvrez cette montre chez Place des Montres.',
      structuredDataSellerName: 'Place des Montres',
    },
    aPropos: {
      title: 'À propos — Place des Montres, spécialiste depuis 1995',
      metaDescription:
        "Installée au cœur de Strasbourg (Place des Halles), Place des Montres propose une vaste sélection de montres pour toute la famille, avec l'exigence d'un détaillant historique.",
      ogTitle: 'À propos | Place des Montres',
      ogDescription:
        'Vente, conseils et réparation : notre histoire et nos engagements pour les amateurs de belles montres.',
      twitterTitle: 'À propos Place des Montres',
      twitterDescription: 'Expertise et proximité depuis 1995 à Strasbourg.',
    },
    politique: {
      title: 'Politique de confidentialité | Place des Montres',
      metaDescription:
        'Politique de confidentialité : traitement des données clients, cookies, newsletters et paiements en ligne.',
      ogTitle: 'Confidentialité | Place des Montres',
      ogDescription: 'Vos données et vos droits RGPD.',
      twitterTitle: 'Confidentialité | Place des Montres',
      twitterDescription: 'Protection des données personnelles.',
    },
    mentions: {
      title: 'Mentions légales | Place des Montres',
      metaDescription:
        'Mentions légales du site placedesmontres.fr : éditeur, hébergement, propriété intellectuelle.',
      ogTitle: 'Mentions légales | Place des Montres',
      ogDescription: 'Informations réglementaires sur la boutique en ligne.',
      twitterTitle: 'Mentions légales | Place des Montres',
      twitterDescription: 'Éditeur et cadre juridique.',
    },
    cgu: {
      title: 'Conditions générales de vente | Place des Montres',
      metaDescription:
        'CGV : commande, paiement, livraison, rétractation, garanties légales et contractuelles.',
      ogTitle: 'CGV | Place des Montres',
      ogDescription: 'Modalités de vente à distance et en magasin.',
      twitterTitle: 'CGV | Place des Montres',
      twitterDescription: 'Conditions générales de vente.',
    },
  },
}
