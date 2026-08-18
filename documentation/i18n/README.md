# Multilingue (fr / en / de)

Ce document explique comment un site devient multilingue, où vivent les textes et comment
ajouter ou corriger une traduction. Deux clients l'utilisent aujourd'hui : `sauvage-watches`
et `place-des-montres`. Les sites qui ne déclarent rien restent monolingues, sans aucun
changement de comportement.

## 1. Activer les langues d'un client

Dans `sites/<SITE_ID>/site.config.js` :

```js
i18n: {
  enabled: true,
  defaultLocale: 'fr',         // langue servie quand le navigateur ne dit rien d'exploitable
  locales: ['fr', 'en', 'de'],
},
```

Le client ne déclare que des **codes**. Les libellés du sélecteur, les formats de nombre et de
date (`Intl`) et les valeurs `og:locale` vivent une seule fois dans
`packages/base/src/i18n/locales.js` : ajouter une langue à un site tient en un mot.

Options facultatives :

| Clé | Défaut | Rôle |
| --- | --- | --- |
| `excludePathPrefixes` | `['/admin']` | Chemins jamais préfixés par une langue (le back-office reste en français). |
| `untranslatedRoutes` | `['/montre/', '/watch/', '/blog/']` | Routes dont le contenu vient de la base : canonique vers la langue par défaut, pas d'alternates `hreflang`. |
| `detect` | `{ storage: true, navigator: 'suggest' }` | `navigator: 'off'` désactive la détection par le navigateur. |
| `storageKey` | `<siteId>_locale_v1` | Clé `localStorage` du choix explicite. |
| `messages` | `{}` | Surcharges du catalogue d'interface, par langue. |

## 2. Deux familles de textes

**Les textes du client** vivent dans son manifest et se traduisent sur place :

```js
import { t } from '../../packages/base/src/site/i18nValue.js'

copy: {
  footerTagline: t({
    fr: 'Montres d’exception, sélectionnées à la main.',
    en: 'Exceptional watches, hand-picked.',
    de: 'Außergewöhnliche Uhren, handverlesen.',
  }),
  copyrightLine: '© 2026 Sauvage Watches',   // identique partout : chaîne simple
}
```

Une chaîne simple reste valide et sert pour les trois langues : **seul ce qui diffère se
déclare**. Une langue absente retombe sur `defaultLocale`, donc une traduction partielle
n'affiche jamais de vide.

`resolveSiteConfig()` aplatit l'arbre **une seule fois** au chargement : les composants lisent
`site.copy.footerTagline` comme une chaîne ordinaire et ignorent tout de l'i18n. C'est ce qui a
permis de rendre le manifest multilingue sans toucher aux ~60 composants qui le consomment.

**Les textes de l'interface** (codés dans les composants) vivent dans
`packages/base/src/i18n/messages/{fr,en,de}.js`, en clés plates et pointées :

```vue
<script setup>
import { t } from '@/i18n'
</script>

<template>
  <button>{{ t('cart.checkout') }}</button>
  <p>{{ t('collection.resultCount', { count: 3 }) }}</p>
</template>
```

Le français est la **source** : une nouvelle clé s'ajoute d'abord dans `fr.js`, puis dans les
deux autres. Pour un texte accordé en nombre, la valeur est un objet `{ one, other }` résolu par
`tc(clé, nombre)` — via `Intl.PluralRules`, car le français range 0 au singulier là où l'anglais
et l'allemand le rangent au pluriel.

Un client peut renommer une clé du socle sans dupliquer le catalogue :

```js
i18n: {
  messages: { en: { 'nav.language': 'Language' } },
},
```

## 3. Ce qui empêche les traductions de dériver

Deux tests, volontairement bloquants plutôt que de simples avertissements :

- `messages.test.js` — les trois langues déclarent **exactement** les mêmes clés, aucune valeur
  vide, mêmes formes plurielles et mêmes jetons `{count}`. Une traduction oubliée est un test
  rouge.
- `messageUsage.test.js` — toute clé `t('…')` employée dans un composant **existe** dans le
  catalogue. Une clé mal orthographiée s'affichait sinon telle quelle dans la page.

En développement, une clé absente écrit aussi un avertissement en console.

## 4. URLs et référencement

La langue par défaut garde des URLs propres (`/collection`) ; les autres sont préfixées
(`/en/collection`, `/de/collection`).

Le préfixe est porté par la **base d'historique de vue-router**, pas par la table de routes :
vue-router le retire des URLs entrantes et le remet sur chaque lien résolu. Conséquence pratique :
les routes de `appRouteMeta.js` et tous les `<RouterLink>` existants fonctionnent à l'identique
dans les trois langues, sans réécriture. Le contrat est verrouillé par
`packages/base/src/i18n/routerLocaleBase.test.js`.

Deux pièges à connaître :

- Une ancre brute `<a href="/collection">` **contourne** la base et retombe silencieusement en
  français. Utiliser `RouterLink`.
- `route.fullPath` est dépréfixé. Pour une URL absolue (canonique, `og:url`, JSON-LD), passer par
  `CANONICAL_BASE_URL` ou `localizedUrl()` de `@/config`. `BASE_URL` reste l'origine nue, pour les
  ressources et l'URL de l'organisation, qui ne doivent pas être préfixées.

Le reste suit automatiquement : `useLocaleHead()` émet `<html lang>`, les alternates `hreflang`
et `x-default`, `api/sitemap.js` liste chaque page statique dans les trois langues, et le build
écrit une coquille par langue (`dist/en/index.html`) que le pré-rendu décline sur chaque route.

## 5. Détection et changement de langue

Ordre de résolution : **préfixe d'URL → choix mémorisé → `navigator.languages` → `defaultLocale`**.

La détection choisit la langue **rendue** mais ne redirige jamais d'elle-même : une URL non
déterministe pour un robot d'indexation contredirait la canonique que la page vient d'émettre.
Un visiteur germanophone arrivant sur `/` voit donc l'allemand à l'URL française, avec le
sélecteur et les alternates pour rejoindre `/de/`.

Changer de langue déclenche une **navigation complète**, assumée : le manifest est un singleton
capturé au montage par une soixantaine de composants, et la base d'historique est figée à la
création du routeur. Rendre tout le manifest réactif coûterait bien plus que le rechargement
occasionnel d'une action rare et explicite. Le panier et le consentement survivent
(`localStorage`).

## 6. Ce qui reste en français, volontairement

| Quoi | Pourquoi |
| --- | --- |
| Back-office (`/admin`) | Hors périmètre : interface interne, jamais préfixée ni traduite. |
| Contenu de la base (fiches montre, articles) | Non traduit ; leur canonique pointe vers la langue par défaut. |
| Pages légales (politique de confidentialité, mentions, CGU/CGV) | Textes engageants : une traduction doit être relue par le client ou son conseil avant publication. |
| Contenus longs de `place-des-montres` (réponses FAQ, « Nos services », Guide de l'horloger) | Mentionnent prix, délais et garanties : même exigence de relecture. |
| Chemins d'URL (`/collection`, `/montre/:slug`) | Les traduire casserait les liens existants et les redirections SEO. |

## 7. Ajouter une langue au socle

1. Ajouter le code dans `SUPPORTED_LOCALES` et les tables de `packages/base/src/i18n/locales.js`.
2. Créer `packages/base/src/i18n/messages/<code>.js` en miroir de `fr.js` (`messages.test.js`
   dira exactement ce qui manque).
3. L'ajouter à `i18n.locales` du ou des clients concernés.
