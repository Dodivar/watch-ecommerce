# Carte boutique (Leaflet + OpenStreetMap)

Le composant [`packages/base/src/components/StoreLocationMap.vue`](../packages/base/src/components/StoreLocationMap.vue) affiche une carte centrée sur la boutique. La position et les libellés viennent du manifest du site actif : `sites/<SITE_ID>/site.config.js`, clé **`storeMap`**.

## Configuration par site (`storeMap`)

Exemple :

```js
storeMap: {
  enabled: true,
  center: { lat: 48.58185, lng: 7.74875 },
  zoom: 16,
  markerLabel: "Nom affiché sur le marqueur",
  // optionnel — tuiles et attribution personnalisées (ex. Mapbox, MapTiler)
  // tileLayerUrl: 'https://api.mapbox.com/styles/v1/...',
  // attribution: '&copy; Mapbox …',
},
```

- **`enabled`** : masque la section « Nous trouver » sur `/a-propos` si `false`.
- **`center`** : latitude / longitude (nombres décimaux WGS84).
- **`zoom`** : niveau de zoom Leaflet (souvent 15–17 pour une rue en France).
- **`markerLabel`** : titre du popup (l’adresse est complétée depuis `contact.footerAddressHtml` ou `legal.address`).

Pour obtenir `lat` / `lng` à partir d’une adresse : géocoder une fois (outil cartographique, ou [Nominatim](https://nominatim.org/) en respectant leur politique d’usage), puis copier les coordonnées dans le manifest.

---

## OpenStreetMap (cas par défaut)

- **Clé API** : aucune pour les tuiles OSM standard utilisées dans un site vitrine à trafic raisonnable.
- **Obligations** : conserver l’**attribution** OpenStreetMap (déjà gérée par le composant et les tuiles Leaflet).
- **Politique** : respecter les règles d’usage des serveurs de tuiles OSM ([Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)) — pas de charge abusive, pas de détournement pour de grosses apps mobiles, etc.

Aucune variable d’environnement Vite n’est requise pour ce mode.

---

## Alternatives avec clé API

### Mapbox (tuiles ou style vectoriel)

1. Créer un compte sur [mapbox.com](https://www.mapbox.com/).
2. Tableau de bord → **Tokens** → créer un jeton avec **restrictions d’URL** (domaine de production + `http://localhost:5173` pour le dev).
3. Construire l’URL de tuiles ou de style selon la doc Mapbox et la renseigner dans `storeMap.tileLayerUrl`, avec `storeMap.attribution` adaptée.
4. Exposer le jeton côté front uniquement si nécessaire : variable **`VITE_…`** dans `.env` (non commitée), injectée dans l’URL des tuiles si la doc Mapbox l’exige.

### Google Maps (JavaScript API)

1. [Google Cloud Console](https://console.cloud.google.com/) → activer **Maps JavaScript API**.
2. Créer une **clé API** avec restrictions de référent HTTP (domaines du site).
3. La facturation est en général requise ; vérifier les crédits et quotas en vigueur.
4. L’intégration n’utilise pas Leaflet : il faudrait un composant dédié Google Maps, distinct de `StoreLocationMap.vue`.

### Autres fournisseurs (MapTiler, Stadia, etc.)

Même principe : compte → clé → restrictions par domaine → `tileLayerUrl` + `attribution` dans `storeMap`.

---

## Page d’intégration

La section **Nous trouver** sur `/a-propos` est dans [`packages/base/src/components/APropos.vue`](../packages/base/src/components/APropos.vue) et s’affiche si `storeMap.enabled` est vrai et que `storeMap.center` est défini.

Pour réutiliser la carte ailleurs : importer `StoreLocationMap` et passer des props optionnelles (`center`, `zoom`, `markerLabel`, …) pour surcharger le manifest.
