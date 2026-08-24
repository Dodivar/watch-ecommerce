# Présentation commerciale — Place des Montres

Livrables pour le rendez-vous client [placedesmontres.fr](https://www.placedesmontres.fr).

## Fichiers

| Fichier | Usage |
|---|---|
| [brochure-commerciale.pdf](brochure-commerciale.pdf) | **Brochure commerciale A4 (10 pages)** — à envoyer ou remettre au client |
| [brochure-commerciale.html](brochure-commerciale.html) | Source de la brochure (HTML print A4, images dans `assets/`) |
| [presentation-slides.md](presentation-slides.md) | Source du deck 18 slides (Marp) |
| [presentation-slides.pdf](presentation-slides.pdf) | Export PDF prêt à présenter |
| [presentation-slides.pptx](presentation-slides.pptx) | Export PowerPoint |
| [guide-demo.md](guide-demo.md) | Parcours démo 45 min + checklist + objections |
| [fiche-recap-one-pager.md](fiche-recap-one-pager.md) | Fiche 1 page à imprimer et remettre au client |
| [assets/](assets/) | Captures avant/après + graphiques (`assets/charts/`) pour les slides |
| `contractuel/` *(local, hors dépôt)* | **Pack contractuel** — SLA, sauvegarde, DPA, réversibilité, accessibilité, dossier de preuves, grille TCO |

## Regénérer la brochure PDF

La brochure est une page HTML calibrée A4 (`brochure-commerciale.html`), rendue avec Chromium :

```bash
# via Playwright (page.pdf, format A4, printBackground, preferCSSPageSize)
node -e "
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/documentation/commercial/place-des-montres/brochure-commerciale.html', { waitUntil: 'networkidle' });
  await p.pdf({ path: 'documentation/commercial/place-des-montres/brochure-commerciale.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
"
```

> **Positionnement (règle actuelle) :** le socle technique **est** mutualisé entre plusieurs
> clients, et cela s'assume — c'est ce qui fait que la migration coûte 4 900 € et non 40 000 €.
> Ce qui est **dédié** à Place des Montres : son backend, sa base de données, ses secrets, son
> compte Stripe. Formuler « socle éprouvé et mutualisé, runtime et données dédiés », jamais
> « votre site dédié » seul, qui laisse croire à un développement exclusif.
>
> L'ancienne consigne de discrétion sur la mutualisation est abandonnée : un client qui le
> découvre après signature perd confiance, alors que le même fait énoncé le premier devient une
> preuve de sérieux. Élément de langage complet dans
> `contractuel/README.md` (local).

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

Si Marp échoue faute de Chromium (`Could not find Chrome`), réutiliser celui de Playwright déjà
installé pour les tests e2e :

```bash
CHROME_PATH="$(node -e "const{chromium}=require('playwright-core');console.log(chromium.executablePath())")" npx @marp-team/marp-cli documentation/commercial/place-des-montres/presentation-slides.md --pdf --allow-local-files
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
- Abonnement : **249 € HT / mois** (2 h support, incident critique pris en charge sous 4 h ouvrées)
- Engagement : 12 mois recommandé

Ajuster ces montants dans `presentation-slides.md`, `fiche-recap-one-pager.md` **et
`contractuel/01-conditions-de-service.md` (local)** si besoin — les trois doivent concorder, le client
les lit ensemble.
