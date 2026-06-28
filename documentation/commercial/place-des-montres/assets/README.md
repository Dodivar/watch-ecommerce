# Assets visuels — présentation Place des Montres

Captures pour les slides avant/après.

## Inventaire

| Fichier | Description | Date |
|---|---|---|
| `avant-accueil-prestashop.png` | Accueil placedesmontres.fr (PrestaShop) | 25/06/2026 |
| `apres-accueil-plateforme.png` | Accueil plateforme (démo locale) | 25/06/2026 |
| `apres-collection-plateforme.png` | Page collection avec filtres et promos | 25/06/2026 |
| `apres-admin-plateforme.png` | Écran connexion admin | 25/06/2026 |

## Rafraîchir les captures « après »

```powershell
cd d:\Github\watch-ecommerce
$env:SITE_ID = "place-des-montres"
npm run dev
```

Puis capturer http://localhost:5173/ et sous-pages. Une fois `recette.placedesmontres.fr` en ligne, refaire les captures sur l'environnement de recette pour plus de crédibilité client.
