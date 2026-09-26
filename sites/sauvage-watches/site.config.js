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

    /**
     * Surcharges du catalogue d'interface du socle (`packages/base/src/i18n/messages/`).
     * Deux renommages propres à Sauvage :
     *
     * 1. « Collection » devient « Montres en stock » — le stock appartient à la maison,
     *    et le mot le dit mieux qu'un terme de catalogue.
     * 2. Le service d'« estimation » devient le « rachat de votre montre » : Sauvage ne
     *    vend pas une expertise, elle achète des montres. L'estimation reste nommée là
     *    où elle décrit une étape du processus, pas l'offre commerciale.
     */
    messages: {
      fr: {
        'home.collectionTitle': 'Montres en stock',
        'crossSell.ourCollection': 'Nos montres en stock',

        'checkout.fulfillmentPickup': 'Rendez-vous',
        'checkout.pickupSectionTitle': 'Remise en main propre',

        'home.valuationTitle': 'Rachat de votre montre',
        'home.valuationText':
          'Nous rachetons votre montre au juste prix : proposition sous 24 h, sans engagement.',
        'home.valuationCta': 'Vendre ma montre',

        'crossSell.valuation': 'Rachat de votre montre',
        'crossSell.valuationText':
          'Nous rachetons votre montre. Estimation gratuite, proposition claire et paiement rapide.',
        'crossSell.valuationCta': 'Vendre ma montre',

        'valuation.pageTitle': 'Rachat de votre montre',
        'valuation.pageLead':
          'Remplissez ce formulaire pour recevoir notre proposition de rachat, gratuite et sans engagement',
        'valuation.howWeEstimate': 'Comment fixons-nous notre proposition de rachat ?',
        'valuation.submit': 'Vendre ma montre',

        'process.pageTitle': 'Comment fixons-nous notre proposition de rachat ?',
        'process.introTail':
          "C'est pourquoi nous vous expliquons en détail comment nous fixons notre proposition de rachat, de manière précise et équitable.",
        'process.step1Text':
          "Dès réception de votre formulaire, notre équipe examine toutes les informations fournies : marque, modèle, année, numéro de série, état général et accessoires (boîte, papiers). Chaque détail compte pour une proposition juste.",
        'process.step5Title': 'Proposition de rachat',
        'process.step5Text':
          'Après avoir croisé toutes ces informations, nous vous adressons une proposition de rachat détaillée et transparente. Elle est valable trente jours et peut être ajustée après un examen physique de la montre.',
        'process.factorsTitle': 'Les facteurs qui influencent notre proposition',
        'process.ctaTitle': 'Prêt à vendre votre montre ?',
        'process.ctaText':
          'Remplissez notre formulaire gratuit et recevez notre proposition de rachat sous 24 à 48 h.',
        'process.ctaButton': 'Demander une proposition de rachat',
        'process.marketPricesText':
          'Nos propositions sont fondées sur les prix réels du marché, pas sur des prix gonflés.',
        'process.freeValuation': 'Proposition gratuite',
        'process.freeValuationText':
          'Aucun engagement de votre part : notre proposition est entièrement gratuite.',

        'thanks.estimation':
          'Nous avons bien reçu votre demande de rachat. Un membre de notre équipe vous contactera sous 24 h avec notre proposition.',
      },
      en: {
        'home.collectionTitle': 'Watches in stock',
        'crossSell.ourCollection': 'Our watches in stock',

        'checkout.fulfillmentPickup': 'Appointment',
        'checkout.pickupSectionTitle': 'Handover in person',

        'home.valuationTitle': 'We buy your watch',
        'home.valuationText':
          'We buy your watch at a fair price: an offer within 24 hours, with no obligation.',
        'home.valuationCta': 'Sell my watch',

        'crossSell.valuation': 'We buy your watch',
        'crossSell.valuationText':
          'We buy your watch. Free valuation, a clear offer and fast payment.',
        'crossSell.valuationCta': 'Sell my watch',

        'valuation.pageTitle': 'We buy your watch',
        'valuation.pageLead':
          'Fill in this form to receive our purchase offer, free and with no obligation',
        'valuation.howWeEstimate': 'How do we set our purchase offer?',
        'valuation.submit': 'Sell my watch',

        'process.pageTitle': 'How do we set our purchase offer?',
        'process.introTail':
          'That is why we explain in detail how we arrive at our purchase offer, precisely and fairly.',
        'process.step1Text':
          'As soon as we receive your form, our team reviews everything you have provided: brand, model, year, serial number, overall condition and accessories (box, papers). Every detail counts towards a fair offer.',
        'process.step5Title': 'Purchase offer',
        'process.step5Text':
          'Having cross-checked all of this, we send you a detailed and transparent purchase offer. It is valid for thirty days and may be adjusted after a physical inspection of the watch.',
        'process.factorsTitle': 'What influences our offer',
        'process.ctaTitle': 'Ready to sell your watch?',
        'process.ctaText':
          'Fill in our free form and receive our purchase offer within 24 to 48 hours.',
        'process.ctaButton': 'Request a purchase offer',
        'process.marketPricesText':
          'Our offers are based on real market prices, not inflated ones.',
        'process.freeValuation': 'Free offer',
        'process.freeValuationText': 'No obligation on your part: our offer is entirely free.',

        'thanks.estimation':
          'We have received your request. A member of our team will contact you within 24 hours with our purchase offer.',
      },
      de: {
        'home.collectionTitle': 'Uhren auf Lager',
        'crossSell.ourCollection': 'Unsere Uhren auf Lager',

        'checkout.fulfillmentPickup': 'Termin',
        'checkout.pickupSectionTitle': 'Persönliche Übergabe',

        'home.valuationTitle': 'Ankauf Ihrer Uhr',
        'home.valuationText':
          'Wir kaufen Ihre Uhr zum fairen Preis: ein Angebot innerhalb von 24 Stunden, unverbindlich.',
        'home.valuationCta': 'Meine Uhr verkaufen',

        'crossSell.valuation': 'Ankauf Ihrer Uhr',
        'crossSell.valuationText':
          'Wir kaufen Ihre Uhr an. Kostenlose Schätzung, klares Angebot und schnelle Zahlung.',
        'crossSell.valuationCta': 'Meine Uhr verkaufen',

        'valuation.pageTitle': 'Ankauf Ihrer Uhr',
        'valuation.pageLead':
          'Füllen Sie dieses Formular aus und erhalten Sie unser Ankaufsangebot — kostenlos und unverbindlich',
        'valuation.howWeEstimate': 'Wie ermitteln wir unser Ankaufsangebot?',
        'valuation.submit': 'Meine Uhr verkaufen',

        'process.pageTitle': 'Wie ermitteln wir unser Ankaufsangebot?',
        'process.introTail':
          'Deshalb erklären wir Ihnen ausführlich, wie wir unser Ankaufsangebot genau und fair ermitteln.',
        'process.step1Text':
          'Sobald Ihr Formular bei uns eingeht, prüft unser Team alle Angaben: Marke, Modell, Jahr, Seriennummer, Gesamtzustand und Zubehör (Box, Papiere). Jedes Detail zählt für ein faires Angebot.',
        'process.step5Title': 'Ankaufsangebot',
        'process.step5Text':
          'Nach Abgleich all dieser Informationen unterbreiten wir Ihnen ein detailliertes und transparentes Ankaufsangebot. Es gilt dreißig Tage und kann nach einer physischen Prüfung der Uhr angepasst werden.',
        'process.factorsTitle': 'Was unser Angebot beeinflusst',
        'process.ctaTitle': 'Bereit, Ihre Uhr zu verkaufen?',
        'process.ctaText':
          'Füllen Sie unser kostenloses Formular aus und erhalten Sie unser Ankaufsangebot innerhalb von 24 bis 48 Stunden.',
        'process.ctaButton': 'Ankaufsangebot anfordern',
        'process.marketPricesText':
          'Unsere Angebote beruhen auf echten Marktpreisen, nicht auf überhöhten Preisen.',
        'process.freeValuation': 'Kostenloses Angebot',
        'process.freeValuationText':
          'Keinerlei Verpflichtung Ihrerseits: Unser Angebot ist vollständig kostenlos.',

        'thanks.estimation':
          'Wir haben Ihre Anfrage erhalten. Ein Mitglied unseres Teams meldet sich innerhalb von 24 Stunden mit unserem Ankaufsangebot bei Ihnen.',
      },
    },
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
    /**
     * Pas d'adresse publique : Sauvage ne reçoit pas en boutique, les rendez-vous se
     * tiennent en un lieu convenu avec l'acheteur. Clé absente = le socle masque la ligne
     * d'adresse (pied de page, page Contact, modale de rendez-vous) et affiche les
     * réseaux sociaux à la place. L'adresse du siège reste déclarée dans `legal.address`,
     * où les mentions légales et les CGV l'exigent.
     */
    footerAddressHtml: null,
  },

  /**
   * Zone d'intervention — référencement local sur les villes où Sauvage se déplace pour
   * ses rendez-vous. `title` et `text` s'affichent en petit en bas des pages Contact,
   * Rachat et Recherche (jamais sur l'accueil) ; `cities` et `region` alimentent
   * l'`areaServed` du JSON-LD `Organization`. Bloc absent = rien d'affiché.
   */
  serviceArea: {
    title: t({
      fr: 'Zone d’intervention — Alsace & Grand Est',
      en: 'Service area — Alsace & Grand Est',
      de: 'Einsatzgebiet — Elsass & Grand Est',
    }),
    text: t({
      fr: 'Nous intervenons à Strasbourg, Colmar, Mulhouse, Haguenau, Sélestat, Saint-Louis, Nancy, Metz, Reims, Épinal, Thionville, Troyes et dans l’ensemble du Grand Est.',
      en: 'We operate in Strasbourg, Colmar, Mulhouse, Haguenau, Sélestat, Saint-Louis, Nancy, Metz, Reims, Épinal, Thionville, Troyes and throughout the Grand Est region.',
      de: 'Wir sind in Straßburg, Colmar, Mülhausen, Hagenau, Schlettstadt, Saint-Louis, Nancy, Metz, Reims, Épinal, Diedenhofen, Troyes und in der gesamten Region Grand Est für Sie da.',
    }),
    cities: [
      'Strasbourg',
      'Colmar',
      'Mulhouse',
      'Haguenau',
      'Sélestat',
      'Saint-Louis',
      'Nancy',
      'Metz',
      'Reims',
      'Épinal',
      'Thionville',
      'Troyes',
    ],
    region: 'Grand Est',
  },

  storeMap: {
    /** Pas de carte publique : l'adresse ne sort pas des mentions légales (visites sur rendez-vous). */
    enabled: false,
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

  /**
   * Avis Google de la fiche d'établissement — section d'accueil `avisGoogle` et bloc sous la
   * carte de la page Contact. Les avis sont lus par le backend (`GET /api/reviews`) et mis en
   * cache 6 h : voir `documentation/google-reviews/README.md`.
   *
   * Tant que `placeId` est vide, la fonctionnalité reste éteinte et rien ne change à l'affichage.
   * Récupérer l'identifiant `ChIJ…` de la fiche avec le « Place ID Finder » de Google, puis
   * déclarer le secret `SITE_SAUVAGE_WATCHES__GOOGLE_PLACES_API_KEY` côté Render.
   */
  googleReviews: {
    enabled: true,
    /** Place ID `ChIJ…` de la fiche Google Business. Vide = section masquée. */
    placeId: 'ChIJ3Yd26nfJlkcR8t7VaQCaNxA',
    /** Plafond dur de l'API Places : 5 avis maximum. */
    maxReviews: 5,
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
    /**
     * Emplacements où les réseaux s'affichent en plus du pied de page et de la page
     * Contact, où ils figurent déjà. Bloc absent sur les autres vitrines : rien ne
     * change chez elles.
     */
    show: {
      /** En-tête desktop et menu mobile, en icônes seules. */
      header: true,
      /** Bloc « Besoin d'aide ? » des pages rachat et recherche. */
      contactCta: true,
    },
    suivezNous: {
      instagramUrl: 'https://www.instagram.com/sauvage_watches',
      instagramHandle: '@sauvage_watches',
      facebookUrl: 'https://www.facebook.com/profile.php?id=61592137302130',
      facebookHandle: 'Sauvage Watches',
    },
  },

  copy: {
    footerTagline: t({
      fr: "Votre partenaire pour l'achat et la mise à disposition de montres de luxe authentifiées. Recherche personnalisée, rachat rapide, transparence garantie.",
      en: 'Your partner for buying and sourcing authenticated luxury watches. Personalised sourcing, fast buy-back, guaranteed transparency.',
      de: 'Ihr Partner für den Kauf und die Beschaffung authentifizierter Luxusuhren. Persönliche Suche, schneller Ankauf, garantierte Transparenz.',
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
    /**
     * « Coup de foudre » (`/coup-de-foudre`) : préférences guidées puis montres à faire
     * glisser, shortlist locale au navigateur. Exclusif à Sauvage.
     */
    watchMatchmaking: true,
    /**
     * Phase 2 : alerte e-mail quand une montre nouvellement ajoutée correspond aux préférences
     * enregistrées. Nécessite la migration `20260902120000_watch_match_alerts.sql` et
     * `backend.publicApiUrl` (les liens de désinscription en dépendent).
     */
    watchMatchAlerts: true,
  },

  /** Profil catalogue revente : année, état, contenu et référence visibles sur cartes et fiches. */
  watchCatalog: {
    mode: 'resale',
    /** Bouton « Prendre rendez-vous » sur les fiches montre. */
    appointment: true,
    /**
     * Pas de point de vente : le lieu du rendez-vous se convient avec l'acheteur.
     * La modale masque alors adresse, horaires et itinéraire, et rend le téléphone
     * obligatoire. Valeur par défaut ailleurs : `'store'`.
     */
    appointmentLocation: 'agreed',
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
          /**
           * Pas d'adresse : la remise se fait en main propre, en un lieu convenu avec
           * l'acheteur. `whatsapp: true` remplace le bloc adresse du checkout par un
           * encart « rendez-vous par WhatsApp » et ajoute le bouton correspondant à
           * l'e-mail de confirmation de commande (voir `backend/emails/`).
           */
          pickupLocation: {
            name: 'Sauvage Watches',
            whatsapp: true,
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
     * La montre exposée n'est pas configurée ici — elle se choisit dans l'admin
     * « Carrousels → Montre en vitrine », et à défaut c'est la première du catalogue
     * encore en vente (voir `services/homeVitrineService.js`).
     * `variant: 'parallax'` remet le hero historique au cadran animé.
     */
    hero: {
      variant: 'vitrine',
      eyebrow: t({
        fr: "Achat & vente de montres d'exception",
        en: 'Buying & selling exceptional watches',
        de: 'An- und Verkauf außergewöhnlicher Uhren',
      }),
      title: t({
        fr: 'Des montres de prestige, sélectionnées pour vous.',
        en: 'Prestige watches, selected for you.',
        de: 'Prestigeuhren, für Sie ausgewählt.',
      }),
      subtitle: t({
        fr: 'Nous achetons, vérifions et détenons nos montres. Chaque pièce est contrôlée et disponible immédiatement.',
        en: 'We buy, check and hold our watches ourselves. Every piece is inspected and available immediately.',
        de: 'Wir kaufen, prüfen und besitzen unsere Uhren selbst. Jedes Stück wird kontrolliert und ist sofort verfügbar.',
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
        label: t({ fr: 'Je vends ma montre', en: 'Sell my watch', de: 'Ich verkaufe meine Uhr' }),
        to: '/rachat',
      },
      /** Trois points de réassurance maximum : le variant `vitrine` leur associe une icône. */
      highlights: [
        t({ fr: 'Montre certifiée', en: 'Certified watch', de: 'Zertifizierte Uhr' }),
        t({
          fr: 'Chaque montre est garantie',
          en: 'Every watch is guaranteed',
          de: 'Jede Uhr ist garantiert',
        }),
        t({
          fr: 'Remise en main propre sur rendez-vous',
          en: 'Handover in person, by appointment',
          de: 'Persönliche Übergabe nach Vereinbarung',
        }),
      ],
    },
    nouvelles: {
      title: t({ fr: 'Nouvelles arrivées', en: 'New arrivals', de: 'Neuzugänge' }),
    },
    sections: ['hero', 'nouvelles', 'trust', 'avisGoogle', 'ventes', 'suivezNous', 'services', 'faq'],
  },

  /** Filtres collection — passer une clé à `false` pour masquer la section dans le tiroir. */
  collection: {
    /**
     * Format du catalogue : 'grid' (défaut, grille 2/3/4 colonnes) | 'list'
     * (une montre par ligne, caractéristiques visibles) | 'showcase' (grands
     * visuels portrait, 1 à 2 par rangée) | 'compact' (grille dense jusqu'à
     * 6 colonnes). Valeurs dans `packages/base/src/site/collectionFilters.js`.
     */
    displayMode: 'grid',
    /** Nombre de montres par page sur `/collection` (défaut socle : 12, bornes 4–96). */
    pageSize: 12,
    filters: {
      price: true,
      brand: true,
      audience: true,
      caseSize: true,
      dialColor: true,
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
            label: t({ fr: 'Coup de foudre', en: 'Find your match', de: 'Ihre Traumuhr' }),
            to: '/coup-de-foudre',
            feature: 'watchMatchmaking',
          },
          {
            label: t({ fr: 'Recherche personnalisée', en: 'Watch sourcing', de: 'Uhrensuche' }),
            to: '/recherche',
            feature: 'recherche',
          },
          {
            label: t({
              fr: 'Rachat de votre montre',
              en: 'We buy your watch',
              de: 'Ankauf Ihrer Uhr',
            }),
            to: '/rachat',
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
        label: t({ fr: 'Coup de foudre', en: 'Find your match', de: 'Ihre Traumuhr' }),
        to: '/coup-de-foudre',
        feature: 'watchMatchmaking',
      },
      {
        label: t({ fr: 'Recherche personnalisée', en: 'Watch sourcing', de: 'Uhrensuche' }),
        to: '/recherche',
        feature: 'recherche',
      },
      {
        label: t({
          fr: 'Rachat de votre montre',
          en: 'We buy your watch',
          de: 'Ankauf Ihrer Uhr',
        }),
        to: '/rachat',
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
        /**
         * `accentColor` volontairement absent : l'accent des e-mails (filets, boutons, badges)
         * retombe sur `theme.colors.primary`, le vert de la vitrine — comme le fait déjà le
         * reçu PDF (`backend/orders/receiptBranding.js`). L'or qui figurait ici n'appartenait
         * à aucune couleur du thème et laissait les e-mails en décalage avec le site.
         */
        /**
         * Logo d'en-tête des e-mails, depuis `public/`. Déclaration explicite exigée : sans elle
         * l'e-mail est signé du nom de la marque en toutes lettres, jamais d'une icône générique
         * (favicon, icône de manifeste) qui peut être restée celle du site modèle.
         */
        logoPath: '/web-app-manifest-512x512.png',
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
    /**
     * Le service d'estimation est devenu le rachat : les anciennes URLs restent servies
     * en 301 pour les liens partagés et le référencement déjà acquis. Le routeur fait la
     * même redirection côté application (`buildAppRoutes.js`) ; celle-ci vaut pour les
     * robots, qui n'exécutent pas forcément le JavaScript.
     */
    legacyRedirects: {
      static: [
        { source: '/estimation', destination: '/rachat' },
        { source: '/estimation/processus', destination: '/rachat/processus' },
      ],
    },

    /** Static shell before Vue hydrates @vueuse/head (fallback / crawlers). */
    indexHtml: {
      title: t({
        fr: 'Sauvage - Montres de luxe',
        en: 'Sauvage - Luxury watches',
        de: 'Sauvage - Luxusuhren',
      }),
      metaDescription: t({
        fr: 'Sauvage - Expert en services de montres de luxe. Collection de montres garanties 1 an, rachat de votre montre. Rolex, Breitling, Tag Heuer, Cartier et plus.',
        en: 'Sauvage - Luxury watch specialists. A collection of watches with a 1-year warranty, we buy your watch. Rolex, Breitling, Tag Heuer, Cartier and more.',
        de: 'Sauvage - Spezialist für Luxusuhren. Uhrenkollektion mit 1 Jahr Garantie, Ankauf Ihrer Uhr. Rolex, Breitling, Tag Heuer, Cartier und mehr.',
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
        fr: 'Expert en services de montres de luxe. Collection de montres garanties 1 an, rachat de votre montre.',
        en: 'Luxury watch specialists. A collection of watches with a 1-year warranty, we buy your watch.',
        de: 'Spezialist für Luxusuhren. Uhrenkollektion mit 1 Jahr Garantie, Ankauf Ihrer Uhr.',
      }),
      twitterCard: 'summary_large_image',
      twitterTitle: t({
        fr: 'Sauvage - Montres de luxe',
        en: 'Sauvage - Luxury watches',
        de: 'Sauvage - Luxusuhren',
      }),
      twitterDescription: t({
        fr: 'Expert en services de montres de luxe. Collection de montres garanties 1 an, rachat de votre montre.',
        en: 'Luxury watch specialists. A collection of watches with a 1-year warranty, we buy your watch.',
        de: 'Spezialist für Luxusuhren. Uhrenkollektion mit 1 Jahr Garantie, Ankauf Ihrer Uhr.',
      }),
      /** Repli : `og:locale` réel est dérivé de la langue active (voir `i18n/locales.js`). */
      ogLocale: 'fr_FR',
      ogSiteName: 'Sauvage',
      appleMobileWebAppTitle: 'Sauvage Watches',
      /** Icône applicative, à remplacer par une bannière 1200×630 dédiée au partage. */
      ogImagePath: '/web-app-manifest-512x512.png',
    },
    home: {
      title: t({
        fr: 'Sauvage - Rachat de Montres de Luxe | Collection Garantie',
        en: 'Sauvage - Luxury Watch Buy-Back | Warranted Collection',
        de: 'Sauvage - Ankauf von Luxusuhren | Kollektion mit Garantie',
      }),
      metaDescription: t({
        fr: 'Montres de luxe garanties 1 an : Rolex, Breitling, Tag Heuer, Cartier. Rachat de votre montre, recherche personnalisée et accompagnement expert.',
        en: 'Luxury watches with a 1-year warranty: Rolex, Breitling, Tag Heuer, Cartier. We buy your watch, personalised sourcing and expert guidance.',
        de: 'Luxusuhren mit 1 Jahr Garantie: Rolex, Breitling, Tag Heuer, Cartier. Ankauf Ihrer Uhr, persönliche Suche und fachkundige Beratung.',
      }),
      ogTitle: t({
        fr: 'Sauvage - Rachat de Montres de Luxe | Collection Garantie',
        en: 'Sauvage - Luxury Watch Buy-Back | Warranted Collection',
        de: 'Sauvage - Ankauf von Luxusuhren | Kollektion mit Garantie',
      }),
      ogDescription: t({
        fr: 'Découvrez notre collection de montres de luxe garanties 1 an. Rachat de votre montre, recherche personnalisée et accompagnement expert.',
        en: 'Discover our collection of luxury watches with a 1-year warranty. We buy your watch, personalised sourcing and expert guidance.',
        de: 'Entdecken Sie unsere Kollektion von Luxusuhren mit 1 Jahr Garantie. Ankauf Ihrer Uhr, persönliche Suche und fachkundige Beratung.',
      }),
      twitterTitle: t({
        fr: 'Sauvage - Rachat de Montres de Luxe',
        en: 'Sauvage - Luxury Watch Buy-Back',
        de: 'Sauvage - Ankauf von Luxusuhren',
      }),
      twitterDescription: t({
        fr: 'Découvrez notre collection de montres de luxe garanties 1 an. Rachat de votre montre, recherche personnalisée.',
        en: 'Discover our collection of luxury watches with a 1-year warranty. We buy your watch, personalised sourcing.',
        de: 'Entdecken Sie unsere Kollektion von Luxusuhren mit 1 Jahr Garantie. Ankauf Ihrer Uhr, persönliche Suche.',
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
      /**
       * Argument commercial ajouté aux méta-descriptions de fiche. Propre à chaque vitrine :
       * il était codé en dur dans `WatchDetail.vue`, et annonçait donc la garantie de Sauvage
       * sur les fiches des autres clients. Omettre la clé retire simplement la phrase.
       */
      descriptionSuffix: t({
        fr: 'Garantie 1 an, authentification certifiée.',
        en: '1-year warranty, certified authentication.',
        de: '1 Jahr Garantie, zertifizierte Authentifizierung.',
      }),
      descriptionFallback: t({
        fr: 'Découvrez cette montre de luxe sur Sauvage',
        en: 'Discover this luxury watch at Sauvage',
        de: 'Entdecken Sie diese Luxusuhr bei Sauvage',
      }),
      structuredDataSellerName: 'Sauvage',
    },
    /**
     * Page « Nos dernières ventes ». Les mêmes textes que les défauts de
     * `SoldWatchesArchivePage.vue`, mais déclarés ici : le pré-rendu ne peut pas atteindre les
     * replis d'un composant, et servait donc la copie de l'accueil sur cette route.
     */
    soldArchive: {
      title: t({
        fr: 'Montres vendues | Sauvage',
        en: 'Sold watches | Sauvage',
        de: 'Verkaufte Uhren | Sauvage',
      }),
      metaDescription: t({
        fr: 'Les montres qui ont trouvé preneur. Un modèle vous intéresse ? Nous pouvons trouver le même pour vous.',
        en: 'The watches that have found a buyer. A model catches your eye? We can source the same for you.',
        de: 'Die Uhren, die einen Käufer gefunden haben. Ein Modell gefällt Ihnen? Wir finden dasselbe für Sie.',
      }),
    },
    matchmaking: {
      title: t({
        fr: 'Coup de foudre | Trouvez la montre faite pour vous | Sauvage',
        en: 'Find your match | The watch made for you | Sauvage',
        de: 'Ihre Traumuhr | Die Uhr, die zu Ihnen passt | Sauvage',
      }),
      metaDescription: t({
        fr: 'Dites-nous ce que vous cherchez : les montres Sauvage défilent une par une. Un geste pour passer, un autre pour garder, une shortlist à la fin.',
        en: 'Tell us what you are looking for and browse the watches at Sauvage one at a time. Swipe to pass or keep, and end with your shortlist.',
        de: 'Sagen Sie uns, was Sie suchen: die Uhren von Sauvage einzeln durchsehen. Wischen zum Weitergehen oder Behalten, am Ende Ihre Auswahl.',
      }),
      ogTitle: t({
        fr: 'Coup de foudre | Sauvage Watches',
        en: 'Find your match | Sauvage Watches',
        de: 'Ihre Traumuhr | Sauvage Watches',
      }),
      ogDescription: t({
        fr: 'Trouvez la montre faite pour vous, une montre à la fois.',
        en: 'Find the watch made for you, one watch at a time.',
        de: 'Finden Sie die Uhr, die zu Ihnen passt — eine nach der anderen.',
      }),
    },
    faq: {
      title: t({
        fr: 'FAQ | Questions fréquentes | Sauvage',
        en: 'FAQ | Frequently asked questions | Sauvage',
        de: 'FAQ | Häufige Fragen | Sauvage',
      }),
      metaDescription: t({
        fr: 'Réponses aux questions les plus fréquentes sur Sauvage : recherche personnalisée, rachat de votre montre, collection, garanties et services horlogers.',
        en: 'Answers to the most common questions about Sauvage: personalised sourcing, watch buy-back, collection, warranties and watchmaking services.',
        de: 'Antworten auf die häufigsten Fragen zu Sauvage: persönliche Suche, Ankauf Ihrer Uhr, Kollektion, Garantien und Uhrmacherleistungen.',
      }),
      ogTitle: t({
        fr: 'FAQ | Sauvage Watches',
        en: 'FAQ | Sauvage Watches',
        de: 'FAQ | Sauvage Watches',
      }),
      ogDescription: t({
        fr: 'Rachat, recherche personnalisée, collection et garanties — retrouvez toutes les réponses à vos questions.',
        en: 'Buy-back, personalised sourcing, collection and warranties — find all the answers here.',
        de: 'Ankauf, persönliche Suche, Kollektion und Garantien — hier finden Sie alle Antworten.',
      }),
      twitterTitle: t({
        fr: 'FAQ — Sauvage Watches',
        en: 'FAQ — Sauvage Watches',
        de: 'FAQ — Sauvage Watches',
      }),
      twitterDescription: t({
        fr: 'Questions fréquentes sur nos services de montres de luxe, rachat et collection garantie.',
        en: 'Frequently asked questions about our luxury watch services, buy-back and warranted collection.',
        de: 'Häufige Fragen zu unseren Luxusuhren-Leistungen, zum Ankauf und zur Kollektion mit Garantie.',
      }),
    },
    aPropos: {
      title: t({
        fr: 'À propos de Sauvage — Spécialiste de la montre de luxe',
        en: 'About Sauvage — Luxury watch specialists',
        de: 'Über Sauvage — Spezialist für Luxusuhren',
      }),
      metaDescription: t({
        fr: 'Sauvage, spécialiste du rachat et de la vente de montres de luxe. Notre stock nous appartient : authenticité, qualité et disponibilité immédiate.',
        en: 'Sauvage specialises in buying and selling luxury watches. We own our stock outright: authenticity, quality and immediate availability.',
        de: 'Sauvage kauft und verkauft Luxusuhren. Unser Bestand gehört uns selbst: Echtheit, Qualität und sofortige Verfügbarkeit.',
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
