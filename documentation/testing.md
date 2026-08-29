# Tests

> Ce document a été reconstitué à partir de `vitest.config.mjs`, `playwright.config.js` et du
> contenu de `tests/`. Si tu disposes d'une version locale antérieure plus riche, fusionne-la :
> git refusera d'écraser un fichier non suivi, donc rien n'est perdu.

Deux suites : **Vitest** (unitaire + contrats, ~1 100 tests) et **Playwright** (end-to-end sur le
tunnel d'achat). Les deux sont **hermétiques** : aucun appel réseau réel, aucune clé nécessaire.

## Commandes

```sh
npm test                 # toute la suite Vitest (ce que lance la CI)
npm run test:watch       # Vitest en mode watch
npm run test:unit        # uniquement packages/base/src/site
npm run test:contracts   # uniquement les contrats sur les site.config.js
npm run test:e2e         # Playwright
npm run test:e2e:ui      # Playwright en mode interactif
npm run test:e2e:report  # rouvrir le dernier rapport HTML
```

`npm install` est un prérequis : `node_modules` n'est pas versionné.

## Où vivent les tests

| Emplacement | Contenu |
| --- | --- |
| `packages/base/**/*.test.js` | Test **à côté du module qu'il couvre** — c'est la convention par défaut (l'essentiel est sous `packages/base/src/site/`) |
| `tests/base/` | Tests transverses du socle (pricing, pagination, campagnes promo) |
| `tests/backend/` | Routes et logique Express : commandes, paiements, e-mails, newsletter, avis, registry multi-tenant |
| `tests/api/` | Fonctions serverless Vercel (`sitemap`) |
| `tests/contracts/` | **Contrats sur tous les `site.config.js`** — voir ci-dessous |
| `tests/scripts/` | Import PrestaShop |
| `tests/e2e/` | Playwright ([README dédié](../tests/e2e/README.md)) |
| `tests/fixtures/`, `tests/helpers/` | Manifests factices et utilitaires partagés |

Vitest ramasse `packages/base/**/*.test.js` et `tests/**/*.test.js`.

## Vitest : l'environnement de test

Trois points expliquent la configuration (`vitest.config.mjs`) :

- **Alias `@site-config` → `tests/fixtures/stub-site-config.js`.** Les tests ne dépendent d'aucun
  client réel ; pour tester un manifest précis, l'importer explicitement.
- **Variables Supabase factices** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) injectées par la
  config : certains services les exigent au chargement du module, et la CI ne fournit pas de
  `.env`.
- **`--no-experimental-webstorage`** passé aux workers *seulement* sur Node ≥ 22.4. Node expose
  depuis cette version un `localStorage` natif qui masque celui de happy-dom ; sur une version
  antérieure, le flag n'existe pas et chaque worker planterait au démarrage.

## Les contrats de manifest

`tests/contracts/` est le garde-fou du multi-site : chaque `sites/*/site.config.js` est résolu par
`resolveSiteConfig()` puis comparé à un **snapshot** (`tests/contracts/__snapshots__/`).

Conséquence pratique : **toute modification d'un manifest ou de la logique de résolution fait
échouer un snapshot.** C'est voulu — le diff montre exactement quelles features, quelles routes et
quelles sections d'accueil changent pour chaque client.

Si le diff est celui attendu, régénérer :

```sh
npx vitest run tests/contracts --update
```

Ne jamais régénérer sans avoir lu le diff : c'est le seul endroit où une régression de
configuration client devient visible.

## Playwright

Périmètre : le tunnel d'achat, de la fiche produit au retour de paiement, plus la collection, la
recherche, la gestion du panier, les langues et les événements analytics.

Deux vitrines couvertes, chacune avec son propre serveur de dev :

| Projet | Site | Port (`E2E_PORT*`) | Spécificité |
| --- | --- | --- | --- |
| `sauvage-watches` | défaut | 5173 | tunnel de référence |
| `place-des-montres` | `tests/e2e/place-des-montres/` | 5174 | panier multi-quantité |

Hermétisme : les variables Supabase et Stripe sont factices, tout le trafic réseau est intercepté
côté navigateur (`tests/e2e/support`), les identifiants de mesure sont vidés pour qu'aucun script
tiers ne se charge — les événements restent observables dans `window.dataLayer`, ce que vérifie
`analytics.spec.js`. La clé Stripe est laissée vide : le tunnel est vérifié jusqu'au montant
final, sans monter le Payment Element.

En CI : `retries: 1`, un seul worker, rapports `list` + HTML. En local : aucun retry.

**Le navigateur est déjà installé** dans les environnements Claude Code (`PLAYWRIGHT_BROWSERS_PATH`) :
ne pas lancer `playwright install`.

## Intégration continue

`.github/workflows/test.yml` — sur chaque push et chaque PR : Node 22, `npm ci`, `npm test`.
Playwright n'est pas lancé en CI ; il se lance à la main avant une modification du tunnel d'achat.

## Quand écrire un test

- **Toujours** avant une PR touchant `packages/base` ou `sites/*` : au minimum `npm test`.
- Nouvelle logique de résolution de manifest → un `*.test.js` à côté du module dans
  `packages/base/src/site/`.
- Nouveau feature flag ou nouvelle route → vérifier que `buildAppRoutes.test.js` et les contrats
  reflètent le changement.
- Nouveau client → `npm run test:contracts` génère son snapshot ; le relire avant de le committer.
- Modification du tunnel d'achat → `npm run test:e2e`.
