import { t } from '../../packages/base/src/site/i18nValue.js'

/**
 * Atelier Place des Montres — formulaire de prise en charge et pages prestation.
 *
 * Séparé de `site.config.js` pour la même raison que `guide.config.js` : ce sont des blocs de
 * contenu long, relus par le client, qui n'ont pas à alourdir le manifest.
 *
 * Prix affichés : uniquement ceux que le magasin annonce déjà (pile 9 €, étanchéité 21 €).
 * Tout le reste est « sur devis » — une réparation dépend du mouvement et des pièces, annoncer
 * un montant au hasard se paierait au comptoir.
 */

/** Prestations proposées dans le sélecteur du formulaire de prise en charge. */
const REPAIR_SERVICES = [
  t({
    fr: 'Changement de pile',
    en: 'Battery replacement',
    de: 'Batteriewechsel',
  }),
  t({
    fr: "Test d'étanchéité",
    en: 'Water-resistance test',
    de: 'Dichtheitsprüfung',
  }),
  t({
    fr: 'Réparation complète',
    en: 'Full repair',
    de: 'Komplettreparatur',
  }),
  t({
    fr: 'Révision / entretien',
    en: 'Service / overhaul',
    de: 'Revision / Wartung',
  }),
  t({
    fr: 'Changement de verre',
    en: 'Crystal replacement',
    de: 'Glaswechsel',
  }),
  t({
    fr: 'Bracelet : pose, ajustement, remplacement',
    en: 'Strap: fitting, adjustment, replacement',
    de: 'Armband: Montage, Anpassung, Wechsel',
  }),
]

const repairRequest = {
  title: t({
    fr: 'Faire prendre en charge votre montre',
    en: 'Have your watch looked at',
    de: 'Ihre Uhr in die Werkstatt geben',
  }),
  lead: t({
    fr: "Décrivez la panne en deux minutes : notre horloger vous répond avec un délai et un ordre de prix, avant toute intervention.",
    en: 'Describe the fault in two minutes: our watchmaker replies with a lead time and a price range, before any work starts.',
    de: 'Beschreiben Sie den Defekt in zwei Minuten: Unser Uhrmacher antwortet mit Dauer und Preisrahmen, bevor gearbeitet wird.',
  }),
  reassurance: t({
    fr: "Réponse sous 48 h ouvrées. Rien n'est lancé sans votre accord.",
    en: 'Answer within 48 working hours. Nothing is started without your agreement.',
    de: 'Antwort innerhalb von 48 Arbeitsstunden. Ohne Ihre Zustimmung wird nichts begonnen.',
  }),
  /**
   * Envoi postal : désactivé tant que le suivi d'intervention n'existe pas. Recevoir une montre
   * par la poste sans pouvoir en tracer l'état est un risque, pas un service. Passer à `true`
   * le jour où le SAV par correspondance est arbitré avec le client.
   */
  shippingEnabled: false,
  services: REPAIR_SERVICES,
}

const landings = [
  {
    slug: 'reparation-montre-strasbourg',
    sectionId: 'atelier',
    icon: 'atelier',
    repairService: t({
      fr: 'Réparation complète',
      en: 'Full repair',
      de: 'Komplettreparatur',
    }),
    navLabel: t({
      fr: 'Réparation toutes marques',
      en: 'Repairs, all brands',
      de: 'Reparatur aller Marken',
    }),
    navDescription: t({
      fr: 'Diagnostic à l’atelier, devis avant intervention.',
      en: 'Diagnosis in the workshop, quote before any work.',
      de: 'Diagnose in der Werkstatt, Kostenvoranschlag vor der Arbeit.',
    }),
    hero: {
      eyebrow: t({
        fr: 'Atelier sur place',
        en: 'Workshop on site',
        de: 'Werkstatt vor Ort',
      }),
      title: t({
        fr: 'Réparation de montre à Strasbourg',
        en: 'Watch repair in Strasbourg',
        de: 'Uhrenreparatur in Straßburg',
      }),
      lead: t({
        fr: "Quartz, automatique ou mécanique : notre horloger diagnostique votre montre à l'atelier du centre commercial Place des Halles et vous annonce le délai et le prix avant toute intervention.",
        en: 'Quartz, automatic or mechanical: our watchmaker examines your watch in the workshop at the Place des Halles shopping centre and tells you the lead time and the price before any work starts.',
        de: 'Quarz, Automatik oder Handaufzug: Unser Uhrmacher untersucht Ihre Uhr in der Werkstatt im Einkaufszentrum Place des Halles und nennt Ihnen Dauer und Preis, bevor gearbeitet wird.',
      }),
    },
    highlights: [
      {
        label: t({ fr: 'Diagnostic', en: 'Diagnosis', de: 'Diagnose' }),
        value: t({ fr: "À l'atelier", en: 'In our workshop', de: 'In der Werkstatt' }),
        detail: t({
          fr: 'Pas de renvoi extérieur pour les interventions courantes',
          en: 'Routine jobs are never sent away',
          de: 'Routinearbeiten werden nicht ausgelagert',
        }),
      },
      {
        label: t({ fr: 'Devis', en: 'Quote', de: 'Kostenvoranschlag' }),
        value: t({ fr: 'Sous 48 h', en: 'Within 48 hours', de: 'Innerhalb von 48 Stunden' }),
        detail: t({
          fr: "Rien n'est lancé sans votre accord",
          en: 'Nothing is started without your agreement',
          de: 'Ohne Ihre Zustimmung wird nichts begonnen',
        }),
      },
      {
        label: t({ fr: 'Marques', en: 'Brands', de: 'Marken' }),
        value: t({ fr: 'Toutes', en: 'All of them', de: 'Alle' }),
        detail: t({
          fr: 'Achetée chez nous ou ailleurs',
          en: 'Bought from us or elsewhere',
          de: 'Bei uns oder anderswo gekauft',
        }),
      },
    ],
    body: [
      {
        title: t({
          fr: 'Ce que nous réparons',
          en: 'What we repair',
          de: 'Was wir reparieren',
        }),
        text: t({
          fr: "Montre arrêtée, qui retarde ou qui avance, couronne ou poussoir bloqué, verre rayé ou fêlé, bracelet ou fermoir cassé, boîtier qui a pris l'humidité : la plupart des pannes se traitent à l'atelier. Lorsqu'un mouvement de manufacture exige des pièces d'origine, il part chez la marque — nous vous le disons dès le diagnostic.",
          en: 'A watch that has stopped, runs slow or fast, a jammed crown or pusher, a scratched or cracked crystal, a broken strap or clasp, moisture inside the case: most faults are handled in the workshop. When a manufacture movement needs original parts it goes back to the brand — we tell you as soon as we have made the diagnosis.',
          de: 'Eine stehen gebliebene Uhr, Nach- oder Vorgehen, eine klemmende Krone oder ein blockierter Drücker, ein zerkratztes oder gesprungenes Glas, ein gerissenes Armband oder Schließe, Feuchtigkeit im Gehäuse: Die meisten Defekte werden in der Werkstatt behoben. Benötigt ein Manufakturwerk Originalteile, geht es zur Marke zurück — das sagen wir Ihnen bereits bei der Diagnose.',
        }),
      },
      {
        title: t({
          fr: 'Comment ça se passe',
          en: 'How it works',
          de: 'So läuft es ab',
        }),
        text: t({
          fr: "Vous déposez la montre au magasin, ou vous décrivez la panne depuis cette page. Nous établissons un diagnostic, puis un devis avec un délai. Vous validez — ou non — avant que l'horloger n'intervienne. La montre est contrôlée avant de vous être rendue. Pour le vocabulaire (mouvement, étanchéité, type de verre), le <a href=\"/guide-horloger\" class=\"text-primary underline\">Guide de l'horloger</a> explique l'essentiel.",
          en: 'You drop the watch off in store, or describe the fault from this page. We make a diagnosis, then a quote with a lead time. You approve it — or not — before the watchmaker starts. The watch is checked before being handed back. For the vocabulary (movement, water resistance, crystal types), the <a href="/guide-horloger" class="text-primary underline">watchmaker\'s guide</a> covers the essentials.',
          de: 'Sie bringen die Uhr ins Geschäft oder beschreiben den Defekt auf dieser Seite. Wir erstellen eine Diagnose und daraufhin einen Kostenvoranschlag mit Terminangabe. Sie stimmen zu — oder nicht —, bevor der Uhrmacher beginnt. Vor der Rückgabe wird die Uhr geprüft. Zum Fachvokabular (Uhrwerk, Dichtheit, Glasarten) erklärt der <a href="/guide-horloger" class="text-primary underline">Uhrmacher-Ratgeber</a> das Wesentliche.',
        }),
      },
    ],
    pricing: {
      title: t({ fr: 'Ordre de prix', en: 'Price guide', de: 'Preisrahmen' }),
      note: t({
        fr: 'Une réparation dépend du mouvement et des pièces : le prix exact est annoncé après diagnostic, avant toute intervention.',
        en: 'A repair depends on the movement and the parts: the exact price is given after diagnosis, before any work starts.',
        de: 'Eine Reparatur hängt vom Uhrwerk und den Teilen ab: Der genaue Preis wird nach der Diagnose genannt, bevor gearbeitet wird.',
      }),
      items: [
        {
          label: t({
            fr: 'Diagnostic en atelier',
            en: 'Workshop diagnosis',
            de: 'Diagnose in der Werkstatt',
          }),
          price: t({ fr: 'Sur devis', en: 'On quotation', de: 'Auf Anfrage' }),
          detail: t({
            fr: 'Annoncé avant toute intervention',
            en: 'Given before any work starts',
            de: 'Vor Arbeitsbeginn mitgeteilt',
          }),
        },
        {
          label: t({
            fr: 'Révision complète',
            en: 'Full service',
            de: 'Komplettrevision',
          }),
          price: t({ fr: 'Selon mouvement', en: 'Depending on movement', de: 'Je nach Uhrwerk' }),
          detail: t({
            fr: 'Démontage, nettoyage, lubrification et réglage',
            en: 'Stripping, cleaning, lubrication and regulation',
            de: 'Zerlegen, Reinigen, Ölen und Regulieren',
          }),
        },
        {
          label: t({
            fr: 'Changement de verre',
            en: 'Crystal replacement',
            de: 'Glaswechsel',
          }),
          price: t({ fr: 'Selon modèle', en: 'Depending on model', de: 'Je nach Modell' }),
          detail: t({
            fr: 'Selon la disponibilité des pièces',
            en: 'Subject to parts availability',
            de: 'Je nach Verfügbarkeit der Teile',
          }),
        },
        {
          label: t({
            fr: "Test d'étanchéité",
            en: 'Water-resistance test',
            de: 'Dichtheitsprüfung',
          }),
          price: '21 €',
          detail: t({
            fr: "Résultat en moins d'une heure",
            en: 'Result in under an hour',
            de: 'Ergebnis in weniger als einer Stunde',
          }),
        },
      ],
    },
    faq: [
      {
        question: t({
          fr: 'Réparez-vous les montres qui ne viennent pas de chez vous ?',
          en: 'Do you repair watches that were not bought from you?',
          de: 'Reparieren Sie auch Uhren, die nicht bei Ihnen gekauft wurden?',
        }),
        answer: t({
          fr: "Oui. L'atelier prend en charge les montres toutes marques, achetées chez nous ou ailleurs.",
          en: 'Yes. The workshop takes in watches of every brand, whether bought from us or elsewhere.',
          de: 'Ja. Die Werkstatt nimmt Uhren aller Marken an, ob bei uns oder anderswo gekauft.',
        }),
      },
      {
        question: t({
          fr: 'Combien de temps prend une réparation ?',
          en: 'How long does a repair take?',
          de: 'Wie lange dauert eine Reparatur?',
        }),
        answer: t({
          fr: "Une pile ou un bracelet se font au comptoir en quelques minutes. Une révision complète demande plusieurs jours, et davantage si une pièce doit être commandée : le délai figure sur le devis.",
          en: 'A battery or a strap is done at the counter in a few minutes. A full service takes several days, longer if a part has to be ordered: the lead time is stated on the quote.',
          de: 'Batterie oder Armband erledigen wir am Tresen in wenigen Minuten. Eine Komplettrevision dauert mehrere Tage, länger, wenn ein Teil bestellt werden muss: Die Dauer steht im Kostenvoranschlag.',
        }),
      },
      {
        question: t({
          fr: 'Faut-il prendre rendez-vous ?',
          en: 'Do I need an appointment?',
          de: 'Brauche ich einen Termin?',
        }),
        answer: t({
          fr: 'Non. Vous pouvez passer du lundi au samedi, de 9h à 20h. Décrire la panne en ligne avant de venir fait simplement gagner du temps au comptoir.',
          en: 'No. You can come in Monday to Saturday, 9am to 8pm. Describing the fault online beforehand simply saves time at the counter.',
          de: 'Nein. Sie können Montag bis Samstag von 9 bis 20 Uhr vorbeikommen. Den Defekt vorab online zu beschreiben spart am Tresen einfach Zeit.',
        }),
      },
    ],
    seo: {
      title: t({
        fr: 'Réparation de montre à Strasbourg — horloger sur place | Place des Montres',
        en: 'Watch repair in Strasbourg — watchmaker on site | Place des Montres',
        de: 'Uhrenreparatur in Straßburg — Uhrmacher vor Ort | Place des Montres',
      }),
      metaDescription: t({
        fr: "Réparation de montre toutes marques à Strasbourg : diagnostic à l'atelier des Place des Halles, devis avant intervention, quartz, automatique et mécanique.",
        en: 'Watch repair for all brands in Strasbourg: diagnosis in our Place des Halles workshop, quote before any work, quartz, automatic and mechanical.',
        de: 'Uhrenreparatur aller Marken in Straßburg: Diagnose in unserer Werkstatt in der Place des Halles, Kostenvoranschlag vor der Arbeit, Quarz, Automatik und Handaufzug.',
      }),
      ogTitle: t({
        fr: 'Réparation de montre à Strasbourg | Place des Montres',
        en: 'Watch repair in Strasbourg | Place des Montres',
        de: 'Uhrenreparatur in Straßburg | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Horloger et atelier sur place aux Place des Halles : diagnostic, devis et réparation toutes marques.',
        en: 'Watchmaker and workshop on site at Place des Halles: diagnosis, quote and repairs for every brand.',
        de: 'Uhrmacher und Werkstatt vor Ort in der Place des Halles: Diagnose, Kostenvoranschlag und Reparatur aller Marken.',
      }),
    },
  },

  {
    slug: 'changement-pile-montre',
    sectionId: 'piles',
    icon: 'piles',
    repairService: t({
      fr: 'Changement de pile',
      en: 'Battery replacement',
      de: 'Batteriewechsel',
    }),
    navLabel: t({
      fr: 'Changement de pile',
      en: 'Battery replacement',
      de: 'Batteriewechsel',
    }),
    navDescription: t({
      fr: 'Pile RENATA Swiss Made posée en quelques minutes.',
      en: 'RENATA Swiss Made battery fitted in minutes.',
      de: 'RENATA Swiss Made Batterie in wenigen Minuten eingesetzt.',
    }),
    hero: {
      eyebrow: t({
        fr: 'Service express',
        en: 'Express service',
        de: 'Express-Service',
      }),
      title: t({
        fr: 'Changement de pile de montre à Strasbourg',
        en: 'Watch battery replacement in Strasbourg',
        de: 'Uhrenbatterie wechseln in Straßburg',
      }),
      lead: t({
        fr: 'Pile RENATA Swiss Made posée au comptoir en quelques minutes, sans rendez-vous — pour vos montres comme pour vos clés de voiture et vos télécommandes.',
        en: 'A RENATA Swiss Made battery fitted at the counter in a few minutes, no appointment needed — for your watches as well as your car keys and remote controls.',
        de: 'RENATA Swiss Made Batterie in wenigen Minuten am Tresen eingesetzt, ohne Termin — für Ihre Uhren ebenso wie für Autoschlüssel und Fernbedienungen.',
      }),
    },
    highlights: [
      {
        label: t({ fr: 'Prix', en: 'Price', de: 'Preis' }),
        value: '9 €',
        detail: t({
          fr: 'Pose incluse pour la plupart des montres',
          en: 'Fitting included for most watches',
          de: 'Einsetzen bei den meisten Uhren inbegriffen',
        }),
      },
      {
        label: t({ fr: 'Délai', en: 'Lead time', de: 'Dauer' }),
        value: t({ fr: 'Quelques minutes', en: 'A few minutes', de: 'Wenige Minuten' }),
        detail: t({
          fr: 'Sans rendez-vous, du lundi au samedi',
          en: 'No appointment, Monday to Saturday',
          de: 'Ohne Termin, Montag bis Samstag',
        }),
      },
      {
        label: t({ fr: 'Modèles', en: 'Models', de: 'Modelle' }),
        value: t({ fr: 'Toutes marques', en: 'All brands', de: 'Alle Marken' }),
        detail: t({
          fr: 'Quartz, digitale ou classique',
          en: 'Quartz, digital or classic',
          de: 'Quarz, digital oder klassisch',
        }),
      },
    ],
    body: [
      {
        title: t({
          fr: 'Une pile posée dans les règles',
          en: 'A battery fitted properly',
          de: 'Eine fachgerecht eingesetzte Batterie',
        }),
        text: t({
          fr: "Changer une pile ne se limite pas à ouvrir le fond du boîtier : le joint doit être contrôlé et le boîtier refermé correctement, sans quoi l'étanchéité n'est plus assurée. Nous posons des piles RENATA Swiss Made et vérifions le joint à chaque ouverture.",
          en: 'Changing a battery is not just about opening the case back: the gasket has to be checked and the case closed properly, otherwise water resistance is gone. We fit RENATA Swiss Made batteries and check the gasket every time we open a case.',
          de: 'Einen Batteriewechsel macht nicht das Öffnen des Gehäusebodens aus: Die Dichtung muss geprüft und das Gehäuse korrekt verschlossen werden, sonst ist die Dichtheit dahin. Wir setzen RENATA Swiss Made Batterien ein und prüfen bei jedem Öffnen die Dichtung.',
        }),
      },
      {
        title: t({
          fr: 'Au-delà de la montre',
          en: 'Beyond watches',
          de: 'Mehr als nur Uhren',
        }),
        text: t({
          fr: 'Clés de voiture, télécommandes, calculatrices et autres petits objets à pile : même service, même rapidité, au comptoir.',
          en: 'Car keys, remote controls, calculators and other small battery-powered items: the same service, just as fast, at the counter.',
          de: 'Autoschlüssel, Fernbedienungen, Taschenrechner und andere kleine batteriebetriebene Geräte: derselbe Service, ebenso schnell, am Tresen.',
        }),
      },
    ],
    pricing: {
      title: t({ fr: 'Tarifs', en: 'Prices', de: 'Preise' }),
      items: [
        {
          label: t({
            fr: 'Pile RENATA SWISS MADE, pose incluse',
            en: 'RENATA SWISS MADE battery, fitting included',
            de: 'Batterie RENATA SWISS MADE, Einsetzen inbegriffen',
          }),
          price: '9 €',
          detail: t({
            fr: 'Pour la plupart des montres',
            en: 'For most watches',
            de: 'Für die meisten Uhren',
          }),
        },
        {
          label: t({
            fr: "Test d'étanchéité après ouverture",
            en: 'Water-resistance test after opening',
            de: 'Dichtheitsprüfung nach dem Öffnen',
          }),
          price: '21 €',
          detail: t({
            fr: 'Recommandé pour une montre de plongée ou de sport',
            en: 'Recommended for a diving or sports watch',
            de: 'Empfohlen für Taucher- und Sportuhren',
          }),
        },
      ],
    },
    faq: [
      {
        question: t({
          fr: 'Faut-il prendre rendez-vous pour changer une pile ?',
          en: 'Do I need an appointment for a battery change?',
          de: 'Brauche ich für den Batteriewechsel einen Termin?',
        }),
        answer: t({
          fr: "Non, passez quand vous voulez du lundi au samedi de 9h à 20h : l'intervention prend quelques minutes.",
          en: 'No, come in whenever you like, Monday to Saturday from 9am to 8pm: it takes a few minutes.',
          de: 'Nein, kommen Sie einfach vorbei, Montag bis Samstag von 9 bis 20 Uhr: Es dauert wenige Minuten.',
        }),
      },
      {
        question: t({
          fr: 'Ma montre reste-t-elle étanche après le changement de pile ?',
          en: 'Is my watch still water-resistant after a battery change?',
          de: 'Bleibt meine Uhr nach dem Batteriewechsel dicht?',
        }),
        answer: t({
          fr: "Le joint est contrôlé à chaque ouverture et remplacé si nécessaire. Pour une montre de plongée ou de sport, nous recommandons un test d'étanchéité juste après l'intervention.",
          en: 'The gasket is checked every time the case is opened and replaced if needed. For a diving or sports watch we recommend a water-resistance test right after the work.',
          de: 'Die Dichtung wird bei jedem Öffnen geprüft und bei Bedarf ersetzt. Bei Taucher- oder Sportuhren empfehlen wir direkt danach eine Dichtheitsprüfung.',
        }),
      },
      {
        question: t({
          fr: 'Changez-vous les piles des montres connectées ?',
          en: 'Do you change batteries in connected watches?',
          de: 'Wechseln Sie auch Batterien von Smartwatches?',
        }),
        answer: t({
          fr: "Oui pour les modèles à pile. Les montres à batterie rechargeable relèvent du service après-vente de leur marque.",
          en: 'Yes for models that run on a battery cell. Watches with a rechargeable battery are handled by their brand’s after-sales service.',
          de: 'Ja, bei Modellen mit Knopfzelle. Uhren mit Akku betreut der Kundendienst der jeweiligen Marke.',
        }),
      },
    ],
    seo: {
      title: t({
        fr: 'Changement de pile de montre à Strasbourg — 9 € | Place des Montres',
        en: 'Watch battery replacement in Strasbourg — €9 | Place des Montres',
        de: 'Uhrenbatterie wechseln in Straßburg — 9 € | Place des Montres',
      }),
      metaDescription: t({
        fr: 'Changement de pile de montre à Strasbourg : pile RENATA Swiss Made 9 € pose incluse, en quelques minutes et sans rendez-vous aux Place des Halles.',
        en: 'Watch battery replacement in Strasbourg: RENATA Swiss Made battery €9 including fitting, in a few minutes and with no appointment at Place des Halles.',
        de: 'Uhrenbatterie wechseln in Straßburg: RENATA Swiss Made Batterie 9 € inklusive Einsetzen, in wenigen Minuten und ohne Termin in der Place des Halles.',
      }),
      ogTitle: t({
        fr: 'Changement de pile de montre — 9 € | Place des Montres',
        en: 'Watch battery replacement — €9 | Place des Montres',
        de: 'Uhrenbatterie wechseln — 9 € | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Pile RENATA Swiss Made posée sur place en quelques minutes, joint contrôlé à chaque ouverture.',
        en: 'RENATA Swiss Made battery fitted on site in minutes, gasket checked every time.',
        de: 'RENATA Swiss Made Batterie in Minuten vor Ort eingesetzt, Dichtung jedes Mal geprüft.',
      }),
    },
  },

  {
    slug: 'test-etancheite-montre',
    icon: 'atelier',
    repairService: t({
      fr: "Test d'étanchéité",
      en: 'Water-resistance test',
      de: 'Dichtheitsprüfung',
    }),
    navLabel: t({
      fr: "Test d'étanchéité",
      en: 'Water-resistance test',
      de: 'Dichtheitsprüfung',
    }),
    navDescription: t({
      fr: 'Contrôle sur place, résultat en moins d’une heure.',
      en: 'Tested on site, result in under an hour.',
      de: 'Prüfung vor Ort, Ergebnis in weniger als einer Stunde.',
    }),
    hero: {
      eyebrow: t({
        fr: 'Contrôle en moins d’une heure',
        en: 'Checked in under an hour',
        de: 'Prüfung in weniger als einer Stunde',
      }),
      title: t({
        fr: "Test d'étanchéité de montre à Strasbourg",
        en: 'Watch water-resistance testing in Strasbourg',
        de: 'Dichtheitsprüfung für Uhren in Straßburg',
      }),
      lead: t({
        fr: "Contrôle réalisé sur place, résultat en moins d'une heure : avant l'été, après un changement de pile, ou au moindre doute.",
        en: 'Tested on site with a result in under an hour: before the summer, after a battery change, or at the first sign of doubt.',
        de: 'Prüfung vor Ort mit Ergebnis in weniger als einer Stunde: vor dem Sommer, nach einem Batteriewechsel oder beim geringsten Zweifel.',
      }),
    },
    highlights: [
      {
        label: t({ fr: 'Prix', en: 'Price', de: 'Preis' }),
        value: '21 €',
        detail: t({
          fr: 'Test et contrôle compris',
          en: 'Test and inspection included',
          de: 'Prüfung und Kontrolle inbegriffen',
        }),
      },
      {
        label: t({ fr: 'Délai', en: 'Lead time', de: 'Dauer' }),
        value: t({ fr: "Moins d'une heure", en: 'Under an hour', de: 'Unter einer Stunde' }),
        detail: t({
          fr: 'Réalisé à l’atelier, sans envoi extérieur',
          en: 'Done in our workshop, nothing sent away',
          de: 'In unserer Werkstatt, ohne Versand',
        }),
      },
      {
        label: t({ fr: 'Recommandé', en: 'Recommended', de: 'Empfohlen' }),
        value: t({ fr: 'Après ouverture', en: 'After opening', de: 'Nach dem Öffnen' }),
        detail: t({
          fr: 'Pile, réparation, ou avant la baignade',
          en: 'Battery, repair, or before swimming',
          de: 'Batterie, Reparatur oder vor dem Schwimmen',
        }),
      },
    ],
    body: [
      {
        title: t({
          fr: "Pourquoi tester l'étanchéité",
          en: 'Why test water resistance',
          de: 'Warum die Dichtheit prüfen',
        }),
        text: t({
          fr: "L'étanchéité d'une montre n'est pas acquise une fois pour toutes : les joints vieillissent, un choc ou une couronne mal revissée suffit à laisser passer l'humidité. Un test coûte bien moins cher qu'un mouvement à remplacer.",
          en: 'A watch is not water-resistant for ever: gaskets age, and a knock or a crown left unscrewed is enough to let moisture in. A test costs far less than a replacement movement.',
          de: 'Die Dichtheit einer Uhr hält nicht ewig: Dichtungen altern, und ein Stoß oder eine nicht verschraubte Krone genügt, damit Feuchtigkeit eindringt. Eine Prüfung kostet weit weniger als ein neues Uhrwerk.',
        }),
      },
      {
        title: t({
          fr: 'Quand le faire',
          en: 'When to have it done',
          de: 'Wann sie sinnvoll ist',
        }),
        text: t({
          fr: "Après chaque ouverture du boîtier (changement de pile, réparation), avant les vacances si vous nagez avec votre montre, et dès qu'une buée apparaît sous le verre. Les mentions « 3 ATM », « 5 ATM » ou « 10 ATM » sont expliquées dans le <a href=\"/guide-horloger\" class=\"text-primary underline\">Guide de l'horloger</a>.",
          en: 'After every time the case is opened (battery change, repair), before a holiday if you swim with your watch, and as soon as condensation appears under the crystal. The markings “3 ATM”, “5 ATM” and “10 ATM” are explained in the <a href="/guide-horloger" class="text-primary underline">watchmaker\'s guide</a>.',
          de: 'Nach jedem Öffnen des Gehäuses (Batteriewechsel, Reparatur), vor dem Urlaub, wenn Sie mit der Uhr schwimmen, und sobald sich Beschlag unter dem Glas zeigt. Die Angaben „3 ATM“, „5 ATM“ und „10 ATM“ erklärt der <a href="/guide-horloger" class="text-primary underline">Uhrmacher-Ratgeber</a>.',
        }),
      },
    ],
    pricing: {
      title: t({ fr: 'Tarif', en: 'Price', de: 'Preis' }),
      items: [
        {
          label: t({
            fr: "Test et contrôle d'étanchéité",
            en: 'Water-resistance test and inspection',
            de: 'Dichtheitsprüfung und Kontrolle',
          }),
          price: '21 €',
          detail: t({
            fr: "Résultat en moins d'une heure",
            en: 'Result in under an hour',
            de: 'Ergebnis in weniger als einer Stunde',
          }),
        },
      ],
    },
    faq: [
      {
        question: t({
          fr: 'Ma montre a pris l’eau, que faire ?',
          en: 'Water got into my watch — what should I do?',
          de: 'In meine Uhr ist Wasser eingedrungen — was tun?',
        }),
        answer: t({
          fr: "Apportez-la sans attendre : plus l'humidité reste à l'intérieur, plus le mouvement s'oxyde. Nous ouvrons le boîtier, séchons et évaluons les dégâts avant de vous proposer la suite.",
          en: 'Bring it in straight away: the longer moisture stays inside, the more the movement corrodes. We open the case, dry it and assess the damage before suggesting what to do next.',
          de: 'Bringen Sie sie sofort vorbei: Je länger die Feuchtigkeit bleibt, desto stärker korrodiert das Uhrwerk. Wir öffnen das Gehäuse, trocknen es und beurteilen den Schaden, bevor wir das weitere Vorgehen vorschlagen.',
        }),
      },
      {
        question: t({
          fr: 'Puis-je nager avec une montre « 3 ATM » ?',
          en: 'Can I swim with a “3 ATM” watch?',
          de: 'Kann ich mit einer „3 ATM“-Uhr schwimmen?',
        }),
        answer: t({
          fr: "Non. Une montre 3 ATM supporte les éclaboussures et la pluie, pas la baignade. La natation demande au minimum 5 ATM, la plongée 10 ATM et plus.",
          en: 'No. A 3 ATM watch copes with splashes and rain, not swimming. Swimming calls for at least 5 ATM, diving for 10 ATM and above.',
          de: 'Nein. Eine 3-ATM-Uhr verträgt Spritzwasser und Regen, aber kein Schwimmen. Zum Schwimmen braucht es mindestens 5 ATM, zum Tauchen 10 ATM und mehr.',
        }),
      },
    ],
    seo: {
      title: t({
        fr: "Test d'étanchéité de montre à Strasbourg — 21 € en 1 h | Place des Montres",
        en: 'Watch water-resistance test in Strasbourg — €21 in 1 hour | Place des Montres',
        de: 'Dichtheitsprüfung für Uhren in Straßburg — 21 € in 1 Std. | Place des Montres',
      }),
      metaDescription: t({
        fr: "Test d'étanchéité de montre à Strasbourg : contrôle réalisé sur place aux Place des Halles, 21 €, résultat en moins d'une heure.",
        en: 'Watch water-resistance testing in Strasbourg: carried out on site at Place des Halles, €21, result in under an hour.',
        de: 'Dichtheitsprüfung für Uhren in Straßburg: vor Ort in der Place des Halles, 21 €, Ergebnis in weniger als einer Stunde.',
      }),
      ogTitle: t({
        fr: "Test d'étanchéité de montre — 21 € | Place des Montres",
        en: 'Watch water-resistance test — €21 | Place des Montres',
        de: 'Dichtheitsprüfung für Uhren — 21 € | Place des Montres',
      }),
      ogDescription: t({
        fr: "Contrôle réalisé à l'atelier, résultat en moins d'une heure.",
        en: 'Carried out in our workshop, result in under an hour.',
        de: 'In unserer Werkstatt durchgeführt, Ergebnis in weniger als einer Stunde.',
      }),
    },
  },

  {
    slug: 'bracelets-montre-strasbourg',
    sectionId: 'bracelets',
    icon: 'bracelets',
    repairService: t({
      fr: 'Bracelet : pose, ajustement, remplacement',
      en: 'Strap: fitting, adjustment, replacement',
      de: 'Armband: Montage, Anpassung, Wechsel',
    }),
    navLabel: t({
      fr: 'Bracelets',
      en: 'Straps & bracelets',
      de: 'Armbänder',
    }),
    navDescription: t({
      fr: 'Cuir, acier, caoutchouc, NATO — posés au comptoir.',
      en: 'Leather, steel, rubber, NATO — fitted at the counter.',
      de: 'Leder, Stahl, Kautschuk, NATO — am Tresen montiert.',
    }),
    hero: {
      eyebrow: t({
        fr: 'Le plus grand choix de Strasbourg',
        en: 'The widest choice in Strasbourg',
        de: 'Die größte Auswahl in Straßburg',
      }),
      title: t({
        fr: 'Bracelets de montre à Strasbourg',
        en: 'Watch straps in Strasbourg',
        de: 'Uhrenarmbänder in Straßburg',
      }),
      lead: t({
        fr: 'Cuir, acier, caoutchouc ou NATO : nous posons et ajustons votre bracelet au comptoir, et nous ajustons gratuitement les bracelets métal des montres commandées en ligne.',
        en: 'Leather, steel, rubber or NATO: we fit and adjust your strap at the counter, and we adjust the metal bracelets of watches ordered online free of charge.',
        de: 'Leder, Stahl, Kautschuk oder NATO: Wir montieren und passen Ihr Armband am Tresen an — und passen Metallarmbänder online bestellter Uhren kostenlos an.',
      }),
    },
    highlights: [
      {
        label: t({ fr: 'Choix', en: 'Choice', de: 'Auswahl' }),
        value: t({ fr: 'N°1 à Strasbourg', en: 'No. 1 in Strasbourg', de: 'Nr. 1 in Straßburg' }),
        detail: t({
          fr: 'Cuir, acier, caoutchouc, NATO',
          en: 'Leather, steel, rubber, NATO',
          de: 'Leder, Stahl, Kautschuk, NATO',
        }),
      },
      {
        label: t({ fr: 'Pose', en: 'Fitting', de: 'Montage' }),
        value: t({ fr: 'Immédiate', en: 'On the spot', de: 'Sofort' }),
        detail: t({
          fr: 'Ajustement et conseil taille au comptoir',
          en: 'Adjustment and sizing advice at the counter',
          de: 'Anpassung und Größenberatung am Tresen',
        }),
      },
      {
        label: t({ fr: 'Commande en ligne', en: 'Online orders', de: 'Online-Bestellung' }),
        value: t({ fr: 'Ajustement offert', en: 'Free adjustment', de: 'Anpassung gratis' }),
        detail: t({
          fr: 'Bracelet métal mis à votre poignet avant expédition',
          en: 'Metal bracelet sized to your wrist before dispatch',
          de: 'Metallarmband vor dem Versand an Ihr Handgelenk angepasst',
        }),
      },
    ],
    body: [
      {
        title: t({
          fr: 'Trouver le bon bracelet',
          en: 'Finding the right strap',
          de: 'Das passende Armband finden',
        }),
        text: t({
          fr: "Un bracelet se choisit d'abord à la bonne largeur d'entrecorne, puis selon l'usage : le cuir pour l'élégance, l'acier pour la robustesse, le caoutchouc pour le sport et l'eau, le NATO pour changer de style sans outil. Nous mesurons et posons devant vous.",
          en: 'A strap is chosen first by lug width, then by use: leather for elegance, steel for durability, rubber for sport and water, NATO to change the look without tools. We measure and fit it in front of you.',
          de: 'Ein Armband wählt man zuerst nach der Bandanstoßbreite, dann nach dem Einsatz: Leder für Eleganz, Stahl für Robustheit, Kautschuk für Sport und Wasser, NATO für schnellen Stilwechsel ohne Werkzeug. Wir messen und montieren vor Ihren Augen.',
        }),
      },
      {
        title: t({
          fr: 'Ajustement offert sur les commandes en ligne',
          en: 'Free adjustment on online orders',
          de: 'Kostenlose Anpassung bei Online-Bestellungen',
        }),
        text: t({
          fr: "Pour toute montre à bracelet métal commandée sur le site, nous ajustons gratuitement le bracelet à votre tour de poignet avant l'envoi : indiquez votre mesure à la commande, la montre arrive prête à porter.",
          en: 'For any watch with a metal bracelet ordered on the site, we adjust the bracelet to your wrist size free of charge before dispatch: give us your measurement when ordering and the watch arrives ready to wear.',
          de: 'Bei jeder online bestellten Uhr mit Metallarmband passen wir das Armband vor dem Versand kostenlos an Ihren Handgelenkumfang an: Geben Sie Ihr Maß bei der Bestellung an, und die Uhr kommt tragefertig an.',
        }),
      },
    ],
    pricing: {
      title: t({ fr: 'Tarifs', en: 'Prices', de: 'Preise' }),
      note: t({
        fr: 'Le prix dépend du bracelet choisi : nous vous l’annonçons avant la pose.',
        en: 'The price depends on the strap you choose: we tell you before fitting it.',
        de: 'Der Preis hängt vom gewählten Armband ab: Wir nennen ihn vor der Montage.',
      }),
      items: [
        {
          label: t({
            fr: 'Ajustement d’un bracelet métal commandé en ligne',
            en: 'Adjusting a metal bracelet ordered online',
            de: 'Anpassung eines online bestellten Metallarmbands',
          }),
          price: t({ fr: 'Offert', en: 'Free', de: 'Kostenlos' }),
          detail: t({
            fr: 'Réalisé avant expédition',
            en: 'Done before dispatch',
            de: 'Vor dem Versand erledigt',
          }),
        },
        {
          label: t({
            fr: 'Pose et ajustement en magasin',
            en: 'Fitting and adjustment in store',
            de: 'Montage und Anpassung im Geschäft',
          }),
          price: t({ fr: 'Selon bracelet', en: 'Depending on strap', de: 'Je nach Armband' }),
          detail: t({
            fr: 'Conseil taille compris',
            en: 'Sizing advice included',
            de: 'Größenberatung inbegriffen',
          }),
        },
      ],
    },
    faq: [
      {
        question: t({
          fr: 'Posez-vous un bracelet acheté ailleurs ?',
          en: 'Will you fit a strap bought elsewhere?',
          de: 'Montieren Sie auch ein anderswo gekauftes Armband?',
        }),
        answer: t({
          fr: 'Oui, dès lors que la largeur correspond à la montre. Passez avec la montre et le bracelet, la pose se fait au comptoir.',
          en: 'Yes, as long as the width matches the watch. Bring the watch and the strap and we fit it at the counter.',
          de: 'Ja, sofern die Breite zur Uhr passt. Bringen Sie Uhr und Armband mit, die Montage erfolgt am Tresen.',
        }),
      },
      {
        question: t({
          fr: 'Comment connaître mon tour de poignet ?',
          en: 'How do I measure my wrist?',
          de: 'Wie messe ich meinen Handgelenkumfang?',
        }),
        answer: t({
          fr: 'Un mètre ruban de couturière suffit, ou une bande de papier reportée sur une règle. Notre guide de mesure au format PDF, disponible sur la page <a href="/services" class="text-primary underline">Nos services</a>, détaille la méthode.',
          en: 'A tailor’s tape measure will do, or a strip of paper measured against a ruler. Our PDF measuring guide, available on the <a href="/services" class="text-primary underline">Our services</a> page, explains the method.',
          de: 'Ein Schneidermaßband genügt, oder ein Papierstreifen, den Sie an einem Lineal ablesen. Unsere PDF-Maßanleitung auf der Seite <a href="/services" class="text-primary underline">Unsere Leistungen</a> beschreibt das Vorgehen.',
        }),
      },
    ],
    seo: {
      title: t({
        fr: 'Bracelets de montre à Strasbourg — pose et ajustement | Place des Montres',
        en: 'Watch straps in Strasbourg — fitting and adjustment | Place des Montres',
        de: 'Uhrenarmbänder in Straßburg — Montage und Anpassung | Place des Montres',
      }),
      metaDescription: t({
        fr: 'Bracelets de montre à Strasbourg : cuir, acier, caoutchouc et NATO, posés et ajustés au comptoir aux Place des Halles. Ajustement offert sur les commandes en ligne.',
        en: 'Watch straps in Strasbourg: leather, steel, rubber and NATO, fitted and adjusted at the counter at Place des Halles. Free adjustment on online orders.',
        de: 'Uhrenarmbänder in Straßburg: Leder, Stahl, Kautschuk und NATO, am Tresen in der Place des Halles montiert und angepasst. Kostenlose Anpassung bei Online-Bestellungen.',
      }),
      ogTitle: t({
        fr: 'Bracelets de montre à Strasbourg | Place des Montres',
        en: 'Watch straps in Strasbourg | Place des Montres',
        de: 'Uhrenarmbänder in Straßburg | Place des Montres',
      }),
      ogDescription: t({
        fr: 'Cuir, acier, caoutchouc, NATO : le plus grand choix de la ville, posé et ajusté au comptoir.',
        en: 'Leather, steel, rubber, NATO: the widest choice in town, fitted and adjusted at the counter.',
        de: 'Leder, Stahl, Kautschuk, NATO: die größte Auswahl der Stadt, am Tresen montiert und angepasst.',
      }),
    },
  },
]

export default {
  /** Zone desservie, reprise dans le schema.org `Service` des pages prestation. */
  areaServed: t({ fr: 'Strasbourg', en: 'Strasbourg', de: 'Straßburg' }),
  repairRequest,
  landings,
}
