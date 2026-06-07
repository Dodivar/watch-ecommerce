# Admin UI

Interface back-office accessible après authentification Supabase.

## Composants principaux

- `AdminDashboard.vue` : vue d’ensemble (statistiques, raccourcis).
- `AdminArticleList.vue` / `AdminArticleForm.vue` / `AdminArticleGenerator.vue` :
  gestion des articles, y compris la génération assistée et l’aperçu.
- `AdminWatchForm.vue` / `AdminWatchArticleSelector.vue` : création de fiches
  montres et association aux articles de blog.
- `AdminWatchStats.vue` : page dédiée `/admin/stats` (accessible depuis le menu).
  KPIs métier (valeur du stock, taux d'écoulement, prix de vente moyen, délai
  moyen de vente), chiffre d'affaires réel issu des commandes payées, séries
  temporelles avec sélecteur de période, répartitions du catalogue (statut,
  audience, marques, tranches de prix) et métriques infra (stockage, tables).
- `AdminLogin.vue`, `AdminShell.vue` + `AdminSidebar.vue` : enveloppe d’authentification et navigation.

## Flux de données

- Tous les appels passent par `src/services/admin/*.js`.
- Les listes utilisent souvent des watchers Supabase pour rester à jour.

## Astuces maintenance

- Garder les tables HTML légères : paginer côté Supabase en cas d’augmentation
  du volume.
- Typage implicite : documenter les structures d’objets directement via JSDoc
  ou `defineProps` pour aider l’autocomplétion.

