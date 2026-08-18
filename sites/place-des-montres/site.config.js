import homeSelectionCards from './homeSelections.config.js'
import guidePage from './guide.config.js'
import { publicPath } from '../../packages/base/src/utils/publicPath.js'
import { t } from '../../packages/base/src/site/i18nValue.js'

/**
 * Manifest client — Place des Montres (placedesmontres.fr), horlogerie e-commerce à Strasbourg.
 * Données publiques issues du site vitrine (PrestaShop) : contact, adresse magasin, livraison, réseaux.
 * Mentions légales : LHN S.A.R.L. — SIRET 418 198 792 000 32 (R.C.S. Strasbourg B 418 198 792).
 *
 * FAQ : inline uniquement (pas de faq.config.js) — exigence démo monorepo.
 */
export default {
  siteId: 'place-des-montres',

  faq: {
    enabled: true,
    heading: t({
      fr: 'Questions fréquentes',
      en: 'Frequently asked questions',
      de: 'Häufige Fragen',
    }),
    subheading: t({
      fr: 'Commande, livraison, paiement, retours, garanties et service client.',
      en: 'Ordering, delivery, payment, returns, warranties and customer service.',
      de: 'Bestellung, Lieferung, Zahlung, Rücksendungen, Garantien und Kundenservice.',
    }),
    items: [
      {
        id: 1,
        question: 'Le modèle affiché est-il disponible en stock ?',
        answer:
          'Nous mettons en ligne uniquement des modèles <strong>disponibles en stock</strong>. Les stocks sont mis à jour plusieurs fois par jour. Tant que votre commande n’est pas validée, il se peut qu’un article sélectionné soit acheté par un autre client&nbsp;: la vente est alors annulée et vous êtes prévenu par e-mail.',
      },
      {
        id: 2,
        question: 'Puis-je modifier ou annuler ma commande ?',
        answer:
          'La modification ou la suppression d’une ligne de commande doit intervenir au niveau du <strong>panier</strong>, avant validation du paiement. Au-delà, la vente est ferme et la livraison interviendra. Vous disposez toutefois d’un délai de <strong>30&nbsp;jours</strong> pour retourner votre achat (voir ci-dessous).',
      },
      {
        id: 3,
        question: 'Quels moyens de paiement acceptez-vous ?',
        answer:
          'Vous pouvez régler vos achats par <strong>carte bancaire</strong> (Visa, Mastercard, Cartes Bleues). Le paiement par <strong>virement</strong> ou par <strong>chèque</strong> n’est pas proposé en ligne, afin de garantir des délais de livraison fiables et une gestion précise des stocks.',
      },
      {
        id: 4,
        question: 'Le paiement en ligne est-il sécurisé ?',
        answer:
          'Le site utilise le <strong>cryptage SSL</strong> pour protéger vos données. Le paiement est traité via un prestataire certifié (<strong>Stripe</strong>), qui applique les standards de sécurité les plus exigeants pour vos coordonnées bancaires.',
      },
      {
        id: 5,
        question: 'Quelles sont les modalités de livraison en France ?',
        answer:
          'Pour la France métropolitaine, la livraison en <strong>Colissimo suivi</strong> est <strong>offerte à partir de 80&nbsp;€</strong> d’achat. En dessous de ce seuil, les frais de port s’affichent avant validation du panier. Expédition sous environ <strong>48&nbsp;h</strong> après réception du paiement (délai indicatif, jours ouvrés). Vous pouvez vous faire livrer à domicile, sur votre lieu de travail ou dans un <strong>point relais</strong>. Lors de l’envoi, vous recevez un numéro de colisage par e-mail ou SMS&nbsp;; le suivi est disponible sur <strong>colissimo.fr</strong>. En cas de retard, consultez d’abord le site du transporteur, puis contactez notre service client. Si le colis n’est pas livré, une enquête sera menée auprès du transporteur&nbsp;: réexpédition ou remboursement selon le résultat. Si vous ne pouvez pas être présent, choisissez la livraison en point de dépôt.',
      },
      {
        id: 6,
        question: 'Puis-je retirer ma commande au magasin à Strasbourg ?',
        answer:
          'Oui&nbsp;: c’est le meilleur moyen de «&nbsp;réserver&nbsp;» une montre. Commandez en ligne sur placedesmontres.fr, puis retirez votre commande au <strong>Centre commercial Place des Halles</strong>, 67000 Strasbourg, du <strong>lundi au samedi de 9h à 20h</strong>, quand vous le souhaitez. Il n’est pas possible de réserver un modèle sans l’acheter en ligne, pour garantir la fiabilité du stock.',
      },
      {
        id: 7,
        question: 'Comment réceptionner mon colis ?',
        answer:
          'À réception de votre commande, nous vous recommandons vivement de vérifier la conformité en présence du livreur, surtout si le colis est abîmé. Pour qu’une réclamation soit recevable, elle doit être mentionnée par écrit au moment de la réception. En cas de doute, il est conseillé de refuser le colis et d’en informer notre service client via votre compte client.',
      },
      {
        id: 8,
        question: 'Puis-je retourner ou échanger une montre ?',
        answer:
          'Oui&nbsp;: vous disposez d’un délai de <strong>30&nbsp;jours</strong> à compter de la réception pour nous notifier votre souhait de retour ou d’échange. La procédure est la même pour un échange&nbsp;: indiquez le produit souhaité en remplacement. Si celui-ci n’est pas disponible immédiatement, nous pouvons vous émettre un avoir.',
      },
      {
        id: 9,
        question: 'Comment effectuer un retour ?',
        answer:
          'Envoyez un e-mail à <strong>service.client@placedesmontres.fr</strong> avec votre numéro de facture, vos coordonnées et votre numéro de client. Attendez un <strong>numéro de retour</strong> en réponse. Les articles doivent être dans leur emballage d’origine, complets (garantie, accessoires, notice). Mentionnez le numéro de retour sur le colis et joignez une copie du mail de retour à l’intérieur. Adresse de retour&nbsp;: <strong>Place des Montres — Retour N°&nbsp;… — Centre commercial Place des Halles — 67000 Strasbourg</strong>.',
      },
      {
        id: 10,
        question: 'Les montres sont-elles neuves et couvertes par une garantie ?',
        answer:
          'Place des Montres est un <strong>spécialiste de la montre depuis 1995</strong>. Toutes nos montres bénéficient d’une <strong>garantie constructeur minimum de 2&nbsp;ans</strong> à partir de la date d’achat. Elle couvre les défauts de fabrication et les pannes d’origine interne. Ne sont pas couverts&nbsp;: les consommables (piles, verres, bracelets, joints…), l’usage anormal, une réparation par un intervenant non agréé, ou les dommages dus à un choc, une chute ou une immersion inappropriée. Votre montre est livrée avec une garantie constructeur tamponnée, datée et référencée&nbsp;: conservez-la dans l’écrin. Pour toute prise en charge, consultez notre page <a href="/services" class="text-primary underline">Nos services</a>.',
      },
      {
        id: 11,
        question: 'Que faire si ma montre ne fonctionne plus ?',
        answer:
          'Si vous habitez près de Strasbourg, passez nous voir aux Place des Halles. Sinon, rendez-vous chez un <strong>dépositaire agréé</strong> de la marque dans votre ville&nbsp;: nos montres ont une bonne couverture réseau en France. L’horloger identifiera la panne. Pour les premiers réflexes (notamment la pile), consultez notre <a href="/guide-horloger" class="text-primary underline">Guide de l’horloger</a>.',
      },
      {
        id: 12,
        question: 'Proposez-vous la réparation de montres ?',
        answer:
          'Oui&nbsp;: <strong>réparation et entretien toutes marques</strong>, changement de pile, étanchéité, verres et bracelets — avec un <strong>horloger sur place</strong> aux Place des Halles. Consultez notre page <a href="/services" class="text-primary underline">Nos services</a> pour les tarifs et prestations.',
      },
      {
        id: 13,
        question: 'Où trouver des conseils d’entretien (pile, étanchéité…) ?',
        answer:
          'Les conseils techniques sur la pile, l’étanchéité, les mouvements, les verres et les fonctions de montre sont regroupés dans notre <a href="/guide-horloger" class="text-primary underline">Guide de l’horloger</a>, rédigé par l’équipe Place des Montres.',
      },
      {
        id: 14,
        question: 'Comment contacter le service client ?',
        answer:
          'Par e-mail&nbsp;: <strong>service.client@placedesmontres.fr</strong> (moyen le plus rapide). Par téléphone&nbsp;: <strong>03&nbsp;88&nbsp;22&nbsp;40&nbsp;40</strong>, du lundi au samedi de 9h à 20h (prix d’un appel local). Par courrier&nbsp;: Place des Montres — Centre commercial Place des Halles — 67000 Strasbourg.',
      },
      {
        id: 15,
        question: 'Ajustez-vous le bracelet métal avant la livraison ?',
        answer: `Oui. Pour toute commande de montre avec <strong>bracelet métal</strong>, nous proposons un <strong>ajustement gratuit</strong> à votre tour de poignet avant expédition. Imprimez notre <a href="${publicPath('documents/aide-ajustement-montres.pdf')}" class="text-primary underline" target="_blank" rel="noopener">guide de mesure (PDF)</a> à l’échelle 100&nbsp;%, mesurez votre poignet puis communiquez le résultat par e-mail à <strong>service.client@placedesmontres.fr</strong>.`,
      },
    ],
  },

  locale: 'fr',

  /**
   * Langues du site. Le client ne déclare que des codes : libellés, formats de nombre/date
   * et `og:locale` viennent du socle (`packages/base/src/i18n/locales.js`).
   *
   * `defaultLocale` sert quand le navigateur du visiteur ne dit rien d'exploitable, et garde
   * les URLs sans préfixe (`/collection`) ; les autres langues sont servies sous `/en/...`
   * et `/de/...`. Strasbourg étant frontalière, l'allemand a un intérêt direct ici.
   *
   * Un texte se traduit sur place avec `t({ fr, en, de })` ; une chaîne simple reste valide
   * et sert pour les trois langues.
   */
  i18n: {
    enabled: true,
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'de'],
  },

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
    /** Typographie — contenu en Tahoma, titres en Fjalla One (`public/fonts/`). */
    typography: {
      sans: {
        family: 'Tahoma',
        faces: [{ weight: 400, style: 'normal', file: 'tahoma.ttf' }],
      },
      heading: {
        family: 'FjallaOne-Regular',
        faces: [{ weight: 400, style: 'normal', file: 'FjallaOne-Regular.ttf' }],
      },
      subheading: {
        role: 'heading',
        weight: 400,
      },
      headingWeight: 700,
    },
    /** Coins droits sur cartes/boutons/champs ; cercles (`rounded-full`) conservés. */
    radius: 'sharp',
  },

  brand: {
    legalName: 'Place des Montres',
    displayName: 'Place des Montres',
    schemaOrgName: 'PlaceDesMontres',
    logoAlt: 'Place des Montres — horlogerie à Strasbourg',
    loginLogoAlt: 'Place des Montres',
  },

  contact: {
    email: 'service.client@placedesmontres.fr',
    phoneDisplay: '03 88 22 40 40',
    phoneE164: '+33388224040',
    footerAddressHtml:
      '24 Place des Halles<br />Centre commercial Place des Halles<br />67000 Strasbourg, France',
  },

  storeMap: {
    enabled: true,
    provider: 'google',
    /** Bonhomme Street View (vue 360°) — facturation Google « Dynamic Street View » si utilisé */
    streetViewControl: true,
    center: { lat: 48.5864673, lng: 7.7411787 },
    zoom: 14,
    markerLabel: 'Place des Montres — Place des Halles',
    /** Logo bulle carte (`public/brand-logo.jpg`) */
    popupLogoSrc: publicPath('brand-logo.jpg'),
    /** Fiche Google Maps (Partager → Copier le lien) */
    googleMapsUrl:
      'https://www.google.com/maps/place/Place+des+Montres/@48.5864673,7.7411787,17z/data=!3m1!4b1!4m6!3m5!1s0x4796c84892d71677:0xed78782525eaaaa8!8m2!3d48.5864673!4d7.7411787!16s%2Fg%2F1tqck4qt?hl=fr',
    /** Adresse exacte pour l'itinéraire Google Maps */
    directionsAddress: '24 Place des Halles, Centre Commercial, 67000 Strasbourg, France',
    /** Horaires boutique — affichés dans la popup prise de rendez-vous */
    openingHours: {
      daysLabel: 'Lundi – samedi',
      hoursLabel: '9h – 20h',
    },
  },

  legal: {
    companyName: 'LHN S.A.R.L. (Place des Montres)',
    address: '24 Place des Halles, Centre commercial Place des Halles, 67000 Strasbourg, France',
    siret: '418 198 792 000 32',
  },

  urls: {
    production: 'https://www.placedesmontres.fr',
    staging: 'https://recette.placedesmontres.fr',
    development: 'http://localhost:5173',
    previewFallbackHost: 'recette.placedesmontres.fr',
  },

  social: {
    suivezNous: {
      facebookUrl: 'https://www.facebook.com/252531501590681',
      facebookHandle: 'Place des Montres',
    },
  },

  about: {
    variant: 'retail',
    hero: {
      eyebrow: 'Qui sommes-nous ?',
      title: 'Place des Montres',
      lead: "Depuis 1995, au cœur de Strasbourg, nous cultivons l'art de bien choisir sa montre : un conseil de spécialiste, un large choix de marques et l'envie de vous voir repartir avec la pièce qu'il vous faut.",
      sinceYear: 1995,
      image: publicPath('places/place-des-montres-strasbourg_1.jpg'),
      imageLayout: 'landscape',
    },
    stats: [
      {
        value: '30+',
        label: "Années d'expérience",
        detail: 'Spécialiste de la montre depuis 1995',
      },
      { value: '3 000', label: 'Montres en stock', detail: 'Un choix immédiat' },
      {
        value: '30',
        label: t({
          fr: 'Marques',
          en: 'Brands',
          de: 'Marken',
        }),
        detail: 'Des plus prestigieuses',
      },
      { value: '1', label: 'Adresse à Strasbourg', detail: 'Place des Halles' },
    ],
    story: {
      title: 'Une adresse de référence à Strasbourg',
      paragraphs: [
        "Installée au centre commercial Place des Halles, Place des Montres est bien plus qu'une boutique : c'est un lieu de rencontre entre les amateurs de belles montres et une équipe qui connaît chaque univers, chaque mécanisme, chaque nuance de cadran.",
        "Notre force, c'est le savoir-faire d'une enseigne installée de longue date à Strasbourg, que notre équipe d'aujourd'hui fait vivre au quotidien. Derrière le comptoir comme en ligne, nous guidons chaque client — du premier garde-temps au cadeau qui marquera une occasion — avec la même attention et le même plaisir de conseiller.",
        'Des montres de tous styles et à tous les prix : sport, élégance, mécanique automatique à fond transparent… nous vous aidons à trouver la pièce qui vous ressemble, pour vous faire plaisir ou faire plaisir à votre entourage.',
      ],
      pullQuote:
        "Franchir la porte de notre magasin, c'est profiter d'un vrai conseil horloger — et repartir avec une montre choisie pour vous.",
    },
    styles: [
      {
        title: 'Sport & quotidien',
        description:
          "Chronographes, montres résistantes, modèles connectés ou classiques au poignet : pour le bureau, le week-end ou l'aventure.",
        icon: 'sport',
      },
      {
        title: 'Élégance intemporelle',
        description:
          'Cadrans sobres, finitions raffinées, bracelets cuir ou acier : la montre qui sublime une tenue et traverse les saisons.',
        icon: 'elegance',
      },
      {
        title: 'Mécanique vivante',
        description:
          'Pour les amoureux de belles mécaniques : montres automatiques à fond transparent pour admirer les rouages en mouvement.',
        icon: 'mechanics',
      },
    ],
    brands: {
      title: 'Une trentaine de marques, un seul standard',
      intro:
        "Tissot, Swatch, Cluse, Seiko, Hugo Boss, Tommy Hilfiger, Diesel, Fossil, Festina, Pierre Lannier, Casio, G-Shock… et bien d'autres : nous sélectionnons des maisons reconnues pour leur qualité et leur diversité.",
      names: [
        'Tissot',
        'Swatch',
        'Cluse',
        'Seiko',
        'Hugo Boss',
        'Tommy Hilfiger',
        'Diesel',
        'Fossil',
        'Festina',
        'Pierre Lannier',
        'Casio',
        'G-Shock',
      ],
    },
    experience: {
      title: "L'expérience Place des Montres",
      items: [
        {
          title: 'Conseil de proximité',
          description:
            'Essayer au poignet, comparer les modèles, poser toutes vos questions : notre équipe vous accueille avec plaisir du lundi au samedi.',
        },
        {
          title: 'Boutique & e-commerce',
          description:
            'Commandez en ligne ou passez nous voir aux Halles : retrait magasin, livraison Colissimo offerte dès 80 € en France métropolitaine.',
        },
        {
          title: 'Pour toutes les envies',
          description:
            'Anniversaire, fête des pères, première montre ou pièce de collection accessible : nous trouvons le cadeau idéal à chaque budget.',
        },
      ],
    },
    cta: {
      title: 'Prêt à trouver votre montre ?',
      subtitle:
        "Parcourez notre catalogue en ligne ou venez nous rencontrer au centre commercial Place des Halles — c'est avec plaisir que nous vous accueillerons.",
      collectionLabel: 'Découvrir nos montres',
      contactLabel: 'Nous contacter',
    },
    guidePromo: {
      title: t({
        fr: "Le Guide de l'horloger",
        en: "The watchmaker's guide",
        de: 'Der Uhrmacher-Ratgeber',
      }),
      description:
        "Pile, étanchéité, mouvements, verres et fonctions — tout ce qu'il faut savoir pour entretenir votre montre.",
      linkLabel: 'Consulter le guide',
      to: '/guide-horloger',
    },
  },

  servicesPage: {
    hero: {
      eyebrow: 'Atelier & service rapide',
      title: 'Tout pour votre montre, sur place',
      lead: 'Aux Place des Halles, notre horloger intervient sur toutes marques — du changement de pile express à la réparation complète, sans longs délais.',
    },
    workshop: {
      title: 'Horloger & atelier sur place',
      description:
        "Un atelier équipé et un horloger qualifié vous accueillent en boutique. L'essentiel se fait devant vous — pas de renvoi externe pour les interventions courantes.",
    },
    sections: [
      {
        id: 'atelier',
        icon: 'atelier',
        title: 'Réparation & entretien',
        intro: 'Toutes marques, diagnostic et remise en état.',
        items: [
          {
            title: 'Réparation complète',
            description:
              'Montres quartz, automatiques ou mécaniques — prise en charge par notre atelier.',
          },
          {
            title: 'Entretien régulier',
            description: 'Révision, nettoyage et contrôle pour prolonger la vie de votre montre.',
          },
          {
            title: 'Changement de verre',
            description: 'Remplacement du vitrage selon modèle et disponibilité des pièces.',
          },
          {
            title: 'Étanchéité express',
            description: "Test et contrôle réalisés sur place — résultat en moins d'une heure.",
            price: '21 €',
            badge: '< 1 h',
          },
        ],
      },
      {
        id: 'piles',
        icon: 'piles',
        title: 'Piles & petits objets',
        intro: 'Montres, clés de voiture, télécommandes, calculatrices…',
        items: [
          {
            title: 'Pile RENATA SWISS MADE',
            description: 'Pose incluse pour la plupart des montres — qualité suisse reconnue.',
            price: '9 €',
            badge: 'Express',
          },
          {
            title: 'Toutes marques de montres',
            description:
              'Quartz, digitale, connectée ou classique : nous changeons la pile sur place.',
          },
          {
            title: 'Au-delà de la montre',
            description:
              'Clés de voiture, télécommandes, calculatrices et autres objets à pile — même service rapide.',
          },
        ],
      },
      {
        id: 'bracelets',
        icon: 'bracelets',
        title: 'Bracelets',
        intro:
          'Le plus grand choix de bracelets de montres sur Strasbourg — en magasin et pour vos commandes en ligne.',
        items: [
          {
            title: 'Ajustement avant expédition',
            description:
              'Pour toute montre avec bracelet métal commandée en ligne, nous ajustons gratuitement le bracelet à votre tour de poignet avant l’envoi.',
            link: {
              href: publicPath('documents/aide-ajustement-montres.pdf'),
              label: 'Guide de mesure (PDF)',
            },
          },
          {
            title: 'Remplacement sur place',
            description: 'Pose, ajustement et conseil taille directement en magasin.',
          },
          {
            title: 'Large choix',
            description:
              'Cuir, acier, caoutchouc, NATO… pour personnaliser ou renouveler votre bracelet.',
            badge: 'N°1 Strasbourg',
          },
        ],
      },
      {
        id: 'avantages',
        icon: 'avantages',
        title: 'Facilités',
        items: [
          {
            title: 'Paiement en 3 ou 4x',
            description: 'Sans frais par carte bancaire, directement en magasin.',
            badge: 'Sans frais',
          },
          {
            title: 'Extension de garantie',
            description: 'Un an de tranquillité supplémentaire pour votre montre.',
            price: '2 €',
          },
        ],
      },
    ],
    cta: {
      title: 'Passez nous voir aux Halles',
      subtitle: 'Du lundi au samedi, 9h–20h — Centre commercial Place des Halles, Strasbourg.',
      contactLabel: 'Nous contacter',
      phoneLabel: '03 88 22 40 40',
      guideLabel: t({
        fr: "Le Guide de l'horloger",
        en: "The watchmaker's guide",
        de: 'Der Uhrmacher-Ratgeber',
      }),
      guideTo: '/guide-horloger',
      documentLabel: 'Guide ajustement bracelet (PDF)',
      documentHref: publicPath('documents/aide-ajustement-montres.pdf'),
    },
  },

  guidePage,

  copy: {
    footerTagline: t({
      fr: 'Spécialiste de la montre depuis 1995 : vente en ligne et au magasin Place des Halles à Strasbourg, grand choix de marques, livraison Colissimo offerte dès 80 € en France métropolitaine (hors offres ponctuelles). Service client du lundi au samedi, 9h–20h.',
      en: 'Watch specialists since 1995: online and in our Place des Halles store in Strasbourg, a wide choice of brands, free Colissimo delivery from €80 in mainland France (excluding limited-time offers). Customer service Monday to Saturday, 9am–8pm.',
      de: 'Uhrenspezialist seit 1995: online und im Geschäft Place des Halles in Straßburg, große Markenauswahl, kostenlose Colissimo-Lieferung ab 80 € im französischen Mutterland (außer bei Sonderaktionen). Kundenservice Montag bis Samstag, 9–20 Uhr.',
    }),
    copyrightLine: t({
      fr: '© 2026 Place des Montres. Tous droits réservés.',
      en: '© 2026 Place des Montres. All rights reserved.',
      de: '© 2026 Place des Montres. Alle Rechte vorbehalten.',
    }),
    estimationProcessLead: t({
      fr: 'Une question sur un modèle, une taille de bracelet ou une disponibilité ? Notre équipe vous répond par e-mail ou par téléphone avec la même exigence que derrière le comptoir du centre commercial Place des Halles.',
      en: 'A question about a model, a strap size or availability? Our team answers by email or phone with the same care as behind the counter at the Place des Halles shopping centre.',
      de: 'Eine Frage zu einem Modell, einer Armbandgröße oder der Verfügbarkeit? Unser Team antwortet per E-Mail oder Telefon — mit derselben Sorgfalt wie hinter dem Tresen im Einkaufszentrum Place des Halles.',
    }),
    watchSecurityAuthentic: t({
      fr: 'Nous travaillons avec des montres issues de circuits professionnels. Chaque fiche produit de cette démo reflète les données du catalogue connecté : référence, état annoncé et garanties doivent être validés avant toute campagne commerciale.',
      en: 'We work with watches sourced through professional channels. Every product page in this demo reflects the connected catalogue data: reference, stated condition and warranties must be validated before any commercial campaign.',
      de: 'Wir arbeiten mit Uhren aus professionellen Bezugsquellen. Jede Produktseite dieser Demo spiegelt die Daten des angebundenen Katalogs wider: Referenz, angegebener Zustand und Garantien sind vor jeder Verkaufskampagne zu prüfen.',
    }),
    watchSecurityInsurance: t({
      fr: 'Les colis sont expédiés en Colissimo suivi. Pour toute commande sensible ou livraison à l’international, adaptez vos conditions d’assurance transport et vos partenaires logistiques — le site historique mentionne notamment la Corse et Monaco pour la gratuité à partir du seuil d’achat.',
      en: 'Parcels are shipped by tracked Colissimo. For sensitive orders or international delivery, adapt your transport insurance terms and logistics partners — the legacy site mentions Corsica and Monaco in particular for free delivery above the purchase threshold.',
      de: 'Pakete werden per Colissimo mit Sendungsverfolgung versandt. Bei sensiblen Bestellungen oder internationalem Versand passen Sie Transportversicherung und Logistikpartner an — die frühere Website nennt insbesondere Korsika und Monaco für die Versandkostenfreiheit ab dem Bestellwert.',
    }),
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
    blog: false,
    recherche: false,
    estimation: false,
    estimationProcess: false,
    merci: true,
    about: true,
    servicesPage: true,
    guidePage: true,
    legal: true,
    faq: true,
    purchase: true,
    paymentReturn: true,
    admin: true,
    adminWatchPromotions: true,
    cartMultiQuantity: true,
    homeCarousel: true,
    newsletter: true,
  },

  /** Profil catalogue boutique : cartes épurées, bloc confiance sur fiche produit. */
  watchCatalog: {
    mode: 'retail',
    trustHighlights: [
      {
        id: 'envoi',
        icon: 'shipping',
        text: 'Envoi gratuit en 48 h',
      },
      {
        id: 'guarantee',
        icon: 'guarantee',
        text: 'Toutes nos montres sont garanties 2 ans',
      },
      {
        id: 'return',
        icon: 'return',
        text: 'Retour possible sous 30 jours',
      },
    ],
    guarantees: {
      heading: 'Nos garanties et services',
      items: [
        {
          id: 'guarantee',
          icon: 'guarantee',
          title: 'Garantie 2 ans',
          text: 'Toutes nos montres sont couvertes par une garantie de 2 ans. Les modalités précises (constructeur ou vendeur) figurent sur chaque fiche produit.',
        },
        {
          id: 'return',
          icon: 'return',
          title: 'Retour sous 30 jours',
          text: 'Vous disposez de 30 jours pour retourner votre montre si elle ne vous convient pas, dans le respect de nos conditions générales de vente.',
        },
        {
          id: 'shipping',
          icon: 'shipping',
          title: 'Envoi Colissimo suivi',
          text: 'Expédition sous environ 48 h après réception du paiement. Livraison offerte dès 80 € en France métropolitaine. Pour les bracelets métal, ajustement gratuit avant envoi — voir le guide PDF sur la page Nos services.',
        },
        {
          id: 'pickup',
          icon: 'pickup',
          title: 'Retrait au magasin',
          text: 'Commandez en ligne et retirez votre montre au centre commercial Place des Halles, du lundi au samedi de 9h à 20h.',
        },
        {
          id: 'payment',
          icon: 'payment',
          title: 'Paiement sécurisé',
          text: "Règlement en ligne protégé via Stripe. Aucune information bancaire n'est stockée sur nos serveurs.",
        },
        {
          id: 'experience',
          icon: 'experience',
          title: 'Expertise depuis 1995',
          text: 'Spécialiste de la montre à Strasbourg depuis près de 30 ans : conseils, atelier sur place et service client du lundi au samedi.',
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
      freeShippingFrom: 80,
      pickupEnabled: true,
      methods: [
        {
          id: 'colissimo_fr',
          type: 'home',
          label: 'Colissimo suivi — France métropolitaine',
          countries: ['FR', 'MC'],
          fee: { type: 'free_above', amount: 6.9, freeAbove: 80 },
          estimatedDays: 'Expédition sous environ 48 h après réception du paiement',
        },
        {
          id: 'pickup_halles',
          type: 'pickup',
          label: 'Retrait au magasin — Place des Halles',
          fee: { type: 'flat', amount: 0 },
          pickupLocation: {
            name: 'Place des Montres',
            address: 'Centre commercial Place des Halles, 67000 Strasbourg',
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

  receipt: {
    enabled: true,
    documentTitle: 'Reçu de paiement',
    footerNote: 'Merci pour votre confiance — Place des Montres.',
    showWatchImages: true,
    logoPath: publicPath('brand-logo.jpg'),
  },

  collection: {
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

  home: {
    hero: {
      variant: 'compact',
      title: "Votre montre de marque, aujourd'hui.",
      subtitle: "30 ans d'expérience basée à Strasbourg.",
      primaryCta: { label: 'Découvrir nos montres', to: '/collection' },
      secondaryCta: { label: 'Nous contacter', to: '/contact' },
    },
    nouvelles: {
      title: 'Nouvelles arrivées',
      // subtitle: 'Découvrez nos dernières pièces ajoutées à notre sélection',
    },
    stats: {
      items: [
        {
          icon: 'stock',
          value: '3 000',
          label: 'Montres en stock',
          detail: 'Disponibles en ligne ou en boutique',
        },
        {
          icon: 'experience',
          value: '30 ans',
          label: 'D’expérience',
          detail: 'Spécialiste montre depuis 1995',
        },
        {
          icon: 'sparkles',
          value: '30+',
          label: t({
            fr: 'Marques',
            en: 'Brands',
            de: 'Marken',
          }),
          detail: 'Des maisons accessibles aux références Swiss Made',
        },
      ],
      highlights: [
        {
          icon: 'shipping',
          label: 'Envoi gratuit en 48 h',
          detail: 'Offert dès 80 € d’achat en France métropolitaine',
        },
        {
          icon: 'guarantee',
          label: 'Toutes nos montres sont garanties 2 ans',
          detail: 'Extension de garantie disponible en boutique',
        },
        {
          icon: 'return',
          label: 'Retour possible sous 30 jours',
          detail: 'À compter de la réception, montre complète dans son emballage d’origine',
        },
      ],
    },
    aboutPreview: {
      eyebrow: 'Qui sommes-nous ?',
      title: 'Une adresse horlogère au cœur des Place des Halles',
      description:
        'Installée à Strasbourg depuis 1995, notre équipe conseille chaque client avec la même attention : choisir le bon style, comparer les marques, trouver le cadeau idéal ou entretenir sa montre au quotidien.',
      image: publicPath('places/place-des-montres-strasbourg_1.jpg'),
      imageAlt: 'Boutique Place des Montres au centre commercial Place des Halles à Strasbourg',
      ctaLabel: 'Découvrir notre histoire',
      to: '/a-propos',
    },
    sections: [
      'homeCarousel',
      'nouvelles',
      'selections',
      'collectionHighlight',
      // 'stats', // Désactivé côté client (bloc chiffres-clés) — conservé pour réactivation éventuelle.
      'aboutPreview',
      // 'hero',
      // 'trust',
      // 'ventes',
      // 'suivezNous',
      // 'services',
      // 'faq',
    ],
    selections: {
      title: 'Notre sélection du moment',
      /** Visuels : voir `public/home-selections/README.md` et `homeSelections.config.js`. */
      cards: homeSelectionCards,
    },
    /**
     * Bloc éditorial « aperçu collection » : 1 montre vedette + sélection, puis CTA.
     * Montres pilotées depuis l'admin (contexte `collection`) avec repli automatique
     * sur les dernières montres disponibles. Voir `HomeCollectionHighlightSection.vue`.
     */
    collectionHighlight: {
      title: 'Un aperçu de notre collection',
      subtitle:
        'Quelques pièces choisies parmi nos 3 000 montres en stock — découvrez l’ensemble en boutique ou en ligne.',
      cta: { label: 'Voir toute la collection', to: '/collection' },
    },
  },

  navigation: {
    main: [
      {
        type: 'megaMenu',
        label: t({
          fr: 'Nos montres',
          en: 'Our watches',
          de: 'Unsere Uhren',
        }),
        to: '/collection',
        feature: 'collection',
        columns: [
          {
            title: t({
              fr: 'Marques',
              en: 'Brands',
              de: 'Marken',
            }),
            source: 'brands',
            columns: 2,
            footerLink: {
              label: t({
                fr: 'Toutes les marques',
                en: 'All brands',
                de: 'Alle Marken',
              }),
              to: '/collection/marques',
            },
          },
          {
            title: t({
              fr: 'Genre',
              en: 'Gender',
              de: 'Geschlecht',
            }),
            items: [
              {
                label: t({
                  fr: 'Montre homme',
                  en: "Men's watches",
                  de: 'Herrenuhren',
                }),
                to: '/collection?public=homme',
                feature: 'collection',
              },
              {
                label: t({
                  fr: 'Montre femme',
                  en: "Women's watches",
                  de: 'Damenuhren',
                }),
                to: '/collection?public=femme',
                feature: 'collection',
              },
              {
                label: t({
                  fr: 'Montre enfant',
                  en: "Children's watches",
                  de: 'Kinderuhren',
                }),
                to: '/collection?public=enfant',
                feature: 'collection',
              },
            ],
          },
          {
            title: t({
              fr: 'Promotions',
              en: 'Sale',
              de: 'Angebote',
            }),
            titleLink: '/collection?promotion=1',
            dynamicCampaigns: true,
            items: [
              {
                label: t({
                  fr: 'Promotions homme',
                  en: "Men's sale",
                  de: 'Angebote Herren',
                }),
                to: '/collection?promotion=1&public=homme',
                feature: 'collection',
              },
              {
                label: t({
                  fr: 'Promotions femme',
                  en: "Women's sale",
                  de: 'Angebote Damen',
                }),
                to: '/collection?promotion=1&public=femme',
                feature: 'collection',
              },
            ],
          },
        ],
      },
      {
        type: 'link',
        label: t({
          fr: 'Qui sommes-nous',
          en: 'About us',
          de: 'Über uns',
        }),
        to: '/a-propos',
        feature: 'about',
      },
      {
        type: 'link',
        label: t({
          fr: 'Nos services',
          en: 'Our services',
          de: 'Unsere Leistungen',
        }),
        to: '/services',
        feature: 'servicesPage',
      },
      { type: 'link', label: 'FAQ', to: '/faq', feature: 'faq' },
      { type: 'link', label: 'Contact', to: '/contact', feature: 'contact' },
    ],
    footer: [
      {
        label: t({
          fr: 'Accueil',
          en: 'Home',
          de: 'Startseite',
        }),
        to: '/#accueil',
      },
      {
        label: t({
          fr: 'Marques',
          en: 'Brands',
          de: 'Marken',
        }),
        to: '/collection/marques',
        feature: 'collection',
      },
      {
        label: t({
          fr: 'Qui sommes-nous',
          en: 'About us',
          de: 'Über uns',
        }),
        to: '/a-propos',
        feature: 'about',
      },
      {
        label: t({
          fr: 'Nos services',
          en: 'Our services',
          de: 'Unsere Leistungen',
        }),
        to: '/services',
        feature: 'servicesPage',
      },
      {
        label: t({
          fr: "Guide de l'horloger",
          en: "Watchmaker's guide",
          de: 'Uhrmacher-Ratgeber',
        }),
        to: '/guide-horloger',
        feature: 'guidePage',
      },
      { label: 'FAQ', to: '/faq', feature: 'faq' },
      { label: 'Contact', to: '/contact', feature: 'contact' },
    ],
  },

  backend: {
    /**
     * URL du backend Express (Render, etc.). Utilisée au build si VITE_BACKEND_URL
     * n’est pas fournie (ex. GitHub Pages). Sans slash final.
     */
    publicApiUrl: 'https://watch-ecommerce-mp9l.onrender.com',
    cors: {
      /** Origines front autorisées en plus de urls.production / staging / development */
      extraAllowedOrigins: ['https://dodivar.github.io'],
    },
    email: {
      fromName: 'Place des Montres',
      // TODO
      // fromAddress: 'service.client@placedesmontres.fr',
      // toAddress: 'service.client@placedesmontres.fr',
      fromAddress: 'doryandillen@gmail.com',
      toAddress: 'doryandillen@gmail.com',
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
    /**
     * Redirections 301 depuis l’ancien PrestaShop (placedesmontres.fr).
     * Les motifs couvrent les URL produit/catégorie ; `static` pour les pages CMS.
     */
    legacyRedirects: {
      prestashop: {
        productPattern: '/:prestashopId(\\d+)-:rewrite.html',
        productDestination: '/montre/:rewrite',
        categoryPattern: '/:prestashopId(\\d+)-:rewrite',
        categoryDestination: '/collection/:rewrite',
      },
      static: [
        { source: '/content/6-mentions-legales', destination: '/mentions-legales' },
        {
          source: '/content/3-conditions-utilisation',
          destination: '/conditions-generales-utilisation',
        },
        { source: '/content/1-livraison', destination: '/faq' },
        { source: '/contactez-nous', destination: '/contact' },
        { source: '/magasins', destination: '/a-propos' },
      ],
    },
    indexHtml: {
      title: t({
        fr: 'Place des Montres — Montres à Strasbourg depuis 1995',
        en: 'Place des Montres — Watches in Strasbourg since 1995',
        de: 'Place des Montres — Uhren in Straßburg seit 1995',
      }),
      metaDescription: t({
        fr: 'Spécialiste montres à Strasbourg (Place des Halles) : homme, femme, enfant. Large choix, livraison Colissimo offerte dès 80 € en France métropolitaine, service client du lundi au samedi (9h–20h).',
        en: 'Watch specialists in Strasbourg (Place des Halles): men, women, children. Wide choice, free Colissimo delivery from €80 in mainland France, customer service Monday to Saturday (9am–8pm).',
        de: 'Uhrenspezialist in Straßburg (Place des Halles): Herren, Damen, Kinder. Große Auswahl, kostenlose Colissimo-Lieferung ab 80 € im französischen Mutterland, Kundenservice Montag bis Samstag (9–20 Uhr).',
      }),
      keywords: t({
        fr: 'montres Strasbourg, Place des Halles, horlogerie, montre homme, femme, enfant, Swiss Made, Colissimo, Place des Montres',
        en: "watches Strasbourg, Place des Halles, watchmaking, men's watch, women's watch, children's watch, Swiss Made, Colissimo, Place des Montres",
        de: 'Uhren Straßburg, Place des Halles, Uhrmacherei, Herrenuhr, Damenuhr, Kinderuhr, Swiss Made, Colissimo, Place des Montres',
      }),
      author: 'Place des Montres',
      ogTitle: t({
        fr: 'Place des Montres — Horlogerie & e-commerce',
        en: 'Place des Montres — Watchmaking & e-commerce',
        de: 'Place des Montres — Uhren & E-Commerce',
      }),
      ogDescription: t({
        fr: 'Depuis 1995, votre spécialiste montre à Strasbourg : catalogue en ligne, retrait magasin, conseils experts.',
        en: 'Your watch specialist in Strasbourg since 1995: online catalogue, in-store collection, expert advice.',
        de: 'Seit 1995 Ihr Uhrenspezialist in Straßburg: Online-Katalog, Abholung im Geschäft, fachkundige Beratung.',
      }),
      twitterCard: 'summary_large_image',
      twitterTitle: t({
        fr: 'Place des Montres — Strasbourg',
        en: 'Place des Montres — Strasbourg',
        de: 'Place des Montres — Straßburg',
      }),
      twitterDescription: t({
        fr: 'Montres pour toute la famille, livraison suivie, équipe joignable du lundi au samedi.',
        en: 'Watches for the whole family, tracked delivery, a team reachable Monday to Saturday.',
        de: 'Uhren für die ganze Familie, Versand mit Sendungsverfolgung, Team von Montag bis Samstag erreichbar.',
      }),
      ogLocale: 'fr_FR',
      ogSiteName: 'Place des Montres',
      appleMobileWebAppTitle: 'Place des Montres',
      ogImagePath: '/brand-logo.jpg',
    },
    home: {
      title: t({
        fr: 'Place des Montres — Montres de marque à Strasbourg & en ligne',
        en: 'Place des Montres — Branded watches in Strasbourg & online',
        de: 'Place des Montres — Markenuhren in Straßburg & online',
      }),
      metaDescription: t({
        fr: "Plus de 3 000 montres en stock, une trentaine de marques : découvrez l'offre Place des Montres. Retrait au centre commercial Place des Halles ou livraison Colissimo offerte dès 80 € (France métropolitaine).",
        en: 'Over 3,000 watches in stock across some thirty brands: discover the Place des Montres range. Collect at the Place des Halles shopping centre or get free Colissimo delivery from €80 (mainland France).',
        de: 'Über 3.000 Uhren am Lager, rund dreißig Marken: Entdecken Sie das Angebot von Place des Montres. Abholung im Einkaufszentrum Place des Halles oder kostenlose Colissimo-Lieferung ab 80 € (französisches Mutterland).',
      }),
      ogTitle: t({
        fr: 'Place des Montres — Strasbourg & e-commerce',
        en: 'Place des Montres — Strasbourg & e-commerce',
        de: 'Place des Montres — Straßburg & E-Commerce',
      }),
      ogDescription: t({
        fr: 'Expert montres depuis 1995 : sélection large, prix transparents, service client réactif.',
        en: 'Watch experts since 1995: a broad selection, transparent prices, responsive customer service.',
        de: 'Uhrenexperte seit 1995: große Auswahl, transparente Preise, reaktionsschneller Kundenservice.',
      }),
      twitterTitle: t({
        fr: 'Place des Montres — Accueil',
        en: 'Place des Montres — Home',
        de: 'Place des Montres — Startseite',
      }),
      twitterDescription: t({
        fr: 'Montres homme, femme, enfant — boutique Place des Halles et boutique en ligne.',
        en: 'Watches for men, women and children — the Place des Halles store and our online shop.',
        de: 'Uhren für Herren, Damen und Kinder — Geschäft Place des Halles und Onlineshop.',
      }),
    },
    blog: {
      title: t({
        fr: 'Blog Horlogerie | Place des Montres',
        en: 'Watchmaking Blog | Place des Montres',
        de: 'Uhren-Blog | Place des Montres',
      }),
      metaDescription: t({
        fr: "Conseils d'achat, tendances et actu montres par l'équipe Place des Montres à Strasbourg.",
        en: 'Buying advice, trends and watch news from the Place des Montres team in Strasbourg.',
        de: 'Kauftipps, Trends und Uhren-News vom Team von Place des Montres in Straßburg.',
      }),
      ogTitle: t({
        fr: 'Blog | Place des Montres',
        en: 'Blog | Place des Montres',
        de: 'Blog | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Articles et guides pour bien choisir sa montre.',
        en: 'Articles and guides to help you choose the right watch.',
        de: 'Artikel und Ratgeber für die richtige Uhrenwahl.',
      }),
      twitterTitle: t({
        fr: 'Blog Place des Montres',
        en: 'Place des Montres Blog',
        de: 'Place des Montres Blog',
      }),
      twitterDescription: t({
        fr: 'Horlogerie et lifestyle montre.',
        en: 'Watchmaking and watch lifestyle.',
        de: 'Uhrmacherkunst und Uhren-Lifestyle.',
      }),
      articleFallbackTitle: t({
        fr: 'Article - Place des Montres',
        en: 'Article - Place des Montres',
        de: 'Artikel - Place des Montres',
      }),
      articleTitleBlogSuffix: t({
        fr: '| Blog Place des Montres',
        en: '| Place des Montres Blog',
        de: '| Place des Montres Blog',
      }),
      structuredDataPublisherName: 'Place des Montres',
    },
    collection: {
      title: t({
        fr: 'Collection montres | Place des Montres',
        en: 'Watch collection | Place des Montres',
        de: 'Uhrenkollektion | Place des Montres',
      }),
      metaDescription: t({
        fr: 'Parcourez les montres homme, femme et enfant : filtres par marque, public et budget. Stock mis à jour depuis notre catalogue.',
        en: 'Browse watches for men, women and children: filter by brand, audience and budget. Stock updated from our catalogue.',
        de: 'Stöbern Sie in Uhren für Herren, Damen und Kinder: Filter nach Marke, Zielgruppe und Budget. Bestand aus unserem Katalog aktualisiert.',
      }),
      ogTitle: t({
        fr: 'Collection | Place des Montres',
        en: 'Collection | Place des Montres',
        de: 'Kollektion | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Montres de marque — Strasbourg et livraison France.',
        en: 'Branded watches — Strasbourg and delivery across France.',
        de: 'Markenuhren — Straßburg und Lieferung in ganz Frankreich.',
      }),
      twitterTitle: t({
        fr: 'Collection Place des Montres',
        en: 'Place des Montres collection',
        de: 'Kollektion Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Trouvez la montre adaptée à votre style.',
        en: 'Find the watch that matches your style.',
        de: 'Finden Sie die Uhr, die zu Ihrem Stil passt.',
      }),
    },
    brandsIndex: {
      h1: t({
        fr: 'Toutes les marques',
        en: 'All brands',
        de: 'Alle Marken',
      }),
      title: t({
        fr: 'Marques de montres | Place des Montres Strasbourg',
        en: 'Watch brands | Place des Montres Strasbourg',
        de: 'Uhrenmarken | Place des Montres Straßburg',
      }),
      metaDescription: t({
        fr: 'Découvrez les maisons présentes chez Place des Montres : accès rapide à chaque univers de collection.',
        en: 'Discover the houses stocked at Place des Montres, with quick access to each collection.',
        de: 'Entdecken Sie die Marken bei Place des Montres — mit schnellem Zugang zu jeder Kollektion.',
      }),
      ogTitle: t({
        fr: 'Marques | Place des Montres',
        en: 'Brands | Place des Montres',
        de: 'Marken | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Du grand classique aux montres tendance — sélection expert.',
        en: 'From great classics to on-trend watches — an expert selection.',
        de: 'Von großen Klassikern bis zu Trenduhren — eine Auswahl vom Experten.',
      }),
      twitterTitle: t({
        fr: 'Marques | Place des Montres',
        en: 'Brands | Place des Montres',
        de: 'Marken | Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Les marques du moment à Strasbourg.',
        en: 'The brands of the moment in Strasbourg.',
        de: 'Die angesagten Marken in Straßburg.',
      }),
    },
    brandCollection: {
      title: t({
        fr: '{brand} | Collection | Place des Montres',
        en: '{brand} | Collection | Place des Montres',
        de: '{brand} | Kollektion | Place des Montres',
      }),
      metaDescription: t({
        fr: 'Montres {brand} : filtres par public et budget. Conseils et disponibilité auprès de notre équipe.',
        en: '{brand} watches: filter by audience and budget. Advice and availability from our team.',
        de: '{brand}-Uhren: Filter nach Zielgruppe und Budget. Beratung und Verfügbarkeit über unser Team.',
      }),
      titleFallback: t({
        fr: 'Collection par marque | Place des Montres',
        en: 'Collection by brand | Place des Montres',
        de: 'Kollektion nach Marke | Place des Montres',
      }),
      metaDescriptionFallback: t({
        fr: 'Montres par marque — filtres par public et prix.',
        en: 'Watches by brand — filter by audience and price.',
        de: 'Uhren nach Marke — Filter nach Zielgruppe und Preis.',
      }),
    },
    watchDetail: {
      titleFallback: t({
        fr: 'Montre - Place des Montres',
        en: 'Watch - Place des Montres',
        de: 'Uhr - Place des Montres',
      }),
      titlePriceSuffix: ' | Place des Montres',
      descriptionFallback: t({
        fr: 'Découvrez cette montre chez Place des Montres.',
        en: 'Discover this watch at Place des Montres.',
        de: 'Entdecken Sie diese Uhr bei Place des Montres.',
      }),
      structuredDataSellerName: 'Place des Montres',
    },
    aPropos: {
      title: t({
        fr: 'Qui sommes-nous ? — Place des Montres, spécialiste depuis 1995',
        en: 'About us — Place des Montres, specialists since 1995',
        de: 'Über uns — Place des Montres, Spezialist seit 1995',
      }),
      metaDescription: t({
        fr: 'Place des Montres à Strasbourg (Place des Halles) : près de 3 000 montres, une trentaine de marques, conseils experts depuis 1995. Sport, élégance, mécanique — venez découvrir notre univers.',
        en: 'Place des Montres in Strasbourg (Place des Halles): close to 3,000 watches, some thirty brands and expert advice since 1995. Sport, elegance, mechanical — come and explore our world.',
        de: 'Place des Montres in Straßburg (Place des Halles): rund 3.000 Uhren, etwa dreißig Marken und fachkundige Beratung seit 1995. Sport, Eleganz, Mechanik — entdecken Sie unsere Welt.',
      }),
      ogTitle: t({
        fr: 'Qui sommes-nous | Place des Montres',
        en: 'About us | Place des Montres',
        de: 'Über uns | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Spécialiste montres depuis 1995 au centre commercial Place des Halles : expérience, proximité et large choix pour toutes les envies.',
        en: 'Watch specialists since 1995 at the Place des Halles shopping centre: experience, a local presence and a wide choice for every taste.',
        de: 'Uhrenspezialist seit 1995 im Einkaufszentrum Place des Halles: Erfahrung, Nähe und große Auswahl für jeden Geschmack.',
      }),
      twitterTitle: t({
        fr: 'Qui sommes-nous — Place des Montres',
        en: 'About us — Place des Montres',
        de: 'Über uns — Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Expertise horlogère et accueil chaleureux à Strasbourg depuis 1995.',
        en: 'Watchmaking expertise and a warm welcome in Strasbourg since 1995.',
        de: 'Uhrmacherkompetenz und herzlicher Empfang in Straßburg seit 1995.',
      }),
    },
    servicesPage: {
      title: t({
        fr: 'Nos services horlogerie | Place des Montres Strasbourg',
        en: 'Our watchmaking services | Place des Montres Strasbourg',
        de: 'Unsere Uhrmacher-Leistungen | Place des Montres Straßburg',
      }),
      metaDescription: t({
        fr: 'Pile RENATA 9 €, étanchéité en 1 h (21 €), réparation toutes marques, bracelets et financement 3/4x sans frais — horloger sur place aux Place des Halles.',
        en: 'RENATA battery €9, water-resistance testing in 1 hour (€21), repairs for all brands, straps and interest-free payment in 3 or 4 instalments — watchmaker on site at Place des Halles.',
        de: 'RENATA-Batterie 9 €, Dichtheitsprüfung in 1 Stunde (21 €), Reparatur aller Marken, Armbänder und zinsfreie Ratenzahlung in 3 oder 4 Raten — Uhrmacher vor Ort in der Place des Halles.',
      }),
      ogTitle: t({
        fr: 'Services horlogerie | Place des Montres',
        en: 'Watchmaking services | Place des Montres',
        de: 'Uhrmacher-Leistungen | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Atelier sur place à Strasbourg : piles, étanchéité, réparation, bracelets et extension de garantie à prix clairs.',
        en: 'On-site workshop in Strasbourg: batteries, water resistance, repairs, straps and extended warranty at clear prices.',
        de: 'Werkstatt vor Ort in Straßburg: Batterien, Dichtheit, Reparaturen, Armbänder und Garantieverlängerung zu klaren Preisen.',
      }),
      twitterTitle: t({
        fr: 'Nos services — Place des Montres',
        en: 'Our services — Place des Montres',
        de: 'Unsere Leistungen — Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Horloger sur place aux Halles : piles, réparation, bracelets et paiement en plusieurs fois.',
        en: 'Watchmaker on site at Les Halles: batteries, repairs, straps and payment in instalments.',
        de: 'Uhrmacher vor Ort in Les Halles: Batterien, Reparaturen, Armbänder und Ratenzahlung.',
      }),
    },
    guidePage: {
      title: t({
        fr: "Le Guide de l'horloger | Place des Montres",
        en: "The watchmaker's guide | Place des Montres",
        de: 'Der Uhrmacher-Ratgeber | Place des Montres',
      }),
      metaDescription: t({
        fr: "Conseils d'entretien horloger : pile, étanchéité, mouvements, types de verre, boîtiers et fonctions de montre — par l'équipe Place des Montres à Strasbourg.",
        en: 'Watch care advice: battery, water resistance, movements, crystal types, cases and watch functions — from the Place des Montres team in Strasbourg.',
        de: 'Pflegetipps rund um die Uhr: Batterie, Dichtheit, Uhrwerke, Glasarten, Gehäuse und Uhrenfunktionen — vom Team von Place des Montres in Straßburg.',
      }),
      ogTitle: t({
        fr: "Le Guide de l'horloger | Place des Montres",
        en: "The watchmaker's guide | Place des Montres",
        de: 'Der Uhrmacher-Ratgeber | Place des Montres',
      }),
      ogDescription: t({
        fr: "Tout savoir sur l'entretien de votre montre : pile, étanchéité, mouvements et complications expliqués simplement.",
        en: 'Everything about caring for your watch: battery, water resistance, movements and complications explained simply.',
        de: 'Alles zur Pflege Ihrer Uhr: Batterie, Dichtheit, Uhrwerke und Komplikationen einfach erklärt.',
      }),
      twitterTitle: t({
        fr: "Guide de l'horloger — Place des Montres",
        en: "Watchmaker's guide — Place des Montres",
        de: 'Uhrmacher-Ratgeber — Place des Montres',
      }),
      twitterDescription: t({
        fr: "Entretien, étanchéité et fonctionnement des montres — conseils d'experts.",
        en: 'Care, water resistance and how watches work — expert advice.',
        de: 'Pflege, Dichtheit und Funktionsweise von Uhren — Expertentipps.',
      }),
    },
    faq: {
      title: t({
        fr: 'FAQ | Place des Montres — Commande, livraison et garanties',
        en: 'FAQ | Place des Montres — Ordering, delivery and warranties',
        de: 'FAQ | Place des Montres — Bestellung, Lieferung und Garantien',
      }),
      metaDescription: t({
        fr: 'Réponses aux questions fréquentes : stock, paiement sécurisé, Colissimo offert dès 80 €, retrait aux Halles, retour sous 30 jours, garantie 2 ans et service client.',
        en: 'Answers to common questions: stock, secure payment, free Colissimo from €80, collection at Les Halles, 30-day returns, 2-year warranty and customer service.',
        de: 'Antworten auf häufige Fragen: Bestand, sichere Zahlung, kostenloses Colissimo ab 80 €, Abholung in Les Halles, 30 Tage Rückgabe, 2 Jahre Garantie und Kundenservice.',
      }),
      ogTitle: t({
        fr: 'FAQ | Place des Montres',
        en: 'FAQ | Place des Montres',
        de: 'FAQ | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Commande, livraison, paiement, retours, garanties et service client — toutes les réponses pour acheter en confiance.',
        en: 'Ordering, delivery, payment, returns, warranties and customer service — every answer you need to buy with confidence.',
        de: 'Bestellung, Lieferung, Zahlung, Rücksendungen, Garantien und Kundenservice — alle Antworten für einen sorgenfreien Kauf.',
      }),
      twitterTitle: t({
        fr: 'FAQ — Place des Montres',
        en: 'FAQ — Place des Montres',
        de: 'FAQ — Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Colissimo, retrait Strasbourg, retour 30 jours, garantie 2 ans — vos questions, nos réponses.',
        en: 'Colissimo, collection in Strasbourg, 30-day returns, 2-year warranty — your questions, our answers.',
        de: 'Colissimo, Abholung in Straßburg, 30 Tage Rückgabe, 2 Jahre Garantie — Ihre Fragen, unsere Antworten.',
      }),
    },
    politique: {
      title: t({
        fr: 'Politique de confidentialité | Place des Montres',
        en: 'Privacy policy | Place des Montres',
        de: 'Datenschutzerklärung | Place des Montres',
      }),
      metaDescription: t({
        fr: 'Politique de confidentialité : traitement des données clients, cookies, newsletters et paiements en ligne.',
        en: 'Privacy policy: customer data processing, cookies, newsletters and online payments.',
        de: 'Datenschutzerklärung: Verarbeitung von Kundendaten, Cookies, Newsletter und Online-Zahlungen.',
      }),
      ogTitle: t({
        fr: 'Confidentialité | Place des Montres',
        en: 'Privacy | Place des Montres',
        de: 'Datenschutz | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Vos données et vos droits RGPD.',
        en: 'Your data and your GDPR rights.',
        de: 'Ihre Daten und Ihre DSGVO-Rechte.',
      }),
      twitterTitle: t({
        fr: 'Confidentialité | Place des Montres',
        en: 'Privacy | Place des Montres',
        de: 'Datenschutz | Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Protection des données personnelles.',
        en: 'Personal data protection.',
        de: 'Schutz personenbezogener Daten.',
      }),
    },
    mentions: {
      title: t({
        fr: 'Mentions légales | Place des Montres',
        en: 'Legal notice | Place des Montres',
        de: 'Impressum | Place des Montres',
      }),
      metaDescription: t({
        fr: 'Mentions légales du site placedesmontres.fr : éditeur, hébergement, propriété intellectuelle.',
        en: 'Legal notice for placedesmontres.fr: publisher, hosting, intellectual property.',
        de: 'Impressum von placedesmontres.fr: Herausgeber, Hosting, geistiges Eigentum.',
      }),
      ogTitle: t({
        fr: 'Mentions légales | Place des Montres',
        en: 'Legal notice | Place des Montres',
        de: 'Impressum | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Informations réglementaires sur la boutique en ligne.',
        en: 'Regulatory information about the online shop.',
        de: 'Rechtliche Angaben zum Onlineshop.',
      }),
      twitterTitle: t({
        fr: 'Mentions légales | Place des Montres',
        en: 'Legal notice | Place des Montres',
        de: 'Impressum | Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Éditeur et cadre juridique.',
        en: 'Publisher and legal framework.',
        de: 'Herausgeber und rechtlicher Rahmen.',
      }),
    },
    cgu: {
      title: t({
        fr: 'Conditions générales de vente | Place des Montres',
        en: 'Terms and conditions of sale | Place des Montres',
        de: 'Allgemeine Geschäftsbedingungen | Place des Montres',
      }),
      metaDescription: t({
        fr: 'CGV : commande, paiement, livraison, rétractation, garanties légales et contractuelles.',
        en: 'T&Cs: ordering, payment, delivery, withdrawal, statutory and contractual warranties.',
        de: 'AGB: Bestellung, Zahlung, Lieferung, Widerruf, gesetzliche und vertragliche Garantien.',
      }),
      ogTitle: t({
        fr: 'CGV | Place des Montres',
        en: 'T&Cs | Place des Montres',
        de: 'AGB | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Modalités de vente à distance et en magasin.',
        en: 'Terms for distance and in-store sales.',
        de: 'Bedingungen für Fernabsatz und Ladenverkauf.',
      }),
      twitterTitle: t({
        fr: 'CGV | Place des Montres',
        en: 'T&Cs | Place des Montres',
        de: 'AGB | Place des Montres',
      }),
      twitterDescription: t({
        fr: 'Conditions générales de vente.',
        en: 'Terms and conditions of sale.',
        de: 'Allgemeine Geschäftsbedingungen.',
      }),
    },
  },
}
