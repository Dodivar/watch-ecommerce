# Vitrines client — `sites/<SITE_ID>/`

Un dossier par client. Le manifest **`site.config.js`** décrit tout ce qui distingue une vitrine
d'une autre ; `packages/base` ne contient que du code qui vaut pour tous.

## Avant de modifier quoi que ce soit

1. **Identifier le `SITE_ID` actif** — mention de l'utilisateur, chemin ouvert, ou script npm
   (`dev:sauvage`, `dev:place`, `build:demo-store`). **Ne pas supposer `sauvage-watches`** :
   c'est seulement le défaut en dev si `SITE_ID` est absent.
2. **Lire le manifest complet** — `site.config.js` et ses imports locaux (`faq.config.js`,
   `homeSelections.config.js`, `services.config.js`, `guide.config.js`).
3. **Chercher la config avant le code** — si un texte, une couleur, une coordonnée ou un bloc
   d'accueil varie d'un client à l'autre, il appartient au manifest, pas à `packages/base`.

## Structure d'un site

| Fichier / dossier | Rôle |
| --- | --- |
| `site.config.js` | Manifest : `siteId`, `locale`, `theme`, `brand`, `contact`, `urls`, `social`, `copy`, `features`, `home`, `collection`, `navigation`, `checkout`, `seo`, `backend`, `integrations`, `googleReviews`, `legal`, `maintenance` |
| `index.html` | Point d'entrée ; le CSS de thème y est injecté au build |
| `main.js` | Bootstrap (importe le socle) |
| `src/` | Assets et éventuels composants propres au client — alias `@site/*` (**dossier obligatoire**) |
| `public/` | Polices (`fonts/`), favicons, PDF publics |
| `prestashop-import.mapping.json` | Mapping d'import catalogue, si migration depuis PrestaShop |

Gabarit de départ : [`_template/`](_template/README.md).

## Blocs sensibles du manifest

- **`features`** — active/désactive routes, menus et blocs. Défauts et commentaires par clé :
  `packages/base/src/site/siteFeatures.js`. Ne pas poser à la main les drapeaux **dérivés**
  (`faq`, `googleReviews`, `serviceLandings`, `watchReference`, `homeNouvelles`) : `resolveSiteConfig`
  les calcule et les remet à `false` si le bloc de contenu correspondant manque.
- **`home.sections`** — tableau ordonné d'ids ; ids reconnus dans
  `packages/base/src/site/homeSections.js`. Un id inconnu est ignoré (avertissement en dev).
  Tableau absent ou vide → accueil sans blocs.
- **`collection.displayMode`** — format du catalogue : `grid` (défaut), `list`, `showcase`
  ou `compact`. Valeurs et disposition dans `packages/base/src/site/collectionFilters.js`
  et `packages/base/src/constants/watchCollectionLayouts.js`. Une valeur inconnue retombe
  sur `grid` (avertissement en dev).
- **`theme`** — tokens visuels uniquement. Voir [documentation/design-system.md](../documentation/design-system.md).
- **`i18n`** — présence du bloc = site multilingue. Textes client via `t({ fr, en, de })`.
  Voir [documentation/i18n/README.md](../documentation/i18n/README.md).
- **`backend`** — URL du service Render et paramètres d'emails. Les secrets ne sont **jamais**
  dans le manifest : ils vivent en variables d'environnement `SITE_<ID>__<KEY>` côté Render.

## Après modification

`npm run test:contracts` vérifie tous les `site.config.js` (forme, cohérence des features,
snapshots). Un manifest invalide fait échouer la suite — c'est voulu.
