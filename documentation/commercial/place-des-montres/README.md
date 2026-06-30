# Présentation commerciale — Place des Montres

Livrables pour le rendez-vous client [placedesmontres.fr](https://www.placedesmontres.fr).

## Fichiers

| Fichier | Usage |
|---|---|
| [presentation-slides.md](presentation-slides.md) | Source du deck 18 slides (Marp) |
| [presentation-slides.pdf](presentation-slides.pdf) | Export PDF prêt à présenter |
| [presentation-slides.pptx](presentation-slides.pptx) | Export PowerPoint |
| [guide-demo.md](guide-demo.md) | Parcours démo 45 min + checklist + objections |
| [fiche-recap-one-pager.md](fiche-recap-one-pager.md) | Fiche 1 page à imprimer et remettre au client |
| [assets/](assets/) | Captures avant/après + graphiques (`assets/charts/`) pour les slides |

## Exporter les slides

### Option A — Marp for VS Code

1. Installer l'extension [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode)
2. Ouvrir `presentation-slides.md`
3. Exporter en PDF ou PPTX (palette de commandes → Marp: Export)

### Option B — CLI Marp

```bash
npx @marp-team/marp-cli documentation/commercial/place-des-montres/presentation-slides.md --pdf
npx @marp-team/marp-cli documentation/commercial/place-des-montres/presentation-slides.md --pptx
```

### Option C — Google Slides

Copier le contenu slide par slide depuis `presentation-slides.md` ; charte couleurs : primaire `#7c6300`, fond crème `#f9f7f1`, texte `#2c2412`.

## Captures d'écran

| Fichier | Source | Slide |
|---|---|---|
| `avant-accueil-prestashop.png` | placedesmontres.fr (PrestaShop) | 3, 10 |
| `apres-accueil-plateforme.png` | localhost:5173 (SITE_ID=place-des-montres) | 2, 10 |
| `apres-collection-plateforme.png` | localhost:5173/collection | 10 |
| `apres-admin-plateforme.png` | localhost:5173/admin/login | 11 |

> **Note :** `recette.placedesmontres.fr` renvoyait 503 au 25/06/2026 — réactiver le déploiement Vercel avant le RDV, ou utiliser la démo locale.

### Captures mobiles réelles (`assets/mobile/`)

Rendus réels du nouveau site en vue smartphone (iPhone, 390×844 @2x), utilisés sur la slide 6.

| Fichier | Source | Slide |
|---|---|---|
| `apres-accueil-mobile.png` | localhost:5173 — accueil, vue mobile | 6 |
| `apres-menu-mobile.png` | localhost:5173 — mega-menu « Nos montres » ouvert, vue mobile | 6 |

> **À compléter — « avant » mobile :** la capture mobile du site PrestaShop actuel (placedesmontres.fr) n'a pas pu être générée depuis l'environnement (egress réseau bloqué). Pour un vrai avant/après côte à côte, ajouter `assets/mobile/avant-accueil-mobile.png` (capture de `www.placedesmontres.fr` en vue mobile) ; la slide 6 pourra alors afficher les deux colonnes.

## Graphiques (slides mobile)

Graphiques vectoriels SVG dans `assets/charts/`, éditables directement (valeurs en clair) et reflétant des **ordres de grandeur de benchmarks e-commerce FR/EU** (à actualiser si vous disposez de chiffres plus récents).

| Fichier | Slide | Donnée |
|---|---|---|
| `mobile-share.svg` | 5 | Part des ventes e-commerce sur mobile (2020 → 2026) |
| `cart-abandonment.svg` | 7 | Taux d'abandon panier par appareil |
| `load-time.svg` | 7 | Probabilité de rebond mobile selon le temps de chargement |
| `payment-methods.svg` | 8 | Répartition des moyens de paiement (FR) |

## Grille tarifaire

Voir slides 16–17 dans `presentation-slides.md` :

- Migration : **4 900 € HT**
- Abonnement : **249 € HT / mois** (2 h support, réponse 4 h ouvrées)
- Engagement : 12 mois recommandé

Ajuster ces montants dans `presentation-slides.md` et `fiche-recap-one-pager.md` si besoin.
