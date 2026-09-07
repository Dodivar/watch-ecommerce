import homeSelectionCards from './homeSelections.config.js'
import guidePage from './guide.config.js'
import servicesAtelier from './services.config.js'
import { publicPath } from '../../packages/base/src/utils/publicPath.js'
import { t } from '../../packages/base/src/site/i18nValue.js'

/** Guide de mesure du poignet — cité par la FAQ (3 langues) et la page « Nos services ». */
const MEASURE_GUIDE_PDF = publicPath('documents/aide-ajustement-montres.pdf')

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
        question: t({
          fr: 'Le modèle affiché est-il disponible en stock ?',
          en: 'Is the model shown in stock?',
          de: 'Ist das angezeigte Modell auf Lager?',
        }),
        answer: t({
          fr: 'Nous mettons en ligne uniquement des modèles <strong>disponibles en stock</strong>. Les stocks sont mis à jour plusieurs fois par jour. Tant que votre commande n’est pas validée, il se peut qu’un article sélectionné soit acheté par un autre client&nbsp;: la vente est alors annulée et vous êtes prévenu par e-mail.',
          en: 'We only list models that are <strong>in stock</strong>. Stock is refreshed several times a day. Until your order is confirmed, an item you have selected may be bought by another customer: the sale is then cancelled and you are notified by email.',
          de: 'Wir stellen ausschließlich Modelle online, die <strong>auf Lager</strong> sind. Der Bestand wird mehrmals täglich aktualisiert. Solange Ihre Bestellung nicht bestätigt ist, kann ein ausgewählter Artikel von einer anderen Kundin oder einem anderen Kunden gekauft werden: Der Verkauf wird dann storniert und Sie werden per E-Mail benachrichtigt.',
        }),
      },
      {
        id: 2,
        question: t({
          fr: 'Puis-je modifier ou annuler ma commande ?',
          en: 'Can I change or cancel my order?',
          de: 'Kann ich meine Bestellung ändern oder stornieren?',
        }),
        answer: t({
          fr: 'La modification ou la suppression d’une ligne de commande doit intervenir au niveau du <strong>panier</strong>, avant validation du paiement. Au-delà, la vente est ferme et la livraison interviendra. Vous disposez toutefois d’un délai de <strong>30&nbsp;jours</strong> pour retourner votre achat (voir ci-dessous).',
          en: 'A line must be changed or removed in the <strong>basket</strong>, before payment is confirmed. Beyond that point the sale is final and delivery will go ahead. You do, however, have <strong>30&nbsp;days</strong> to return your purchase (see below).',
          de: 'Das Ändern oder Entfernen einer Bestellposition muss im <strong>Warenkorb</strong> erfolgen, bevor die Zahlung bestätigt wird. Danach ist der Kauf verbindlich und die Lieferung erfolgt. Sie haben jedoch <strong>30&nbsp;Tage</strong> Zeit, Ihren Kauf zurückzusenden (siehe unten).',
        }),
      },
      {
        id: 3,
        question: t({
          fr: 'Quels moyens de paiement acceptez-vous ?',
          en: 'Which payment methods do you accept?',
          de: 'Welche Zahlungsmittel akzeptieren Sie?',
        }),
        answer: t({
          fr: 'Vous pouvez régler vos achats par <strong>carte bancaire</strong> (Visa, Mastercard, Cartes Bleues). Le paiement par <strong>virement</strong> ou par <strong>chèque</strong> n’est pas proposé en ligne, afin de garantir des délais de livraison fiables et une gestion précise des stocks.',
          en: 'You can pay by <strong>bank card</strong> (Visa, Mastercard, Cartes Bleues). Payment by <strong>bank transfer</strong> or <strong>cheque</strong> is not offered online, so that delivery times stay reliable and stock is tracked accurately.',
          de: 'Sie können mit <strong>Bankkarte</strong> bezahlen (Visa, Mastercard, Cartes Bleues). Zahlung per <strong>Überweisung</strong> oder <strong>Scheck</strong> bieten wir online nicht an, um zuverlässige Lieferzeiten und eine genaue Bestandsführung zu gewährleisten.',
        }),
      },
      {
        id: 4,
        question: t({
          fr: 'Le paiement en ligne est-il sécurisé ?',
          en: 'Is online payment secure?',
          de: 'Ist die Online-Zahlung sicher?',
        }),
        answer: t({
          fr: 'Le site utilise le <strong>cryptage SSL</strong> pour protéger vos données. Le paiement est traité via un prestataire certifié (<strong>Stripe</strong>), qui applique les standards de sécurité les plus exigeants pour vos coordonnées bancaires.',
          en: 'The site uses <strong>SSL encryption</strong> to protect your data. Payment is handled by a certified provider (<strong>Stripe</strong>), which applies the most demanding security standards to your card details.',
          de: 'Die Website nutzt eine <strong>SSL-Verschlüsselung</strong> zum Schutz Ihrer Daten. Die Zahlung wird über einen zertifizierten Anbieter (<strong>Stripe</strong>) abgewickelt, der höchste Sicherheitsstandards für Ihre Bankdaten anwendet.',
        }),
      },
      {
        id: 5,
        question: t({
          fr: 'Quelles sont les modalités de livraison en France ?',
          en: 'What are the delivery terms within France?',
          de: 'Wie sind die Lieferbedingungen innerhalb Frankreichs?',
        }),
        answer: t({
          fr: 'Pour la France métropolitaine, la livraison en <strong>Colissimo suivi</strong> est <strong>offerte à partir de 80&nbsp;€</strong> d’achat. En dessous de ce seuil, les frais de port s’affichent avant validation du panier. Expédition sous environ <strong>48&nbsp;h</strong> après réception du paiement (délai indicatif, jours ouvrés). Vous pouvez vous faire livrer à domicile, sur votre lieu de travail ou dans un <strong>point relais</strong>. Lors de l’envoi, vous recevez un numéro de colisage par e-mail ou SMS&nbsp;; le suivi est disponible sur <strong>colissimo.fr</strong>. En cas de retard, consultez d’abord le site du transporteur, puis contactez notre service client. Si le colis n’est pas livré, une enquête sera menée auprès du transporteur&nbsp;: réexpédition ou remboursement selon le résultat. Si vous ne pouvez pas être présent, choisissez la livraison en point de dépôt.',
          en: 'For mainland France, tracked <strong>Colissimo</strong> delivery is <strong>free from €80</strong>. Below that threshold, shipping costs are shown before you confirm your basket. Dispatch takes around <strong>48&nbsp;hours</strong> after payment is received (indicative, working days). You can be delivered at home, at your workplace or to a <strong>pick-up point</strong>. When the parcel is sent you receive a tracking number by email or SMS; tracking is available on <strong>colissimo.fr</strong>. If it is late, check the carrier’s website first, then contact our customer service. If the parcel is not delivered, an enquiry is opened with the carrier: reshipment or refund depending on the outcome. If you cannot be there to receive it, choose delivery to a drop-off point.',
          de: 'Für das französische Mutterland ist die Lieferung per <strong>Colissimo mit Sendungsverfolgung</strong> <strong>ab 80&nbsp;€ Einkaufswert kostenlos</strong>. Darunter werden die Versandkosten vor der Bestätigung des Warenkorbs angezeigt. Versand etwa <strong>48&nbsp;Stunden</strong> nach Zahlungseingang (Richtwert, Werktage). Sie können sich nach Hause, an Ihren Arbeitsplatz oder an einen <strong>Paketshop</strong> liefern lassen. Beim Versand erhalten Sie eine Sendungsnummer per E-Mail oder SMS; die Sendungsverfolgung finden Sie auf <strong>colissimo.fr</strong>. Bei Verzögerungen prüfen Sie zuerst die Website des Transportunternehmens und wenden sich dann an unseren Kundenservice. Wird das Paket nicht zugestellt, wird beim Transportunternehmen nachgeforscht: je nach Ergebnis erfolgt ein erneuter Versand oder eine Rückerstattung. Wenn Sie nicht anwesend sein können, wählen Sie die Lieferung an einen Paketshop.',
        }),
      },
      {
        id: 6,
        question: t({
          fr: 'Puis-je retirer ma commande au magasin à Strasbourg ?',
          en: 'Can I collect my order from the Strasbourg store?',
          de: 'Kann ich meine Bestellung im Geschäft in Straßburg abholen?',
        }),
        answer: t({
          fr: 'Oui&nbsp;: c’est le meilleur moyen de «&nbsp;réserver&nbsp;» une montre. Commandez en ligne sur placedesmontres.fr, puis retirez votre commande au <strong>Centre commercial Place des Halles</strong>, 67000 Strasbourg, du <strong>lundi au samedi de 9h à 20h</strong>, quand vous le souhaitez. Il n’est pas possible de réserver un modèle sans l’acheter en ligne, pour garantir la fiabilité du stock.',
          en: 'Yes — it is the best way to “reserve” a watch. Order online at placedesmontres.fr, then collect your order at the <strong>Place des Halles shopping centre</strong>, 67000 Strasbourg, <strong>Monday to Saturday from 9am to 8pm</strong>, whenever suits you. A model cannot be reserved without buying it online, so that stock figures stay reliable.',
          de: 'Ja — das ist der beste Weg, eine Uhr zu „reservieren“. Bestellen Sie online auf placedesmontres.fr und holen Sie Ihre Bestellung im <strong>Einkaufszentrum Place des Halles</strong>, 67000 Straßburg, <strong>Montag bis Samstag von 9 bis 20 Uhr</strong> ab, wann es Ihnen passt. Eine Reservierung ohne Online-Kauf ist nicht möglich, damit der Bestand verlässlich bleibt.',
        }),
      },
      {
        id: 7,
        question: t({
          fr: 'Comment réceptionner mon colis ?',
          en: 'How should I take delivery of my parcel?',
          de: 'Wie nehme ich mein Paket entgegen?',
        }),
        answer: t({
          fr: 'À réception de votre commande, nous vous recommandons vivement de vérifier la conformité en présence du livreur, surtout si le colis est abîmé. Pour qu’une réclamation soit recevable, elle doit être mentionnée par écrit au moment de la réception. En cas de doute, il est conseillé de refuser le colis et d’en informer notre service client par e-mail à service.client@placedesmontres.fr ou au 03 88 22 40 40.',
          en: 'When your order arrives, we strongly recommend checking it in the presence of the delivery driver, especially if the parcel is damaged. For a claim to be admissible it must be noted in writing at the time of delivery. If in doubt, refuse the parcel and inform our customer service by email at service.client@placedesmontres.fr or on 03 88 22 40 40.',
          de: 'Wir empfehlen dringend, die Lieferung bei Erhalt in Anwesenheit der Zustellperson zu prüfen, insbesondere wenn das Paket beschädigt ist. Damit eine Reklamation zulässig ist, muss sie bei der Entgegennahme schriftlich vermerkt werden. Im Zweifelsfall nehmen Sie das Paket nicht an und informieren unseren Kundenservice per E-Mail an service.client@placedesmontres.fr oder unter 03 88 22 40 40.',
        }),
      },
      {
        id: 8,
        question: t({
          fr: 'Puis-je retourner ou échanger une montre ?',
          en: 'Can I return or exchange a watch?',
          de: 'Kann ich eine Uhr zurückgeben oder umtauschen?',
        }),
        answer: t({
          fr: 'Oui&nbsp;: vous disposez d’un délai de <strong>30&nbsp;jours</strong> à compter de la réception pour nous notifier votre souhait de retour ou d’échange. La procédure est la même pour un échange&nbsp;: indiquez le produit souhaité en remplacement. Si celui-ci n’est pas disponible immédiatement, nous pouvons vous émettre un avoir.',
          en: 'Yes — you have <strong>30&nbsp;days</strong> from delivery to tell us you wish to return or exchange it. The procedure is the same for an exchange: tell us which product you would like instead. If it is not immediately available, we can issue you a credit note.',
          de: 'Ja — Sie haben ab Erhalt <strong>30&nbsp;Tage</strong> Zeit, uns Ihren Rückgabe- oder Umtauschwunsch mitzuteilen. Beim Umtausch ist das Vorgehen identisch: Nennen Sie uns das gewünschte Ersatzprodukt. Ist es nicht sofort verfügbar, können wir Ihnen eine Gutschrift ausstellen.',
        }),
      },
      {
        id: 9,
        question: t({
          fr: 'Comment effectuer un retour ?',
          en: 'How do I make a return?',
          de: 'Wie sende ich einen Artikel zurück?',
        }),
        answer: t({
          fr: 'Envoyez un e-mail à <strong>service.client@placedesmontres.fr</strong> avec votre numéro de facture, vos coordonnées et votre numéro de client. Attendez un <strong>numéro de retour</strong> en réponse. Les articles doivent être dans leur emballage d’origine, complets (garantie, accessoires, notice). Mentionnez le numéro de retour sur le colis et joignez une copie du mail de retour à l’intérieur. Adresse de retour&nbsp;: <strong>Place des Montres — Retour N°&nbsp;… — Centre commercial Place des Halles — 67000 Strasbourg</strong>.',
          en: 'Send an email to <strong>service.client@placedesmontres.fr</strong> with your invoice number, your contact details and your customer number. Wait for a <strong>return number</strong> in reply. Items must be in their original packaging and complete (warranty, accessories, instructions). Write the return number on the parcel and enclose a copy of the return email inside. Return address: <strong>Place des Montres — Retour N°&nbsp;… — Centre commercial Place des Halles — 67000 Strasbourg</strong>.',
          de: 'Senden Sie eine E-Mail an <strong>service.client@placedesmontres.fr</strong> mit Ihrer Rechnungsnummer, Ihren Kontaktdaten und Ihrer Kundennummer. Warten Sie die <strong>Rücksendenummer</strong> in der Antwort ab. Die Artikel müssen sich in der Originalverpackung befinden und vollständig sein (Garantie, Zubehör, Anleitung). Vermerken Sie die Rücksendenummer auf dem Paket und legen Sie eine Kopie der Rücksende-E-Mail bei. Rücksendeadresse: <strong>Place des Montres — Retour N°&nbsp;… — Centre commercial Place des Halles — 67000 Strasbourg</strong>.',
        }),
      },
      {
        id: 10,
        question: t({
          fr: 'Les montres sont-elles neuves et couvertes par une garantie ?',
          en: 'Are the watches new and covered by a warranty?',
          de: 'Sind die Uhren neu und durch eine Garantie gedeckt?',
        }),
        answer: t({
          fr: 'Place des Montres est un <strong>spécialiste de la montre depuis 1995</strong>. Toutes nos montres bénéficient d’une <strong>garantie constructeur minimum de 2&nbsp;ans</strong> à partir de la date d’achat. Elle couvre les défauts de fabrication et les pannes d’origine interne. Ne sont pas couverts&nbsp;: les consommables (piles, verres, bracelets, joints…), l’usage anormal, une réparation par un intervenant non agréé, ou les dommages dus à un choc, une chute ou une immersion inappropriée. Votre montre est livrée avec une garantie constructeur tamponnée, datée et référencée&nbsp;: conservez-la dans l’écrin. Pour toute prise en charge, consultez notre page <a href="/services" class="text-primary underline">Nos services</a>.',
          en: 'Place des Montres has been a <strong>watch specialist since 1995</strong>. All our watches come with a <strong>manufacturer’s warranty of at least 2&nbsp;years</strong> from the date of purchase. It covers manufacturing defects and internal failures. Not covered: consumables (batteries, crystals, straps, seals…), abnormal use, repair by a non-approved party, or damage caused by an impact, a fall or inappropriate immersion. Your watch is delivered with a stamped, dated and referenced manufacturer’s warranty: keep it in its case. For any claim, see our <a href="/services" class="text-primary underline">Our services</a> page.',
          de: 'Place des Montres ist <strong>seit 1995 Uhrenspezialist</strong>. Alle unsere Uhren haben eine <strong>Herstellergarantie von mindestens 2&nbsp;Jahren</strong> ab Kaufdatum. Sie deckt Herstellungsfehler und Defekte interner Ursache ab. Nicht abgedeckt sind: Verschleißteile (Batterien, Gläser, Armbänder, Dichtungen …), unsachgemäßer Gebrauch, Reparaturen durch eine nicht autorisierte Stelle sowie Schäden durch Stoß, Sturz oder unsachgemäßes Eintauchen. Ihre Uhr wird mit gestempelter, datierter und referenzierter Herstellergarantie geliefert: Bewahren Sie sie im Etui auf. Für jede Inanspruchnahme besuchen Sie unsere Seite <a href="/services" class="text-primary underline">Unsere Leistungen</a>.',
        }),
      },
      {
        id: 11,
        question: t({
          fr: 'Que faire si ma montre ne fonctionne plus ?',
          en: 'What should I do if my watch stops working?',
          de: 'Was tun, wenn meine Uhr nicht mehr funktioniert?',
        }),
        answer: t({
          fr: 'Si vous habitez près de Strasbourg, passez nous voir aux Place des Halles. Sinon, rendez-vous chez un <strong>dépositaire agréé</strong> de la marque dans votre ville&nbsp;: nos montres ont une bonne couverture réseau en France. L’horloger identifiera la panne. Pour les premiers réflexes (notamment la pile), consultez notre <a href="/guide-horloger" class="text-primary underline">Guide de l’horloger</a>.',
          en: 'If you live near Strasbourg, come and see us at Place des Halles. Otherwise, visit an <strong>approved dealer</strong> for the brand in your town: our watches have good network coverage across France. The watchmaker will identify the fault. For the first things to check (the battery in particular), see our <a href="/guide-horloger" class="text-primary underline">Watchmaker’s guide</a>.',
          de: 'Wenn Sie in der Nähe von Straßburg wohnen, besuchen Sie uns in der Place des Halles. Andernfalls wenden Sie sich an einen <strong>autorisierten Fachhändler</strong> der Marke in Ihrer Stadt: Unsere Uhren sind in Frankreich gut vertreten. Der Uhrmacher stellt den Defekt fest. Erste Schritte (insbesondere zur Batterie) finden Sie in unserem <a href="/guide-horloger" class="text-primary underline">Uhrmacher-Ratgeber</a>.',
        }),
      },
      {
        id: 12,
        question: t({
          fr: 'Proposez-vous la réparation de montres ?',
          en: 'Do you repair watches?',
          de: 'Bieten Sie Uhrenreparaturen an?',
        }),
        answer: t({
          fr: 'Oui&nbsp;: <strong>réparation et entretien toutes marques</strong>, changement de pile, étanchéité, verres et bracelets — avec un <strong>horloger sur place</strong> aux Place des Halles. Détail de la <a href="/services/reparation-montre-strasbourg" class="text-primary underline">réparation de montre à Strasbourg</a>, ou demandez une prise en charge depuis la page <a href="/services" class="text-primary underline">Nos services</a>.',
          en: 'Yes — <strong>repairs and servicing for all brands</strong>, battery replacement, water-resistance testing, crystals and straps, with a <strong>watchmaker on site</strong> at Place des Halles. See <a href="/services/reparation-montre-strasbourg" class="text-primary underline">watch repair in Strasbourg</a> in detail, or send us a request from the <a href="/services" class="text-primary underline">Our services</a> page.',
          de: 'Ja — <strong>Reparatur und Wartung aller Marken</strong>, Batteriewechsel, Dichtheitsprüfung, Gläser und Armbänder — mit einem <strong>Uhrmacher vor Ort</strong> in der Place des Halles. Alles zur <a href="/services/reparation-montre-strasbourg" class="text-primary underline">Uhrenreparatur in Straßburg</a>, oder senden Sie uns eine Anfrage über die Seite <a href="/services" class="text-primary underline">Unsere Leistungen</a>.',
        }),
      },
      {
        id: 13,
        question: t({
          fr: 'Où trouver des conseils d’entretien (pile, étanchéité…) ?',
          en: 'Where can I find care advice (battery, water resistance…)?',
          de: 'Wo finde ich Pflegetipps (Batterie, Dichtheit …)?',
        }),
        answer: t({
          fr: 'Les conseils techniques sur la pile, l’étanchéité, les mouvements, les verres et les fonctions de montre sont regroupés dans notre <a href="/guide-horloger" class="text-primary underline">Guide de l’horloger</a>, rédigé par l’équipe Place des Montres.',
          en: 'Technical advice on the battery, water resistance, movements, crystals and watch functions is gathered in our <a href="/guide-horloger" class="text-primary underline">Watchmaker’s guide</a>, written by the Place des Montres team.',
          de: 'Technische Hinweise zu Batterie, Dichtheit, Uhrwerken, Gläsern und Uhrenfunktionen sind in unserem <a href="/guide-horloger" class="text-primary underline">Uhrmacher-Ratgeber</a> gebündelt, verfasst vom Team von Place des Montres.',
        }),
      },
      {
        id: 14,
        question: t({
          fr: 'Comment contacter le service client ?',
          en: 'How do I contact customer service?',
          de: 'Wie erreiche ich den Kundenservice?',
        }),
        answer: t({
          fr: 'Par e-mail&nbsp;: <strong>service.client@placedesmontres.fr</strong> (moyen le plus rapide). Par téléphone&nbsp;: <strong>03&nbsp;88&nbsp;22&nbsp;40&nbsp;40</strong>, du lundi au samedi de 9h à 20h (prix d’un appel local). Par courrier&nbsp;: Place des Montres — Centre commercial Place des Halles — 67000 Strasbourg.',
          en: 'By email: <strong>service.client@placedesmontres.fr</strong> (the fastest route). By phone: <strong>03&nbsp;88&nbsp;22&nbsp;40&nbsp;40</strong>, Monday to Saturday from 9am to 8pm (local call rate). By post: Place des Montres — Centre commercial Place des Halles — 67000 Strasbourg.',
          de: 'Per E-Mail: <strong>service.client@placedesmontres.fr</strong> (am schnellsten). Telefonisch: <strong>03&nbsp;88&nbsp;22&nbsp;40&nbsp;40</strong>, Montag bis Samstag von 9 bis 20 Uhr (Ortstarif). Per Post: Place des Montres — Centre commercial Place des Halles — 67000 Straßburg.',
        }),
      },
      {
        id: 15,
        question: t({
          fr: 'Ajustez-vous le bracelet métal avant la livraison ?',
          en: 'Do you adjust metal bracelets before delivery?',
          de: 'Passen Sie Metallarmbänder vor der Lieferung an?',
        }),
        answer: t({
          fr: `Oui. Pour toute commande de montre avec <strong>bracelet métal</strong>, nous proposons un <strong>ajustement gratuit</strong> à votre tour de poignet avant expédition. Imprimez notre <a href="${MEASURE_GUIDE_PDF}" class="text-primary underline" target="_blank" rel="noopener">guide de mesure (PDF)</a> à l’échelle 100&nbsp;%, mesurez votre poignet puis communiquez le résultat par e-mail à <strong>service.client@placedesmontres.fr</strong>.`,
          en: `Yes. For any watch ordered with a <strong>metal bracelet</strong>, we adjust it <strong>free of charge</strong> to your wrist size before dispatch. Print our <a href="${MEASURE_GUIDE_PDF}" class="text-primary underline" target="_blank" rel="noopener">measuring guide (PDF)</a> at 100&nbsp;% scale, measure your wrist, then send us the result by email at <strong>service.client@placedesmontres.fr</strong>.`,
          de: `Ja. Für jede bestellte Uhr mit <strong>Metallarmband</strong> passen wir das Armband vor dem Versand <strong>kostenlos</strong> an Ihren Handgelenkumfang an. Drucken Sie unsere <a href="${MEASURE_GUIDE_PDF}" class="text-primary underline" target="_blank" rel="noopener">Maßanleitung (PDF)</a> im Maßstab 100&nbsp;% aus, messen Sie Ihr Handgelenk und teilen Sie uns das Ergebnis per E-Mail an <strong>service.client@placedesmontres.fr</strong> mit.`,
        }),
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
    logoAlt: t({
      fr: 'Place des Montres — horlogerie à Strasbourg',
      en: 'Place des Montres — watch shop in Strasbourg',
      de: 'Place des Montres — Uhrengeschäft in Straßburg',
    }),
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
      daysLabel: t({
        fr: 'Lundi – samedi',
        en: 'Monday – Saturday',
        de: 'Montag – Samstag',
      }),
      hoursLabel: t({
        fr: '9h – 20h',
        en: '9am – 8pm',
        de: '9 – 20 Uhr',
      }),
    },
  },

  /**
   * Avis Google de la fiche d'établissement — section d'accueil `avisGoogle` et bloc sous la
   * carte de la page Contact. Les avis sont lus par le backend (`GET /api/reviews`) et mis en
   * cache 6 h : voir `documentation/google-reviews/README.md`.
   *
   * Tant que `placeId` est vide, la fonctionnalité reste éteinte et rien ne change à l'affichage.
   * Récupérer l'identifiant `ChIJ…` de la fiche avec le « Place ID Finder » de Google, puis
   * déclarer le secret `SITE_PLACE_DES_MONTRES__GOOGLE_PLACES_API_KEY` côté Render.
   */
  googleReviews: {
    enabled: true,
    /** Place ID `ChIJ…` de la fiche Google Business. Vide = section masquée. */
    placeId: 'ChIJdxbXkkjIlkcRqKrqJSV4eO0',
    /** Plafond dur de l'API Places : 5 avis maximum. */
    maxReviews: 5,
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
      eyebrow: t({
        fr: 'Qui sommes-nous ?',
        en: 'Who we are',
        de: 'Wer wir sind',
      }),
      title: 'Place des Montres',
      lead: t({
        fr: "Depuis 1995, au cœur de Strasbourg, nous cultivons l'art de bien choisir sa montre : un conseil de spécialiste, un large choix de marques et l'envie de vous voir repartir avec la pièce qu'il vous faut.",
        en: 'Since 1995, in the heart of Strasbourg, we have cultivated the art of choosing the right watch: specialist advice, a wide choice of brands and the wish to see you leave with the piece that suits you.',
        de: 'Seit 1995 pflegen wir im Herzen von Straßburg die Kunst, die richtige Uhr zu finden: fachkundige Beratung, eine große Markenauswahl und der Wunsch, dass Sie mit dem passenden Stück nach Hause gehen.',
      }),
      sinceYear: 1995,
      image: publicPath('places/place-des-montres-strasbourg_1.jpg'),
      imageLayout: 'landscape',
      imageAlt: t({
        fr: 'Place des Montres — horlogerie au centre commercial Place des Halles à Strasbourg',
        en: 'Place des Montres — watch shop at the Place des Halles shopping centre in Strasbourg',
        de: 'Place des Montres — Uhrengeschäft im Einkaufszentrum Place des Halles in Straßburg',
      }),
      imageCaption: t({
        fr: 'Centre commercial Place des Halles — Strasbourg',
        en: 'Place des Halles shopping centre — Strasbourg',
        de: 'Einkaufszentrum Place des Halles — Straßburg',
      }),
    },
    stats: [
      {
        value: '30+',
        label: t({
          fr: "Années d'expérience",
          en: 'Years of experience',
          de: 'Jahre Erfahrung',
        }),
        detail: t({
          fr: 'Spécialiste de la montre depuis 1995',
          en: 'Watch specialists since 1995',
          de: 'Uhrenspezialist seit 1995',
        }),
      },
      {
        value: '3 000',
        label: t({
          fr: 'Montres en stock',
          en: 'Watches in stock',
          de: 'Uhren am Lager',
        }),
        detail: t({
          fr: 'Un choix immédiat',
          en: 'Available straight away',
          de: 'Sofort verfügbar',
        }),
      },
      {
        value: '30',
        label: t({
          fr: 'Marques',
          en: 'Brands',
          de: 'Marken',
        }),
        detail: t({
          fr: 'Des plus prestigieuses',
          en: 'Including the most prestigious',
          de: 'Darunter die renommiertesten',
        }),
      },
      {
        value: '1',
        label: t({
          fr: 'Adresse à Strasbourg',
          en: 'Address in Strasbourg',
          de: 'Adresse in Straßburg',
        }),
        detail: 'Place des Halles',
      },
    ],
    story: {
      title: t({
        fr: 'Une adresse de référence à Strasbourg',
        en: 'A landmark address in Strasbourg',
        de: 'Eine feste Adresse in Straßburg',
      }),
      paragraphs: t({
        fr: [
          "Installée au centre commercial Place des Halles, Place des Montres est bien plus qu'une boutique : c'est un lieu de rencontre entre les amateurs de belles montres et une équipe qui connaît chaque univers, chaque mécanisme, chaque nuance de cadran.",
          "Notre force, c'est le savoir-faire d'une enseigne installée de longue date à Strasbourg, que notre équipe d'aujourd'hui fait vivre au quotidien. Derrière le comptoir comme en ligne, nous guidons chaque client — du premier garde-temps au cadeau qui marquera une occasion — avec la même attention et le même plaisir de conseiller.",
          'Des montres de tous styles et à tous les prix : sport, élégance, mécanique automatique à fond transparent… nous vous aidons à trouver la pièce qui vous ressemble, pour vous faire plaisir ou faire plaisir à votre entourage.',
        ],
        en: [
          'Located in the Place des Halles shopping centre, Place des Montres is far more than a shop: it is a meeting point between lovers of fine watches and a team that knows every world, every mechanism, every shade of dial.',
          'Our strength is the know-how of a name long established in Strasbourg, kept alive day after day by today’s team. Behind the counter as well as online, we guide every customer — from a first timepiece to the gift that will mark an occasion — with the same care and the same pleasure in advising.',
          'Watches in every style and at every price: sporty, elegant, automatic movements behind a display back… we help you find the piece that looks like you, for yourself or for someone close to you.',
        ],
        de: [
          'Im Einkaufszentrum Place des Halles gelegen, ist Place des Montres weit mehr als ein Geschäft: ein Treffpunkt für Liebhaberinnen und Liebhaber schöner Uhren und ein Team, das jede Welt, jedes Uhrwerk und jede Zifferblattnuance kennt.',
          'Unsere Stärke ist das Können eines seit Langem in Straßburg verwurzelten Hauses, das unser heutiges Team Tag für Tag weiterträgt. Hinter dem Tresen wie online begleiten wir jede Kundin und jeden Kunden — von der ersten Uhr bis zum Geschenk für einen besonderen Anlass — mit derselben Aufmerksamkeit und Freude an der Beratung.',
          'Uhren in allen Stilrichtungen und Preisklassen: sportlich, elegant, Automatikwerke mit Sichtboden … Wir helfen Ihnen, das Stück zu finden, das zu Ihnen passt — für sich selbst oder als Geschenk.',
        ],
      }),
      pullQuote: t({
        fr: "Franchir la porte de notre magasin, c'est profiter d'un vrai conseil horloger — et repartir avec une montre choisie pour vous.",
        en: 'Stepping through our door means genuine watchmaking advice — and leaving with a watch chosen for you.',
        de: 'Wer unser Geschäft betritt, erhält echte Uhrmacherberatung — und geht mit einer Uhr, die für ihn ausgesucht wurde.',
      }),
    },
    styles: [
      {
        title: t({
          fr: 'Sport & quotidien',
          en: 'Sport & everyday',
          de: 'Sport & Alltag',
        }),
        description: t({
          fr: "Chronographes, montres résistantes, modèles connectés ou classiques au poignet : pour le bureau, le week-end ou l'aventure.",
          en: 'Chronographs, rugged watches, connected or classic models on the wrist: for the office, the weekend or the great outdoors.',
          de: 'Chronographen, robuste Uhren, vernetzte oder klassische Modelle am Handgelenk: fürs Büro, das Wochenende oder das Abenteuer.',
        }),
        icon: 'sport',
      },
      {
        title: t({
          fr: 'Élégance intemporelle',
          en: 'Timeless elegance',
          de: 'Zeitlose Eleganz',
        }),
        description: t({
          fr: 'Cadrans sobres, finitions raffinées, bracelets cuir ou acier : la montre qui sublime une tenue et traverse les saisons.',
          en: 'Understated dials, refined finishes, leather or steel bracelets: the watch that lifts an outfit and outlasts the seasons.',
          de: 'Zurückhaltende Zifferblätter, feine Verarbeitung, Leder- oder Stahlbänder: die Uhr, die ein Outfit veredelt und jede Saison überdauert.',
        }),
        icon: 'elegance',
      },
      {
        title: t({
          fr: 'Mécanique vivante',
          en: 'Living mechanics',
          de: 'Lebendige Mechanik',
        }),
        description: t({
          fr: 'Pour les amoureux de belles mécaniques : montres automatiques à fond transparent pour admirer les rouages en mouvement.',
          en: 'For lovers of fine mechanics: automatic watches with a display back, to watch the gears in motion.',
          de: 'Für Freunde schöner Mechanik: Automatikuhren mit Sichtboden, um das Räderwerk in Bewegung zu bestaunen.',
        }),
        icon: 'mechanics',
      },
    ],
    brands: {
      title: t({
        fr: 'Une trentaine de marques, un seul standard',
        en: 'Some thirty brands, a single standard',
        de: 'Rund dreißig Marken, ein einziger Anspruch',
      }),
      intro: t({
        fr: "Tissot, Swatch, Cluse, Seiko, Hugo Boss, Tommy Hilfiger, Diesel, Fossil, Festina, Pierre Lannier, Casio, G-Shock… et bien d'autres : nous sélectionnons des maisons reconnues pour leur qualité et leur diversité.",
        en: 'Tissot, Swatch, Cluse, Seiko, Hugo Boss, Tommy Hilfiger, Diesel, Fossil, Festina, Pierre Lannier, Casio, G-Shock… and many more: we select houses recognised for their quality and their range.',
        de: 'Tissot, Swatch, Cluse, Seiko, Hugo Boss, Tommy Hilfiger, Diesel, Fossil, Festina, Pierre Lannier, Casio, G-Shock … und viele mehr: Wir wählen Häuser aus, die für Qualität und Vielfalt stehen.',
      }),
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
      title: t({
        fr: "L'expérience Place des Montres",
        en: 'The Place des Montres experience',
        de: 'Das Erlebnis Place des Montres',
      }),
      items: [
        {
          title: t({
            fr: 'Conseil de proximité',
            en: 'Advice close at hand',
            de: 'Beratung vor Ort',
          }),
          description: t({
            fr: 'Essayer au poignet, comparer les modèles, poser toutes vos questions : notre équipe vous accueille avec plaisir du lundi au samedi.',
            en: 'Try watches on, compare models, ask us anything: our team is happy to welcome you Monday to Saturday.',
            de: 'Uhren anprobieren, Modelle vergleichen, alle Fragen stellen: Unser Team empfängt Sie gern von Montag bis Samstag.',
          }),
        },
        {
          title: t({
            fr: 'Boutique & e-commerce',
            en: 'Store & online shop',
            de: 'Geschäft & Onlineshop',
          }),
          description: t({
            fr: 'Commandez en ligne ou passez nous voir aux Halles : retrait magasin, livraison Colissimo offerte dès 80 € en France métropolitaine.',
            en: 'Order online or drop by Les Halles: in-store collection, free Colissimo delivery from €80 in mainland France.',
            de: 'Bestellen Sie online oder besuchen Sie uns in Les Halles: Abholung im Geschäft, kostenlose Colissimo-Lieferung ab 80 € im französischen Mutterland.',
          }),
        },
        {
          title: t({
            fr: 'Pour toutes les envies',
            en: 'For every occasion',
            de: 'Für jeden Anlass',
          }),
          description: t({
            fr: 'Anniversaire, fête des pères, première montre ou pièce de collection accessible : nous trouvons le cadeau idéal à chaque budget.',
            en: 'A birthday, Father’s Day, a first watch or an affordable collector’s piece: we find the right gift for every budget.',
            de: 'Geburtstag, Vatertag, erste Uhr oder erschwingliches Sammlerstück: Wir finden das passende Geschenk für jedes Budget.',
          }),
        },
      ],
    },
    cta: {
      title: t({
        fr: 'Prêt à trouver votre montre ?',
        en: 'Ready to find your watch?',
        de: 'Bereit, Ihre Uhr zu finden?',
      }),
      subtitle: t({
        fr: "Parcourez notre catalogue en ligne ou venez nous rencontrer au centre commercial Place des Halles — c'est avec plaisir que nous vous accueillerons.",
        en: 'Browse our online catalogue or come and meet us at the Place des Halles shopping centre — we will be delighted to welcome you.',
        de: 'Stöbern Sie in unserem Online-Katalog oder besuchen Sie uns im Einkaufszentrum Place des Halles — wir freuen uns auf Sie.',
      }),
      collectionLabel: t({
        fr: 'Découvrir nos montres',
        en: 'Discover our watches',
        de: 'Unsere Uhren entdecken',
      }),
      contactLabel: t({
        fr: 'Nous contacter',
        en: 'Contact us',
        de: 'Kontakt aufnehmen',
      }),
    },
    guidePromo: {
      title: t({
        fr: "Le Guide de l'horloger",
        en: "The watchmaker's guide",
        de: 'Der Uhrmacher-Ratgeber',
      }),
      description: t({
        fr: "Pile, étanchéité, mouvements, verres et fonctions — tout ce qu'il faut savoir pour entretenir votre montre.",
        en: 'Battery, water resistance, movements, crystals and functions — everything you need to look after your watch.',
        de: 'Batterie, Dichtheit, Uhrwerke, Gläser und Funktionen — alles, was Sie zur Pflege Ihrer Uhr wissen müssen.',
      }),
      linkLabel: t({
        fr: 'Consulter le guide',
        en: 'Read the guide',
        de: 'Zum Ratgeber',
      }),
      to: '/guide-horloger',
    },
  },

  servicesPage: {
    /** Formulaire de prise en charge, pages prestation et zone desservie — voir services.config.js. */
    ...servicesAtelier,
    hero: {
      eyebrow: t({
        fr: 'Atelier & service rapide',
        en: 'Workshop & fast service',
        de: 'Werkstatt & schneller Service',
      }),
      title: t({
        fr: 'Tout pour votre montre, sur place',
        en: 'Everything for your watch, on site',
        de: 'Alles für Ihre Uhr, direkt vor Ort',
      }),
      lead: t({
        fr: 'Aux Place des Halles, notre horloger intervient sur toutes marques — du changement de pile express à la réparation complète, sans longs délais.',
        en: 'At Place des Halles, our watchmaker works on every brand — from an express battery change to a full repair, without long waits.',
        de: 'In der Place des Halles arbeitet unser Uhrmacher an allen Marken — vom Express-Batteriewechsel bis zur Komplettreparatur, ohne lange Wartezeiten.',
      }),
    },
    workshop: {
      title: t({
        fr: 'Horloger & atelier sur place',
        en: 'Watchmaker & workshop on site',
        de: 'Uhrmacher & Werkstatt vor Ort',
      }),
      description: t({
        fr: "Un atelier équipé et un horloger qualifié vous accueillent en boutique. L'essentiel se fait devant vous — pas de renvoi externe pour les interventions courantes.",
        en: 'A fully equipped workshop and a qualified watchmaker welcome you in store. Most work is done in front of you — routine jobs are never sent away.',
        de: 'Eine ausgestattete Werkstatt und ein qualifizierter Uhrmacher empfangen Sie im Geschäft. Das Wesentliche geschieht vor Ihren Augen — Routinearbeiten werden nicht ausgelagert.',
      }),
    },
    sections: [
      {
        id: 'atelier',
        icon: 'atelier',
        title: t({
          fr: 'Réparation & entretien',
          en: 'Repairs & servicing',
          de: 'Reparatur & Wartung',
        }),
        intro: t({
          fr: 'Toutes marques, diagnostic et remise en état.',
          en: 'All brands, diagnosis and restoration.',
          de: 'Alle Marken, Diagnose und Instandsetzung.',
        }),
        items: [
          {
            title: t({
              fr: 'Réparation complète',
              en: 'Full repair',
              de: 'Komplettreparatur',
            }),
            description: t({
              fr: 'Montres quartz, automatiques ou mécaniques — prise en charge par notre atelier.',
              en: 'Quartz, automatic or mechanical watches — handled by our own workshop.',
              de: 'Quarz-, Automatik- oder Handaufzugsuhren — bearbeitet in unserer eigenen Werkstatt.',
            }),
          },
          {
            title: t({
              fr: 'Entretien régulier',
              en: 'Regular servicing',
              de: 'Regelmäßige Wartung',
            }),
            description: t({
              fr: 'Révision, nettoyage et contrôle pour prolonger la vie de votre montre.',
              en: 'Overhaul, cleaning and checks to extend the life of your watch.',
              de: 'Revision, Reinigung und Kontrolle, um die Lebensdauer Ihrer Uhr zu verlängern.',
            }),
          },
          {
            title: t({
              fr: 'Changement de verre',
              en: 'Crystal replacement',
              de: 'Glaswechsel',
            }),
            description: t({
              fr: 'Remplacement du vitrage selon modèle et disponibilité des pièces.',
              en: 'Crystal replaced depending on the model and parts availability.',
              de: 'Glasersatz je nach Modell und Verfügbarkeit der Teile.',
            }),
          },
          {
            title: t({
              fr: 'Étanchéité express',
              en: 'Express water-resistance test',
              de: 'Express-Dichtheitsprüfung',
            }),
            description: t({
              fr: "Test et contrôle réalisés sur place — résultat en moins d'une heure.",
              en: 'Testing and inspection carried out on site — result in under an hour.',
              de: 'Prüfung und Kontrolle vor Ort — Ergebnis in weniger als einer Stunde.',
            }),
            price: '21 €',
            badge: t({
              fr: '< 1 h',
              en: '< 1 hr',
              de: '< 1 Std.',
            }),
          },
        ],
      },
      {
        id: 'piles',
        icon: 'piles',
        title: t({
          fr: 'Piles & petits objets',
          en: 'Batteries & small devices',
          de: 'Batterien & Kleingeräte',
        }),
        intro: t({
          fr: 'Montres, clés de voiture, télécommandes, calculatrices…',
          en: 'Watches, car keys, remote controls, calculators…',
          de: 'Uhren, Autoschlüssel, Fernbedienungen, Taschenrechner …',
        }),
        items: [
          {
            title: t({
              fr: 'Pile RENATA SWISS MADE',
              en: 'RENATA SWISS MADE battery',
              de: 'Batterie RENATA SWISS MADE',
            }),
            description: t({
              fr: 'Pose incluse pour la plupart des montres — qualité suisse reconnue.',
              en: 'Fitting included for most watches — recognised Swiss quality.',
              de: 'Einsetzen bei den meisten Uhren inbegriffen — anerkannte Schweizer Qualität.',
            }),
            price: '9 €',
            badge: t({
              fr: 'Express',
              en: 'Express',
              de: 'Express',
            }),
          },
          {
            title: t({
              fr: 'Toutes marques de montres',
              en: 'Every watch brand',
              de: 'Alle Uhrenmarken',
            }),
            description: t({
              fr: 'Quartz, digitale, connectée ou classique : nous changeons la pile sur place.',
              en: 'Quartz, digital, connected or classic: we change the battery on the spot.',
              de: 'Quarz, digital, vernetzt oder klassisch: Wir wechseln die Batterie vor Ort.',
            }),
          },
          {
            title: t({
              fr: 'Au-delà de la montre',
              en: 'Beyond watches',
              de: 'Mehr als nur Uhren',
            }),
            description: t({
              fr: 'Clés de voiture, télécommandes, calculatrices et autres objets à pile — même service rapide.',
              en: 'Car keys, remote controls, calculators and other battery-powered items — the same fast service.',
              de: 'Autoschlüssel, Fernbedienungen, Taschenrechner und andere batteriebetriebene Geräte — derselbe schnelle Service.',
            }),
          },
        ],
      },
      {
        id: 'bracelets',
        icon: 'bracelets',
        title: t({
          fr: 'Bracelets',
          en: 'Straps & bracelets',
          de: 'Armbänder',
        }),
        intro: t({
          fr: 'Le plus grand choix de bracelets de montres sur Strasbourg — en magasin et pour vos commandes en ligne.',
          en: 'The largest choice of watch straps in Strasbourg — in store and for your online orders.',
          de: 'Die größte Auswahl an Uhrenarmbändern in Straßburg — im Geschäft und für Ihre Online-Bestellungen.',
        }),
        items: [
          {
            title: t({
              fr: 'Ajustement avant expédition',
              en: 'Adjusted before dispatch',
              de: 'Anpassung vor dem Versand',
            }),
            description: t({
              fr: 'Pour toute montre avec bracelet métal commandée en ligne, nous ajustons gratuitement le bracelet à votre tour de poignet avant l’envoi.',
              en: 'For any watch with a metal bracelet ordered online, we adjust the bracelet to your wrist size free of charge before shipping.',
              de: 'Bei jeder online bestellten Uhr mit Metallarmband passen wir das Armband vor dem Versand kostenlos an Ihren Handgelenkumfang an.',
            }),
            link: {
              href: MEASURE_GUIDE_PDF,
              label: t({
                fr: 'Guide de mesure (PDF)',
                en: 'Measuring guide (PDF)',
                de: 'Maßanleitung (PDF)',
              }),
            },
          },
          {
            title: t({
              fr: 'Remplacement sur place',
              en: 'Replaced on site',
              de: 'Wechsel vor Ort',
            }),
            description: t({
              fr: 'Pose, ajustement et conseil taille directement en magasin.',
              en: 'Fitting, adjustment and sizing advice directly in store.',
              de: 'Montage, Anpassung und Größenberatung direkt im Geschäft.',
            }),
          },
          {
            title: t({
              fr: 'Large choix',
              en: 'A wide choice',
              de: 'Große Auswahl',
            }),
            description: t({
              fr: 'Cuir, acier, caoutchouc, NATO… pour personnaliser ou renouveler votre bracelet.',
              en: 'Leather, steel, rubber, NATO… to personalise or renew your strap.',
              de: 'Leder, Stahl, Kautschuk, NATO … zum Personalisieren oder Erneuern Ihres Armbands.',
            }),
            badge: t({
              fr: 'N°1 Strasbourg',
              en: 'No. 1 in Strasbourg',
              de: 'Nr. 1 in Straßburg',
            }),
          },
        ],
      },
      {
        id: 'avantages',
        icon: 'avantages',
        title: t({
          fr: 'Facilités',
          en: 'Made easier',
          de: 'Erleichterungen',
        }),
        items: [
          {
            title: t({
              fr: 'Paiement en 3 ou 4x',
              en: 'Payment in 3 or 4 instalments',
              de: 'Zahlung in 3 oder 4 Raten',
            }),
            description: t({
              fr: 'Sans frais par carte bancaire, directement en magasin.',
              en: 'Interest-free by bank card, directly in store.',
              de: 'Zinsfrei per Bankkarte, direkt im Geschäft.',
            }),
            badge: t({
              fr: 'Sans frais',
              en: 'Interest-free',
              de: 'Zinsfrei',
            }),
          },
          {
            title: t({
              fr: 'Extension de garantie',
              en: 'Extended warranty',
              de: 'Garantieverlängerung',
            }),
            description: t({
              fr: 'Un an de tranquillité supplémentaire pour votre montre.',
              en: 'One extra year of peace of mind for your watch.',
              de: 'Ein zusätzliches Jahr Sorgenfreiheit für Ihre Uhr.',
            }),
            price: '2 €',
          },
        ],
      },
    ],
    cta: {
      title: t({
        fr: 'Passez nous voir aux Halles',
        en: 'Come and see us at Les Halles',
        de: 'Besuchen Sie uns in Les Halles',
      }),
      subtitle: t({
        fr: 'Du lundi au samedi, 9h–20h — Centre commercial Place des Halles, Strasbourg.',
        en: 'Monday to Saturday, 9am–8pm — Place des Halles shopping centre, Strasbourg.',
        de: 'Montag bis Samstag, 9–20 Uhr — Einkaufszentrum Place des Halles, Straßburg.',
      }),
      contactLabel: t({
        fr: 'Nous contacter',
        en: 'Contact us',
        de: 'Kontakt aufnehmen',
      }),
      phoneLabel: '03 88 22 40 40',
      guideLabel: t({
        fr: "Le Guide de l'horloger",
        en: "The watchmaker's guide",
        de: 'Der Uhrmacher-Ratgeber',
      }),
      guideTo: '/guide-horloger',
      documentLabel: t({
        fr: 'Guide ajustement bracelet (PDF)',
        en: 'Bracelet adjustment guide (PDF)',
        de: 'Anleitung zur Armbandanpassung (PDF)',
      }),
      documentHref: MEASURE_GUIDE_PDF,
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
    metaPixelInitFlag: '__pdm_meta_pixel_initialized',
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
    repairRequest: true,
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
        text: t({
          fr: 'Envoi gratuit en 48 h',
          en: 'Free shipping within 48 hours',
          de: 'Kostenloser Versand in 48 Stunden',
        }),
      },
      {
        id: 'guarantee',
        icon: 'guarantee',
        text: t({
          fr: 'Toutes nos montres sont garanties 2 ans',
          en: 'Every watch comes with a 2-year warranty',
          de: 'Auf alle Uhren 2 Jahre Garantie',
        }),
      },
      {
        id: 'return',
        icon: 'return',
        text: t({
          fr: 'Retour possible sous 30 jours',
          en: 'Returns accepted within 30 days',
          de: 'Rückgabe innerhalb von 30 Tagen möglich',
        }),
      },
    ],
    guarantees: {
      heading: t({
        fr: 'Nos garanties et services',
        en: 'Our warranties and services',
        de: 'Unsere Garantien und Leistungen',
      }),
      items: [
        {
          id: 'guarantee',
          icon: 'guarantee',
          title: t({
            fr: 'Garantie 2 ans',
            en: '2-year warranty',
            de: '2 Jahre Garantie',
          }),
          text: t({
            fr: 'Toutes nos montres sont couvertes par une garantie de 2 ans. Les modalités précises (constructeur ou vendeur) figurent sur chaque fiche produit.',
            en: 'All our watches are covered by a 2-year warranty. The exact terms (manufacturer or retailer) are stated on each product page.',
            de: 'Alle unsere Uhren sind durch eine 2-Jahres-Garantie gedeckt. Die genauen Bedingungen (Hersteller oder Verkäufer) stehen auf jeder Produktseite.',
          }),
        },
        {
          id: 'return',
          icon: 'return',
          title: t({
            fr: 'Retour sous 30 jours',
            en: '30-day returns',
            de: 'Rückgabe binnen 30 Tagen',
          }),
          text: t({
            fr: 'Vous disposez de 30 jours pour retourner votre montre si elle ne vous convient pas, dans le respect de nos conditions générales de vente.',
            en: 'You have 30 days to return your watch if it does not suit you, in line with our terms and conditions of sale.',
            de: 'Sie haben 30 Tage Zeit, Ihre Uhr zurückzusenden, wenn sie Ihnen nicht zusagt — im Rahmen unserer Allgemeinen Geschäftsbedingungen.',
          }),
        },
        {
          id: 'shipping',
          icon: 'shipping',
          title: t({
            fr: 'Envoi Colissimo suivi',
            en: 'Tracked Colissimo shipping',
            de: 'Colissimo-Versand mit Sendungsverfolgung',
          }),
          text: t({
            fr: 'Expédition sous environ 48 h après réception du paiement. Livraison offerte dès 80 € en France métropolitaine. Pour les bracelets métal, ajustement gratuit avant envoi — voir le guide PDF sur la page Nos services.',
            en: 'Dispatch around 48 hours after payment is received. Free delivery from €80 in mainland France. Metal bracelets are adjusted free of charge before shipping — see the PDF guide on the Our services page.',
            de: 'Versand etwa 48 Stunden nach Zahlungseingang. Kostenlose Lieferung ab 80 € im französischen Mutterland. Metallarmbänder werden vor dem Versand kostenlos angepasst — siehe die PDF-Anleitung auf der Seite „Unsere Leistungen“.',
          }),
        },
        {
          id: 'pickup',
          icon: 'pickup',
          title: t({
            fr: 'Retrait au magasin',
            en: 'Collection in store',
            de: 'Abholung im Geschäft',
          }),
          text: t({
            fr: 'Commandez en ligne et retirez votre montre au centre commercial Place des Halles, du lundi au samedi de 9h à 20h.',
            en: 'Order online and collect your watch at the Place des Halles shopping centre, Monday to Saturday from 9am to 8pm.',
            de: 'Bestellen Sie online und holen Sie Ihre Uhr im Einkaufszentrum Place des Halles ab, Montag bis Samstag von 9 bis 20 Uhr.',
          }),
        },
        {
          id: 'payment',
          icon: 'payment',
          title: t({
            fr: 'Paiement sécurisé',
            en: 'Secure payment',
            de: 'Sichere Zahlung',
          }),
          text: t({
            fr: "Règlement en ligne protégé via Stripe. Aucune information bancaire n'est stockée sur nos serveurs.",
            en: 'Online payment protected by Stripe. No card details are stored on our servers.',
            de: 'Online-Zahlung geschützt über Stripe. Es werden keine Bankdaten auf unseren Servern gespeichert.',
          }),
        },
        {
          id: 'experience',
          icon: 'experience',
          title: t({
            fr: 'Expertise depuis 1995',
            en: 'Expertise since 1995',
            de: 'Kompetenz seit 1995',
          }),
          text: t({
            fr: 'Spécialiste de la montre à Strasbourg depuis près de 30 ans : conseils, atelier sur place et service client du lundi au samedi.',
            en: 'Watch specialists in Strasbourg for almost 30 years: advice, an on-site workshop and customer service Monday to Saturday.',
            de: 'Seit fast 30 Jahren Uhrenspezialist in Straßburg: Beratung, Werkstatt vor Ort und Kundenservice von Montag bis Samstag.',
          }),
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
          label: t({
            fr: 'Colissimo suivi — France métropolitaine',
            en: 'Tracked Colissimo — mainland France',
            de: 'Colissimo mit Sendungsverfolgung — französisches Mutterland',
          }),
          countries: ['FR', 'MC'],
          fee: { type: 'free_above', amount: 6.9, freeAbove: 80 },
          estimatedDays: t({
            fr: 'Expédition sous environ 48 h après réception du paiement',
            en: 'Dispatched around 48 hours after payment is received',
            de: 'Versand etwa 48 Stunden nach Zahlungseingang',
          }),
        },
        {
          id: 'pickup_halles',
          type: 'pickup',
          label: t({
            fr: 'Retrait au magasin — Place des Halles',
            en: 'Collection in store — Place des Halles',
            de: 'Abholung im Geschäft — Place des Halles',
          }),
          fee: { type: 'flat', amount: 0 },
          pickupLocation: {
            name: 'Place des Montres',
            address: t({
              fr: 'Centre commercial Place des Halles, 67000 Strasbourg',
              en: 'Place des Halles shopping centre, 67000 Strasbourg',
              de: 'Einkaufszentrum Place des Halles, 67000 Straßburg',
            }),
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
    documentTitle: t({
      fr: 'Reçu de paiement',
      en: 'Payment receipt',
      de: 'Zahlungsbeleg',
    }),
    footerNote: t({
      fr: 'Merci pour votre confiance — Place des Montres.',
      en: 'Thank you for your trust — Place des Montres.',
      de: 'Vielen Dank für Ihr Vertrauen — Place des Montres.',
    }),
    showWatchImages: true,
    logoPath: publicPath('brand-logo.jpg'),
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

  home: {
    hero: {
      variant: 'compact',
      title: t({
        fr: "Votre montre de marque, aujourd'hui.",
        en: 'Your branded watch, today.',
        de: 'Ihre Markenuhr — noch heute.',
      }),
      subtitle: t({
        fr: "30 ans d'expérience basée à Strasbourg.",
        en: '30 years of experience, based in Strasbourg.',
        de: '30 Jahre Erfahrung, ansässig in Straßburg.',
      }),
      primaryCta: {
        label: t({
          fr: 'Découvrir nos montres',
          en: 'Discover our watches',
          de: 'Unsere Uhren entdecken',
        }),
        to: '/collection',
      },
      secondaryCta: {
        label: t({
          fr: 'Nous contacter',
          en: 'Contact us',
          de: 'Kontakt aufnehmen',
        }),
        to: '/contact',
      },
    },
    nouvelles: {
      title: t({
        fr: 'Nouvelles arrivées',
        en: 'New arrivals',
        de: 'Neuzugänge',
      }),
      // subtitle: 'Découvrez nos dernières pièces ajoutées à notre sélection',
    },
    stats: {
      items: [
        {
          icon: 'stock',
          value: '3 000',
          label: t({
            fr: 'Montres en stock',
            en: 'Watches in stock',
            de: 'Uhren am Lager',
          }),
          detail: t({
            fr: 'Disponibles en ligne ou en boutique',
            en: 'Available online or in store',
            de: 'Online oder im Geschäft verfügbar',
          }),
        },
        {
          icon: 'experience',
          value: t({
            fr: '30 ans',
            en: '30 years',
            de: '30 Jahre',
          }),
          label: t({
            fr: 'D’expérience',
            en: 'Of experience',
            de: 'Erfahrung',
          }),
          detail: t({
            fr: 'Spécialiste montre depuis 1995',
            en: 'Watch specialists since 1995',
            de: 'Uhrenspezialist seit 1995',
          }),
        },
        {
          icon: 'sparkles',
          value: '30+',
          label: t({
            fr: 'Marques',
            en: 'Brands',
            de: 'Marken',
          }),
          detail: t({
            fr: 'Des maisons accessibles aux références Swiss Made',
            en: 'From affordable houses to Swiss Made references',
            de: 'Von erschwinglichen Häusern bis zu Swiss-Made-Referenzen',
          }),
        },
      ],
      highlights: [
        {
          icon: 'shipping',
          label: t({
            fr: 'Envoi gratuit en 48 h',
            en: 'Free shipping within 48 hours',
            de: 'Kostenloser Versand in 48 Stunden',
          }),
          detail: t({
            fr: 'Offert dès 80 € d’achat en France métropolitaine',
            en: 'Free from €80 in mainland France',
            de: 'Ab 80 € Einkaufswert im französischen Mutterland kostenlos',
          }),
        },
        {
          icon: 'guarantee',
          label: t({
            fr: 'Toutes nos montres sont garanties 2 ans',
            en: 'Every watch comes with a 2-year warranty',
            de: 'Auf alle Uhren 2 Jahre Garantie',
          }),
          detail: t({
            fr: 'Extension de garantie disponible en boutique',
            en: 'Extended warranty available in store',
            de: 'Garantieverlängerung im Geschäft erhältlich',
          }),
        },
        {
          icon: 'return',
          label: t({
            fr: 'Retour possible sous 30 jours',
            en: 'Returns accepted within 30 days',
            de: 'Rückgabe innerhalb von 30 Tagen möglich',
          }),
          detail: t({
            fr: 'À compter de la réception, montre complète dans son emballage d’origine',
            en: 'From delivery, with the watch complete in its original packaging',
            de: 'Ab Erhalt, Uhr vollständig in der Originalverpackung',
          }),
        },
      ],
    },
    aboutPreview: {
      eyebrow: t({
        fr: 'Qui sommes-nous ?',
        en: 'Who we are',
        de: 'Wer wir sind',
      }),
      title: t({
        fr: 'Une adresse horlogère au cœur des Place des Halles',
        en: 'A watchmaking address at the heart of Place des Halles',
        de: 'Eine Uhrenadresse im Herzen der Place des Halles',
      }),
      description: t({
        fr: 'Installée à Strasbourg depuis 1995, notre équipe conseille chaque client avec la même attention : choisir le bon style, comparer les marques, trouver le cadeau idéal ou entretenir sa montre au quotidien.',
        en: 'Established in Strasbourg since 1995, our team advises every customer with the same care: choosing the right style, comparing brands, finding the perfect gift or looking after a watch day to day.',
        de: 'Seit 1995 in Straßburg ansässig, berät unser Team jede Kundin und jeden Kunden mit derselben Sorgfalt: den richtigen Stil wählen, Marken vergleichen, das passende Geschenk finden oder die Uhr im Alltag pflegen.',
      }),
      image: publicPath('places/place-des-montres-strasbourg_1.jpg'),
      imageAlt: t({
        fr: 'Boutique Place des Montres au centre commercial Place des Halles à Strasbourg',
        en: 'The Place des Montres store at the Place des Halles shopping centre in Strasbourg',
        de: 'Das Geschäft Place des Montres im Einkaufszentrum Place des Halles in Straßburg',
      }),
      ctaLabel: t({
        fr: 'Découvrir notre histoire',
        en: 'Discover our story',
        de: 'Unsere Geschichte entdecken',
      }),
      to: '/a-propos',
    },
    sections: [
      'homeCarousel',
      'nouvelles',
      'selections',
      'collectionHighlight',
      // 'stats', // Désactivé côté client (bloc chiffres-clés) — conservé pour réactivation éventuelle.
      'aboutPreview',
      'avisGoogle',
      // 'hero',
      // 'trust',
      // 'ventes',
      // 'suivezNous',
      // 'services',
      // 'faq',
    ],
    selections: {
      title: t({
        fr: 'Notre sélection du moment',
        en: 'Our current selection',
        de: 'Unsere aktuelle Auswahl',
      }),
      /** Visuels : voir `public/home-selections/README.md` et `homeSelections.config.js`. */
      cards: homeSelectionCards,
    },
    /**
     * Bloc éditorial « aperçu collection » : 1 montre vedette + sélection, puis CTA.
     * Montres pilotées depuis l'admin (contexte `collection`) avec repli automatique
     * sur les dernières montres disponibles. Voir `HomeCollectionHighlightSection.vue`.
     */
    collectionHighlight: {
      title: t({
        fr: 'Un aperçu de notre collection',
        en: 'A glimpse of our collection',
        de: 'Ein Einblick in unsere Kollektion',
      }),
      subtitle: t({
        fr: 'Quelques pièces choisies parmi nos 3 000 montres en stock — découvrez l’ensemble en boutique ou en ligne.',
        en: 'A few pieces chosen from the 3,000 watches we hold in stock — see them all in store or online.',
        de: 'Einige ausgewählte Stücke aus unseren 3.000 Uhren am Lager — entdecken Sie alle im Geschäft oder online.',
      }),
      cta: {
        label: t({
          fr: 'Voir toute la collection',
          en: 'See the whole collection',
          de: 'Ganze Kollektion ansehen',
        }),
        to: '/collection',
      },
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
      {
        type: 'link',
        label: t({
          fr: 'Contact',
          en: 'Contact',
          de: 'Kontakt',
        }),
        to: '/contact',
        feature: 'contact',
      },
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
      {
        label: t({
          fr: 'Contact',
          en: 'Contact',
          de: 'Kontakt',
        }),
        to: '/contact',
        feature: 'contact',
      },
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
        /** Logo d'en-tête des e-mails (déjà utilisé pour les reçus). */
        logoPath: '/brand-logo.jpg',
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
