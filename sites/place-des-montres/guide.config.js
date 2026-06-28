/**
 * Contenu éditorial — Le Guide de l'horloger (Place des Montres).
 * Images : placer les fichiers dans `sites/place-des-montres/public/guide/`.
 */
import { publicPath } from '../../packages/base/src/utils/publicPath.js'

export default {
  hero: {
    eyebrow: "Conseils d'entretien",
    title: "Le Guide de l'horloger",
    lead:
      "Pile, étanchéité, mouvements, verres et fonctions : les réponses essentielles pour entretenir votre montre et préserver sa garantie.",
    image: {
      src: publicPath('guide/hero.jpg'),
      alt: 'Atelier horloger Place des Montres — Place des Halles, Strasbourg',
      placeholderLabel: 'Atelier horloger — Place des Halles',
    },
  },

  toc: [
    { id: 'pile', label: 'La pile', icon: 'battery' },
    { id: 'etancheite', label: 'Étanchéité', icon: 'water' },
    { id: 'mouvement', label: 'Mouvement', icon: 'mechanics' },
    { id: 'verre', label: 'Types de verre', icon: 'glass' },
    { id: 'boitiers', label: 'Boîtiers', icon: 'case' },
    { id: 'fonctions', label: 'Fonctions', icon: 'functions' },
  ],

  sections: [
    {
      id: 'pile',
      title: 'La pile',
      icon: 'battery',
      layout: 'faq',
      intro: "Lorsque la montre ne fonctionne plus, c'est la première chose à vérifier.",
      image: {
        src: publicPath('guide/pile.jpg'),
        alt: 'Changement de pile de montre en atelier horloger',
        placeholderLabel: 'Changement de pile en atelier',
      },
      items: [
        {
          question: 'Où changer sa pile ?',
          answer:
            "Chez un horloger dépositaire agréé de votre marque. Faire appel à un autre intervenant peut endommager la montre et vous faire perdre la garantie.",
        },
        {
          question: 'Puis-je changer la pile moi-même ?',
          answer:
            "Mieux vaut éviter : fonds de boîtier et systèmes de bride de pile sont de plus en plus complexes. De nombreuses montres arrivent en magasin abîmées par leur propriétaire, parfois de façon irréversible — et la garantie peut être perdue.",
        },
        {
          question: 'Quel type de pile faut-il mettre dans une montre ?',
          answer:
            "Pour une montre donnée, un seul type de pile convient ; la référence peut varier selon les marques. Un horloger agréé vous garantit une pile de marque, et non une pile d'origine douteuse susceptible de couler dans le mouvement.",
        },
      ],
    },
    {
      id: 'etancheite',
      title: 'Étanchéité',
      icon: 'water',
      layout: 'mixed',
      image: {
        src: publicPath('guide/etancheite.jpg'),
        alt: "Contrôle d'étanchéité d'une montre sous cloche",
        placeholderLabel: "Contrôle d'étanchéité sous cloche",
      },
      items: [
        {
          question: "Comment sont établies les normes d'étanchéité ?",
          answer:
            "Les normes d'étanchéité sont souvent mal comprises. Elles correspondent à une mesure réalisée dans des appareils dédiés (test hyperbare ou hypobare). Ces tests mesurent la résistance de la montre à une pression donnée, sur une montre neuve, avec des joints neufs et à température constante.",
        },
        {
          question: "À quoi correspondent les marquages d'étanchéité ?",
          answer:
            "Les normes sont le plus souvent gravées sur le fond de boîtier, parfois sur le cadran. Consultez le tableau ci-dessous pour connaître l'usage recommandé.",
        },
        {
          question: "Évolution de l'étanchéité au fil du temps",
          answer:
            "Les joints se détériorent plus vite s'ils sont sollicités : pression, dépression, eau chaude, eau salée, savon… Après chaque ouverture — notamment lors d'un changement de pile —, refaites un test d'étanchéité chez un dépositaire agréé. Les plongeurs soumettant leur montre à de fortes pressions veilleront à un contrôle annuel, même sans pile (montre automatique ou Kinetic). Un verre ébréché ou un poussoir tordu peut créer une voie d'eau. Sur les montres très étanches, la couronne doit toujours être vissée, sinon la montre n'est plus étanche.",
        },
        {
          question: "Suis-je obligé de refaire l'étanchéité lors d'un changement de pile ?",
          answer:
            "Si la montre est encore sous garantie et que le changement de pile est effectué sans contrôle d'étanchéité, elle perd sa garantie. Refaire l'étanchéité fait partie de l'entretien courant, comme pour tout objet étanche (appareil photo, profondimètre…). Sans ce contrôle, le risque de prise d'eau n'est pas exclu — et l'étanchéité protège aussi le mouvement de la poussière, de la pluie et de la transpiration.",
        },
        {
          question: "Que faire si ma montre a pris l'eau ?",
          answer:
            "Le mouvement d'une montre n'apprécie pas l'eau, comme tout mécanisme. Rendez-vous le plus rapidement possible chez un dépositaire de la marque pour ouvrir la montre et la faire sécher à l'étuve.",
        },
        {
          question: "En quoi consiste le contrôle d'étanchéité ?",
          answer:
            "L'horloger vérifie d'abord l'état général : verre, joint de verre, tige-couronne, poussoir, boîtier… Il ouvre ensuite la montre pour changer le joint de fond de boîtier, le plus important, et traite les joints de poussoirs et de tige-couronne au silicone. La montre est soigneusement refermée, puis placée dans un testeur sous cloche avec un micromètre mesurant les variations de volume du boîtier. L'appareil procède à des surpressions et dépressions : si le boîtier réagit conformément, le test est réussi ; sinon, l'horloger identifie et remplace le joint défaillant.",
        },
        {
          question: 'Que faire après la baignade ?',
          answer:
            "Après chaque passage en mer ou en piscine, rincez votre montre à l'eau claire (douche ou robinet). Le sel et le chlore peuvent endommager progressivement les joints d'étanchéité.",
        },
        {
          question: 'Puis-je prendre la douche ou le bain avec ma montre ?',
          answer:
            "Mieux vaut éviter : l'eau chaude et savonneuse dessèche prématurément les joints.",
        },
      ],
      referenceTable: [
        {
          marking: 'Aucun marquage',
          usage: "La montre n'est pas considérée comme étanche.",
        },
        {
          marking: '30 m, Water-resistant, Water-proof, 3 atm ou 3 bar',
          usage: "Étanche au lavage des mains, à la sudation et à l'immersion accidentelle.",
        },
        {
          marking: '50 m, 5 atm ou 5 bar',
          usage: 'Étanche à la baignade.',
        },
        {
          marking: '100 m, 10 atm ou 10 bar',
          usage: 'Étanche à la baignade et à l\'apnée jusqu\'à 10 m maximum.',
        },
        {
          marking: '> 200 m, 20 atm ou 20 bar',
          usage: 'Étanche à la plongée bouteille.',
        },
      ],
    },
    {
      id: 'mouvement',
      title: "Mouvement d'une montre",
      icon: 'mechanics',
      layout: 'definitions',
      intro:
        "Le mouvement désigne l'ensemble des mécanismes qui indiquent les unités de temps : heures, minutes, secondes.",
      image: {
        src: publicPath('guide/mouvement.jpg'),
        alt: 'Mouvement mécanique, automatique et quartz',
        placeholderLabel: 'Mouvement mécanique / automatique / quartz',
      },
      definitions: [
        {
          title: 'Mouvement mécanique',
          description:
            "Mouvement avec remontoir, ressort et rouages. Le remontage se fait à la main. Aucune pile ni composant électronique à l'intérieur du mécanisme.",
        },
        {
          title: 'Montre automatique',
          description:
            "Montre mécanique équipée d'un rotor : elle se remonte avec le mouvement du poignet, et également à la main.",
        },
        {
          title: 'Mouvement à quartz',
          description:
            "Fonctionne avec une pile alimentant la vibration d'un cristal de quartz. L'heure s'affiche par aiguilles (analogique) ou cristaux liquides (digitale). L'énergie est fournie par une pile ou une batterie.",
        },
      ],
      precision: {
        title: 'Quelle est la précision d\'un mouvement ?',
        rows: [
          { type: 'Mécanique', value: '5 à 30 secondes par jour' },
          { type: 'Quartz', value: 'Environ 5 secondes par mois' },
        ],
        note: "Un mouvement à quartz est environ 60 fois plus précis qu'un mouvement mécanique.",
      },
    },
    {
      id: 'verre',
      title: 'Les différents types de verre',
      icon: 'glass',
      layout: 'cards',
      image: {
        src: publicPath('guide/verre.jpg'),
        alt: 'Verre plexiglas, minéral et saphir sur montres',
        placeholderLabel: 'Plexiglas, minéral et saphir',
      },
      cards: [
        {
          title: 'Verre plexiglas',
          description:
            'Souvent utilisé sur les montres sportives : très léger, souple et d\'une bonne qualité optique.',
        },
        {
          title: 'Verre minéral',
          description:
            'Le plus courant. Très bonne qualité optique, bonne résistance aux rayures, à la pression et aux chocs, mais assez lourd.',
        },
        {
          title: 'Verre saphir',
          description:
            'Cristal synthétique très pur, grande transparence, très dur et quasiment inrayable. Équipe en général les montres haut de gamme.',
        },
      ],
    },
    {
      id: 'boitiers',
      title: 'Les boîtiers',
      icon: 'case',
      layout: 'cards',
      image: {
        src: publicPath('guide/boitiers.jpg'),
        alt: 'Boîtiers de montre en acier, PVD, céramique et titane',
        placeholderLabel: 'Acier, PVD, céramique, titane',
      },
      cards: [
        {
          title: 'Acier inoxydable',
          description:
            'Alliage de fer et de carbone enrichi de chrome et d\'autres éléments pour résister à la corrosion. Les montres actuelles ne contiennent plus de nickel, allergène le plus courant.',
        },
        {
          title: 'PVD',
          description:
            'Physical Vapor Deposition — procédé le plus utilisé pour teinter le métal (foncé, doré, etc.).',
        },
        {
          title: 'Céramique',
          description:
            'Loin de la céramique artisanale : l\'industrie horlogère en optimise les propriétés. Aspect très brillant permanent et surface quasiment anti-rayures.',
        },
        {
          title: 'Titane',
          description:
            'Métal léger, très résistant, aspect gris métallique souvent mat. Aucune allergie connue au titane.',
        },
      ],
    },
    {
      id: 'fonctions',
      title: 'Les fonctions',
      icon: 'functions',
      layout: 'features',
      image: {
        src: publicPath('guide/fonctions.jpg'),
        alt: 'Cadran de montre avec complications et fonctions',
        placeholderLabel: 'Cadran et complications',
      },
      groups: [
        {
          label: 'Affichage',
          items: [
            {
              term: 'Dateur',
              description:
                'Indique le jour du mois (du 1er au 31). Les mois de moins de 31 jours demandent un réglage manuel. Peut être complété par les jours de la semaine (lundi au dimanche).',
            },
            {
              term: "Réglage du dateur (montre analogique)",
              description:
                "Tirez deux fois sur la couronne pour régler l'heure. Si la date change au passage de minuit (aiguille à 12 h), le mécanisme indique minuit ; sinon, midi. Réglez l'heure exacte (deux tours de cadran = 24 h), renfoncez la couronne une fois, puis réglez la date. D'autre part, la montre avancera jusqu'au 31 chaque mois (sauf montres perpétuelles) : réajustez la date tous les deux mois.",
            },
            {
              term: 'Format 24 h',
              description:
                "Utile sur les montres digitales pour distinguer 2 h du matin de 14 h l'après-midi.",
            },
          ],
        },
        {
          label: 'Chronométrie',
          items: [
            {
              term: 'Chronomètre',
              description:
                "Ce n'est pas une fonction : le chronomètre désigne une précision contrôlée par des laboratoires spécialisés. Un certificat de chronométrie indique la précision exacte de la montre, très élevée quel que soit l'organisme de certification.",
            },
            {
              term: 'Chronographe',
              description:
                "Fonction mesurant le temps écoulé. L'aiguille centrale comptabilise les secondes ; les compteurs indiquent le cumul chronométré (heures, minutes, dixièmes de seconde…).",
            },
            {
              term: 'Compte à rebours',
              description:
                "Décompte un temps donné jusqu'au déclenchement d'une alarme. Des modèles à répétition existent.",
            },
            {
              term: 'Tachymètre',
              description:
                "Graduations circulaires au bord du cadran pour mesurer une vitesse. Avec l'aiguille centrale des secondes du chronographe, chronométrez le temps pour parcourir 1 km : au stop, le tachymètre indique la vitesse moyenne.",
            },
          ],
        },
        {
          label: 'Synchronisation et énergie',
          items: [
            {
              term: 'Radio-piloté',
              description:
                "La montre reçoit les signaux d'un émetteur radio diffusant l'heure d'une horloge atomique au césium. Elle se synchronise plusieurs fois par jour ; chaque continent dispose d'un émetteur.",
            },
            {
              term: 'Montre solaire',
              description:
                "Le cadran transforme la lumière en énergie, stockée dans une batterie rechargeable intégrée. La montre fonctionne alors comme une montre à quartz. L'autonomie peut atteindre un mois.",
            },
          ],
        },
        {
          label: 'Pratique',
          items: [
            {
              term: 'Alarme',
              description:
                "Fonction réveil, le plus souvent sur les montres digitales, rarement sur les analogiques. Plusieurs alarmes programmables sont possibles.",
            },
            {
              term: 'Boussole',
              description:
                'Indique les points cardinaux ; version électronique pour ne pas interférer avec le mouvement.',
            },
            {
              term: 'Baromètre',
              description: 'Indique la pression atmosphérique, le plus souvent en hPa.',
            },
            {
              term: 'Altimètre',
              description:
                "Indique l'altitude en fonction de la pression atmosphérique. Pour plus de précision, étalonnez-le avant une randonnée.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    title: 'Besoin d\'un entretien en boutique ?',
    subtitle:
      'Changement de pile, contrôle d\'étanchéité et réparations toutes marques — notre horloger vous accueille aux Place des Halles.',
    servicesLabel: 'Nos services',
    contactLabel: 'Nous contacter',
  },
}
