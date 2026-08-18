/**
 * Catalogue de référence — français.
 *
 * C'est la source : toute nouvelle clé s'ajoute ici d'abord, puis dans `en.js` et `de.js`.
 * `messages.test.js` échoue si une langue prend du retard, pour qu'un texte non traduit soit
 * un test rouge et non un avertissement de console qu'on finit par ne plus lire.
 *
 * Clés plates et pointées, groupées par zone d'interface. Une valeur peut être un objet de
 * formes plurielles (`{ one, other }`), résolu par `Intl.PluralRules` via `tc()`.
 */
export default {
  // — Vocabulaire partagé
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'common.loading': 'Chargement…',
  'common.error': 'Une erreur est survenue',
  'common.retry': 'Réessayer',
  'common.seeMore': 'Voir plus',
  'common.seeAll': 'Tout voir',
  'common.required': 'Champ obligatoire',
  'common.optional': 'facultatif',
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.send': 'Envoyer',
  'common.sending': 'Envoi…',

  // — En-tête, menu, pied de page
  'nav.openMenu': 'Ouvrir le menu',
  'nav.closeMenu': 'Fermer le menu',
  'nav.openCart': 'Ouvrir le panier',
  'nav.search': 'Rechercher',
  'nav.searchPlaceholder': 'Rechercher marque, modèle, référence…',
  'nav.mainMenu': 'Menu principal',
  'nav.openSearch': 'Ouvrir la recherche',
  'nav.closeSearch': 'Fermer la recherche',
  'nav.searchWatchLabel': 'Rechercher une montre',
  'nav.searchBrand': 'Rechercher une marque',
  'nav.language': 'Langue',
  'nav.callUs': 'Nous appeler',
  'nav.allBrands': 'Toutes les marques',
  'footer.followUs': 'Suivez-nous',
  'footer.navigation': 'Navigation',
  'footer.contact': 'Contact',
  'footer.legalLinks': 'Informations légales',

  // — Pages légales (libellés de liens ; le corps reste géré par le client)
  'legal.mentions': 'Mentions légales',
  'legal.privacy': 'Politique de confidentialité',
  'legal.terms': 'CGU',
  'legal.cookiePreferences': 'Préférences cookies',

  // — Catalogue
  'collection.title': 'Nos montres',
  'collection.filters': 'Filtres',
  'collection.clearFilters': 'Effacer les filtres',
  'collection.applyFilters': 'Appliquer',
  'collection.noResults': 'Aucune montre ne correspond à votre recherche.',
  'collection.resultCount': { one: '{count} montre', other: '{count} montres' },
  'collection.sortBy': 'Trier par',
  'collection.sortNewest': 'Nouveautés',
  'collection.sortPriceAsc': 'Prix croissant',
  'collection.sortPriceDesc': 'Prix décroissant',
  'collection.brand': 'Marque',
  'collection.price': 'Prix',
  'collection.audience': 'Public',
  'collection.caseSize': 'Diamètre du boîtier',
  'collection.braceletColor': 'Couleur du bracelet',
  'collection.braceletMaterial': 'Matière du bracelet',
  'collection.promotionsOnly': 'En promotion uniquement',

  // — Fiche montre
  'watch.new': 'Nouveau',
  'watch.sold': 'Vendue',
  'watch.reserved': 'Réservée',
  'watch.imageUnavailable': 'Image non disponible',
  'watch.reference': 'Référence',
  'watch.year': 'Année',
  'watch.condition': 'État',
  'watch.addToCart': 'Ajouter au panier',
  'watch.outOfStock': 'Indisponible',
  'watch.contactUs': 'Nous contacter',
  'watch.priceOnRequest': 'Prix sur demande',
  'watch.previousImage': 'Image précédente',
  'watch.nextImage': 'Image suivante',
  'watch.zoomImage': "Agrandir l'image",

  // — Panier
  'cart.title': 'Votre panier',
  'cart.empty': 'Votre panier est vide.',
  'cart.continueShopping': 'Poursuivre mes achats',
  'cart.checkout': 'Commander',
  'cart.remove': 'Retirer',
  'cart.quantity': 'Quantité',
  'cart.subtotal': 'Sous-total',
  'cart.itemCount': { one: '{count} article', other: '{count} articles' },

  // — Tunnel de commande
  'checkout.title': 'Commande',
  'checkout.contactDetails': 'Vos coordonnées',
  'checkout.shippingAddress': 'Adresse de livraison',
  'checkout.shippingMethod': 'Mode de livraison',
  'checkout.payment': 'Paiement',
  'checkout.orderSummary': 'Récapitulatif',
  'checkout.total': 'Total',
  'checkout.shipping': 'Livraison',
  'checkout.freeShipping': 'Offerte',
  'checkout.vatIncluded': 'TVA incluse',
  'checkout.payNow': 'Payer maintenant',
  'checkout.acceptTerms': "J'accepte les conditions générales de vente",
  'checkout.orderConfirmed': 'Merci, votre commande est confirmée.',
  'checkout.orderCancelled': 'Votre commande a été annulée.',

  // — Formulaires
  'form.firstName': 'Prénom',
  'form.lastName': 'Nom',
  'form.email': 'Adresse e-mail',
  'form.phone': 'Téléphone',
  'form.message': 'Message',
  'form.address': 'Adresse',
  'form.postalCode': 'Code postal',
  'form.city': 'Ville',
  'form.country': 'Pays',
  'form.invalidEmail': 'Adresse e-mail invalide',
  'form.submitError': "L'envoi a échoué. Merci de réessayer.",
  'form.submitSuccess': 'Message envoyé. Nous vous répondons rapidement.',

  // — Infolettre et cookies
  'newsletter.title': 'Newsletter',
  'newsletter.placeholder': 'Votre adresse e-mail',
  'newsletter.subscribe': "S'inscrire",
  'newsletter.success': 'Inscription confirmée. À bientôt !',
  'cookies.title': 'Cookies et mesure d’audience',
  'cookies.body':
    'Nous utilisons des cookies et traceurs pour mesurer l’audience du site (Google Analytics) et améliorer votre navigation. Vous décidez : accepter, refuser ou personnaliser. L’enregistrement de votre choix sur cet appareil est nécessaire au fonctionnement de cette bannière. Pour plus de détails, consultez notre',
  'cookies.privacyLink': 'politique de confidentialité',
  'cookies.accept': 'Tout accepter',
  'cookies.reject': 'Tout refuser',
  'cookies.customize': 'Personnaliser',
  'cookies.preferences': 'Préférences',
  'cookies.analyticsTitle': 'Mesure d’audience',
  'cookies.analyticsBody':
    '— Google Analytics : statistiques de fréquentation et de parcours, de façon anonymisée ou agrégée selon les réglages du service.',
  'cookies.save': 'Enregistrer mes choix',

  // — Page introuvable
  'notFound.title': 'Page introuvable',
  'notFound.message': "La page que vous cherchez n'existe pas ou a été déplacée.",
  'notFound.backHome': "Retour à l'accueil",
}
