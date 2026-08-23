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
- `AdminWatchStats.vue` : page dédiée `/admin/stats` (accessible depuis le menu).
  KPIs métier (valeur du stock, taux d'écoulement, prix de vente moyen, délai
  moyen de vente), chiffre d'affaires réel issu des commandes payées, séries
  temporelles avec sélecteur de période, répartitions du catalogue (statut,
  audience, marques, tranches de prix) et métriques infra (stockage, tables).
- `AdminOrderReturnPanel.vue` : dossier retour d'une commande payée (délai de
  rétractation de 14 jours, statut du retour, trace du remboursement). Aucun
  remboursement n'est déclenché depuis l'admin : le panneau renvoie vers le
  paiement dans le dashboard Stripe, où l'opération est faite à la main, puis
  enregistre le montant et l'identifiant `re_…` obtenus.
- `AdminLogin.vue`, `AdminShell.vue` + `AdminSidebar.vue` : enveloppe d’authentification et navigation.

## Flux de données

- Tous les appels passent par `src/services/admin/*.js`.
- Les listes utilisent souvent des watchers Supabase pour rester à jour.

## Astuces maintenance

- Garder les tables HTML légères : paginer côté Supabase en cas d’augmentation
  du volume.
- Typage implicite : documenter les structures d’objets directement via JSDoc
  ou `defineProps` pour aider l’autocomplétion.

