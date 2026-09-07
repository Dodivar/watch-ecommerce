# Admin UI

Interface back-office accessible après authentification Supabase.

## Composants principaux

- `AdminDashboard.vue` : vue d’ensemble — KPIs opérationnels, alertes, sparkline CA 7 jours,
  inventaire condensé, dernières commandes et messages non lus.
- `AdminKpiCard.vue` : carte KPI réutilisable (icône, alerte, lien).
- `AdminArticleList.vue` / `AdminArticleForm.vue` / `AdminArticleGenerator.vue` :
  gestion des articles, y compris la génération assistée et l’aperçu.
- `AdminWatchForm.vue` / `AdminWatchArticleSelector.vue` : création de fiches
  montres et association aux articles de blog.
- `AdminWatchesList.vue` : catalogue paginé côté base. La colonne « Prix » porte toute
  la remise — prix catalogue barré, prix promo, taux et origine empilés sous le prix,
  la hauteur de ligne (vignette 96 px) suffisant à les loger sans colonne dédiée.
  L'origine est : campagne en cours (nom de l'événement), promo directe posée sur la
  fiche, ou campagne à venir (montre engagée, prix pas encore modifié). La case
  « En promotion uniquement » filtre côté base sur `promotion_price`. Le rattachement montre ↔ campagne
  n'est chargé que si `features.adminWatchPromotions` est actif, et son échec ne prive
  pas l'admin du catalogue.
- `AdminPromotedWatchesList.vue` : page dédiée `/admin/watch-promotions/watches`
  (« Montres en promo », dans la section « Promotions » du menu). Récapitule toutes les
  montres remisées quelle que soit l'origine de la remise, avec la synthèse chiffrée
  (nombre, remise moyenne, écart prix catalogue / prix promo), le détail par événement,
  un filtre par origine et une recherche montre ou campagne. Réservée au rôle `admin`
  comme le reste de `/admin/watch-promotions` (voir `adminPermissions.js`).
- `AdminWatchStats.vue` : page dédiée `/admin/stats` (accessible depuis le menu).
  KPIs métier (valeur du stock, taux d'écoulement, prix de vente moyen, délai
  moyen de vente), chiffre d'affaires réel issu des commandes payées, séries
  temporelles avec sélecteur de période, répartitions du catalogue (statut,
  audience, marques, tranches de prix) et métriques infra (stockage, tables).
  Le graphique « articles créés et vus » dépend de `features.blog` : sans ce
  drapeau dans `sites/<SITE_ID>/site.config.js`, la section n'est pas rendue et
  `getArticleStatsByDay()` n'est même pas appelé (voir
  `AdminWatchStats.component.test.js`).
  « Retours & remboursements » (nombre et montant remboursés, taux de retour,
  délai moyen, dossiers hors délai légal) dépend de `features.purchase` et des
  colonnes retour de `orders` — voir la migration « Retours & remboursements ».
  « Demandes clients » trace la boîte de réception par type : les séries sont
  celles que le site propose (`contact`, `appointment`, `estimation`,
  `recherche`, `repairRequest`), plus tout type ayant un historique sur la
  période — couper une feature ne doit pas effacer les demandes déjà reçues.
- `AdminOrderReturnPanel.vue` : dossier retour d'une commande payée (délai de
  rétractation de 14 jours, statut du retour, trace du remboursement). Aucun
  remboursement n'est déclenché depuis l'admin : le panneau renvoie vers le
  paiement dans le dashboard Stripe, où l'opération est faite à la main, puis
  enregistre le montant et l'identifiant `re_…` obtenus.
- `AdminLogin.vue`, `AdminShell.vue` + `AdminSidebar.vue` : enveloppe d’authentification et navigation.
  Le menu mélange liens de premier niveau et sections groupées (`type: 'group'`) : « Promotions »
  (codes promo checkout, événements promotionnels, montres en promo) et « Carrousels ». Une section
  ferme le menu — tout ce qui suit son intitulé lui appartient visuellement — d'où leur place en fin
  de liste. Le contenu d'une section suit les feature flags du site, et chaque entrée est grisée
  plutôt que masquée quand le rôle n'y a pas accès (`adminPermissions.js`).

## Flux de données

- Tous les appels passent par `src/services/admin/*.js`.
- Les listes utilisent souvent des watchers Supabase pour rester à jour.

## Astuces maintenance

- Garder les tables HTML légères : paginer côté Supabase en cas d’augmentation
  du volume.
- Typage implicite : documenter les structures d’objets directement via JSDoc
  ou `defineProps` pour aider l’autocomplétion.

