# Sauvage – Vue d’ensemble fonctionnelle

## Expérience utilisateur publique

### Accueil et navigation
- Interface animée (parallax, `scrollAnimation`, `CarouselNouvelles`, `CarouselVentes`) pour afficher en temps réel les arrivages et ventes récentes.
- Mise en avant immédiate des parcours possibles : consultation de la collection, lancement d’une recherche personnalisée ou accès direct aux formulaires de contact.
- Section d’information “Achetez ou recherchez en toute confiance” qui explique les garanties offertes (authenticité vérifiée, réseau partenaires, transparence des opérations).

### Collection et fiches montres
- `WatchesCollection.vue` : filtres instantanés par marque et budget, compteur de montres disponibles et gestion des états de chargement/erreur grâce aux services Supabase.
- `WatchCard` renvoie vers `WatchDetail.vue`, page qui propose : galerie HD avec zoom et lightbox, badges de disponibilité, fiche technique complète (mouvement, matériaux, accessoires, garantie), description extensible et liens vers des articles associés.
- Boutons d’action préremplis (WhatsApp, email) afin de contacter rapidement l’équipe avec une référence précise.
- **Partage social** : bouton de partage intégré dans la galerie d’images ouvrant une lightbox modale avec options de partage sur Facebook, X (Twitter), par email et copie d’URL. Les liens partagés incluent automatiquement le nom de la montre, le prix formaté et la référence pour faciliter la diffusion des produits en stock.

### Services en ligne
- `Recherche.vue` : formulaire guidé avec curseur de budget (`BudgetSlider`), choix des moyens de contact, collecte des critères détaillés et redirection automatique vers `Merci.vue` en cas de succès.
- `EstimationPage.vue` et `EstimationProcess.vue` : formulaires segmentés pour les vendeurs (informations personnelles, état, accessoires, numéro de série) et documentation pédagogique sur le déroulé d’une estimation.
- Possibilités complémentaires : dépôt-vente (section dédiée), demande d’achat direct via `WatchesCollection`, suivi des étapes dans `Faq.vue`.

### Information et assistance
- `Faq.vue` couvre les questions d’authenticité, de garantie, de rendez-vous en main propre, de coûts et de déroulé des ventes/rachats.
- `SuivezNous.vue` centralise les canaux publics (Instagram, TikTok, WhatsApp) pour rester informé des nouveautés et dialoguer avec l’équipe.
- `BlogList.vue` et `BlogDetail.vue` offrent un contenu éditorial filtrable, paginé, avec tags, compteur de vues et résumés courts pour prolonger la découverte.
- **Partage d’articles** : boutons de partage discrets dans l’en-tête et plus visibles dans le pied de page de chaque article (`BlogDetail.vue`), permettant de partager sur Facebook, X (Twitter), par email ou de copier l’URL. Les messages partagés incluent automatiquement le titre de l’article pour encourager la diffusion du contenu éditorial.

## Back-office et administration

### Pilotage des montres
- `AdminDashboard.vue` réunit la liste des montres avec recherche plein texte, filtres par statut, tris multi-colonnes, indicateurs de valeur (stock, vendu, indisponible) et tableau de bord des ventes sur la période récente.
- Actions rapides : édition (`AdminWatchForm.vue`), bascule disponibilité, marquage “vendu”, suppression, réordonnancement (drag-and-drop) et accès aux statistiques détaillées (`AdminWatchStats.vue`).

### Gestion des contenus
- Section admin des articles : liste, création, édition et mise à jour via `AdminArticleList.vue`, `AdminArticleForm.vue` et `AdminArticleGenerator.vue`.
- Générateur connecté à n8n pour produire un article à partir d’un nom de montre, avec redirection automatique vers la fiche créée dans Supabase.
- Possibilité de lier les articles aux montres, ce qui permet d’afficher des contenus relatifs dans `WatchDetail.vue`.

### Services techniques
- Authentification obligatoire sur toutes les routes `/admin`, avec redirection automatique vers `AdminLogin.vue` en cas de session expirée (`adminAuthService`).
- Mode maintenance global configurable (`maintenanceService`) qui bloque l’accès public tant que l’instance n’est pas validée.
- Services partagés (`watchService`, `emailService`, `articleService`) pour centraliser les appels Supabase et l’envoi de formulaires.
- Fichiers de migration SQL et scripts Supabase fournis pour initialiser les tables, gérer les affichages et maintenir l’ordre d’exposition des montres.

## Synthèse

Sauvage propose une interface publique riche (consultation de la collection, formulaires de recherche ou d’estimation, blog, FAQ) tout en disposant d’un back-office structuré (gestion du stock, pilotage éditorial, automatisations n8n, sécurité renforcée). Les deux volets s’appuient sur les mêmes services Vue/Supabase, ce qui facilite la maintenance et garantit une cohérence des données entre les utilisateurs publics et l’équipe interne.
