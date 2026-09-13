# Version déployée et détection de mise à jour

Comment savoir quelle version une vitrine sert, et comment un visiteur cesse d'en voir une
périmée.

## 1. Le problème que ça résout

Le socle n'a **pas de service worker** et ne découpe pas son bundle : tout le JavaScript est
dans un seul fichier haché, chargé une fois par l'`index.html`. Un onglet resté ouvert garde
donc indéfiniment le code qu'il a chargé — il ne redemande jamais rien au serveur tant que la
page n'est pas rechargée.

C'est la seule façon, sur ce socle, de voir une vitrine « pas à jour » alors que la production
l'est : un visiteur revenu sur son onglet de la semaine dernière ne verra ni les nouvelles
sections, ni les correctifs, et n'aura aucun moyen de s'en douter. Le diagnostic est d'autant
plus pénible que rien ne distingue, de l'extérieur, un onglet en retard d'un déploiement en
retard.

## 2. Le tampon de version

`vite/build-version.mjs` calcule une identité de build et la publie de deux façons :

| Sortie | Contenu | Rôle |
|---|---|---|
| `import.meta.env.VITE_APP_VERSION` | figée dans le bundle au build | la version que le code **est** |
| `/version.json` | fichier statique à la racine | la version qui est **déployée** |

```json
{
  "version": "147bec3bf087",
  "commit": "147bec3bf0879a076972eb46c2bd398d7f1b0905",
  "branch": "main",
  "builtAt": "2026-09-08T15:00:00.000Z",
  "siteId": "sauvage-watches"
}
```

`version` est la seule valeur comparée : le SHA court du commit (`VERCEL_GIT_COMMIT_SHA`, sinon
`git rev-parse HEAD`), ou à défaut un horodatage — jamais vide, sans quoi deux builds successifs
paraîtraient identiques.

**Vérifier une vitrine en production**, sans outil ni accès :

```bash
curl -s https://www.sauvage-watches.fr/version.json
```

Le `commit` renvoyé se compare directement à ce que porte la branche déployée. C'est aussi ce
qui permet de répondre à « le site est-il à jour ? » autrement que par une capture d'écran.

La même valeur est affichée en bas de la barre latérale du panel d'administration : demander à
quelqu'un « tu vois quelle version ? » ne nécessite plus qu'il ouvre une console.

## 3. La détection côté visiteur

`composables/useAppUpdate.js` compare la version du bundle chargé à celle de `/version.json`,
et `components/layout/AppUpdateBanner.vue` propose alors de recharger. Le bandeau est discret
et jamais bloquant : la page reste utilisable, le visiteur n'a rien demandé.

**Quand la comparaison a lieu** — au retour sur l'onglet (`visibilitychange`, `focus`) et au
montage, pas à intervalle serré. Le cas visé est l'onglet laissé ouvert des jours durant :
personne ne regarde pendant ce temps, et le réveiller toutes les cinq minutes ne ferait que
consommer de la batterie. Un relevé périodique subsiste, très espacé (30 min), pour l'onglet
réellement resté sous les yeux ; deux vérifications événementielles sont espacées d'au moins
5 minutes.

**Ce qui ne déclenche jamais le bandeau** : un `/version.json` illisible (hors ligne, ou
déploiement antérieur à ce dispositif, qui répond 404). Une version qu'on n'a pas pu lire ne
prouve rien, surtout pas qu'il faut recharger.

En développement et sous vitest, `VITE_APP_VERSION` est vide : la vérification ne s'arme pas
du tout.

## 4. Les en-têtes de cache

`vercel.json` pose deux règles, volontairement non chevauchantes :

- `/assets/(.*)` → `public, max-age=31536000, immutable`. Ces fichiers portent un hachage de
  contenu dans leur nom : un changement produit un nouveau nom, jamais une nouvelle version du
  même nom.
- `/version.json` → `no-store, max-age=0, must-revalidate`. Le manifeste doit toujours être
  frais, sans quoi la détection compare le bundle à une réponse mise en cache — et ne détecte
  plus rien. Le client ajoute en plus un paramètre horodaté à sa requête, pour les proxies qui
  ignorent l'en-tête.

**Pas de règle attrape-tout sur le HTML** : Vercel sert déjà les fichiers statiques HTML en
`public, max-age=0, must-revalidate`, ce qui est exactement le réglage voulu. Une règle
`/(.*)` chevaucherait les deux précédentes, et l'ordre de priorité entre règles de `headers`
qui se recouvrent n'est pas documenté — le risque de dégrader la mise en cache des assets ne
vaut pas la redondance.
