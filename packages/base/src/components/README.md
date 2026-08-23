# Composants Vue

Ce dossier regroupe les blocs UI utilisés par les routes définies dans
`router.js`. On y trouve à la fois des pages complètes (`HomePage.vue`,
`EstimationPage.vue`, etc.) et des sous-composants réutilisables (carrousels,
tooltips, sliders).

## Sous-structures

- `admin/` : interface d’administration (CRUD articles, montres, statistiques).
- `watch/` : composants dédiés à la collection (listing, cartes, détail).
- `services/` : atelier — pages prestation `/services/:slug` (`ServiceLandingPage.vue`)
  et formulaire de prise en charge (`RepairRequestForm.vue`), tous deux pilotés par le
  bloc `servicesPage` du manifest client.

## Bonnes pratiques

- Préférer `<script setup>` pour garder des fichiers compacts.
- Déléguer la logique réseau aux services (`src/services`).
- Isoler les états locaux complexes dans des composables si plusieurs composants
  en ont besoin.

