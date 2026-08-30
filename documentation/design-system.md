# Design system — comment l'aspect d'une vitrine est défini

Aucune couleur, police ou arrondi n'est codé en dur dans les composants. Chaque vitrine décrit
des **tokens** dans son manifest ; le build les transforme en variables CSS ; Tailwind les expose
en utilitaires. Changer l'identité visuelle d'un client, c'est éditer `theme` dans
`sites/<SITE_ID>/site.config.js` — jamais retoucher `packages/base`.

## Chaîne de transformation

```
sites/<SITE_ID>/site.config.js         theme: { colorScheme, colors, surfaces, typography, radius }
              │
              ▼
vite/site-from-config.mjs              buildThemeCss() → @font-face + :root { --color-*, --font-*, --radius-* }
              │                        transformIndexHtml() → <html data-ui-color-scheme="dark"> si colorScheme === 'dark'
              ▼
tailwind.config.js                     theme.extend lit les variables
              │
              ▼
composants                             bg-primary, text-text-main, bg-cream-200, rounded-lg, font-heading…
```

Le CSS est servi par un module virtuel (`virtual:site-theme.css`) : il n'existe aucun fichier de
thème par client à maintenir.

## Tokens disponibles

### Couleurs — `theme.colors`

| Clé manifest | Variable CSS | Utilitaire Tailwind |
| --- | --- | --- |
| `primary` | `--color-primary` | `bg-primary`, `text-primary`, `border-primary` |
| `primaryHover` | `--color-primary-hover` | `bg-primary-hover` |
| `cream` | `--color-cream` | `bg-cream` |
| `cream100` / `cream200` / `cream300` | `--color-cream-100…300` | `bg-cream-100`, `bg-cream-200`, `bg-cream-300` |
| `textMain` | `--color-text-main` | `text-text-main` |
| `textOnDark` | `--color-text-on-dark` | — (défaut `#ffffff`) |
| `browserChrome` | `<meta name="theme-color">` | — (barre du navigateur mobile) |

### Surfaces — `theme.surfaces` (optionnel)

Quatre plans de page : fond, bande alternée, panneau posé sur la bande, filet de séparation.

| Clé | Variable CSS | Défaut si absent |
| --- | --- | --- |
| `page` | `--color-page` | `colors.cream` |
| `pageAlt` | `--color-page-alt` | `colors.cream100` |
| `pageRaised` | `--color-page-raised` | `colors.cream200` |
| `pageLine` | `--color-page-line` | `colors.cream300` |

Sans ce bloc, un site retombe donc sur ses beiges — aucun changement pour un thème clair.

### Typographie — `theme.typography`

Défauts du socle dans `packages/base/src/site/defaultTypography.js` (HK Grotesk + Poppins).
Trois rôles : `sans` (corps), `heading` (h1/h2), `subheading` (h3/h4, par défaut la pile `sans`
en graisse 800). Chaque rôle liste ses `faces` (`weight`, `style`, `file`) ; les fichiers `.woff2`
sont servis depuis `sites/<SITE_ID>/public/fonts/` (`fontsPath`, défaut `/fonts/`).

Produit : `--font-sans`, `--font-heading`, `--font-subheading`, `--font-heading-weight`,
`--font-subheading-weight` → utilitaires `font-sans`, `font-heading`.
Les `@font-face` sont générés automatiquement en `font-display: swap`.

Résolution : `packages/base/src/site/resolveTypography.js`.

### Arrondis — `theme.radius`

Trois écritures acceptées (`packages/base/src/site/resolveVisual.js`) :

- absent ou `'rounded'` → échelle Tailwind v3 par défaut (`defaultVisual.js`) ;
- `'sharp'` → tout à `0` sauf `full` (angles vifs) ;
- objet → surcharge clé par clé du défaut.

Produit `--radius-sm` … `--radius-full` → `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`…
Un preset inconnu lève une erreur au build : c'est voulu.

## Thème sombre (`colorScheme: 'dark'`)

`theme.colorScheme: 'dark'` pose `data-ui-color-scheme="dark"` sur `<html>` et active
`packages/base/src/assets/theme-dark.css`.

Le parti pris (documenté en tête du fichier) : le fond de page est sombre sur tout le site, et le
contenu est posé sur des **surfaces claires** (cartes, formulaires, modales). Plutôt que de
retoucher la centaine de composants, les utilitaires neutres de Tailwind (`bg-white`, `bg-cream*`,
`text-gray-*`, `border-gray-*`, `bg-primary`…) sont réécrits pour lire des variables `--ui-*`
décrivant le **contexte** de la surface courante :

- contexte « sur fond sombre » — valeur par défaut sous `data-ui-color-scheme="dark"` ;
- contexte « sur surface claire » — reposé par toute surface claire (`.bg-white`, champs de
  formulaire, aplats teintés des messages d'état).

Les variables CSS étant héritées, une carte claire remet automatiquement tout son contenu (gris,
filets, boutons) dans ses valeurs d'origine : aucune cascade à maintenir composant par composant.

**Conséquence pratique** : pour styliser un composant, utiliser les utilitaires Tailwind neutres
habituels. Ils sont déjà traduits dans les deux contextes. N'écrire une règle explicite
`html[data-ui-color-scheme='dark'] …` qu'en dernier recours.

Tout le fichier est préfixé par ce sélecteur : les sites au thème clair ne sont pas concernés.

## CSS global

- `packages/base/src/assets/main.css` — Tailwind, reset, comportements globaux (scroll fluide,
  fonds de formulaires forcés en clair pour éviter le style sombre natif du navigateur, safe
  areas iOS).
- `packages/base/src/assets/theme-dark.css` — voir ci-dessus.
- `packages/base/src/animation.js` — animations partagées ; `useTiltMotion`,
  `useImagePinchZoom`, `useWatchImageSwipe` pour les interactions produit.

## Assets de marque

Logos et visuels d'accueil vivent sous `sites/<SITE_ID>/src/assets/` (alias `@site/*`), pas dans
le socle. Polices, favicons et PDF publics sous `sites/<SITE_ID>/public/`.
Conventions de nommage et d'optimisation : [`packages/base/src/assets/README.md`](../packages/base/src/assets/README.md).

## Ajouter un token

1. L'ajouter au manifest d'un site (`theme.…`).
2. L'émettre dans `buildThemeCss()` (`vite/site-from-config.mjs`).
3. L'exposer dans `tailwind.config.js` → `theme.extend`.
4. Prévoir un défaut dans `defaultVisual.js` / `defaultTypography.js` pour les sites qui ne le
   déclarent pas, et couvrir la résolution par un test dans `packages/base/src/site/`.
