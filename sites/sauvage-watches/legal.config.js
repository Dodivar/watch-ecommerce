/**
 * Contenu juridique de Sauvage Watches — mentions légales, politique de confidentialité et
 * conditions générales de vente.
 *
 * Source de vérité : les documents du client (`documentation/onboarding/client/Sauvage Watches/`,
 * fichiers .docx). Ce fichier en est la transcription : pour modifier un texte, éditer ici puis
 * faire valider par le client — ne jamais retoucher la page elle-même.
 *
 * Forme d'un document : `{ title, updated, intro, sections: [{ title, blocks }] }`.
 * Blocs : `p` (paragraphe), `lines` (lignes à la suite, ex. une adresse), `list` (puces),
 * `h3` (sous-titre), `notice` (encadré réglementaire, contient d'autres blocs).
 * Dans un texte : `**gras**`, `[libellé](https://…)`, et les adresses e-mail deviennent des
 * liens `mailto:` d'elles-mêmes. Le rendu est celui de `components/legal/LegalDocument.vue`.
 *
 * Textes en français uniquement (chaînes simples, servies telles quelles dans les trois langues).
 *
 * L'encadré de l'article 17 reproduit le « modèle A » de l'annexe à l'article D. 211-2 du code
 * de la consommation (version en vigueur depuis le 1er octobre 2022) : le texte est imposé,
 * ne pas le reformuler.
 */
export default {
  mentions: {
    title: 'Mentions légales',
    updated: '1 octobre 2026',
    intro: [
      {
        type: 'p',
        text: 'Conformément aux dispositions légales applicables, les présentes mentions légales ont pour objet d’informer les utilisateurs du site **sauvage-watches.fr** de l’identité de son éditeur, de son responsable de publication et de son hébergeur.',
      },
    ],
    sections: [
      {
        title: '1. Éditeur du site',
        blocks: [
          {
            type: 'p',
            text: 'Le site **sauvage-watches.fr** est édité par :',
          },
          {
            type: 'lines',
            lines: [
              '**SAUVAGE WATCHES**',
              'Société par actions simplifiée (SAS) au capital social de **2 000 euros**',
              'Siège social : **32 Allée de la Robertsau, 67000 Strasbourg, France**',
            ],
          },
          {
            type: 'p',
            text: 'Immatriculée au **Registre du commerce et des sociétés de Strasbourg** sous le numéro **931 523 393**',
          },
          {
            type: 'lines',
            lines: [
              '**SIREN :** 931 523 393',
              '**SIRET :** 931 523 393 00011',
              '**Numéro de TVA intracommunautaire :** FR94931523393',
            ],
          },
          {
            type: 'lines',
            lines: ['**Président :** Antoine Roth', '**Directeur général :** Thomas Desroches'],
          },
          {
            type: 'lines',
            lines: ['**E-mail :** contact@sauvage-watches.fr', '**Téléphone :** 06 12 84 39 26'],
          },
        ],
      },
      {
        title: '2. Directeur de la publication',
        blocks: [
          {
            type: 'p',
            text: 'Le directeur de la publication du site est :',
          },
          {
            type: 'p',
            text: '**Antoine Roth**, en qualité de Président de SAUVAGE WATCHES.',
          },
        ],
      },
      {
        title: '3. Hébergement du site',
        blocks: [
          {
            type: 'p',
            text: 'Le site est hébergé par :',
          },
          {
            type: 'lines',
            lines: [
              '**Vercel Inc.**',
              '340 South Lemon Avenue, bureau 4133',
              'Walnut, CA 91789',
              'États-Unis',
            ],
          },
          {
            type: 'p',
            text: 'Site internet : [vercel.com](https://vercel.com)',
          },
          {
            type: 'p',
            text: 'Les coordonnées et informations légales actualisées de l’hébergeur peuvent être consultées directement sur son site officiel.',
          },
          {
            type: 'p',
            text: 'Le nom de domaine sauvage-watches.fr est enregistré auprès de **Hostinger International Limited** ([hostinger.fr](https://www.hostinger.fr)), qui n’héberge pas le site.',
          },
        ],
      },
      {
        title: '4. Propriété intellectuelle',
        blocks: [
          {
            type: 'p',
            text: 'Le site **sauvage-watches.fr**, sa structure générale ainsi que l’ensemble des éléments qui le composent ou qui y sont accessibles, notamment les textes, photographies, vidéos, illustrations, graphismes, logos, éléments visuels, éléments graphiques, bases de données et autres contenus, sont protégés par les dispositions applicables en matière de propriété intellectuelle.',
          },
          {
            type: 'p',
            text: 'Sauf mention contraire, ces éléments sont la propriété de **SAUVAGE WATCHES** ou sont utilisés avec l’autorisation de leurs titulaires respectifs.',
          },
          {
            type: 'p',
            text: 'Toute reproduction, représentation, modification, adaptation, publication, diffusion ou exploitation, totale ou partielle, du site ou de l’un de ses éléments, par quelque procédé que ce soit et sur quelque support que ce soit, est interdite sans l’autorisation préalable de SAUVAGE WATCHES ou du titulaire des droits concernés, sauf dans les cas expressément autorisés par la loi.',
          },
          {
            type: 'p',
            text: 'Toute utilisation non autorisée est susceptible de constituer une atteinte aux droits de propriété intellectuelle concernés et d’engager la responsabilité de son auteur.',
          },
          {
            type: 'p',
            text: 'Les marques, dénominations, logos et signes distinctifs appartenant à des tiers et éventuellement reproduits sur le site demeurent la propriété de leurs titulaires respectifs.',
          },
        ],
      },
      {
        title: '5. Photographies et contenus relatifs aux montres',
        blocks: [
          {
            type: 'p',
            text: 'Les photographies et contenus présentant les montres proposées par SAUVAGE WATCHES sont destinés à présenter les produits commercialisés sur le site.',
          },
          {
            type: 'p',
            text: 'Sauf indication contraire, les photographies réalisées par ou pour SAUVAGE WATCHES ainsi que les textes et contenus éditoriaux correspondants ne peuvent être reproduits, réutilisés ou diffusés à des fins commerciales sans autorisation préalable.',
          },
          {
            type: 'p',
            text: 'Les marques et références de montres citées sur le site, notamment celles appartenant aux fabricants et maisons horlogères, demeurent la propriété de leurs titulaires respectifs.',
          },
          {
            type: 'p',
            text: 'La commercialisation de montres de seconde main par SAUVAGE WATCHES n’implique aucune affiliation, partenariat ou relation commerciale officielle avec les marques concernées, sauf indication expresse contraire.',
          },
        ],
      },
      {
        title: '6. Responsabilité',
        blocks: [
          {
            type: 'p',
            text: 'SAUVAGE WATCHES s’efforce de fournir sur son site des informations aussi exactes et actualisées que possible.',
          },
          {
            type: 'p',
            text: 'Toutefois, SAUVAGE WATCHES ne peut garantir l’absence totale d’erreurs, d’omissions ou d’indisponibilités temporaires du site.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES se réserve le droit de modifier, corriger ou mettre à jour le contenu du site à tout moment.',
          },
          {
            type: 'p',
            text: 'L’utilisateur est responsable de son équipement informatique, de sa connexion à Internet et de l’utilisation qu’il fait des informations et services accessibles sur le site.',
          },
          {
            type: 'p',
            text: 'Les conditions applicables aux achats réalisés sur le site, notamment en matière de commande, paiement, livraison, rétractation, retour et garanties, sont précisées dans les **Conditions Générales de Vente (CGV)**.',
          },
        ],
      },
      {
        title: '7. Liens hypertextes',
        blocks: [
          {
            type: 'p',
            text: 'Le site peut contenir des liens permettant d’accéder à des sites ou services exploités par des tiers.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES n’exerce aucun contrôle sur le contenu de ces sites tiers et ne saurait être tenue responsable de leur contenu, de leur disponibilité ou de leurs pratiques.',
          },
          {
            type: 'p',
            text: 'La présence d’un lien vers un site tiers n’implique pas nécessairement l’existence d’un partenariat ou d’une relation commerciale entre SAUVAGE WATCHES et l’exploitant du site concerné.',
          },
        ],
      },
      {
        title: '8. Données personnelles et cookies',
        blocks: [
          {
            type: 'p',
            text: 'Les informations relatives à la collecte et au traitement des données personnelles des utilisateurs, ainsi qu’à l’utilisation des cookies et autres traceurs, sont détaillées dans la **Politique de confidentialité** accessible sur le site.',
          },
          {
            type: 'p',
            text: 'Les utilisateurs peuvent également gérer leurs choix relatifs aux cookies à partir de l’outil **« Préférences cookies »** disponible sur le site.',
          },
        ],
      },
      {
        title: '9. Contact',
        blocks: [
          {
            type: 'p',
            text: 'Pour toute question concernant le site ou son contenu, vous pouvez contacter SAUVAGE WATCHES :',
          },
          {
            type: 'lines',
            lines: [
              '**Par e-mail :** contact@sauvage-watches.fr',
              '**Par téléphone :** 06 12 84 39 26',
              '**Par courrier :** SAUVAGE WATCHES – 32 Allée de la Robertsau, 67000 Strasbourg, France',
            ],
          },
        ],
      },
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    updated: '1 octobre 2026',
    intro: [
      {
        type: 'p',
        text: 'La présente politique de confidentialité a pour objet d’informer les utilisateurs du site Sauvage Watches sur la manière dont leurs données personnelles sont collectées, utilisées, conservées et protégées.',
      },
      {
        type: 'p',
        text: 'Sauvage Watches accorde une importance particulière à la protection de vos données personnelles et s’engage à les traiter conformément au Règlement général sur la protection des données (RGPD), à la loi française « Informatique et Libertés » et, plus généralement, à la réglementation applicable en matière de protection des données personnelles.',
      },
    ],
    sections: [
      {
        title: '1. Responsable du traitement',
        blocks: [
          {
            type: 'p',
            text: 'Le responsable du traitement des données personnelles collectées sur le site est :',
          },
          {
            type: 'lines',
            lines: [
              'Sauvage Watches, société par actions simplifiée (SAS)',
              '32 Allée de la Robertsau',
              '67000 Strasbourg – France',
              'SIRET : 931 523 393 00011',
              'E-mail : contact@sauvage-watches.fr',
            ],
          },
          {
            type: 'p',
            text: 'Pour toute question relative à l’utilisation de vos données personnelles ou à l’exercice de vos droits, vous pouvez nous contacter à cette adresse e-mail.',
          },
        ],
      },
      {
        title: '2. Données personnelles collectées',
        blocks: [
          {
            type: 'p',
            text: 'Selon votre utilisation du site et les services auxquels vous faites appel, Sauvage Watches peut être amené à collecter différentes catégories de données personnelles.',
          },
          {
            type: 'h3',
            text: '2.1 Données de navigation et données techniques',
          },
          {
            type: 'p',
            text: 'Lors de votre navigation sur le site, certaines données techniques peuvent être traitées, notamment :',
          },
          {
            type: 'list',
            items: [
              'adresse IP ;',
              'type de navigateur et système d’exploitation ;',
              'type d’appareil utilisé ;',
              'date et heure de connexion ;',
              'pages consultées ;',
              'données relatives au fonctionnement et à la sécurité du site ;',
              'informations liées aux cookies et autres traceurs, selon vos choix.',
            ],
          },
          {
            type: 'p',
            text: 'Ces informations peuvent notamment être utilisées afin d’assurer le bon fonctionnement et la sécurité du site, détecter d’éventuelles anomalies ou tentatives d’utilisation frauduleuse et, lorsque vous y avez consenti, mesurer l’audience du site.',
          },
          {
            type: 'h3',
            text: '2.2 Formulaires de contact, d’estimation et de recherche personnalisée',
          },
          {
            type: 'p',
            text: 'Lorsque vous nous contactez ou utilisez un formulaire disponible sur le site, nous pouvons collecter notamment :',
          },
          {
            type: 'list',
            items: [
              'nom et prénom ;',
              'adresse e-mail ;',
              'numéro de téléphone ;',
              'contenu de votre demande ;',
              'critères de recherche d’une montre ;',
              'informations relatives à une montre que vous souhaitez faire estimer, vendre ou proposer en dépôt-vente ;',
              'photographies ;',
              'documents et pièces jointes éventuellement transmis.',
            ],
          },
          {
            type: 'p',
            text: 'Ces informations sont utilisées afin de répondre à votre demande, réaliser une estimation, rechercher une montre correspondant à vos critères, établir une proposition commerciale et assurer le suivi de nos échanges.',
          },
          {
            type: 'p',
            text: 'Base juridique : exécution de mesures précontractuelles prises à votre demande, exécution d’un contrat lorsqu’une relation commerciale est établie et, selon les situations, intérêt légitime de Sauvage Watches à assurer le suivi de sa relation avec ses clients et prospects.',
          },
        ],
      },
      {
        title: '3. Service « Coup de cœur » et alertes personnalisées',
        blocks: [
          {
            type: 'p',
            text: 'Sauvage Watches propose un service « Coup de cœur » permettant aux utilisateurs de découvrir les montres susceptibles de correspondre à leurs préférences.',
          },
          {
            type: 'p',
            text: 'Dans le cadre de ce service, l’utilisateur peut notamment sélectionner différents critères tels que :',
          },
          {
            type: 'list',
            items: [
              'une tranche de budget ;',
              'une ou plusieurs marques ;',
              'des préférences de couleurs ;',
              'ainsi que, le cas échéant, d’autres caractéristiques relatives aux montres recherchées.',
            ],
          },
          {
            type: 'p',
            text: 'Ces informations sont utilisées afin de comparer les préférences renseignées par l’utilisateur avec les montres disponibles chez Sauvage Watches et de lui présenter une sélection correspondant à ses critères.',
          },
          {
            type: 'p',
            text: 'Lorsque l’utilisateur choisit de renseigner son adresse e-mail afin d’être informé de l’arrivée de nouvelles montres correspondant à ses préférences, Sauvage Watches peut conserver :',
          },
          {
            type: 'list',
            items: [
              'son adresse e-mail ;',
              'les critères et préférences qu’il a renseignés ;',
              'les informations nécessaires à la gestion de son alerte.',
            ],
          },
          {
            type: 'p',
            text: 'Lorsqu’une nouvelle montre correspondant aux critères enregistrés est ajoutée au stock de Sauvage Watches, un e-mail d’alerte peut être envoyé automatiquement à l’utilisateur.',
          },
          {
            type: 'p',
            text: 'Ces données sont utilisées afin de fournir le service d’alerte personnalisé demandé par l’utilisateur et de lui signaler les nouvelles montres correspondant aux critères qu’il a enregistrés.',
          },
          {
            type: 'p',
            text: 'L’inscription au service d’alertes « Coup de cœur » n’entraîne pas automatiquement l’inscription de l’utilisateur à une newsletter ou à d’autres communications commerciales sans rapport avec le service demandé. Lorsque le consentement de l’utilisateur est requis pour recevoir de telles communications, celui-ci est recueilli séparément.',
          },
          {
            type: 'p',
            text: 'L’utilisateur peut mettre fin aux alertes « Coup de cœur » à tout moment grâce au lien prévu à cet effet dans chaque e-mail ou en contactant Sauvage Watches à l’adresse contact@sauvage-watches.fr.',
          },
          {
            type: 'p',
            text: 'Lorsque l’utilisateur met fin au service d’alerte, les données conservées spécifiquement pour son fonctionnement sont supprimées ou anonymisées lorsqu’elles ne sont plus nécessaires à une autre finalité légitime ou à une obligation légale.',
          },
          {
            type: 'p',
            text: 'Base juridique : exécution du service demandé par l’utilisateur et, lorsque cela est requis en fonction de la nature des communications adressées, consentement de l’utilisateur.',
          },
        ],
      },
      {
        title: '4. Estimation, rachat et dépôt-vente de montres',
        blocks: [
          {
            type: 'p',
            text: 'Dans le cadre d’une demande d’estimation, de rachat ou de dépôt-vente, Sauvage Watches peut traiter les informations nécessaires à l’identification et à l’évaluation de la montre concernée, notamment :',
          },
          {
            type: 'list',
            items: [
              'marque et modèle ;',
              'référence ;',
              'numéro de série lorsque celui-ci est nécessaire à l’identification ou à la vérification de la montre ;',
              'année ;',
              'état de la montre ;',
              'photographies ;',
              'présence de la boîte, des papiers, de la carte de garantie ou d’autres accessoires ;',
              'facture d’origine ou justificatif d’achat lorsqu’il est communiqué ou nécessaire ;',
              'informations permettant de vérifier la propriété ou la provenance du bien lorsque cela est nécessaire ;',
              'coordonnées du vendeur ou déposant ;',
              'informations nécessaires au règlement de la transaction.',
            ],
          },
          {
            type: 'p',
            text: 'Ces données sont utilisées afin d’évaluer la montre, vérifier ses caractéristiques et son authenticité, établir une offre de rachat ou les conditions d’un dépôt-vente, organiser la transaction et contribuer à la prévention de la fraude.',
          },
          {
            type: 'p',
            text: 'Selon la nature et les modalités de la transaction, Sauvage Watches peut également être amené à recueillir certaines informations ou certains justificatifs nécessaires au respect de ses obligations légales et réglementaires.',
          },
          {
            type: 'p',
            text: 'Base juridique : mesures précontractuelles, exécution du contrat, respect des obligations légales applicables et intérêt légitime de Sauvage Watches à sécuriser ses transactions et prévenir les fraudes.',
          },
        ],
      },
      {
        title: '5. Commandes et gestion de la relation client',
        blocks: [
          {
            type: 'p',
            text: 'Lorsque vous achetez une montre ou un autre produit auprès de Sauvage Watches, nous pouvons traiter notamment :',
          },
          {
            type: 'list',
            items: [
              'nom et prénom ;',
              'coordonnées postales ;',
              'adresse de facturation ;',
              'adresse de livraison ;',
              'adresse e-mail ;',
              'numéro de téléphone ;',
              'produits commandés ;',
              'référence et caractéristiques de la montre ;',
              'montant et date de la transaction ;',
              'informations relatives à la facturation ;',
              'informations relatives à la livraison ;',
              'historique des échanges concernant la commande ;',
              'informations relatives à un éventuel retour, à une réclamation ou au service après-vente.',
            ],
          },
          {
            type: 'p',
            text: 'Ces informations sont nécessaires afin de :',
          },
          {
            type: 'list',
            items: [
              'traiter et exécuter votre commande ;',
              'établir les factures et documents commerciaux ;',
              'organiser la livraison ;',
              'assurer le suivi de la commande ;',
              'gérer les retours et réclamations ;',
              'assurer le service après-vente et la garantie ;',
              'respecter nos obligations comptables, fiscales et légales.',
            ],
          },
          {
            type: 'p',
            text: 'Base juridique : exécution du contrat et respect des obligations légales auxquelles Sauvage Watches est soumis.',
          },
        ],
      },
      {
        title: '6. Paiement en ligne',
        blocks: [
          {
            type: 'p',
            text: 'Lorsque vous effectuez un paiement en ligne, les données nécessaires au traitement du paiement sont prises en charge par notre prestataire de paiement Stripe.',
          },
          {
            type: 'p',
            text: 'Sauvage Watches ne conserve pas sur ses propres serveurs l’intégralité des données de votre carte bancaire et n’a pas vocation à accéder à votre cryptogramme visuel.',
          },
          {
            type: 'p',
            text: 'Stripe traite les données de paiement conformément à ses propres conditions et mesures de sécurité.',
          },
          {
            type: 'p',
            text: 'Les informations relatives à la transaction qui sont nécessaires à Sauvage Watches, telles que le montant, la date, le statut du paiement ou la référence de la transaction, peuvent être conservées afin d’assurer la gestion de la commande, de la comptabilité, des remboursements et des éventuels litiges.',
          },
          {
            type: 'p',
            text: 'Base juridique : exécution du contrat et respect des obligations légales applicables.',
          },
        ],
      },
      {
        title: '7. Livraison',
        blocks: [
          {
            type: 'p',
            text: 'Lorsque votre commande nécessite une expédition, certaines données personnelles peuvent être transmises aux transporteurs et prestataires logistiques chargés de la livraison, notamment :',
          },
          {
            type: 'list',
            items: [
              'nom et prénom ;',
              'adresse de livraison ;',
              'numéro de téléphone ;',
              'adresse e-mail lorsque celle-ci est nécessaire au suivi ou à l’organisation de la livraison ;',
              'informations strictement nécessaires à l’expédition et au suivi du colis.',
            ],
          },
          {
            type: 'p',
            text: 'Ces données sont communiquées uniquement dans la mesure nécessaire à l’exécution et à la sécurisation de la livraison.',
          },
          {
            type: 'p',
            text: 'Base juridique : exécution du contrat.',
          },
        ],
      },
      {
        title: '8. Service après-vente et garantie',
        blocks: [
          {
            type: 'p',
            text: 'Lorsque vous nous contactez concernant une montre achetée auprès de Sauvage Watches, nous pouvons traiter les informations relatives à votre achat, à la montre concernée et au problème rencontré.',
          },
          {
            type: 'p',
            text: 'Ces informations peuvent être utilisées afin de traiter votre demande, organiser une expertise ou une intervention, assurer le suivi du dossier et mettre en œuvre les garanties applicables.',
          },
          {
            type: 'p',
            text: 'Lorsque cela est nécessaire, certaines informations peuvent être transmises à un horloger, atelier ou prestataire intervenant dans le traitement du dossier.',
          },
          {
            type: 'p',
            text: 'Base juridique : exécution du contrat, respect des obligations légales applicables et, selon les situations, intérêt légitime à assurer le suivi de la relation client.',
          },
        ],
      },
      {
        title: '9. Mesure d’audience – Google Analytics',
        blocks: [
          {
            type: 'p',
            text: 'Sous réserve de votre consentement lorsque celui-ci est requis, Sauvage Watches peut utiliser Google Analytics afin de mesurer la fréquentation du site et mieux comprendre son utilisation.',
          },
          {
            type: 'p',
            text: 'Les informations collectées peuvent notamment concerner :',
          },
          {
            type: 'list',
            items: [
              'les pages consultées ;',
              'le parcours de navigation ;',
              'la durée des visites ;',
              'le type d’appareil utilisé ;',
              'l’origine approximative du trafic ;',
              'les interactions avec certaines fonctionnalités du site.',
            ],
          },
          {
            type: 'p',
            text: 'Les traceurs concernés ne sont déposés et les scripts correspondants ne sont chargés qu’après votre accord via le bandeau de gestion des cookies lorsqu’un consentement est requis.',
          },
          {
            type: 'p',
            text: 'Vous pouvez retirer ou modifier votre choix à tout moment depuis le lien « Préférences cookies » accessible sur le site.',
          },
          {
            type: 'p',
            text: 'Base juridique : consentement lorsqu’il est requis par la réglementation applicable.',
          },
        ],
      },
      {
        title: '10. Publicité et mesure des campagnes',
        blocks: [
          {
            type: 'p',
            text: 'Sous réserve de votre consentement, Sauvage Watches peut utiliser des outils publicitaires tels que Google Ads et les technologies publicitaires de Meta associées notamment à Facebook et Instagram.',
          },
          {
            type: 'p',
            text: 'Ces outils permettent notamment :',
          },
          {
            type: 'list',
            items: [
              'de mesurer les performances des campagnes publicitaires ;',
              'de déterminer si une visite ou un achat provient d’une campagne ;',
              'd’analyser certaines interactions avec le site ;',
              'd’améliorer la pertinence des campagnes publicitaires ;',
              'de créer, lorsque les fonctionnalités utilisées le permettent, des audiences publicitaires.',
            ],
          },
          {
            type: 'p',
            text: 'Certains événements liés à votre navigation peuvent être transmis aux plateformes concernées, par exemple la consultation d’une page produit, l’ajout d’un produit au panier ou la réalisation d’une commande.',
          },
          {
            type: 'p',
            text: 'Lorsque le consentement est requis, les traceurs et scripts publicitaires ne sont activés qu’après votre accord à la finalité correspondante.',
          },
          {
            type: 'p',
            text: 'Le refus des cookies publicitaires n’empêche pas de consulter le site ou d’effectuer un achat.',
          },
          {
            type: 'p',
            text: 'Vous pouvez retirer votre consentement ou modifier vos préférences à tout moment depuis le lien « Préférences cookies ».',
          },
          {
            type: 'p',
            text: 'Base juridique : consentement.',
          },
        ],
      },
      {
        title: '11. Prospection commerciale et communications',
        blocks: [
          {
            type: 'p',
            text: 'Lorsque la réglementation le permet, Sauvage Watches peut utiliser vos coordonnées afin de vous adresser des informations commerciales concernant ses produits et services.',
          },
          {
            type: 'p',
            text: 'Lorsque votre consentement est requis, aucune communication commerciale électronique ne vous sera adressée sans votre accord préalable.',
          },
          {
            type: 'p',
            text: 'Dans les cas prévus par la réglementation, Sauvage Watches peut également informer ses clients existants de produits ou services analogues à ceux ayant fait l’objet d’une précédente transaction.',
          },
          {
            type: 'p',
            text: 'Le service d’alertes « Coup de cœur » est distinct des communications commerciales générales : l’inscription à ce service ne vaut pas automatiquement inscription à une newsletter ou acceptation de communications commerciales sans rapport avec les critères enregistrés.',
          },
          {
            type: 'p',
            text: 'Vous pouvez vous opposer à la réception de communications commerciales à tout moment, notamment en utilisant le lien de désinscription présent dans les communications concernées ou en nous contactant à :',
          },
          {
            type: 'p',
            text: 'contact@sauvage-watches.fr',
          },
        ],
      },
      {
        title: '12. Cookies et autres traceurs',
        blocks: [
          {
            type: 'p',
            text: 'Le site peut utiliser différents types de cookies ou technologies similaires.',
          },
          {
            type: 'p',
            text: 'Ils peuvent notamment avoir pour finalité :',
          },
          {
            type: 'list',
            items: [
              'le fonctionnement technique du site ;',
              'la sécurité ;',
              'la mémorisation de certains choix ;',
              'la mesure d’audience ;',
              'la mesure des performances publicitaires ;',
              'la personnalisation ou le ciblage publicitaire.',
            ],
          },
          {
            type: 'p',
            text: 'Les cookies strictement nécessaires au fonctionnement du site peuvent être utilisés sans consentement lorsqu’ils remplissent les conditions prévues par la réglementation.',
          },
          {
            type: 'p',
            text: 'Les cookies et traceurs soumis au consentement ne sont utilisés qu’après votre accord.',
          },
          {
            type: 'p',
            text: 'Lors de votre première visite, un bandeau vous permet d’accepter, de refuser ou de paramétrer les cookies concernés.',
          },
          {
            type: 'p',
            text: 'Vous pouvez modifier ou retirer votre choix à tout moment depuis le lien « Préférences cookies » accessible sur le site.',
          },
          {
            type: 'p',
            text: 'Lorsque le traitement repose sur votre consentement, son retrait n’affecte pas la licéité des traitements effectués avant ce retrait.',
          },
        ],
      },
      {
        title: '13. Destinataires et prestataires',
        blocks: [
          {
            type: 'p',
            text: 'Vos données personnelles sont accessibles uniquement aux personnes et organismes qui en ont besoin dans le cadre des finalités décrites dans la présente politique.',
          },
          {
            type: 'p',
            text: 'Selon les services utilisés, elles peuvent notamment être communiquées :',
          },
          {
            type: 'list',
            items: [
              'au personnel habilité de Sauvage Watches ;',
              'aux prestataires assurant l’hébergement et le fonctionnement technique du site ;',
              'aux prestataires de messagerie et d’infrastructure informatique ;',
              'à Mailjet, prestataire utilisé par SAUVAGE WATCHES pour l’envoi des e-mails transactionnels, des alertes personnalisées “Coup de cœur” et, le cas échéant, des communications commerciales ;',
              'à Stripe, pour le traitement des paiements ;',
              'aux transporteurs et prestataires logistiques chargés des expéditions ;',
              'aux horlogers, ateliers ou prestataires intervenant dans le cadre du contrôle, du service après-vente ou de la garantie lorsque cela est nécessaire ;',
              'à Google, notamment pour Google Analytics et Google Ads selon les fonctionnalités effectivement utilisées et vos choix en matière de cookies ;',
              'à Meta Platforms Ireland Limited, pour les outils publicitaires liés notamment à Facebook et Instagram, lorsque vous avez consenti à leur utilisation ;',
              'aux conseils, experts, assureurs, établissements financiers, administrations ou autorités compétentes lorsque cela est nécessaire ou imposé par la loi.',
            ],
          },
          {
            type: 'p',
            text: 'Sauvage Watches ne vend pas vos données personnelles.',
          },
        ],
      },
      {
        title: '14. Transferts de données hors de l’Espace économique européen',
        blocks: [
          {
            type: 'p',
            text: 'Dans le cadre de l’utilisation de certains prestataires techniques, notamment pour l’hébergement, le paiement, l’envoi d’e-mails, la mesure d’audience ou les services publicitaires, certaines données personnelles peuvent être traitées ou accessibles depuis des pays situés en dehors de l’Espace économique européen (EEE).',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES veille à ce que ces transferts soient réalisés conformément à la réglementation applicable en matière de protection des données personnelles.',
          },
          {
            type: 'p',
            text: 'Lorsque les données sont transférées vers un pays reconnu par la Commission européenne comme assurant un niveau de protection adéquat, le transfert repose sur la décision d’adéquation correspondante.',
          },
          {
            type: 'p',
            text: 'Lorsque le pays concerné ne bénéficie pas d’une telle décision, le transfert est encadré par des garanties appropriées prévues par le RGPD, notamment les clauses contractuelles types adoptées par la Commission européenne ou tout autre mécanisme juridiquement reconnu.',
          },
          {
            type: 'p',
            text: 'Lorsque cela est nécessaire, des mesures complémentaires peuvent également être mises en œuvre afin d’assurer un niveau de protection approprié des données.',
          },
          {
            type: 'p',
            text: 'Le client peut contacter SAUVAGE WATCHES à l’adresse contact@sauvage-watches.fr pour obtenir davantage d’informations concernant les transferts de ses données personnelles et les garanties mises en place.',
          },
        ],
      },
      {
        title: '15. Durées de conservation',
        blocks: [
          {
            type: 'p',
            text: 'Sauvage Watches conserve les données personnelles uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, puis, lorsque cela est nécessaire, pendant les durées imposées par les obligations légales ou permettant la constatation, l’exercice ou la défense de droits en justice.',
          },
          {
            type: 'p',
            text: 'À titre indicatif :',
          },
          {
            type: 'list',
            items: [
              'alertes « Coup de cœur » : les données nécessaires au fonctionnement de l’alerte sont conservées pendant la durée d’activation du service. Lorsque l’utilisateur met fin à ses alertes, elles sont supprimées ou anonymisées lorsqu’elles ne sont plus nécessaires à une autre finalité ou obligation légale ;',
              'demandes de prospects, estimations et recherches personnalisées : pendant la durée nécessaire au traitement de la demande puis, à des fins de prospection commerciale lorsque cela est permis, jusqu’à 3 ans à compter de la collecte ou du dernier contact émanant du prospect ;',
              'données relatives aux clients : pendant la durée de la relation commerciale puis, pour la prospection commerciale, jusqu’à 3 ans à compter de la fin de la relation commerciale, sauf opposition ;',
              'commandes, factures et pièces comptables : conservation conformément aux obligations légales applicables, certaines pièces comptables devant notamment être conservées pendant 10 ans ;',
              'données nécessaires à la gestion d’un SAV, d’une garantie ou d’un litige : pendant la durée nécessaire au traitement du dossier puis, lorsque cela est justifié, pendant les délais légaux applicables ;',
              'données de paiement : selon les durées nécessaires à la réalisation de la transaction et les obligations applicables au prestataire de paiement ;',
              'données utilisées pour la mesure d’audience et la publicité : selon les durées définies dans la configuration des services concernés et conformément à vos choix en matière de cookies ;',
              'choix relatifs aux cookies : conservés pendant une durée adaptée afin d’éviter de solliciter excessivement votre consentement, conformément aux recommandations applicables.',
            ],
          },
          {
            type: 'p',
            text: 'Certaines données peuvent faire l’objet d’un archivage intermédiaire lorsqu’elles doivent être conservées afin de respecter une obligation légale ou de permettre la défense des droits de Sauvage Watches.',
          },
        ],
      },
      {
        title: '16. Sécurité des données',
        blocks: [
          {
            type: 'p',
            text: 'Sauvage Watches met en œuvre des mesures techniques et organisationnelles appropriées afin de protéger les données personnelles contre notamment :',
          },
          {
            type: 'list',
            items: [
              'l’accès non autorisé ;',
              'la divulgation ;',
              'l’altération ;',
              'la perte ;',
              'la destruction ;',
              'l’utilisation frauduleuse.',
            ],
          },
          {
            type: 'p',
            text: 'Ces mesures comprennent notamment, selon les services concernés, la sécurisation des communications, le recours à des prestataires professionnels, la limitation des accès aux données et la protection des comptes et infrastructures utilisés.',
          },
          {
            type: 'p',
            text: 'Aucun système informatique ne permettant de garantir une sécurité absolue, Sauvage Watches adapte ses mesures de protection en fonction de la nature des données traitées et des risques identifiés.',
          },
        ],
      },
      {
        title: '17. Vos droits',
        blocks: [
          {
            type: 'p',
            text: 'Conformément à la réglementation applicable en matière de protection des données personnelles, vous pouvez disposer, selon la situation, des droits suivants :',
          },
          {
            type: 'list',
            items: [
              'droit d’accès à vos données personnelles ;',
              'droit de rectification des données inexactes ou incomplètes ;',
              'droit à l’effacement de vos données dans les conditions prévues par la réglementation ;',
              'droit à la limitation du traitement ;',
              'droit d’opposition à certains traitements fondés sur l’intérêt légitime ;',
              'droit de vous opposer à tout moment à l’utilisation de vos données à des fins de prospection commerciale ;',
              'droit à la portabilité lorsque le traitement repose sur votre consentement ou sur un contrat et est réalisé à l’aide de procédés automatisés ;',
              'droit de retirer votre consentement à tout moment lorsqu’un traitement repose sur celui-ci ;',
              'droit de définir des directives relatives au sort de vos données personnelles après votre décès dans les conditions prévues par la législation française.',
            ],
          },
          {
            type: 'p',
            text: 'L’exercice de certains droits peut être limité lorsque le traitement de vos données est nécessaire au respect d’une obligation légale, à l’exécution d’un contrat ou à la constatation, l’exercice ou la défense de droits en justice.',
          },
        ],
      },
      {
        title: '18. Exercice de vos droits',
        blocks: [
          {
            type: 'p',
            text: 'Pour exercer vos droits ou poser une question concernant le traitement de vos données personnelles, vous pouvez nous contacter à :',
          },
          {
            type: 'p',
            text: 'contact@sauvage-watches.fr',
          },
          {
            type: 'p',
            text: 'Afin de protéger vos données, Sauvage Watches pourra vous demander des informations complémentaires permettant de vérifier votre identité lorsque cela est nécessaire et proportionné.',
          },
          {
            type: 'p',
            text: 'Nous nous efforcerons de répondre à votre demande dans les délais prévus par la réglementation applicable.',
          },
        ],
      },
      {
        title: '19. Réclamation auprès de la CNIL',
        blocks: [
          {
            type: 'p',
            text: 'Si vous estimez, après nous avoir contactés, que vos droits relatifs à vos données personnelles ne sont pas respectés, vous pouvez introduire une réclamation auprès de la :',
          },
          {
            type: 'lines',
            lines: [
              'Commission nationale de l’informatique et des libertés (CNIL)',
              '3 Place de Fontenoy',
              'TSA 80715',
              '75334 Paris Cedex 07',
              'France',
            ],
          },
          {
            type: 'p',
            text: 'Le site officiel de la CNIL permet également d’effectuer certaines démarches et réclamations en ligne.',
          },
        ],
      },
      {
        title: '20. Modification de la politique de confidentialité',
        blocks: [
          {
            type: 'p',
            text: 'Sauvage Watches peut modifier la présente politique de confidentialité afin de tenir compte notamment de l’évolution du site, des services proposés, des prestataires utilisés ou de la réglementation applicable.',
          },
          {
            type: 'p',
            text: 'La date de « dernière mise à jour » figurant en haut de cette page sera modifiée en conséquence.',
          },
          {
            type: 'p',
            text: 'Nous vous invitons à consulter régulièrement cette page afin de prendre connaissance de sa version la plus récente.',
          },
        ],
      },
    ],
  },
  terms: {
    title: 'Conditions générales de vente',
    updated: '1er octobre 2026',
    intro: [],
    sections: [
      {
        title: 'Article 1 – Identité du vendeur',
        blocks: [
          {
            type: 'p',
            text: 'Les présentes Conditions Générales de Vente, ci-après les « CGV », régissent les ventes réalisées sur le site sauvage-watches.fr par :',
          },
          {
            type: 'lines',
            lines: [
              'SAUVAGE WATCHES',
              'Société par actions simplifiée (SAS) au capital de 2 000 euros',
              'Siège social : 32 Allée de la Robertsau, 67000 Strasbourg, France',
              'RCS Strasbourg : 931 523 393',
              'SIREN : 931 523 393',
              'SIRET : 931 523 393 00011',
              'TVA intracommunautaire : FR94931523393',
              'Président : Antoine Roth',
              'Directeur général : Thomas Desroches',
              'E-mail : contact@sauvage-watches.fr',
              'Téléphone : 06 12 84 39 26',
            ],
          },
        ],
      },
      {
        title: 'Article 2 – Objet et champ d’application',
        blocks: [
          {
            type: 'p',
            text: 'Les présentes CGV définissent les droits et obligations de SAUVAGE WATCHES et de ses clients consommateurs dans le cadre de la vente de montres et accessoires proposés sur le site sauvage-watches.fr.',
          },
          {
            type: 'p',
            text: 'Le site est destiné à la vente aux consommateurs particuliers.',
          },
          {
            type: 'p',
            text: 'Les transactions réalisées entre SAUVAGE WATCHES et des professionnels sont conclues en dehors du site et ne sont pas régies par les présentes CGV.',
          },
          {
            type: 'p',
            text: 'Toute commande effectuée sur le site implique l’acceptation des présentes CGV par le client avant la validation définitive de sa commande.',
          },
          {
            type: 'p',
            text: 'Les CGV applicables sont celles en vigueur à la date de la commande.',
          },
        ],
      },
      {
        title: 'Article 3 – Caractéristiques des montres et produits',
        blocks: [
          {
            type: 'p',
            text: 'SAUVAGE WATCHES est spécialisé dans l’achat et la revente de montres, principalement de seconde main.',
          },
          {
            type: 'p',
            text: 'Les caractéristiques essentielles de chaque montre sont présentées sur sa fiche produit, notamment, selon les informations disponibles : marque et modèle, référence, année ou période estimée, dimensions, mouvement, matériau, type de bracelet, état général, présence éventuelle de boîte, papiers, carte de garantie et autres accessoires, ainsi que les conditions de garantie applicables.',
          },
          {
            type: 'p',
            text: 'Les montres d’occasion peuvent présenter des traces d’utilisation, rayures, marques, patine ou autres signes d’usure compatibles avec leur âge, leur historique et leur état.',
          },
          {
            type: 'p',
            text: 'Ces éléments ne constituent pas un défaut dès lors qu’ils ont été correctement portés à la connaissance du client et dans les limites prévues par les garanties légales applicables.',
          },
          {
            type: 'p',
            text: 'Les photographies sont réalisées afin de représenter aussi fidèlement que possible les montres proposées. De légères différences de perception, notamment de couleur, peuvent résulter de l’écran, de l’éclairage ou des conditions de prise de vue.',
          },
          {
            type: 'p',
            text: 'Lorsqu’une caractéristique particulière de la montre s’écarte des critères normalement attendus d’un bien comparable, cette caractéristique est portée spécifiquement à la connaissance du client conformément à la réglementation applicable.',
          },
        ],
      },
      {
        title: 'Article 4 – Authenticité',
        blocks: [
          {
            type: 'p',
            text: 'SAUVAGE WATCHES apporte un soin particulier à la sélection et au contrôle des montres proposées à la vente.',
          },
          {
            type: 'p',
            text: 'Les montres sont contrôlées et authentifiées avant leur commercialisation selon les procédures mises en place par SAUVAGE WATCHES et, lorsque cela est jugé nécessaire, avec l’intervention d’un professionnel de l’horlogerie.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES garantit l’authenticité des montres qu’elle commercialise, sous réserve des éventuelles modifications, pièces de service, remplacements ou particularités expressément indiqués sur la fiche produit ou portés à la connaissance du client avant la vente.',
          },
          {
            type: 'p',
            text: 'Les marques citées sur le site demeurent la propriété de leurs titulaires respectifs. SAUVAGE WATCHES est un revendeur indépendant de montres de seconde main et n’est pas nécessairement affilié aux fabricants ou réseaux de distribution officiels des marques proposées.',
          },
        ],
      },
      {
        title: 'Article 5 – Disponibilité',
        blocks: [
          {
            type: 'p',
            text: 'Les produits sont proposés dans la limite des stocks disponibles.',
          },
          {
            type: 'p',
            text: 'Compte tenu notamment du caractère individuel des montres d’occasion, une montre disponible correspond généralement à un exemplaire unique.',
          },
          {
            type: 'p',
            text: 'La mise au panier d’un produit ne garantit pas sa réservation définitive tant que la commande et, lorsque nécessaire, son paiement n’ont pas été validés.',
          },
          {
            type: 'p',
            text: 'En cas d’indisponibilité exceptionnelle d’une montre après passation de la commande, SAUVAGE WATCHES en informe le client dans les meilleurs délais et procède au remboursement des sommes éventuellement encaissées conformément à la réglementation applicable.',
          },
        ],
      },
      {
        title: 'Article 6 – Prix',
        blocks: [
          {
            type: 'p',
            text: 'Les prix sont indiqués en euros (€) et correspondent au prix total applicable au consommateur, toutes taxes comprises lorsque la TVA est applicable selon le régime fiscal concerné.',
          },
          {
            type: 'p',
            text: 'Sauf indication contraire lors de la commande, la livraison standard proposée par SAUVAGE WATCHES en France et dans les destinations européennes desservies est comprise dans le prix de vente.',
          },
          {
            type: 'p',
            text: 'Le prix applicable est celui affiché au moment de la validation de la commande.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES se réserve le droit de modifier ses prix à tout moment, sans incidence sur les commandes déjà valablement conclues.',
          },
        ],
      },
      {
        title: 'Article 7 – Commande',
        blocks: [
          {
            type: 'p',
            text: 'Le client sélectionne la montre qu’il souhaite acheter et suit les différentes étapes du processus de commande.',
          },
          {
            type: 'p',
            text: 'Avant la validation définitive, il peut vérifier le détail de sa commande, son prix total et corriger d’éventuelles erreurs.',
          },
          {
            type: 'p',
            text: 'Le client doit fournir des informations exactes, complètes et à jour nécessaires à la facturation, au paiement et à la livraison.',
          },
          {
            type: 'p',
            text: 'La validation définitive de la commande implique l’acceptation des présentes CGV et l’obligation de paiement du prix.',
          },
          {
            type: 'p',
            text: 'Une confirmation de commande est adressée au client par voie électronique.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES se réserve la possibilité de procéder aux vérifications raisonnablement nécessaires à la sécurisation d’une transaction, notamment compte tenu de la valeur élevée de certaines montres.',
          },
          {
            type: 'p',
            text: 'En présence d’éléments objectifs laissant raisonnablement suspecter une fraude, une usurpation d’identité, une utilisation frauduleuse d’un moyen de paiement ou toute autre anomalie grave, SAUVAGE WATCHES peut suspendre le traitement de la commande le temps de procéder aux vérifications nécessaires ou refuser la transaction dans les conditions permises par la loi.',
          },
        ],
      },
      {
        title: 'Article 8 – Moyens de paiement',
        blocks: [
          {
            type: 'p',
            text: 'Selon les moyens effectivement proposés au moment de la commande, le client peut notamment régler par carte bancaire ou par les solutions de paiement électroniques proposées sur le site, telles qu’Apple Pay, Google Pay, Link, Bancontact, iDEAL, Wero ou Revolut Pay.',
          },
          {
            type: 'p',
            text: 'Les moyens effectivement disponibles peuvent varier selon le pays, le montant de la transaction et les services proposés par le prestataire de paiement.',
          },
          {
            type: 'p',
            text: 'Les paiements électroniques sont notamment traités par Stripe.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES ne conserve pas sur ses propres serveurs l’intégralité des données de carte bancaire du client.',
          },
          {
            type: 'p',
            text: 'Le paiement peut également être effectué par virement bancaire classique directement au profit de SAUVAGE WATCHES, lorsque cette possibilité est proposée.',
          },
          {
            type: 'p',
            text: 'Dans le cas d’un paiement par virement, la commande n’est expédiée qu’après réception effective des fonds, sauf accord contraire de SAUVAGE WATCHES.',
          },
          {
            type: 'p',
            text: 'Aucun frais supplémentaire correspondant aux commissions du prestataire de paiement n’est facturé au consommateur du seul fait de l’utilisation d’un moyen de paiement donné.',
          },
        ],
      },
      {
        title: 'Article 9 – Réserve de propriété',
        blocks: [
          {
            type: 'p',
            text: 'Les produits demeurent la propriété de SAUVAGE WATCHES jusqu’au paiement complet et effectif du prix.',
          },
          {
            type: 'p',
            text: 'Cette disposition n’affecte pas les règles légales relatives au transfert des risques applicables aux consommateurs.',
          },
        ],
      },
      {
        title: 'Article 10 – Livraison',
        blocks: [
          {
            type: 'p',
            text: 'SAUVAGE WATCHES propose la livraison en France et dans les pays européens desservis au moment de la commande.',
          },
          {
            type: 'p',
            text: 'Les expéditions sont principalement réalisées par DHL ou, lorsque les circonstances l’exigent, par un autre transporteur adapté.',
          },
          {
            type: 'p',
            text: 'Les montres sont expédiées selon un service sécurisé et avec une couverture adaptée à la valeur déclarée, dans les conditions du contrat de transport et d’assurance utilisé par SAUVAGE WATCHES.',
          },
          {
            type: 'p',
            text: 'La livraison standard proposée par SAUVAGE WATCHES est comprise dans le prix de vente, sauf indication contraire clairement portée à la connaissance du client avant la commande.',
          },
          {
            type: 'p',
            text: 'Le client doit fournir une adresse de livraison complète et exacte et s’assurer qu’il peut réceptionner le colis dans les conditions communiquées par le transporteur.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES communique au client la date ou le délai de livraison prévu conformément aux informations présentées lors de la commande.',
          },
          {
            type: 'p',
            text: 'À défaut d’indication particulière, le bien est délivré sans retard injustifié et au plus tard trente jours après la conclusion du contrat, conformément aux dispositions légales applicables.',
          },
        ],
      },
      {
        title: 'Article 11 – Transfert des risques et réception',
        blocks: [
          {
            type: 'p',
            text: 'Lorsque le transporteur est proposé par SAUVAGE WATCHES, le risque de perte ou d’endommagement de la montre demeure à la charge de SAUVAGE WATCHES jusqu’au moment où le client, ou un tiers désigné par lui autre que le transporteur, prend physiquement possession du bien.',
          },
          {
            type: 'p',
            text: 'Le client est invité à vérifier l’état apparent du colis lors de sa réception.',
          },
          {
            type: 'p',
            text: 'En cas de colis manifestement endommagé, ouvert, reconditionné ou présentant une anomalie, le client est invité à émettre les réserves appropriées auprès du transporteur et à contacter SAUVAGE WATCHES dans les meilleurs délais afin de faciliter le traitement du dossier.',
          },
          {
            type: 'p',
            text: 'Ces démarches ne privent pas le consommateur de ses droits légaux.',
          },
        ],
      },
      {
        title: 'Article 12 – Remise en main propre',
        blocks: [
          {
            type: 'p',
            text: 'Le client peut, lorsque cette possibilité est proposée, choisir une remise en main propre sur rendez-vous.',
          },
          {
            type: 'p',
            text: 'Le rendez-vous peut être organisé par le système de prise de rendez-vous disponible sur le site, par téléphone ou par e-mail.',
          },
          {
            type: 'p',
            text: 'Les modalités pratiques, le lieu et l’heure du rendez-vous sont convenus avec SAUVAGE WATCHES.',
          },
          {
            type: 'p',
            text: 'Lors de la remise, SAUVAGE WATCHES peut demander au client de présenter un justificatif permettant de vérifier son identité et, lorsque cela est nécessaire, sa qualité de titulaire ou bénéficiaire de la commande.',
          },
          {
            type: 'p',
            text: 'Lorsque le contrat de vente a été conclu à distance sur le site sauvage-watches.fr, le choix d’une remise en main propre n’a pas pour effet de supprimer le droit de rétractation applicable au contrat conclu à distance.',
          },
        ],
      },
      {
        title: 'Article 13 – Droit de rétractation',
        blocks: [
          {
            type: 'p',
            text: 'Pour les contrats conclus à distance, le consommateur dispose en principe d’un délai de quatorze (14) jours à compter de la réception de la montre pour exercer son droit de rétractation, sans avoir à justifier sa décision.',
          },
          {
            type: 'p',
            text: 'Le client doit informer SAUVAGE WATCHES de sa décision avant l’expiration du délai, au moyen d’une déclaration dénuée d’ambiguïté, notamment par e-mail à :',
          },
          {
            type: 'p',
            text: 'contact@sauvage-watches.fr',
          },
          {
            type: 'p',
            text: 'Il peut également utiliser le formulaire de rétractation figurant en annexe des présentes CGV.',
          },
        ],
      },
      {
        title: 'Article 14 – Retour après rétractation',
        blocks: [
          {
            type: 'p',
            text: 'Après avoir communiqué sa décision de se rétracter, le client doit restituer ou expédier la montre sans retard excessif et au plus tard dans les quatorze jours suivant cette communication.',
          },
          {
            type: 'p',
            text: 'Les coûts directs du retour sont à la charge du client.',
          },
          {
            type: 'p',
            text: 'Compte tenu de la nature et de la valeur des montres commercialisées, il est fortement recommandé au client d’utiliser un mode d’expédition permettant un suivi complet, nécessitant une remise contre signature, avec un emballage correctement protégé et une assurance adaptée à la valeur totale du bien retourné.',
          },
          {
            type: 'p',
            text: 'Avant toute expédition, le client est invité à contacter SAUVAGE WATCHES afin d’obtenir les instructions pratiques de retour.',
          },
          {
            type: 'p',
            text: 'Le produit doit être retourné avec l’ensemble des éléments effectivement remis lors de la vente, notamment, selon le cas : montre, bracelet, maillons, boucle, boîte et surboîte, carte ou documents de garantie, notices, certificats, accessoires, étiquettes ou éléments spécifiques éventuellement fournis et, plus généralement, tout élément compris dans la vente.',
          },
        ],
      },
      {
        title: 'Article 15 – Contrôle des produits retournés et dépréciation',
        blocks: [
          {
            type: 'p',
            text: 'Compte tenu de la valeur des biens commercialisés et du risque de substitution ou de modification d’une montre ou de ses composants, chaque retour peut faire l’objet d’un contrôle approfondi par SAUVAGE WATCHES.',
          },
          {
            type: 'p',
            text: 'Ce contrôle peut notamment porter sur la référence, le numéro de série, l’identité de la montre, le mouvement, le boîtier, le cadran, le bracelet et la boucle, les composants, les documents, les cartes de garantie, les numéros ou marquages, la boîte et les accessoires ainsi que l’état esthétique et fonctionnel.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES peut, lorsque cela est raisonnablement nécessaire, confier la montre à un horloger ou expert compétent afin de contrôler son identité, son authenticité, son état ou l’absence de substitution de composants.',
          },
          {
            type: 'p',
            text: 'Le consommateur peut manipuler le bien dans la mesure nécessaire pour en établir la nature, les caractéristiques et le bon fonctionnement.',
          },
          {
            type: 'p',
            text: 'Sa responsabilité peut toutefois être engagée en cas de dépréciation résultant de manipulations autres que celles nécessaires à ces vérifications.',
          },
          {
            type: 'p',
            text: 'Peuvent notamment être prises en considération, lorsqu’elles sont imputables au client et excèdent ces manipulations nécessaires : rayures, chocs ou détériorations nouvelles ; détérioration du bracelet ou de la boucle ; suppression, détérioration ou modification d’un élément ; intervention technique ou ouverture non nécessaire ; modification ou remplacement d’un composant ; perte ou détérioration d’un accessoire, document, maillon ou élément compris dans la vente.',
          },
          {
            type: 'p',
            text: 'Toute retenue éventuelle liée à une dépréciation est déterminée au regard de la dépréciation réellement constatée et justifiable et ne constitue pas une pénalité forfaitaire.',
          },
          {
            type: 'p',
            text: 'En cas de retour d’un bien qui ne serait pas celui vendu par SAUVAGE WATCHES, de substitution d’une montre, d’un composant, d’un document ou d’un accessoire, ou de toute autre fraude avérée, SAUVAGE WATCHES se réserve la possibilité d’exercer tout recours approprié.',
          },
        ],
      },
      {
        title: 'Article 16 – Remboursement en cas de rétractation',
        blocks: [
          {
            type: 'p',
            text: 'En cas d’exercice valable du droit de rétractation, SAUVAGE WATCHES rembourse les sommes dues conformément aux dispositions du Code de la consommation.',
          },
          {
            type: 'p',
            text: 'Le remboursement comprend les sommes versées au titre de la commande et, lorsqu’ils ont été facturés séparément, les frais de livraison standard dans les conditions prévues par la loi.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES peut différer le remboursement jusqu’à récupération du bien ou jusqu’à ce que le client fournisse une preuve de son expédition, la date retenue étant celle du premier de ces faits.',
          },
          {
            type: 'p',
            text: 'La réception de la montre permet à SAUVAGE WATCHES de procéder aux contrôles prévus à l’article 15 et, lorsqu’une dépréciation imputable au consommateur est constatée, d’en tirer les conséquences dans les limites prévues par la loi.',
          },
          {
            type: 'p',
            text: 'Le remboursement est effectué en utilisant le même moyen de paiement que celui utilisé pour la transaction initiale, sauf accord exprès du consommateur pour un autre moyen ne lui occasionnant pas de frais.',
          },
          {
            type: 'p',
            text: 'Les frais directs de retour restent à la charge du client.',
          },
        ],
      },
      {
        title: 'Article 17 – Garantie légale de conformité',
        blocks: [
          {
            type: 'p',
            text: 'Les produits vendus par SAUVAGE WATCHES bénéficient de la garantie légale de conformité prévue par les articles L.217-1 et suivants du Code de la consommation.',
          },
          {
            type: 'p',
            text: 'Cette garantie s’applique également aux biens d’occasion.',
          },
          {
            type: 'p',
            text: 'Le vendeur répond des défauts de conformité existant lors de la délivrance et apparaissant dans un délai de deux ans à compter de la délivrance du bien.',
          },
          {
            type: 'p',
            text: 'Pour les biens d’occasion, les règles particulières de preuve prévues par le Code de la consommation sont applicables.',
          },
          {
            type: 'p',
            text: 'Le caractère d’occasion de la montre, son ancienneté et les caractéristiques particulières dont le consommateur a été spécifiquement informé avant la vente sont pris en considération conformément aux dispositions légales applicables.',
          },
          {
            type: 'notice',
            blocks: [
              {
                type: 'p',
                text: "Le consommateur dispose d'un délai de deux ans à compter de la délivrance du bien pour obtenir la mise en œuvre de la garantie légale de conformité en cas d'apparition d'un défaut de conformité. Durant ce délai, le consommateur n'est tenu d'établir que l'existence du défaut de conformité et non la date d'apparition de celui-ci.",
              },
              {
                type: 'p',
                text: "Lorsque le contrat de vente du bien prévoit la fourniture d'un contenu numérique ou d'un service numérique de manière continue pendant une durée supérieure à deux ans, la garantie légale est applicable à ce contenu numérique ou ce service numérique tout au long de la période de fourniture prévue. Durant ce délai, le consommateur n'est tenu d'établir que l'existence du défaut de conformité affectant le contenu numérique ou le service numérique et non la date d'apparition de celui-ci.",
              },
              {
                type: 'p',
                text: 'La garantie légale de conformité emporte obligation pour le professionnel, le cas échéant, de fournir toutes les mises à jour nécessaires au maintien de la conformité du bien.',
              },
              {
                type: 'p',
                text: 'La garantie légale de conformité donne au consommateur droit à la réparation ou au remplacement du bien dans un délai de trente jours suivant sa demande, sans frais et sans inconvénient majeur pour lui.',
              },
              {
                type: 'p',
                text: "Si le bien est réparé dans le cadre de la garantie légale de conformité, le consommateur bénéficie d'une extension de six mois de la garantie initiale.",
              },
              {
                type: 'p',
                text: 'Si le consommateur demande la réparation du bien, mais que le vendeur impose le remplacement, la garantie légale de conformité est renouvelée pour une période de deux ans à compter de la date de remplacement du bien.',
              },
              {
                type: 'p',
                text: "Le consommateur peut obtenir une réduction du prix d'achat en conservant le bien ou mettre fin au contrat en se faisant rembourser intégralement contre restitution du bien, si :",
              },
              {
                type: 'list',
                items: [
                  '1° Le professionnel refuse de réparer ou de remplacer le bien ;',
                  '2° La réparation ou le remplacement du bien intervient après un délai de trente jours ;',
                  "3° La réparation ou le remplacement du bien occasionne un inconvénient majeur pour le consommateur, notamment lorsque le consommateur supporte définitivement les frais de reprise ou d'enlèvement du bien non conforme, ou s'il supporte les frais d'installation du bien réparé ou de remplacement ;",
                  '4° La non-conformité du bien persiste en dépit de la tentative de mise en conformité du vendeur restée infructueuse.',
                ],
              },
              {
                type: 'p',
                text: "Le consommateur a également droit à une réduction du prix du bien ou à la résolution du contrat lorsque le défaut de conformité est si grave qu'il justifie que la réduction du prix ou la résolution du contrat soit immédiate. Le consommateur n'est alors pas tenu de demander la réparation ou le remplacement du bien au préalable.",
              },
              {
                type: 'p',
                text: "Le consommateur n'a pas droit à la résolution de la vente si le défaut de conformité est mineur.",
              },
              {
                type: 'p',
                text: "Toute période d'immobilisation du bien en vue de sa réparation ou de son remplacement suspend la garantie qui restait à courir jusqu'à la délivrance du bien remis en état.",
              },
              {
                type: 'p',
                text: "Les droits mentionnés ci-dessus résultent de l'application des articles L. 217-1 à L. 217-32 du code de la consommation.",
              },
              {
                type: 'p',
                text: "Le vendeur qui fait obstacle de mauvaise foi à la mise en œuvre de la garantie légale de conformité encourt une amende civile d'un montant maximal de 300 000 euros, qui peut être porté jusqu'à 10 % du chiffre d'affaires moyen annuel (article L. 241-5 du code de la consommation).",
              },
              {
                type: 'p',
                text: 'Le consommateur bénéficie également de la garantie légale des vices cachés en application des articles 1641 à 1649 du code civil, pendant une durée de deux ans à compter de la découverte du défaut. Cette garantie donne droit à une réduction de prix si le bien est conservé ou à un remboursement intégral contre restitution du bien.',
              },
            ],
          },
        ],
      },
      {
        title: 'Article 18 – Garantie des vices cachés',
        blocks: [
          {
            type: 'p',
            text: 'Indépendamment de la garantie légale de conformité et de toute garantie commerciale, le consommateur bénéficie de la garantie légale contre les vices cachés prévue aux articles 1641 à 1649 du Code civil.',
          },
          {
            type: 'p',
            text: 'Cette garantie peut être mise en œuvre lorsque le défaut caché rend le bien impropre à l’usage auquel il est destiné ou diminue tellement cet usage que l’acheteur ne l’aurait pas acquis, ou n’en aurait donné qu’un moindre prix, s’il en avait eu connaissance.',
          },
          {
            type: 'p',
            text: 'L’action résultant des vices cachés doit être exercée dans le délai prévu par la loi à compter de la découverte du vice.',
          },
        ],
      },
      {
        title: 'Article 19 – Garantie commerciale SAUVAGE WATCHES',
        blocks: [
          {
            type: 'p',
            text: 'En complément des garanties légales, certaines montres bénéficient d’une garantie commerciale SAUVAGE WATCHES de douze (12) mois portant exclusivement sur le mécanisme.',
          },
          {
            type: 'p',
            text: 'Cette garantie est proposée lorsque la montre vendue n’est plus couverte par une garantie fabricant encore en cours de validité au jour de la vente.',
          },
          {
            type: 'p',
            text: 'Lorsqu’une montre bénéficie encore d’une garantie fabricant applicable, aucune garantie commerciale SAUVAGE WATCHES supplémentaire de douze mois n’est ajoutée, sans préjudice des garanties légales dues par SAUVAGE WATCHES.',
          },
          {
            type: 'p',
            text: 'Lorsqu’elle est applicable, la garantie commerciale SAUVAGE WATCHES est accordée sans supplément de prix et court à compter de la date d’achat figurant sur la facture.',
          },
          {
            type: 'p',
            text: 'Elle couvre les dysfonctionnements mécaniques relevant du mouvement de la montre dans les limites et conditions définies dans le contrat de garantie commerciale remis au client.',
          },
          {
            type: 'p',
            text: 'Elle ne couvre notamment pas les dommages résultant d’un choc, d’une chute ou d’un accident ; d’une mauvaise utilisation ; l’usure normale ; les dommages esthétiques ; les éléments extérieurs sauf lorsque le dysfonctionnement relève directement du mécanisme couvert ; les dommages causés par une intervention d’un tiers lorsque celle-ci est à l’origine du problème ; les dommages volontaires ou résultant d’une négligence ; ou une utilisation ne respectant pas les caractéristiques de la montre.',
          },
          {
            type: 'p',
            text: 'L’étanchéité n’est pas couverte par la garantie commerciale SAUVAGE WATCHES, sauf engagement écrit contraire.',
          },
          {
            type: 'p',
            text: 'Pour solliciter la garantie :',
          },
          {
            type: 'lines',
            lines: [
              'SAUVAGE WATCHES',
              '32 Allée de la Robertsau',
              '67000 Strasbourg – France',
              'contact@sauvage-watches.fr',
              '06 12 84 39 26',
            ],
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES pourra demander la remise de la montre afin de procéder ou faire procéder à un diagnostic.',
          },
          {
            type: 'p',
            text: 'Cette garantie commerciale est distincte et sans préjudice de la garantie légale de conformité et de la garantie légale des vices cachés.',
          },
          {
            type: 'p',
            text: 'Les conditions complètes de la garantie commerciale sont remises au client sur un support durable au plus tard au moment de la délivrance de la montre concernée.',
          },
        ],
      },
      {
        title: 'Article 20 – Garantie fabricant',
        blocks: [
          {
            type: 'p',
            text: 'Certaines montres peuvent encore bénéficier d’une garantie commerciale proposée par leur fabricant.',
          },
          {
            type: 'p',
            text: 'Lorsqu’une telle garantie est indiquée comme existante, son application dépend des conditions définies par le fabricant concerné, notamment de sa durée, de sa transférabilité, de la validité des documents accompagnant la montre et de ses exclusions.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES ne peut étendre ni modifier les conditions d’une garantie commerciale accordée par un fabricant tiers.',
          },
          {
            type: 'p',
            text: 'L’existence éventuelle d’une garantie fabricant ne limite pas les garanties légales dues par SAUVAGE WATCHES en sa qualité de vendeur professionnel.',
          },
        ],
      },
      {
        title: 'Article 21 – Service après-vente',
        blocks: [
          {
            type: 'p',
            text: 'Pour toute demande relative à une garantie, une réparation ou un problème rencontré après l’achat, le client peut contacter :',
          },
          {
            type: 'lines',
            lines: ['contact@sauvage-watches.fr', '06 12 84 39 26'],
          },
          {
            type: 'p',
            text: 'Lorsqu’il souhaite solliciter la garantie commerciale SAUVAGE WATCHES, le client est invité à contacter SAUVAGE WATCHES avant de confier la montre à un tiers.',
          },
          {
            type: 'p',
            text: 'Cette disposition ne limite pas les droits dont bénéficie le consommateur au titre des garanties légales.',
          },
        ],
      },
      {
        title: 'Article 22 – Archivage du contrat',
        blocks: [
          {
            type: 'p',
            text: 'Pour les contrats conclus par voie électronique dont le montant atteint le seuil prévu par la réglementation, SAUVAGE WATCHES assure la conservation de l’écrit constatant le contrat pendant la durée légalement applicable.',
          },
          {
            type: 'p',
            text: 'Pour les contrats concernés, cette conservation est assurée pendant une durée de dix ans dans les conditions prévues par le Code de la consommation.',
          },
          {
            type: 'p',
            text: 'Le client peut demander l’accès au contrat archivé le concernant en contactant :',
          },
          {
            type: 'p',
            text: 'contact@sauvage-watches.fr',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES conserve notamment les informations contractuelles nécessaires permettant d’identifier les conditions applicables à la commande et la version des CGV acceptée lors de sa conclusion.',
          },
        ],
      },
      {
        title: 'Article 23 – Données personnelles',
        blocks: [
          {
            type: 'p',
            text: 'Les données personnelles recueillies dans le cadre des commandes sont traitées conformément à la Politique de confidentialité de SAUVAGE WATCHES accessible sur le site.',
          },
          {
            type: 'p',
            text: 'Cette politique détaille notamment les traitements liés aux commandes, paiements, livraisons, formulaires, service « Coup de cœur », mesure d’audience, publicité et droits des personnes concernées.',
          },
        ],
      },
      {
        title: 'Article 24 – Responsabilité',
        blocks: [
          {
            type: 'p',
            text: 'SAUVAGE WATCHES est responsable de la bonne exécution de ses obligations dans les conditions prévues par la réglementation applicable.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES ne saurait toutefois être tenue responsable d’un dommage résultant d’une mauvaise utilisation du produit, d’une utilisation contraire à sa destination ou d’un événement présentant les caractéristiques de la force majeure, sous réserve des dispositions légales impératives applicables.',
          },
          {
            type: 'p',
            text: 'Aucune disposition des présentes CGV ne peut avoir pour effet d’exclure ou de limiter un droit impératif reconnu au consommateur par la loi.',
          },
        ],
      },
      {
        title: 'Article 25 – Réclamation',
        blocks: [
          {
            type: 'p',
            text: 'Pour toute difficulté relative à une commande, le client est invité à contacter préalablement SAUVAGE WATCHES afin de rechercher une solution amiable :',
          },
          {
            type: 'lines',
            lines: [
              'SAUVAGE WATCHES',
              '32 Allée de la Robertsau',
              '67000 Strasbourg – France',
              'E-mail : contact@sauvage-watches.fr',
              'Téléphone : 06 12 84 39 26',
            ],
          },
        ],
      },
      {
        title: 'Article 26 – Médiation de la consommation',
        blocks: [
          {
            type: 'p',
            text: 'Après avoir adressé une réclamation écrite préalable à SAUVAGE WATCHES et en l’absence de résolution amiable satisfaisante, le consommateur peut recourir gratuitement au médiateur de la consommation dont relève SAUVAGE WATCHES :',
          },
          {
            type: 'lines',
            lines: [
              'CM2C – Centre de la Médiation de la Consommation de Conciliateurs de Justice',
              '49 rue de Ponthieu',
              '75008 Paris – France',
              'E-mail : contact@cm2c.net',
              'Téléphone : 01 89 47 00 14',
              'Site : [cm2c.net](https://cm2c.net)',
            ],
          },
          {
            type: 'p',
            text: 'Le recours au médiateur est gratuit pour le consommateur dans les conditions prévues par la réglementation et les règles de saisine du médiateur.',
          },
        ],
      },
      {
        title: 'Article 27 – Droit applicable et litiges',
        blocks: [
          {
            type: 'p',
            text: 'Les présentes CGV et les contrats conclus avec SAUVAGE WATCHES sont régis par le droit français.',
          },
          {
            type: 'p',
            text: 'Lorsque le consommateur réside dans un autre État bénéficiant de dispositions impératives de protection du consommateur applicables à sa situation, le choix du droit français ne saurait le priver de la protection que lui assurent les dispositions impératives applicables conformément aux règles de droit international privé.',
          },
          {
            type: 'p',
            text: 'En cas de litige, les parties sont invitées à rechercher préalablement une solution amiable.',
          },
          {
            type: 'p',
            text: 'À défaut de résolution amiable ou de médiation, le litige relève des juridictions compétentes conformément aux règles légales applicables.',
          },
        ],
      },
      {
        title: 'Article 28 – Modification des CGV',
        blocks: [
          {
            type: 'p',
            text: 'SAUVAGE WATCHES peut modifier les présentes CGV afin notamment de tenir compte de l’évolution de son activité, de ses services ou de la réglementation.',
          },
          {
            type: 'p',
            text: 'Les CGV applicables à une commande sont celles acceptées par le client au moment de sa conclusion.',
          },
          {
            type: 'p',
            text: 'SAUVAGE WATCHES conserve la version des CGV applicable à chaque commande dans les conditions prévues à l’article 22.',
          },
        ],
      },
      {
        title: 'ANNEXE – FORMULAIRE DE RÉTRACTATION',
        blocks: [
          {
            type: 'p',
            text: 'À l’attention de :',
          },
          {
            type: 'lines',
            lines: [
              'SAUVAGE WATCHES',
              '32 Allée de la Robertsau',
              '67000 Strasbourg – France',
              'E-mail : contact@sauvage-watches.fr',
            ],
          },
          {
            type: 'p',
            text: 'Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien suivant :',
          },
          {
            type: 'lines',
            lines: [
              'Montre / produit :',
              '....................................................................................',
            ],
          },
          {
            type: 'lines',
            lines: [
              'Référence de commande :',
              '....................................................................................',
            ],
          },
          {
            type: 'lines',
            lines: [
              'Commandé le :',
              '....................................................................................',
            ],
          },
          {
            type: 'lines',
            lines: [
              'Reçu le :',
              '....................................................................................',
            ],
          },
          {
            type: 'lines',
            lines: [
              'Nom du consommateur :',
              '....................................................................................',
            ],
          },
          {
            type: 'lines',
            lines: [
              'Adresse du consommateur :',
              '....................................................................................',
            ],
          },
          {
            type: 'lines',
            lines: [
              'Date :',
              '....................................................................................',
            ],
          },
          {
            type: 'lines',
            lines: [
              'Signature du consommateur (uniquement en cas d’envoi du formulaire sur papier) :',
              '....................................................................................',
            ],
          },
        ],
      },
    ],
  },
}
