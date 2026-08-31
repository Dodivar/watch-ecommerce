/**
 * Manifest client — Jack'N'Ed (jackned.com), horlogerie-bijouterie à Strasbourg.
 * Données publiques issues du site vitrine : adresse, horaires, contact, texte « À propos ».
 * SIRET : à renseigner depuis les mentions légales officielles du client.
 *
 * Site monolingue : pas de bloc `i18n`, donc pas de `t({ fr, en, de })` — les chaînes
 * françaises simples suffisent (voir AGENTS.md).
 */
import faq from './faq.config.js'

export default {
  siteId: 'jackned',

  faq,

  locale: 'fr',

  /**
   * Design tokens repris du site actuel jackned.com : fond blanc, boutons noirs,
   * bandes gris très clair, aucun accent coloré, coins droits.
   */
  theme: {
    colors: {
      primary: '#111111',
      primaryHover: '#3d3d3d',
      cream: '#f7f7f7',
      cream100: '#ececec',
      cream200: '#e0e0e0',
      cream300: '#d1d1d1',
      textMain: '#1e1a1a',
    },
    /** Coins droits sur cartes/boutons/champs ; cercles (`rounded-full`) conservés. */
    radius: 'sharp',
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
    phoneDisplay: '03 90 41 30 57',
    phoneE164: '+33390413057',
    email: 'sa@jackned.com',
    footerAddressHtml: '14 Place de la Cathédrale<br />67000 Strasbourg, France',
  },

  /** Carte boutique — coordonnées à ajuster au besoin après géocodage précis */
  storeMap: {
    enabled: true,
    provider: 'google',
    /** Bonhomme Street View (vue 360°) — facturation Google « Dynamic Street View » si utilisé */
    streetViewControl: true,
    center: { lat: 48.58185, lng: 7.74875 },
    zoom: 16,
    markerLabel: "Jack'N'Ed — Place de la Cathédrale",
    /** Logo bulle carte : à activer une fois `public/brand-logo.jpg` fourni par le client. */
    // popupLogoSrc: publicPath('brand-logo.jpg'),
    directionsAddress: '14 Place de la Cathédrale, 67000 Strasbourg, France',
    openingHours: {
      daysLabel: 'Lundi – samedi',
      hoursLabel: '10h – 19h',
    },
  },

  legal: {
    companyName: "Jack'N'Ed",
    address: '14 Place de la Cathédrale 67000 Strasbourg',
    /** TODO client : SIRET réel à reprendre des mentions légales officielles. */
    siret: '000 000 000 00000',
  },

  urls: {
    production: 'https://www.jackned.com',
    staging: 'https://recette.jackned.com',
    development: 'http://localhost:5173',
    previewFallbackHost: 'recette.jackned.com',
  },

  /**
   * Seule la page Facebook du client est confirmée. Instagram et TikTok étaient des URLs
   * racines génériques (liens morts) : retirés en attendant les comptes réels.
   */
  social: {
    suivezNous: {
      facebookUrl: 'https://www.facebook.com/JacknedWatchesJewelryForAll/',
      facebookHandle: "Jack'N'Ed",
    },
  },

  about: {
    variant: 'retail',
    hero: {
      eyebrow: 'Qui sommes-nous ?',
      title: "Jack'N'Ed",
      lead: "Située au cœur historique de Strasbourg, au pied de la cathédrale, notre boutique offre aux Strasbourgeois comme aux visiteurs de passage une vue imprenable sur cette splendeur architecturale — et un large choix de montres à essayer au poignet.",
      /**
       * Photo de devanture à ajouter dans `public/places/` : renseigner alors `image`
       * (+ `imageAlt`, `imageCaption`, `imageLayout: 'landscape'`). Sans elle, le hero
       * passe automatiquement sur une seule colonne.
       */
    },
    stats: [
      {
        value: '20+',
        label: 'Marques proposées',
        detail: 'Du quotidien accessible au Swiss Made',
      },
      {
        value: 'Lun–Sam',
        label: '10h – 19h',
        detail: 'Six jours sur sept, sans rendez-vous',
      },
      {
        value: '1',
        label: 'Adresse à Strasbourg',
        detail: '14 place de la Cathédrale',
      },
      {
        value: 'SAV',
        label: 'Sur place',
        detail: 'Réparations, piles et bracelets',
      },
    ],
    story: {
      title: 'Une entreprise familiale au pied de la cathédrale',
      paragraphs: [
        "Jack'N'Ed est avant tout une entreprise familiale, au plus proche de sa clientèle et à l'écoute des attentes et des besoins de chacun. Ouverte du lundi au samedi de 10h à 19h, la boutique se visite sans rendez-vous, que vous cherchiez une première montre, un cadeau ou simplement un conseil.",
        "Les marques que nous proposons offrent un large choix : il y en a pour tous les goûts et pour tous les budgets. Les montres et les bijoux sont garantis, et nous assurons un service après-vente de qualité — réparations, révisions et changements de piles.",
        "Un personnel qualifié et accueillant est là pour vous guider dans vos choix : essayer plusieurs modèles au poignet, comparer les tailles de boîtier, ajuster un bracelet, comprendre ce que change un mouvement automatique. C'est ce dialogue, plus que le catalogue, qui fait la différence.",
      ],
      pullQuote:
        "Pousser notre porte, c'est prendre le temps d'essayer, de comparer et de repartir avec la montre qui vous ressemble.",
    },
    styles: [
      {
        title: 'Sport & quotidien',
        description:
          'Chronographes, montres résistantes, modèles robustes au quotidien : pour le bureau, le week-end ou le grand air.',
        icon: 'sport',
      },
      {
        title: 'Élégance intemporelle',
        description:
          'Cadrans sobres, finitions soignées, bracelets cuir ou acier : la montre qui accompagne une tenue et traverse les saisons.',
        icon: 'elegance',
      },
      {
        title: 'Mécanique vivante',
        description:
          'Pour les amateurs de belles mécaniques : montres automatiques, parfois à fond transparent, pour admirer les rouages en mouvement.',
        icon: 'mechanics',
      },
    ],
    brands: {
      title: 'Une vingtaine de marques, un seul standard',
      intro:
        'Tissot, Hamilton, Seiko, Certina, Citizen, Orient, Herbelin, Lip, Yema, Victorinox, Briston, Squale, Zeppelin, Pierre Lannier, Festina, Maserati, Casio, G-Shock… nous sélectionnons des maisons reconnues pour leur qualité et leur diversité.',
      names: [
        'Tissot',
        'Hamilton',
        'Seiko',
        'Certina',
        'Citizen',
        'Orient',
        'Orient Star',
        'Herbelin',
        'Lip',
        'Yema',
        'Victorinox',
        'Wenger',
        'Briston',
        'Squale',
        'Zeppelin',
        'Pierre Lannier',
        'Festina',
        'Maserati',
        'Casio',
        'G-Shock',
      ],
    },
    experience: {
      title: "L'expérience Jack'N'Ed",
      items: [
        {
          title: 'Conseil de proximité',
          description:
            'Essayer au poignet, comparer les modèles, poser toutes vos questions : notre équipe vous accueille du lundi au samedi, sans rendez-vous.',
        },
        {
          title: 'Boutique & e-commerce',
          description:
            'Commandez en ligne ou passez nous voir place de la Cathédrale : retrait gratuit en boutique, ou livraison suivie et assurée à domicile.',
        },
        {
          title: 'Service après-vente sur place',
          description:
            "Changement de pile, remise en état, ajustement et remplacement de bracelet : nous intervenons directement en boutique, y compris sur les montres achetées ailleurs.",
        },
      ],
    },
    cta: {
      title: 'Prêt à trouver votre montre ?',
      subtitle:
        'Parcourez la collection en ligne ou venez nous rencontrer au 14 place de la Cathédrale — nous vous accueillons du lundi au samedi, de 10h à 19h.',
      collectionLabel: 'Découvrir nos montres',
      contactLabel: 'Nous contacter',
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

  /** Bandeaux hero — une seule marque sélectionnée sur /collection ; clés = libellé exact du champ `brand` en base. */
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
    metaPixelInitFlag: '__jackned_meta_pixel_initialized',
  },

  maintenance: {
    password: 'dodi',
  },

  /**
   * Boutique retail : ni recherche personnalisée ni estimation/reprise (notions revente).
   * Blog coupé tant qu'aucun article n'est rédigé.
   * `faq` n'est pas déclaré ici : `resolveSiteConfig` le dérive de `faq.enabled` + `faq.items`.
   */
  features: {
    collection: true,
    blog: false,
    recherche: false,
    estimation: false,
    estimationProcess: false,
    merci: true,
    about: true,
    legal: true,
    purchase: true,
    paymentReturn: true,
    admin: true,
    adminWatchPromotions: true,
  },
  watchCatalog: {
    mode: 'retail',
    trustHighlights: [
      {
        id: 'experience',
        icon: 'store',
        text: "Entreprise familiale au cœur de Strasbourg — Place de la Cathédrale, du lundi au samedi.",
      },
      {
        id: 'guarantee',
        icon: 'guarantee',
        source: 'watch.guarantee',
        label: 'Garantie',
      },
      {
        id: 'payment',
        icon: 'payment',
        text: 'Règlement en ligne protégé via Stripe.',
      },
      {
        id: 'pickup',
        icon: 'pickup',
        text: "Commande en ligne, retrait en boutique Jack'N'Ed.",
      },
    ],
    guarantees: {
      heading: 'Nos garanties et services',
      items: [
        {
          id: 'experience',
          icon: 'store',
          title: 'Entreprise familiale',
          text: "Au pied de la cathédrale de Strasbourg, Jack'N'Ed vous accueille du lundi au samedi, 10h–19h, avec le même soin qu'en boutique depuis des générations.",
        },
        {
          id: 'guarantee',
          icon: 'guarantee',
          title: 'Garanties et SAV',
          text: "Nous vous informons sur les garanties et services associés à votre achat. Pour les modalités précises, adressez-vous à notre équipe en magasin.",
        },
        {
          id: 'sav',
          icon: 'shield',
          title: 'Service après-vente sur place',
          text: 'Réparations, changements de piles, bracelets et entretien : notre équipe intervient directement en boutique pour prolonger la vie de votre montre.',
        },
        {
          id: 'payment',
          icon: 'payment',
          title: 'Paiement sécurisé',
          text: 'Règlement en ligne protégé via Stripe. Aucune information bancaire n\'est stockée sur nos serveurs.',
        },
        {
          id: 'pickup',
          icon: 'pickup',
          title: 'Retrait en boutique',
          text: "Commandez en ligne et retirez votre montre au 14 place de la Cathédrale, au cœur de Strasbourg.",
        },
      ],
    },
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
          id: 'colissimo_home',
          type: 'home',
          label: 'Livraison à domicile',
          countries: ['FR', 'MC', 'BE', 'CH', 'LU'],
          fee: { type: 'flat', amount: 12 },
          estimatedDays: '5 à 10 jours ouvrés',
        },
        {
          id: 'pickup_cathedrale',
          type: 'pickup',
          label: "Retrait boutique — Place de la Cathédrale",
          fee: { type: 'flat', amount: 0 },
          pickupLocation: {
            name: "Jack'N'Ed",
            address: '14 Place de la Cathédrale, 67000 Strasbourg',
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
    pageSize: 12,
    filters: {
      price: true,
      brand: true,
      audience: true,
      caseSize: true,
      braceletColor: true,
      braceletMaterial: true,
      promotion: true,
    },
  },

  /**
   * Accueil. `sections` ne retient que ce que le site sait afficher aujourd'hui :
   * `homeCarousel` (uploads Supabase) et `selections` (visuels + homeSelections.config.js)
   * seraient de toute façon filtrés par `filterHomeSectionsByFeatures`.
   */
  home: {
    /**
     * Hero « vitrine » : le discours à gauche, une montre du catalogue dans un panneau blanc
     * à droite — elle se renouvelle seule, aucun visuel à fournir. Écho direct du packshot
     * sur fond blanc du site actuel.
     */
    hero: {
      variant: 'vitrine',
      eyebrow: 'Horlogerie à Strasbourg',
      title: 'Votre montre, choisie au pied de la cathédrale.',
      subtitle:
        "Entreprise familiale au 14 place de la Cathédrale : un large choix de marques, un conseil qui prend le temps, et un service après-vente sur place.",
      highlights: [
        'Montres garanties',
        'Réparations et piles sur place',
        'Ouvert du lundi au samedi, 10h–19h',
      ],
      primaryCta: {
        label: 'Découvrir nos montres',
        to: '/collection',
      },
      secondaryCta: {
        label: 'Nous contacter',
        to: '/contact',
      },
    },
    nouvelles: {
      title: 'Nouveautés',
      subtitle: 'Les derniers modèles arrivés en boutique.',
    },
    collectionHighlight: {
      title: 'Nos coups de cœur',
      subtitle:
        'Quelques pièces choisies dans la collection — venez les essayer au poignet place de la Cathédrale.',
      cta: {
        label: 'Voir toute la collection',
        to: '/collection',
      },
    },
    stats: {
      items: [
        {
          icon: 'stock',
          value: '20+',
          label: 'Marques',
          detail: 'Du quotidien accessible au Swiss Made',
        },
        {
          icon: 'store',
          value: 'Lun–Sam',
          label: '10h – 19h',
          detail: '14 place de la Cathédrale, Strasbourg',
        },
        {
          icon: 'atelier',
          value: 'SAV',
          label: 'Sur place',
          detail: 'Réparations, piles et bracelets',
        },
      ],
      highlights: [
        {
          icon: 'guarantee',
          label: 'Montres garanties',
          detail: 'Garantie fabricant indiquée sur chaque fiche modèle',
        },
        {
          icon: 'pickup',
          label: 'Retrait gratuit en boutique',
          detail: 'Commandez en ligne, récupérez place de la Cathédrale',
        },
        {
          icon: 'payment',
          label: 'Paiement sécurisé',
          detail: 'Règlement en ligne protégé via Stripe',
        },
      ],
    },
    aboutPreview: {
      eyebrow: 'Qui sommes-nous ?',
      title: 'Une entreprise familiale au pied de la cathédrale',
      description:
        "Située au cœur historique de Strasbourg, la boutique offre une vue imprenable sur la cathédrale. Ouverte du lundi au samedi, elle réunit un large choix de marques, des montres garanties et un service après-vente assuré sur place — réparations, révisions et changements de piles.",
      /** Photo de devanture à ajouter dans `public/places/` ; en attendant, repli texte. */
      imageFallback: "Jack'N'Ed",
      ctaLabel: 'Découvrir notre histoire',
      to: '/a-propos',
    },
    sections: [
      'hero',
      'nouvelles',
      'collectionHighlight',
      'stats',
      'aboutPreview',
      'faq',
    ],
  },

  navigation: {
    main: [
      {
        type: 'megaMenu',
        label: 'Nos montres',
        to: '/collection',
        feature: 'collection',
        columns: [
          {
            title: 'Genre',
            items: [
              { label: 'Montre femme', to: '/collection?public=femme', feature: 'collection' },
              { label: 'Montre homme', to: '/collection?public=homme', feature: 'collection' },
              { label: 'Montre enfant', to: '/collection?public=enfant', feature: 'collection' },
            ],
          },
          {
            title: 'Marques',
            source: 'brands',
            columns: 2,
            footerLink: {
              label: 'Toutes les marques',
              to: '/collection/marques',
            },
          },
          {
            title: 'Promotions',
            titleLink: '/collection?promotion=1',
            dynamicCampaigns: true,
            items: [
              {
                label: 'Promotions femme',
                to: '/collection?promotion=1&public=femme',
                feature: 'collection',
              },
              {
                label: 'Promotions homme',
                to: '/collection?promotion=1&public=homme',
                feature: 'collection',
              },
            ],
          },
        ],
      },
      { type: 'link', label: 'À propos', to: '/a-propos', feature: 'about' },
      { type: 'link', label: 'FAQ', to: '/faq', feature: 'faq' },
      { type: 'link', label: 'Contact', to: '/contact', feature: 'contact' },
    ],
    footer: [
      { label: 'Accueil', to: '/#accueil' },
      { label: 'Marques', to: '/collection/marques', feature: 'collection' },
      { label: 'À propos', to: '/a-propos', feature: 'about' },
      { label: 'FAQ', to: '/faq', feature: 'faq' },
      { label: 'Contact', to: '/contact', feature: 'contact' },
    ],
  },

  backend: {
    publicApiUrl: 'https://watch-ecommerce-mp9l.onrender.com',
    cors: {
      extraAllowedOrigins: [],
    },
    email: {
      fromName: "Jack'N'Ed",
      fromAddress: 'sa@jackned.com',
      toAddress: 'sa@jackned.com',
      template: {
        logoText: "Jack'N'Ed",
        accentColor: '#111111',
      },
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
      /**
       * TODO client : `public/logo500x500.png` reste à fournir. Ce même chemin est codé en dur
       * dans le JSON-LD de la fiche montre (`WatchDetail.vue`), donc un seul fichier suffit.
       */
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
    faq: {
      title: "FAQ | Jack'N'Ed — Commande, retrait, garanties et SAV",
      metaDescription:
        'Réponses aux questions fréquentes : horaires et accès, retrait gratuit en boutique, livraison, paiement Stripe, garanties, réparations et changements de piles.',
      ogTitle: "FAQ | Jack'N'Ed",
      ogDescription:
        'Commande, retrait place de la Cathédrale, livraison, garanties et service après-vente — toutes les réponses.',
      twitterTitle: "FAQ — Jack'N'Ed",
      twitterDescription:
        'Retrait boutique, garanties, piles et réparations : vos questions, nos réponses.',
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
