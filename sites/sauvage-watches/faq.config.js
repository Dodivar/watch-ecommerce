/**
 * Questions / réponses — section d’accueil `#faq`.
 * Éditer ce fichier pour mettre à jour la FAQ sans toucher aux composants du socle.
 *
 * Chaque texte est déclaré dans les trois langues via `t({ fr, en, de })`. Les `href` des liens
 * restent identiques : les chemins de routes ne sont pas traduits, seul le libellé cliquable l'est.
 */
import { t } from '../../packages/base/src/site/i18nValue.js'

export default {
  enabled: true,
  heading: t({
    fr: 'Questions fréquentes',
    en: 'Frequently asked questions',
    de: 'Häufige Fragen',
  }),
  subheading: t({
    fr: 'Vos questions les plus fréquentes',
    en: 'The questions we hear most often',
    de: 'Ihre häufigsten Fragen',
  }),
  items: [
    {
      id: 1,
      question: t({
        fr: 'Comment fonctionne votre service de recherche personnalisée de montre ?',
        en: 'How does your personalised watch sourcing service work?',
        de: 'Wie funktioniert Ihre persönliche Uhrensuche?',
      }),
      answer: t({
        fr: "Notre <strong>service de recherche personnalisée</strong> est conçu pour trouver la montre de vos rêves selon vos critères précis. Vous nous indiquez vos envies : marque, modèle, année, budget, état souhaité, et nous recherchons activement dans notre réseau et sur le marché pour vous proposer des options qui correspondent exactement à vos attentes. <strong>Le service est gratuit jusqu'à ce que nous trouvions la montre qui vous convient</strong>. Une fois que vous validez votre achat, des frais de service transparents s'appliquent. C'est un service sur-mesure qui vous fait gagner du temps et vous garantit l'authenticité de chaque pièce.",
        en: 'Our <strong>personalised sourcing service</strong> is designed to find your dream watch against your exact criteria. You tell us what you are after — brand, model, year, budget, desired condition — and we search actively through our network and the wider market to put forward options that match precisely. <strong>The service is free until we find the watch that suits you</strong>. Once you confirm your purchase, transparent service fees apply. It is a bespoke service that saves you time and guarantees the authenticity of every piece.',
        de: 'Unsere <strong>persönliche Uhrensuche</strong> findet Ihre Wunschuhr nach genau Ihren Kriterien. Sie nennen uns Marke, Modell, Jahrgang, Budget und gewünschten Zustand, und wir suchen aktiv in unserem Netzwerk und am Markt nach Angeboten, die genau passen. <strong>Der Dienst ist kostenlos, bis wir die passende Uhr gefunden haben</strong>. Sobald Sie den Kauf bestätigen, fällt eine transparente Servicegebühr an. Ein maßgeschneiderter Service, der Ihnen Zeit spart und die Echtheit jedes Stücks garantiert.',
      }),
    },
    {
      id: 2,
      question: t({
        fr: "L'estimation de ma montre est-elle vraiment gratuite ?",
        en: 'Is the valuation of my watch really free?',
        de: 'Ist die Schätzung meiner Uhr wirklich kostenlos?',
      }),
      answer: t({
        fr: 'Oui, <strong>l\'estimation est 100% gratuite et sans aucun engagement</strong>. Vous êtes libres d\'accepter ou de refuser notre proposition, sans aucune pression. Nous vous fournissons une estimation transparente et argumentée dans les 24 heures suivant votre demande. Pour en savoir plus sur notre méthode d\'estimation, consultez notre <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">page détaillée expliquant notre processus d\'estimation</a>.',
        en: 'Yes — <strong>the valuation is completely free and comes with no obligation</strong>. You are free to accept or decline our offer, with no pressure whatsoever. We provide a transparent, reasoned valuation within 24 hours of your request. To learn more about our method, see our <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">detailed page explaining our valuation process</a>.',
        de: 'Ja, <strong>die Schätzung ist völlig kostenlos und unverbindlich</strong>. Sie können unser Angebot ohne jeden Druck annehmen oder ablehnen. Sie erhalten innerhalb von 24 Stunden nach Ihrer Anfrage eine transparente und begründete Schätzung. Mehr zu unserer Methode finden Sie auf unserer <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">ausführlichen Seite zum Schätzverfahren</a>.',
      }),
    },
    {
      id: 3,
      question: t({
        fr: "Comment est calculée l'estimation de ma montre ?",
        en: 'How is my watch’s valuation calculated?',
        de: 'Wie wird die Schätzung meiner Uhr berechnet?',
      }),
      answer: t({
        fr: 'Nous basons notre estimation sur plusieurs critères : l\'état de votre montre, sa cote actuelle sur le marché (Chrono24, ventes aux enchères, etc.), sa rareté, et la présence de la boîte et des papiers. Nous vous fournissons une estimation transparente et argumentée. Pour comprendre en détail notre méthode en 5 étapes, consultez notre <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">page d\'explication du processus d\'estimation</a>.',
        en: 'We base our valuation on several criteria: the condition of your watch, its current market value (Chrono24, auction results and so on), its rarity, and whether box and papers are present. We give you a transparent, reasoned valuation. For a detailed look at our five-step method, see our <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">page explaining the valuation process</a>.',
        de: 'Unsere Schätzung stützt sich auf mehrere Kriterien: den Zustand Ihrer Uhr, ihren aktuellen Marktwert (Chrono24, Auktionsergebnisse usw.), ihre Seltenheit sowie das Vorhandensein von Box und Papieren. Sie erhalten eine transparente, begründete Schätzung. Unsere fünfstufige Methode erläutern wir ausführlich auf unserer <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">Seite zum Schätzverfahren</a>.',
      }),
    },
    {
      id: 4,
      question: t({
        fr: 'Quelles montres proposez-vous dans votre collection en stock ?',
        en: 'Which watches do you offer in your in-stock collection?',
        de: 'Welche Uhren bieten Sie in Ihrer Lagerkollektion an?',
      }),
      answer: t({
        fr: "Nous proposons une <strong>sélection de montres de collection et de prestige en stock</strong> : Rolex, Omega, Cartier, Breitling, Audemars Piguet, Patek Philippe, Tag Heuer, Tudor, et bien d'autres marques prestigieuses. Toutes nos montres sont authentifiées, vérifiées et accompagnées de leur historique. Nous mettons régulièrement à jour notre collection avec de nouveaux modèles. Vous pouvez consulter notre collection complète directement sur notre site.",
        en: 'We hold a <strong>selection of collectible and prestige watches in stock</strong>: Rolex, Omega, Cartier, Breitling, Audemars Piguet, Patek Philippe, Tag Heuer, Tudor and many other prestigious brands. Every watch is authenticated, checked and comes with its history. We refresh the collection regularly with new models. You can browse the full collection directly on our site.',
        de: 'Wir führen eine <strong>Auswahl an Sammler- und Prestigeuhren am Lager</strong>: Rolex, Omega, Cartier, Breitling, Audemars Piguet, Patek Philippe, Tag Heuer, Tudor und viele weitere renommierte Marken. Jede Uhr ist authentifiziert, geprüft und mit ihrer Historie versehen. Wir ergänzen die Kollektion regelmäßig um neue Modelle. Die vollständige Kollektion finden Sie direkt auf unserer Website.',
      }),
    },
    {
      id: 6,
      question: t({
        fr: 'Les montres que vous proposez sont-elles authentiques et garanties ?',
        en: 'Are the watches you offer authentic and under warranty?',
        de: 'Sind Ihre Uhren authentisch und garantiert?',
      }),
      answer: t({
        fr: "Oui, <strong>toutes nos montres sont authentifiées</strong> avant d'être proposées, qu'il s'agisse de notre collection en stock ou de montres trouvées via notre service de recherche personnalisée. Nous vérifions l'authenticité, l'état, et l'historique de chaque pièce. Nous proposons également une garantie sur nos transactions et nous engageons sur la qualité et l'authenticité de chaque pièce que nous proposons.",
        en: 'Yes — <strong>every watch is authenticated</strong> before being offered, whether it comes from our in-stock collection or from our personalised sourcing service. We verify the authenticity, condition and history of each piece. We also provide a warranty on our transactions and stand behind the quality and authenticity of everything we offer.',
        de: 'Ja, <strong>alle unsere Uhren werden authentifiziert</strong>, bevor wir sie anbieten — ob aus unserer Lagerkollektion oder über die persönliche Uhrensuche beschafft. Wir prüfen Echtheit, Zustand und Historie jedes Stücks. Zudem gewähren wir eine Garantie auf unsere Transaktionen und stehen für Qualität und Echtheit jedes angebotenen Stücks ein.',
      }),
    },
    {
      id: 8,
      question: t({
        fr: 'Combien coûte le service de recherche personnalisée ?',
        en: 'How much does the personalised sourcing service cost?',
        de: 'Was kostet die persönliche Uhrensuche?',
      }),
      answer: t({
        fr: "Le <strong>service de recherche personnalisée est gratuit jusqu'à ce que nous trouvions la montre qui vous convient</strong>. Nous ne facturons aucun frais pour la recherche elle-même. Une fois que nous avons trouvé la montre de vos rêves et que vous validez votre achat, des frais de service transparents s'appliquent. Nous vous fournissons un devis détaillé avant de commencer la recherche, sans aucun engagement de votre part.",
        en: 'The <strong>personalised sourcing service is free until we find the watch that suits you</strong>. We charge nothing for the search itself. Once we have found your dream watch and you confirm the purchase, transparent service fees apply. We give you a detailed quote before starting the search, with no obligation on your part.',
        de: 'Die <strong>persönliche Uhrensuche ist kostenlos, bis wir die passende Uhr gefunden haben</strong>. Für die Suche selbst berechnen wir nichts. Sobald wir Ihre Wunschuhr gefunden haben und Sie den Kauf bestätigen, fällt eine transparente Servicegebühr an. Vor Beginn der Suche erhalten Sie ein detailliertes, unverbindliches Angebot.',
      }),
    },
    {
      id: 9,
      question: t({
        fr: "Dois-je fournir la boîte et les papiers pour l'estimation ?",
        en: 'Do I need to provide the box and papers for the valuation?',
        de: 'Muss ich Box und Papiere für die Schätzung vorlegen?',
      }),
      answer: t({
        fr: "Ce n'est pas obligatoire, mais <strong>la présence de la boîte et des papiers peut augmenter significativement la valeur</strong> de votre montre. Nous acceptons également les montres sans papiers, à condition qu'elles soient authentiques. Lors de l'estimation, nous prenons en compte tous ces éléments pour vous fournir une évaluation précise et transparente.",
        en: 'It is not required, but <strong>having the box and papers can significantly increase the value</strong> of your watch. We also accept watches without papers, provided they are authentic. We take all of these factors into account to give you an accurate and transparent valuation.',
        de: 'Das ist nicht zwingend erforderlich, aber <strong>Box und Papiere können den Wert Ihrer Uhr deutlich erhöhen</strong>. Wir nehmen auch Uhren ohne Papiere an, sofern sie authentisch sind. Bei der Schätzung berücksichtigen wir all diese Faktoren, um Ihnen eine präzise und transparente Bewertung zu geben.',
      }),
    },
    {
      id: 10,
      question: t({
        fr: 'Je ne trouve pas la montre que je cherche dans votre collection. Que puis-je faire ?',
        en: 'I cannot find the watch I am looking for in your collection. What can I do?',
        de: 'Ich finde die gesuchte Uhr nicht in Ihrer Kollektion. Was kann ich tun?',
      }),
      answer: t({
        fr: "Si la montre de vos rêves n'est pas dans notre collection en stock, <strong>notre service de recherche personnalisée est fait pour vous</strong> ! Nous recherchons activement dans notre réseau et sur le marché pour trouver exactement ce que vous cherchez selon vos critères (marque, modèle, année, budget, état). Le service est gratuit jusqu'à ce que nous trouvions la montre qui vous convient. N'hésitez pas à nous contacter pour lancer une recherche personnalisée.",
        en: 'If your dream watch is not in our in-stock collection, <strong>our personalised sourcing service is exactly what you need</strong>. We search actively through our network and the wider market to find precisely what you are after, against your criteria (brand, model, year, budget, condition). The service is free until we find the watch that suits you. Do get in touch to start a search.',
        de: 'Wenn Ihre Wunschuhr nicht in unserer Lagerkollektion ist, <strong>ist unsere persönliche Uhrensuche genau das Richtige</strong>. Wir suchen aktiv in unserem Netzwerk und am Markt nach genau dem, was Sie suchen — nach Ihren Kriterien (Marke, Modell, Jahrgang, Budget, Zustand). Der Dienst ist kostenlos, bis wir die passende Uhr gefunden haben. Sprechen Sie uns an, um eine Suche zu starten.',
      }),
    },
    {
      id: 11,
      question: t({
        fr: 'Comment se déroule le processus de rachat de ma montre ?',
        en: 'How does the buy-back process work?',
        de: 'Wie läuft der Ankauf meiner Uhr ab?',
      }),
      answer: t({
        fr: `<ul class="list-decimal space-y-2 ml-4">
      <li>Vous remplissez notre <a href="/estimation" class="text-primary hover:text-green-700 underline font-medium">formulaire d'estimation gratuite</a> en ligne ou nous contactez directement.</li>
      <li>Nous analysons votre demande et vous envoyons une estimation détaillée sous 24h. <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">Découvrez notre méthode d'estimation</a>.</li>
      <li>Si vous acceptez notre proposition, nous organisons le transport de la montre pour qu'elle nous parvienne.</li>
      <li>Après réception de la montre, nous la vérifions et vous envoyons le paiement.</li>
    </ul>`,
        en: `<ul class="list-decimal space-y-2 ml-4">
      <li>You fill in our <a href="/estimation" class="text-primary hover:text-green-700 underline font-medium">free valuation form</a> online, or contact us directly.</li>
      <li>We review your request and send you a detailed valuation within 24 hours. <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">See how we value watches</a>.</li>
      <li>If you accept our offer, we arrange transport so the watch reaches us safely.</li>
      <li>Once the watch arrives, we check it and send your payment.</li>
    </ul>`,
        de: `<ul class="list-decimal space-y-2 ml-4">
      <li>Sie füllen unser <a href="/estimation" class="text-primary hover:text-green-700 underline font-medium">kostenloses Schätzformular</a> online aus oder kontaktieren uns direkt.</li>
      <li>Wir prüfen Ihre Anfrage und senden Ihnen innerhalb von 24 Stunden eine detaillierte Schätzung. <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">So schätzen wir Uhren</a>.</li>
      <li>Nehmen Sie unser Angebot an, organisieren wir den Transport der Uhr zu uns.</li>
      <li>Nach Eingang der Uhr prüfen wir sie und überweisen Ihnen den Betrag.</li>
    </ul>`,
      }),
    },
    {
      id: 12,
      question: t({
        fr: 'Rachetez-vous toutes les marques de montres ?',
        en: 'Do you buy every watch brand?',
        de: 'Kaufen Sie Uhren aller Marken an?',
      }),
      answer: t({
        fr: 'Nous rachetons principalement les <strong>montres de marques prestigieuses</strong> comme Rolex, Omega, Cartier, Breitling, Audemars Piguet, Patek Philippe, Tag Heuer, Tudor, et bien d\'autres. Si vous avez un doute sur votre montre, n\'hésitez pas à nous envoyer les informations via notre <a href="/estimation" class="text-primary hover:text-green-700 underline font-medium">formulaire d\'estimation gratuite</a>, nous vous répondrons rapidement.',
        en: 'We mainly buy <strong>watches from prestigious brands</strong> such as Rolex, Omega, Cartier, Breitling, Audemars Piguet, Patek Philippe, Tag Heuer, Tudor and many others. If you are unsure about your watch, send us the details through our <a href="/estimation" class="text-primary hover:text-green-700 underline font-medium">free valuation form</a> and we will get back to you quickly.',
        de: 'Wir kaufen vor allem <strong>Uhren renommierter Marken</strong> wie Rolex, Omega, Cartier, Breitling, Audemars Piguet, Patek Philippe, Tag Heuer, Tudor und viele weitere. Wenn Sie sich bei Ihrer Uhr unsicher sind, senden Sie uns die Angaben über unser <a href="/estimation" class="text-primary hover:text-green-700 underline font-medium">kostenloses Schätzformular</a> — wir antworten Ihnen zügig.',
      }),
    },
    {
      id: 13,
      question: t({
        fr: 'Je ne suis pas sûr(e) de vouloir vendre tout de suite. Puis-je quand même demander une estimation ?',
        en: 'I am not sure I want to sell just yet. Can I still request a valuation?',
        de: 'Ich bin mir noch nicht sicher, ob ich verkaufen will. Kann ich trotzdem eine Schätzung anfragen?',
      }),
      answer: t({
        fr: "Absolument ! <strong>L'estimation est gratuite et sans engagement</strong>. Vous pouvez obtenir une estimation et revenir vers nous plus tard si vous changez d'avis. Nous ne conservons vos données que pour vous recontacter si vous le souhaitez. Il n'y a aucune pression, prenez le temps de réfléchir à notre proposition.",
        en: 'Absolutely. <strong>The valuation is free and without obligation</strong>. You can get a valuation and come back to us later if you change your mind. We keep your details only so we can contact you again should you wish. There is no pressure — take the time to think our offer over.',
        de: 'Selbstverständlich. <strong>Die Schätzung ist kostenlos und unverbindlich</strong>. Sie können eine Schätzung erhalten und sich später wieder melden, falls Sie es sich anders überlegen. Ihre Daten speichern wir nur, um Sie auf Wunsch erneut zu kontaktieren. Kein Druck — nehmen Sie sich Zeit für unser Angebot.',
      }),
    },
    {
      id: 14,
      question: t({
        fr: 'Comment puis-je être sûr(e) que vous êtes un professionnel sérieux ?',
        en: 'How can I be sure you are a reputable professional?',
        de: 'Woran erkenne ich, dass Sie ein seriöser Anbieter sind?',
      }),
      answer: t({
        fr: 'Notre activité est déclarée (SIRET visible sur le site), et nous avons déjà accompagné de nombreux collectionneurs satisfaits. Nous vous invitons à consulter nos avis Google, à vérifier notre profil professionnel et à nous contacter pour toute question. Nous sommes transparents sur nos méthodes, comme en témoigne notre <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">page détaillée expliquant notre processus d\'estimation</a>.',
        en: 'Our business is formally registered (the SIRET number is shown on the site) and we have already worked with many satisfied collectors. We invite you to read our Google reviews, check our professional profile and contact us with any question. We are open about our methods, as our <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">detailed page explaining our valuation process</a> shows.',
        de: 'Unser Unternehmen ist offiziell registriert (die SIRET-Nummer steht auf der Website), und wir haben bereits viele zufriedene Sammler begleitet. Lesen Sie gern unsere Google-Bewertungen, prüfen Sie unser Unternehmensprofil und sprechen Sie uns bei Fragen an. Wir legen unsere Methoden offen, wie unsere <a href="/estimation/processus" class="text-primary hover:text-green-700 underline font-medium">ausführliche Seite zum Schätzverfahren</a> zeigt.',
      }),
    },
  ],
}
