# Présentation commerciale — Place des Montres

Livrables pour le rendez-vous client [placedesmontres.fr](https://www.placedesmontres.fr).

## Fichiers

| Fichier | Usage |
|---|---|
| [presentation-slides.md](presentation-slides.md) | Source du deck 12 slides (Marp) |
| [presentation-slides.pdf](presentation-slides.pdf) | Export PDF prêt à présenter |
| [presentation-slides.pptx](presentation-slides.pptx) | Export PowerPoint |
| [guide-demo.md](guide-demo.md) | Parcours démo 45 min + checklist + objections |
| [fiche-recap-one-pager.md](fiche-recap-one-pager.md) | Fiche 1 page à imprimer et remettre au client |
| [assets/](assets/) | Captures avant/après pour les slides |

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
| `avant-accueil-prestashop.png` | placedesmontres.fr (PrestaShop) | 3, 6 |
| `apres-accueil-plateforme.png` | localhost:5173 (SITE_ID=place-des-montres) | 2, 6 |
| `apres-collection-plateforme.png` | localhost:5173/collection | 6 |
| `apres-admin-plateforme.png` | localhost:5173/admin/login | 7 |

> **Note :** `recette.placedesmontres.fr` renvoyait 503 au 25/06/2026 — réactiver le déploiement Vercel avant le RDV, ou utiliser la démo locale.

## Grille tarifaire

Voir slide 11 dans `presentation-slides.md` :

- Migration : **4 900 € HT**
- Abonnement : **249 € HT / mois** (2 h support, réponse 4 h ouvrées)
- Engagement : 12 mois recommandé

Ajuster ces montants dans `presentation-slides.md` et `fiche-recap-one-pager.md` si besoin.
