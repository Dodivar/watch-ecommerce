/**
 * Contenu éditorial — Le Guide de l'horloger (Place des Montres).
 * Images : placer les fichiers dans `sites/place-des-montres/public/guide/`.
 *
 * Page traduite : chaque texte affiché passe par `t({ fr, en, de })`. Les identifiants de
 * section (`id`, `icon`, `layout`) restent des chaînes simples — ils servent d'ancres.
 */
import { publicPath } from '../../packages/base/src/utils/publicPath.js'
import { t } from '../../packages/base/src/site/i18nValue.js'

export default {
  hero: {
    eyebrow: t({
      fr: "Conseils d'entretien",
      en: 'Watch care advice',
      de: 'Pflegetipps',
    }),
    title: t({
      fr: "Le Guide de l'horloger",
      en: "The watchmaker's guide",
      de: 'Der Uhrmacher-Ratgeber',
    }),
    lead: t({
      fr: 'Pile, étanchéité, mouvements, verres et fonctions : les réponses essentielles pour entretenir votre montre et préserver sa garantie.',
      en: 'Battery, water resistance, movements, crystals and functions: the essential answers for looking after your watch and keeping its warranty valid.',
      de: 'Batterie, Dichtheit, Uhrwerke, Gläser und Funktionen: die wichtigsten Antworten, um Ihre Uhr zu pflegen und die Garantie zu erhalten.',
    }),
    image: {
      src: publicPath('guide/hero.jpg'),
      alt: t({
        fr: 'Atelier horloger Place des Montres — Place des Halles, Strasbourg',
        en: 'The Place des Montres watchmaking workshop — Place des Halles, Strasbourg',
        de: 'Uhrmacherwerkstatt von Place des Montres — Place des Halles, Straßburg',
      }),
      placeholderLabel: t({
        fr: 'Atelier horloger — Place des Halles',
        en: 'Watchmaking workshop — Place des Halles',
        de: 'Uhrmacherwerkstatt — Place des Halles',
      }),
    },
  },

  toc: [
    {
      id: 'pile',
      label: t({ fr: 'La pile', en: 'The battery', de: 'Die Batterie' }),
      icon: 'battery',
    },
    {
      id: 'etancheite',
      label: t({ fr: 'Étanchéité', en: 'Water resistance', de: 'Dichtheit' }),
      icon: 'water',
    },
    {
      id: 'mouvement',
      label: t({ fr: 'Mouvement', en: 'Movement', de: 'Uhrwerk' }),
      icon: 'mechanics',
    },
    {
      id: 'verre',
      label: t({ fr: 'Types de verre', en: 'Crystal types', de: 'Glasarten' }),
      icon: 'glass',
    },
    {
      id: 'boitiers',
      label: t({ fr: 'Boîtiers', en: 'Cases', de: 'Gehäuse' }),
      icon: 'case',
    },
    {
      id: 'fonctions',
      label: t({ fr: 'Fonctions', en: 'Functions', de: 'Funktionen' }),
      icon: 'functions',
    },
  ],

  sections: [
    {
      id: 'pile',
      title: t({ fr: 'La pile', en: 'The battery', de: 'Die Batterie' }),
      icon: 'battery',
      layout: 'faq',
      intro: t({
        fr: "Lorsque la montre ne fonctionne plus, c'est la première chose à vérifier.",
        en: 'When a watch stops working, this is the first thing to check.',
        de: 'Wenn die Uhr nicht mehr läuft, ist das der erste Punkt, den Sie prüfen sollten.',
      }),
      image: {
        src: publicPath('guide/pile.jpg'),
        alt: t({
          fr: 'Changement de pile de montre en atelier horloger',
          en: 'Replacing a watch battery in a watchmaking workshop',
          de: 'Batteriewechsel einer Uhr in der Uhrmacherwerkstatt',
        }),
        placeholderLabel: t({
          fr: 'Changement de pile en atelier',
          en: 'Battery change in the workshop',
          de: 'Batteriewechsel in der Werkstatt',
        }),
      },
      items: [
        {
          question: t({
            fr: 'Où changer sa pile ?',
            en: 'Where should the battery be changed?',
            de: 'Wo sollte die Batterie gewechselt werden?',
          }),
          answer: t({
            fr: 'Chez un horloger dépositaire agréé de votre marque. Faire appel à un autre intervenant peut endommager la montre et vous faire perdre la garantie.',
            en: 'At a watchmaker who is an approved dealer for your brand. Going elsewhere can damage the watch and void the warranty.',
            de: 'Bei einem Uhrmacher, der autorisierter Fachhändler Ihrer Marke ist. Eine andere Stelle kann die Uhr beschädigen und die Garantie erlöschen lassen.',
          }),
        },
        {
          question: t({
            fr: 'Puis-je changer la pile moi-même ?',
            en: 'Can I change the battery myself?',
            de: 'Kann ich die Batterie selbst wechseln?',
          }),
          answer: t({
            fr: 'Mieux vaut éviter : fonds de boîtier et systèmes de bride de pile sont de plus en plus complexes. De nombreuses montres arrivent en magasin abîmées par leur propriétaire, parfois de façon irréversible — et la garantie peut être perdue.',
            en: 'Better not to: case backs and battery clamp systems are increasingly complex. Many watches reach the shop damaged by their owner, sometimes beyond repair — and the warranty may be lost.',
            de: 'Besser nicht: Gehäuseböden und Batteriehalterungen werden immer komplexer. Viele Uhren kommen von ihren Besitzern beschädigt ins Geschäft, teils irreparabel — und die Garantie kann verfallen.',
          }),
        },
        {
          question: t({
            fr: 'Quel type de pile faut-il mettre dans une montre ?',
            en: 'Which type of battery should go into a watch?',
            de: 'Welche Batterie gehört in eine Uhr?',
          }),
          answer: t({
            fr: "Pour une montre donnée, un seul type de pile convient ; la référence peut varier selon les marques. Un horloger agréé vous garantit une pile de marque, et non une pile d'origine douteuse susceptible de couler dans le mouvement.",
            en: 'For a given watch, only one type of battery is suitable; the reference may vary from one brand to another. An approved watchmaker guarantees a branded battery rather than one of dubious origin that could leak into the movement.',
            de: 'Für eine bestimmte Uhr passt nur ein Batterietyp; die Referenz kann je nach Marke abweichen. Ein autorisierter Uhrmacher garantiert eine Markenbatterie statt eines Produkts zweifelhafter Herkunft, das ins Uhrwerk auslaufen könnte.',
          }),
        },
      ],
    },
    {
      id: 'etancheite',
      title: t({ fr: 'Étanchéité', en: 'Water resistance', de: 'Dichtheit' }),
      icon: 'water',
      layout: 'mixed',
      image: {
        src: publicPath('guide/etancheite.jpg'),
        alt: t({
          fr: "Contrôle d'étanchéité d'une montre sous cloche",
          en: 'Water-resistance test of a watch in a pressure chamber',
          de: 'Dichtheitsprüfung einer Uhr in der Druckkammer',
        }),
        placeholderLabel: t({
          fr: "Contrôle d'étanchéité sous cloche",
          en: 'Water-resistance test in a pressure chamber',
          de: 'Dichtheitsprüfung in der Druckkammer',
        }),
      },
      items: [
        {
          question: t({
            fr: "Comment sont établies les normes d'étanchéité ?",
            en: 'How are water-resistance ratings established?',
            de: 'Wie werden Dichtheitsnormen festgelegt?',
          }),
          answer: t({
            fr: "Les normes d'étanchéité sont souvent mal comprises. Elles correspondent à une mesure réalisée dans des appareils dédiés (test hyperbare ou hypobare). Ces tests mesurent la résistance de la montre à une pression donnée, sur une montre neuve, avec des joints neufs et à température constante.",
            en: 'Water-resistance ratings are often misunderstood. They come from a measurement taken in dedicated equipment (overpressure or vacuum testing). Those tests measure the watch’s resistance to a given pressure, on a new watch, with new seals and at a constant temperature.',
            de: 'Dichtheitsangaben werden oft falsch verstanden. Sie stammen aus einer Messung in speziellen Geräten (Über- oder Unterdruckprüfung). Diese Tests messen den Widerstand der Uhr gegen einen bestimmten Druck — an einer neuen Uhr, mit neuen Dichtungen und bei konstanter Temperatur.',
          }),
        },
        {
          question: t({
            fr: "À quoi correspondent les marquages d'étanchéité ?",
            en: 'What do the water-resistance markings mean?',
            de: 'Was bedeuten die Dichtheitsangaben?',
          }),
          answer: t({
            fr: 'Les normes sont le plus souvent gravées sur le fond de boîtier, parfois sur le cadran. Consultez le tableau ci-dessous pour connaître l’usage recommandé.',
            en: 'The ratings are usually engraved on the case back, sometimes printed on the dial. See the table below for the recommended use.',
            de: 'Die Angaben sind meist auf dem Gehäuseboden eingraviert, manchmal auf dem Zifferblatt. Die empfohlene Nutzung finden Sie in der Tabelle unten.',
          }),
        },
        {
          question: t({
            fr: "Évolution de l'étanchéité au fil du temps",
            en: 'How water resistance changes over time',
            de: 'Wie sich die Dichtheit im Lauf der Zeit verändert',
          }),
          answer: t({
            fr: "Les joints se détériorent plus vite s'ils sont sollicités : pression, dépression, eau chaude, eau salée, savon… Après chaque ouverture — notamment lors d'un changement de pile —, refaites un test d'étanchéité chez un dépositaire agréé. Les plongeurs soumettant leur montre à de fortes pressions veilleront à un contrôle annuel, même sans pile (montre automatique ou Kinetic). Un verre ébréché ou un poussoir tordu peut créer une voie d'eau. Sur les montres très étanches, la couronne doit toujours être vissée, sinon la montre n'est plus étanche.",
            en: 'Seals deteriorate faster when they are stressed: pressure, vacuum, hot water, salt water, soap… After every opening — a battery change in particular — have a water-resistance test done again at an approved dealer. Divers who expose their watch to high pressure should have it checked annually, even without a battery (automatic or Kinetic watches). A chipped crystal or a bent pusher can create a leak. On highly water-resistant watches the crown must always be screwed down, otherwise the watch is no longer sealed.',
            de: 'Dichtungen altern schneller, wenn sie beansprucht werden: Druck, Unterdruck, heißes Wasser, Salzwasser, Seife … Lassen Sie nach jedem Öffnen — insbesondere nach einem Batteriewechsel — die Dichtheit bei einem autorisierten Fachhändler erneut prüfen. Wer als Taucher hohem Druck aussetzt, sollte jährlich prüfen lassen, auch ohne Batterie (Automatik- oder Kinetic-Uhr). Ein angeschlagenes Glas oder ein verbogener Drücker kann Wasser eindringen lassen. Bei sehr dichten Uhren muss die Krone stets verschraubt sein, sonst ist die Uhr nicht mehr dicht.',
          }),
        },
        {
          question: t({
            fr: "Suis-je obligé de refaire l'étanchéité lors d'un changement de pile ?",
            en: 'Must water resistance be redone when the battery is changed?',
            de: 'Muss die Dichtheit beim Batteriewechsel erneuert werden?',
          }),
          answer: t({
            fr: "Si la montre est encore sous garantie et que le changement de pile est effectué sans contrôle d'étanchéité, elle perd sa garantie. Refaire l'étanchéité fait partie de l'entretien courant, comme pour tout objet étanche (appareil photo, profondimètre…). Sans ce contrôle, le risque de prise d'eau n'est pas exclu — et l'étanchéité protège aussi le mouvement de la poussière, de la pluie et de la transpiration.",
            en: 'If the watch is still under warranty and the battery is changed without a water-resistance check, the warranty is lost. Restoring water resistance is part of routine servicing, as with any sealed object (a camera, a depth gauge…). Without that check, water ingress cannot be ruled out — and the seal also protects the movement from dust, rain and perspiration.',
            de: 'Wird die Batterie ohne Dichtheitsprüfung gewechselt, erlischt die noch laufende Garantie. Die Wiederherstellung der Dichtheit gehört zur normalen Wartung, wie bei jedem dichten Gerät (Kamera, Tiefenmesser …). Ohne diese Prüfung ist Wassereintritt nicht ausgeschlossen — und die Dichtung schützt das Uhrwerk auch vor Staub, Regen und Schweiß.',
          }),
        },
        {
          question: t({
            fr: "Que faire si ma montre a pris l'eau ?",
            en: 'What should I do if water has got into my watch?',
            de: 'Was tun, wenn Wasser in die Uhr eingedrungen ist?',
          }),
          answer: t({
            fr: "Le mouvement d'une montre n'apprécie pas l'eau, comme tout mécanisme. Rendez-vous le plus rapidement possible chez un dépositaire de la marque pour ouvrir la montre et la faire sécher à l'étuve.",
            en: 'A watch movement does not like water, as with any mechanism. Go to a dealer for the brand as quickly as possible so the watch can be opened and dried in a drying oven.',
            de: 'Ein Uhrwerk verträgt kein Wasser, wie jeder Mechanismus. Suchen Sie schnellstmöglich einen Fachhändler der Marke auf, damit die Uhr geöffnet und im Trockenschrank getrocknet wird.',
          }),
        },
        {
          question: t({
            fr: "En quoi consiste le contrôle d'étanchéité ?",
            en: 'What does a water-resistance check involve?',
            de: 'Woraus besteht die Dichtheitsprüfung?',
          }),
          answer: t({
            fr: "L'horloger vérifie d'abord l'état général : verre, joint de verre, tige-couronne, poussoir, boîtier… Il ouvre ensuite la montre pour changer le joint de fond de boîtier, le plus important, et traite les joints de poussoirs et de tige-couronne au silicone. La montre est soigneusement refermée, puis placée dans un testeur sous cloche avec un micromètre mesurant les variations de volume du boîtier. L'appareil procède à des surpressions et dépressions : si le boîtier réagit conformément, le test est réussi ; sinon, l'horloger identifie et remplace le joint défaillant.",
            en: 'The watchmaker first checks the overall condition: crystal, crystal gasket, winding stem, pushers, case… The watch is then opened to replace the case-back gasket, the most important one, and the pusher and stem gaskets are treated with silicone. The watch is carefully closed again, then placed in a pressure-chamber tester with a micrometer measuring variations in case volume. The device applies overpressure and vacuum: if the case reacts as expected the test passes; if not, the watchmaker identifies and replaces the faulty gasket.',
            de: 'Der Uhrmacher prüft zunächst den Gesamtzustand: Glas, Glasdichtung, Aufzugswelle, Drücker, Gehäuse … Anschließend öffnet er die Uhr, um die wichtigste Dichtung — die des Gehäusebodens — zu ersetzen, und behandelt die Dichtungen von Drückern und Aufzugswelle mit Silikon. Die Uhr wird sorgfältig verschlossen und dann in einen Prüfstand mit Druckkammer und Mikrometer gesetzt, das Volumenänderungen des Gehäuses misst. Das Gerät erzeugt Über- und Unterdruck: Reagiert das Gehäuse wie erwartet, ist die Prüfung bestanden; andernfalls ermittelt und ersetzt der Uhrmacher die schadhafte Dichtung.',
          }),
        },
        {
          question: t({
            fr: 'Que faire après la baignade ?',
            en: 'What should I do after swimming?',
            de: 'Was tun nach dem Baden?',
          }),
          answer: t({
            fr: "Après chaque passage en mer ou en piscine, rincez votre montre à l'eau claire (douche ou robinet). Le sel et le chlore peuvent endommager progressivement les joints d'étanchéité.",
            en: 'After every swim in the sea or a pool, rinse your watch with clean water (shower or tap). Salt and chlorine gradually damage the seals.',
            de: 'Spülen Sie Ihre Uhr nach jedem Aufenthalt im Meer oder Schwimmbad mit klarem Wasser ab (Dusche oder Wasserhahn). Salz und Chlor greifen die Dichtungen mit der Zeit an.',
          }),
        },
        {
          question: t({
            fr: 'Puis-je prendre la douche ou le bain avec ma montre ?',
            en: 'Can I shower or bathe wearing my watch?',
            de: 'Kann ich mit meiner Uhr duschen oder baden?',
          }),
          answer: t({
            fr: "Mieux vaut éviter : l'eau chaude et savonneuse dessèche prématurément les joints.",
            en: 'Better not to: hot, soapy water dries out the seals prematurely.',
            de: 'Besser nicht: Heißes Seifenwasser lässt die Dichtungen vorzeitig austrocknen.',
          }),
        },
      ],
      referenceTable: [
        {
          marking: t({
            fr: 'Aucun marquage',
            en: 'No marking',
            de: 'Keine Kennzeichnung',
          }),
          usage: t({
            fr: "La montre n'est pas considérée comme étanche.",
            en: 'The watch is not considered water-resistant.',
            de: 'Die Uhr gilt nicht als wasserdicht.',
          }),
        },
        {
          marking: t({
            fr: '30 m, Water-resistant, Water-proof, 3 atm ou 3 bar',
            en: '30 m, Water-resistant, Water-proof, 3 atm or 3 bar',
            de: '30 m, Water-resistant, Water-proof, 3 atm oder 3 bar',
          }),
          usage: t({
            fr: "Étanche au lavage des mains, à la sudation et à l'immersion accidentelle.",
            en: 'Resists hand washing, perspiration and accidental immersion.',
            de: 'Beständig gegen Händewaschen, Schweiß und versehentliches Eintauchen.',
          }),
        },
        {
          marking: t({
            fr: '50 m, 5 atm ou 5 bar',
            en: '50 m, 5 atm or 5 bar',
            de: '50 m, 5 atm oder 5 bar',
          }),
          usage: t({
            fr: 'Étanche à la baignade.',
            en: 'Suitable for swimming.',
            de: 'Zum Schwimmen geeignet.',
          }),
        },
        {
          marking: t({
            fr: '100 m, 10 atm ou 10 bar',
            en: '100 m, 10 atm or 10 bar',
            de: '100 m, 10 atm oder 10 bar',
          }),
          usage: t({
            fr: "Étanche à la baignade et à l'apnée jusqu'à 10 m maximum.",
            en: 'Suitable for swimming and free diving down to 10 m maximum.',
            de: 'Zum Schwimmen und Apnoetauchen bis maximal 10 m geeignet.',
          }),
        },
        {
          marking: t({
            fr: '> 200 m, 20 atm ou 20 bar',
            en: '> 200 m, 20 atm or 20 bar',
            de: '> 200 m, 20 atm oder 20 bar',
          }),
          usage: t({
            fr: 'Étanche à la plongée bouteille.',
            en: 'Suitable for scuba diving.',
            de: 'Zum Gerätetauchen geeignet.',
          }),
        },
      ],
    },
    {
      id: 'mouvement',
      title: t({
        fr: "Mouvement d'une montre",
        en: 'The movement of a watch',
        de: 'Das Uhrwerk',
      }),
      icon: 'mechanics',
      layout: 'definitions',
      intro: t({
        fr: "Le mouvement désigne l'ensemble des mécanismes qui indiquent les unités de temps : heures, minutes, secondes.",
        en: 'The movement is the set of mechanisms that display the units of time: hours, minutes, seconds.',
        de: 'Das Uhrwerk umfasst alle Mechanismen, die die Zeiteinheiten anzeigen: Stunden, Minuten, Sekunden.',
      }),
      image: {
        src: publicPath('guide/mouvement.jpg'),
        alt: t({
          fr: 'Mouvement mécanique, automatique et quartz',
          en: 'Mechanical, automatic and quartz movements',
          de: 'Handaufzugs-, Automatik- und Quarzwerk',
        }),
        placeholderLabel: t({
          fr: 'Mouvement mécanique / automatique / quartz',
          en: 'Mechanical / automatic / quartz movement',
          de: 'Handaufzugs- / Automatik- / Quarzwerk',
        }),
      },
      definitions: [
        {
          title: t({
            fr: 'Mouvement mécanique',
            en: 'Mechanical movement',
            de: 'Mechanisches Uhrwerk',
          }),
          description: t({
            fr: "Mouvement avec remontoir, ressort et rouages. Le remontage se fait à la main. Aucune pile ni composant électronique à l'intérieur du mécanisme.",
            en: 'A movement with a winding crown, a mainspring and a gear train. It is wound by hand. There is no battery or electronic component inside the mechanism.',
            de: 'Ein Werk mit Aufzugskrone, Zugfeder und Räderwerk. Der Aufzug erfolgt von Hand. Im Mechanismus befinden sich weder Batterie noch elektronische Bauteile.',
          }),
        },
        {
          title: t({
            fr: 'Montre automatique',
            en: 'Automatic watch',
            de: 'Automatikuhr',
          }),
          description: t({
            fr: "Montre mécanique équipée d'un rotor : elle se remonte avec le mouvement du poignet, et également à la main.",
            en: 'A mechanical watch fitted with a rotor: it winds itself from the motion of your wrist, and can also be wound by hand.',
            de: 'Eine mechanische Uhr mit Rotor: Sie zieht sich durch die Bewegung des Handgelenks auf und lässt sich zusätzlich von Hand aufziehen.',
          }),
        },
        {
          title: t({
            fr: 'Mouvement à quartz',
            en: 'Quartz movement',
            de: 'Quarzwerk',
          }),
          description: t({
            fr: "Fonctionne avec une pile alimentant la vibration d'un cristal de quartz. L'heure s'affiche par aiguilles (analogique) ou cristaux liquides (digitale). L'énergie est fournie par une pile ou une batterie.",
            en: 'Runs on a battery powering the vibration of a quartz crystal. The time is shown by hands (analogue) or by liquid crystals (digital). Energy comes from a cell or a rechargeable battery.',
            de: 'Läuft mit einer Batterie, die einen Quarzkristall zum Schwingen bringt. Die Zeit wird über Zeiger (analog) oder Flüssigkristalle (digital) angezeigt. Die Energie liefert eine Batterie oder ein Akku.',
          }),
        },
      ],
      precision: {
        title: t({
          fr: "Quelle est la précision d'un mouvement ?",
          en: 'How accurate is a movement?',
          de: 'Wie genau ist ein Uhrwerk?',
        }),
        rows: [
          {
            type: t({ fr: 'Mécanique', en: 'Mechanical', de: 'Mechanisch' }),
            value: t({
              fr: '5 à 30 secondes par jour',
              en: '5 to 30 seconds per day',
              de: '5 bis 30 Sekunden pro Tag',
            }),
          },
          {
            type: t({ fr: 'Quartz', en: 'Quartz', de: 'Quarz' }),
            value: t({
              fr: 'Environ 5 secondes par mois',
              en: 'Around 5 seconds per month',
              de: 'Etwa 5 Sekunden pro Monat',
            }),
          },
        ],
        note: t({
          fr: 'Un mouvement à quartz est environ 60 fois plus précis qu’un mouvement mécanique.',
          en: 'A quartz movement is around 60 times more accurate than a mechanical one.',
          de: 'Ein Quarzwerk ist rund 60-mal genauer als ein mechanisches Werk.',
        }),
      },
    },
    {
      id: 'verre',
      title: t({
        fr: 'Les différents types de verre',
        en: 'The different types of crystal',
        de: 'Die verschiedenen Glasarten',
      }),
      icon: 'glass',
      layout: 'cards',
      image: {
        src: publicPath('guide/verre.jpg'),
        alt: t({
          fr: 'Verre plexiglas, minéral et saphir sur montres',
          en: 'Acrylic, mineral and sapphire crystals on watches',
          de: 'Kunststoff-, Mineral- und Saphirglas an Uhren',
        }),
        placeholderLabel: t({
          fr: 'Plexiglas, minéral et saphir',
          en: 'Acrylic, mineral and sapphire',
          de: 'Kunststoff, Mineral und Saphir',
        }),
      },
      cards: [
        {
          title: t({
            fr: 'Verre plexiglas',
            en: 'Acrylic crystal',
            de: 'Kunststoffglas',
          }),
          description: t({
            fr: 'Souvent utilisé sur les montres sportives : très léger, souple et d’une bonne qualité optique.',
            en: 'Often used on sports watches: very light, flexible and optically good.',
            de: 'Häufig bei Sportuhren verwendet: sehr leicht, flexibel und optisch gut.',
          }),
        },
        {
          title: t({
            fr: 'Verre minéral',
            en: 'Mineral crystal',
            de: 'Mineralglas',
          }),
          description: t({
            fr: 'Le plus courant. Très bonne qualité optique, bonne résistance aux rayures, à la pression et aux chocs, mais assez lourd.',
            en: 'The most common. Very good optical quality, good resistance to scratches, pressure and knocks, but fairly heavy.',
            de: 'Am weitesten verbreitet. Sehr gute optische Qualität, gute Beständigkeit gegen Kratzer, Druck und Stöße, aber relativ schwer.',
          }),
        },
        {
          title: t({
            fr: 'Verre saphir',
            en: 'Sapphire crystal',
            de: 'Saphirglas',
          }),
          description: t({
            fr: 'Cristal synthétique très pur, grande transparence, très dur et quasiment inrayable. Équipe en général les montres haut de gamme.',
            en: 'A very pure synthetic crystal, highly transparent, very hard and virtually scratch-proof. Usually found on high-end watches.',
            de: 'Sehr reiner synthetischer Kristall, hoch transparent, sehr hart und praktisch kratzfest. In der Regel bei hochwertigen Uhren zu finden.',
          }),
        },
      ],
    },
    {
      id: 'boitiers',
      title: t({ fr: 'Les boîtiers', en: 'Cases', de: 'Die Gehäuse' }),
      icon: 'case',
      layout: 'cards',
      image: {
        src: publicPath('guide/boitiers.jpg'),
        alt: t({
          fr: 'Boîtiers de montre en acier, PVD, céramique et titane',
          en: 'Watch cases in steel, PVD, ceramic and titanium',
          de: 'Uhrengehäuse aus Stahl, PVD, Keramik und Titan',
        }),
        placeholderLabel: t({
          fr: 'Acier, PVD, céramique, titane',
          en: 'Steel, PVD, ceramic, titanium',
          de: 'Stahl, PVD, Keramik, Titan',
        }),
      },
      cards: [
        {
          title: t({
            fr: 'Acier inoxydable',
            en: 'Stainless steel',
            de: 'Edelstahl',
          }),
          description: t({
            fr: 'Alliage de fer et de carbone enrichi de chrome et d’autres éléments pour résister à la corrosion. Les montres actuelles ne contiennent plus de nickel, allergène le plus courant.',
            en: 'An iron and carbon alloy enriched with chromium and other elements to resist corrosion. Today’s watches no longer contain nickel, the most common allergen.',
            de: 'Eine Eisen-Kohlenstoff-Legierung, mit Chrom und weiteren Elementen gegen Korrosion angereichert. Heutige Uhren enthalten kein Nickel mehr, das häufigste Allergen.',
          }),
        },
        {
          title: 'PVD',
          description: t({
            fr: 'Physical Vapor Deposition — procédé le plus utilisé pour teinter le métal (foncé, doré, etc.).',
            en: 'Physical Vapor Deposition — the most widely used process for colouring metal (dark, gold, and so on).',
            de: 'Physical Vapor Deposition — das am weitesten verbreitete Verfahren, um Metall einzufärben (dunkel, golden usw.).',
          }),
        },
        {
          title: t({ fr: 'Céramique', en: 'Ceramic', de: 'Keramik' }),
          description: t({
            fr: 'Loin de la céramique artisanale : l’industrie horlogère en optimise les propriétés. Aspect très brillant permanent et surface quasiment anti-rayures.',
            en: 'Far removed from craft ceramics: the watch industry optimises its properties. A permanently high-gloss look and a virtually scratch-proof surface.',
            de: 'Weit entfernt von handwerklicher Keramik: Die Uhrenindustrie optimiert ihre Eigenschaften. Dauerhaft hochglänzendes Aussehen und nahezu kratzfeste Oberfläche.',
          }),
        },
        {
          title: t({ fr: 'Titane', en: 'Titanium', de: 'Titan' }),
          description: t({
            fr: 'Métal léger, très résistant, aspect gris métallique souvent mat. Aucune allergie connue au titane.',
            en: 'A light, very strong metal with a metallic grey, often matt look. No known allergy to titanium.',
            de: 'Leichtes, sehr widerstandsfähiges Metall mit metallisch grauem, oft mattem Aussehen. Keine bekannte Titanallergie.',
          }),
        },
      ],
    },
    {
      id: 'fonctions',
      title: t({ fr: 'Les fonctions', en: 'Functions', de: 'Die Funktionen' }),
      icon: 'functions',
      layout: 'features',
      image: {
        src: publicPath('guide/fonctions.jpg'),
        alt: t({
          fr: 'Cadran de montre avec complications et fonctions',
          en: 'A watch dial with complications and functions',
          de: 'Zifferblatt einer Uhr mit Komplikationen und Funktionen',
        }),
        placeholderLabel: t({
          fr: 'Cadran et complications',
          en: 'Dial and complications',
          de: 'Zifferblatt und Komplikationen',
        }),
      },
      groups: [
        {
          label: t({ fr: 'Affichage', en: 'Display', de: 'Anzeige' }),
          items: [
            {
              term: t({ fr: 'Dateur', en: 'Date display', de: 'Datumsanzeige' }),
              description: t({
                fr: 'Indique le jour du mois (du 1er au 31). Les mois de moins de 31 jours demandent un réglage manuel. Peut être complété par les jours de la semaine (lundi au dimanche).',
                en: 'Shows the day of the month (1 to 31). Months shorter than 31 days require a manual adjustment. It can be complemented by the days of the week (Monday to Sunday).',
                de: 'Zeigt den Tag des Monats an (1. bis 31.). Monate mit weniger als 31 Tagen erfordern eine manuelle Korrektur. Ergänzt werden kann sie durch die Wochentage (Montag bis Sonntag).',
              }),
            },
            {
              term: t({
                fr: 'Réglage du dateur (montre analogique)',
                en: 'Setting the date (analogue watch)',
                de: 'Datum einstellen (Analoguhr)',
              }),
              description: t({
                fr: "Tirez deux fois sur la couronne pour régler l'heure. Si la date change au passage de minuit (aiguille à 12 h), le mécanisme indique minuit ; sinon, midi. Réglez l'heure exacte (deux tours de cadran = 24 h), renfoncez la couronne une fois, puis réglez la date. D'autre part, la montre avancera jusqu'au 31 chaque mois (sauf montres perpétuelles) : réajustez la date tous les deux mois.",
                en: 'Pull the crown out twice to set the time. If the date changes as the hands pass 12 o’clock, the mechanism is at midnight; if not, it is at midday. Set the exact time (two full turns of the dial = 24 hours), push the crown back in one notch, then set the date. Note too that the watch runs to the 31st every month (except on perpetual calendars): readjust the date every couple of months.',
                de: 'Ziehen Sie die Krone zweimal heraus, um die Uhrzeit einzustellen. Wechselt das Datum beim Überschreiten der 12-Uhr-Stellung, steht der Mechanismus auf Mitternacht; andernfalls auf Mittag. Stellen Sie die genaue Uhrzeit ein (zwei volle Zifferblattumläufe = 24 Stunden), drücken Sie die Krone eine Stufe zurück und stellen Sie dann das Datum. Zudem läuft die Uhr jeden Monat bis zum 31. (außer bei ewigen Kalendern): Korrigieren Sie das Datum alle zwei Monate.',
              }),
            },
            {
              term: t({
                fr: 'Format 24 h',
                en: '24-hour format',
                de: '24-Stunden-Format',
              }),
              description: t({
                fr: "Utile sur les montres digitales pour distinguer 2 h du matin de 14 h l'après-midi.",
                en: 'Useful on digital watches to tell 2 in the morning from 2 in the afternoon.',
                de: 'Bei Digitaluhren nützlich, um 2 Uhr morgens von 14 Uhr nachmittags zu unterscheiden.',
              }),
            },
          ],
        },
        {
          label: t({ fr: 'Chronométrie', en: 'Timing', de: 'Zeitmessung' }),
          items: [
            {
              term: t({ fr: 'Chronomètre', en: 'Chronometer', de: 'Chronometer' }),
              description: t({
                fr: "Ce n'est pas une fonction : le chronomètre désigne une précision contrôlée par des laboratoires spécialisés. Un certificat de chronométrie indique la précision exacte de la montre, très élevée quel que soit l'organisme de certification.",
                en: 'This is not a function: a chronometer denotes accuracy certified by specialist laboratories. A timing certificate states the watch’s exact accuracy, which is very high whichever body issued it.',
                de: 'Das ist keine Funktion: Chronometer bezeichnet eine von Fachlaboren geprüfte Ganggenauigkeit. Ein Gangzeugnis weist die exakte Genauigkeit der Uhr aus — unabhängig von der Prüfstelle sehr hoch.',
              }),
            },
            {
              term: t({ fr: 'Chronographe', en: 'Chronograph', de: 'Chronograph' }),
              description: t({
                fr: "Fonction mesurant le temps écoulé. L'aiguille centrale comptabilise les secondes ; les compteurs indiquent le cumul chronométré (heures, minutes, dixièmes de seconde…).",
                en: 'A function that measures elapsed time. The central hand counts the seconds; the sub-dials show the accumulated time (hours, minutes, tenths of a second…).',
                de: 'Eine Funktion zur Messung der verstrichenen Zeit. Der Zentralzeiger zählt die Sekunden; die Hilfszifferblätter zeigen die aufsummierte Zeit (Stunden, Minuten, Zehntelsekunden …).',
              }),
            },
            {
              term: t({
                fr: 'Compte à rebours',
                en: 'Countdown timer',
                de: 'Countdown',
              }),
              description: t({
                fr: "Décompte un temps donné jusqu'au déclenchement d'une alarme. Des modèles à répétition existent.",
                en: 'Counts down a set time until an alarm sounds. Repeating models exist.',
                de: 'Zählt eine vorgegebene Zeit rückwärts, bis ein Alarm ertönt. Es gibt auch Modelle mit Wiederholung.',
              }),
            },
            {
              term: t({ fr: 'Tachymètre', en: 'Tachymeter', de: 'Tachymeter' }),
              description: t({
                fr: "Graduations circulaires au bord du cadran pour mesurer une vitesse. Avec l'aiguille centrale des secondes du chronographe, chronométrez le temps pour parcourir 1 km : au stop, le tachymètre indique la vitesse moyenne.",
                en: 'A circular scale around the edge of the dial for measuring speed. Using the chronograph’s central seconds hand, time how long it takes to cover 1 km: on stopping, the tachymeter shows the average speed.',
                de: 'Eine Ringskala am Zifferblattrand zur Geschwindigkeitsmessung. Stoppen Sie mit dem zentralen Sekundenzeiger des Chronographen die Zeit für 1 km: Beim Anhalten zeigt das Tachymeter die Durchschnittsgeschwindigkeit an.',
              }),
            },
          ],
        },
        {
          label: t({
            fr: 'Synchronisation et énergie',
            en: 'Synchronisation and power',
            de: 'Synchronisation und Energie',
          }),
          items: [
            {
              term: t({
                fr: 'Radio-piloté',
                en: 'Radio-controlled',
                de: 'Funkgesteuert',
              }),
              description: t({
                fr: "La montre reçoit les signaux d'un émetteur radio diffusant l'heure d'une horloge atomique au césium. Elle se synchronise plusieurs fois par jour ; chaque continent dispose d'un émetteur.",
                en: 'The watch picks up signals from a radio transmitter broadcasting the time of a caesium atomic clock. It synchronises several times a day; each continent has its own transmitter.',
                de: 'Die Uhr empfängt Signale eines Funksenders, der die Zeit einer Cäsium-Atomuhr ausstrahlt. Sie synchronisiert sich mehrmals täglich; jeder Kontinent verfügt über einen Sender.',
              }),
            },
            {
              term: t({
                fr: 'Montre solaire',
                en: 'Solar watch',
                de: 'Solaruhr',
              }),
              description: t({
                fr: "Le cadran transforme la lumière en énergie, stockée dans une batterie rechargeable intégrée. La montre fonctionne alors comme une montre à quartz. L'autonomie peut atteindre un mois.",
                en: 'The dial turns light into energy, stored in a built-in rechargeable battery. The watch then runs like a quartz watch. Power reserve can reach a month.',
                de: 'Das Zifferblatt wandelt Licht in Energie um, die in einem integrierten Akku gespeichert wird. Die Uhr läuft dann wie eine Quarzuhr. Die Gangreserve kann einen Monat erreichen.',
              }),
            },
          ],
        },
        {
          label: t({ fr: 'Pratique', en: 'Practical', de: 'Praktisch' }),
          items: [
            {
              term: t({ fr: 'Alarme', en: 'Alarm', de: 'Alarm' }),
              description: t({
                fr: 'Fonction réveil, le plus souvent sur les montres digitales, rarement sur les analogiques. Plusieurs alarmes programmables sont possibles.',
                en: 'An alarm-clock function, mostly on digital watches and rarely on analogue ones. Several programmable alarms are possible.',
                de: 'Weckfunktion, meist bei Digitaluhren, selten bei Analoguhren. Mehrere programmierbare Alarme sind möglich.',
              }),
            },
            {
              term: t({ fr: 'Boussole', en: 'Compass', de: 'Kompass' }),
              description: t({
                fr: 'Indique les points cardinaux ; version électronique pour ne pas interférer avec le mouvement.',
                en: 'Shows the cardinal points; an electronic version avoids interfering with the movement.',
                de: 'Zeigt die Himmelsrichtungen an; die elektronische Ausführung stört das Uhrwerk nicht.',
              }),
            },
            {
              term: t({ fr: 'Baromètre', en: 'Barometer', de: 'Barometer' }),
              description: t({
                fr: 'Indique la pression atmosphérique, le plus souvent en hPa.',
                en: 'Shows atmospheric pressure, usually in hPa.',
                de: 'Zeigt den Luftdruck an, meist in hPa.',
              }),
            },
            {
              term: t({ fr: 'Altimètre', en: 'Altimeter', de: 'Höhenmesser' }),
              description: t({
                fr: "Indique l'altitude en fonction de la pression atmosphérique. Pour plus de précision, étalonnez-le avant une randonnée.",
                en: 'Shows altitude based on atmospheric pressure. For greater accuracy, calibrate it before a hike.',
                de: 'Zeigt die Höhe anhand des Luftdrucks an. Für mehr Genauigkeit vor einer Wanderung kalibrieren.',
              }),
            },
          ],
        },
      ],
    },
  ],

  cta: {
    title: t({
      fr: 'Besoin d’un entretien en boutique ?',
      en: 'Need your watch serviced in store?',
      de: 'Wartung im Geschäft nötig?',
    }),
    subtitle: t({
      fr: 'Changement de pile, contrôle d’étanchéité et réparations toutes marques — notre horloger vous accueille aux Place des Halles.',
      en: 'Battery changes, water-resistance checks and repairs for all brands — our watchmaker welcomes you at Place des Halles.',
      de: 'Batteriewechsel, Dichtheitsprüfung und Reparaturen aller Marken — unser Uhrmacher empfängt Sie in der Place des Halles.',
    }),
    servicesLabel: t({
      fr: 'Nos services',
      en: 'Our services',
      de: 'Unsere Leistungen',
    }),
    contactLabel: t({
      fr: 'Nous contacter',
      en: 'Contact us',
      de: 'Kontakt aufnehmen',
    }),
  },
}
