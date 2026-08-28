# Avis Google

Affichage des derniers avis de la fiche Google Business d'un client : section `avisGoogle` sur la
page d'accueil, note dans la bulle de la carte et bloc d'avis sous la carte de la page Contact.

La fonctionnalité est **éteinte par défaut**. Elle ne s'allume que pour un site dont le manifest
déclare un `placeId` et dont le backend possède une clé Google serveur. Tant que l'une des deux
manque, l'endpoint répond `503` et les blocs disparaissent — aucune page n'est dégradée.

## 1. Comment ça marche

```
navigateur ──GET /api/reviews──▶ backend Render ──Places API (New)──▶ Google
                                  cache mémoire 6 h
```

Le navigateur n'appelle jamais Google directement, pour deux raisons :

- **le coût.** Le champ `reviews` relève du SKU « Place Details Enterprise + Atmosphere », facturé
  à l'appel (~25 $ / 1 000 requêtes, ~1 000 requêtes offertes par mois). Un appel par visiteur
  serait facturé ; avec un cache de 6 h partagé par tous les visiteurs, un site consomme
  **~4 appels par jour**, soit ~120 par mois pour trois langues — largement dans le quota gratuit.
- **la clé.** `VITE_GOOGLE_PLACES_API_KEY` (carte boutique, autocomplétion checkout) est restreinte
  par référent HTTP : elle ne fonctionne pas depuis un serveur. Il faut une **seconde clé**, qui ne
  doit jamais atteindre le navigateur.

L'API plafonne à **5 avis par fiche**. Ils sont classés par pertinence côté Google ; le backend les
retrie par date décroissante pour tenir la promesse « les derniers avis ».

## 2. Activer un client

### a. Récupérer le Place ID

Le Place ID est de la forme `ChIJN1t_tDeuEmsRUsoyG83frY4`. L'identifiant hexadécimal (`0x…:0x…`)
présent dans une URL Google Maps partagée n'en est **pas** un et n'est pas accepté par l'API.

Le récupérer avec le [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
de Google : chercher l'établissement, copier l'identifiant affiché sous le nom.

### b. Créer la clé serveur

Dans Google Cloud Console, sur le projet du client :

1. Activer **Places API (New)**.
2. Créer une clé API dédiée (ne pas réutiliser celle du front).
3. Restriction d'application : **adresses IP**, avec les IP sortantes du service Render.
4. Restriction d'API : **Places API (New)** uniquement.

### c. Déclarer la configuration

Manifest `sites/<SITE_ID>/site.config.js` :

```js
googleReviews: {
  enabled: true,
  placeId: 'ChIJ…',
  maxReviews: 5,
},
```

Puis ajouter l'id de section à l'accueil :

```js
home: {
  sections: [/* … */, 'avisGoogle', /* … */],
},
```

### d. Déclarer le secret

Côté Render, variable d'environnement du service backend :

```
SITE_<UPPER_SNAKE_SITE_ID>__GOOGLE_PLACES_API_KEY=…
```

Exemple : `SITE_PLACE_DES_MONTRES__GOOGLE_PLACES_API_KEY`. Aucun redéploiement du front n'est
nécessaire pour la clé ; le manifest, lui, est lu au build.

## 3. Réglages globaux

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `REVIEWS_CACHE_TTL_MS` | `21600000` (6 h) | Durée du cache mémoire. C'est ce qui rend la fonctionnalité gratuite. |
| `REVIEWS_TIMEOUT_MS` | `5000` | Timeout de l'appel Places. |
| `REVIEWS_RATE_LIMIT_MAX` | `60` | Requêtes par IP et par minute sur `/api/reviews`. |

Le cache vit dans le process Render (un seul process long-vivant, contrairement aux lambdas
Vercel). Il est cloisonné par site **et par langue**, et le mécanisme est *single-flight* : dix
visiteurs simultanés sur un cache froid ne déclenchent qu'un seul appel Google.

Si Google est injoignable, le dernier payload valide est resservi (`stale: true`) plutôt que de
vider la section. Sans cache disponible, l'endpoint répond `502` et les blocs disparaissent.

## 4. Contraintes à respecter

- **Cache ≤ 30 jours.** Les CGU Google Maps Platform interdisent de conserver le contenu Places
  au-delà ; seul le `placeId` est stockable indéfiniment. Ne jamais persister les avis en base :
  le cache mémoire, volatil, est le bon endroit. Ne pas monter `REVIEWS_CACHE_TTL_MS` au-delà de
  `2592000000`.
- **Attribution obligatoire.** Nom et photo de l'auteur, lien vers son profil, et mention de la
  source. Elle est portée par `GoogleReviewsBlock.vue` (`reviews.poweredByGoogle`) — ne pas la
  retirer.
- **Pas de mélange de sources.** Les avis Google ne doivent pas être fondus dans un bloc qui
  agrège d'autres plateformes.
- **Pas de balisage `aggregateRating`.** Google interdit de baliser en JSON-LD des avis collectés
  sur une plateforme tierce comme s'ils étaient les siens. `buildGlobalStructuredData.js` reste
  volontairement inchangé.

## 5. Vérifier

```bash
# Backend seul
npm run server
curl -s -H 'X-Site-Id: place-des-montres' http://localhost:3000/api/reviews | jq

# Sans clé ni placeId → 503 attendu, section masquée côté front.
# Avec la configuration complète → { "success": true, "data": { … }, "cached": false }
# Le second appel doit répondre "cached": true.

# Front
npm run dev:place     # section sur /, bulle + bloc sur /contact
npm run dev:sauvage   # placeId vide → aucun changement visible
```

Tests automatisés : `tests/backend/reviews.test.js` (mapping, cache, TTL, stale, codes d'erreur),
`packages/base/src/site/googleReviews.test.js`,
`packages/base/src/components/reviews/GoogleReviewsBlock.component.test.js`,
`packages/base/src/utils/buildStoreMapPopupHtml.test.js`.

## 6. Limites connues

- **5 avis maximum**, plafond de l'API. Pour en afficher davantage — ou pour répondre aux avis — il
  faudrait la Google Business Profile API : gratuite, mais elle exige la propriété de la fiche, un
  parcours OAuth et une demande de quota.
- **Pas de tri natif par date.** Places renvoie les avis « les plus pertinents » ; le tri par date
  s'applique donc à ces cinq-là, pas à l'ensemble des avis de la fiche.
- **Pas de rendu serveur.** Le build ne fait que recopier la coquille SPA
  (`scripts/prerender-static-routes.mjs`) : les avis sont chargés côté client et n'apparaissent pas
  dans le HTML initial. Sans conséquence SEO, puisqu'aucun balisage structuré n'est émis.
