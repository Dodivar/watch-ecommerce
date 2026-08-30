# Bannière de consentement cookies et traceurs

## Rôle

Le bandeau informe l’utilisateur de l’usage de traceurs et recueille son choix pour **deux finalités distinctes** :

| Finalité | Ce qu’elle couvre | Clé |
|---|---|---|
| **Mesure d’audience** | Google Analytics 4 : pages vues et événements du tunnel d’achat | `analytics` |
| **Publicité** | Google Ads (tag de conversion) et pixel Meta (Facebook, Instagram) | `marketing` |

Elles sont séparées parce qu’elles n’ont pas le même objet : comprendre l’usage du site d’un côté, rattacher une vente à une campagne et cibler de l’autre. Un pixel publicitaire posé sous la case « mesure d’audience » serait un manquement.

Le choix est **enregistré localement** et **conditionne le chargement des scripts** : aucune requête vers Google ou Meta n’est faite tant qu’aucune des deux finalités n’est acceptée.

Voir [analytics-ecommerce.md](./analytics-ecommerce.md) pour les événements réellement envoyés.

Les textes affichés doivent rester alignés avec la [ligne éditoriale Sauvage Watches](./ligne-editoriale.md).

## Stockage

| Élément | Valeur |
|--------|--------|
| Mécanisme | `localStorage` |
| Clé | `integrations.cookieConsentStorageKey` du manifest (ex. `sauvage_cookie_consent_v1`) |
| Version du schéma | `2` (`version` dans le JSON) |
| Durée | **6 mois** (`180 * 24 * 60 * 60 * 1000` ms) à partir de `savedAt` |

Structure JSON enregistrée :

```json
{
  "version": 2,
  "analytics": true,
  "marketing": false,
  "savedAt": "2026-03-30T12:00:00.000Z"
}
```

Après expiration, le bandeau réapparaît et le comportement est celui d’un visiteur n’ayant pas encore tranché.

### Passage de v1 à v2

Un consentement `version: 1` (une seule case `analytics`) est **rejeté** : il ne couvre pas la finalité publicitaire, apparue avec la v2. Conséquence à annoncer au client lors de la mise en production : **le bandeau se réaffiche une fois pour tous les visiteurs**, et le compteur de 6 mois repart de zéro.

## Chargement des traceurs

Tout passe par `applyConsent` de la couche [`packages/base/src/services/analytics/`](../packages/base/src/services/analytics/) — le bandeau ne charge plus de script lui-même :

- **gtag.js** (`ensureGoogleAnalytics`) sert à la fois GA4 et Google Ads. Il est chargé dès qu’**une** des deux finalités est acceptée ; l’identifiant Ads n’est configuré que si `marketing` est accordé.
- **fbevents.js** (`ensureMetaPixel`) n’est chargé que si `marketing` est accordé.
- Le snippet statique a été **retiré de `index.html`** pour éviter tout envoi avant consentement.
- Les identifiants viennent de l’environnement Vite (`VITE_GA_ID`, `VITE_GOOGLE_ADS_ID`, `VITE_GOOGLE_ADS_PURCHASE_LABEL`, `VITE_META_PIXEL_ID`), exposés par [`packages/base/src/config.js`](../packages/base/src/config.js). Une variable absente désactive proprement la destination correspondante.
- Les changements de route SPA passent par `trackPageView` (`router.afterEach` dans `main.js`), qui vérifie lui-même les consentements.

### Consent Mode v2

`initAnalytics()` pousse, **avant tout chargement**, un `gtag('consent', 'default', …)` avec `ad_storage`, `ad_user_data`, `ad_personalization` et `analytics_storage` à `denied`, puis un `consent update` au choix de l’utilisateur. C’est une exigence de Google pour diffuser des campagnes Ads dans l’EEE.

L’implémentation retenue est le mode **« basic »** : gtag.js n’est pas chargé tant que rien n’est accepté. Le mode « advanced » (chargement systématique avec pings sans cookie) n’a pas été retenu — il revient à exécuter un script Google avant tout consentement.

## Interface

| Contexte | Comportement |
|----------|----------------|
| Desktop (`md:` et plus) | Bandeau fixe en **bas à droite**, sans assombrissement du reste du site ; zone hors carte en `pointer-events: none` pour ne pas bloquer la page. |
| Mobile | **Overlay plein écran** avec fond semi-opaque ; panneau centré, suffisamment grand pour une lecture et une action claires. Aucune fermeture au clic sur le fond : l’utilisateur doit utiliser un bouton. |
| Page `/maintenance` | Bandeau **masqué** (aligné sur l’absence du chrome principal). |

Un lien **Préférences cookies** dans le pied de page ([`src/App.vue`](../src/App.vue)) appelle `openCookiePreferences` ([`src/services/cookiePreferencesUi.js`](../src/services/cookiePreferencesUi.js)) : le bandeau se rouvre, les cases « Mesure d’audience » et « Publicité » dans Personnaliser sont préremplies selon le consentement encore valide (si présent).

Composant : [`src/components/CookieBanner.vue`](../src/components/CookieBanner.vue).

### Actions

- **Tout accepter** : `analytics: true`, `marketing: true`.
- **Tout refuser** : les deux à `false`, aucun script tiers chargé.
- **Personnaliser** : affiche une case par finalité — « Mesure d’audience » et « Publicité et mesure des campagnes » ; **Enregistrer mes choix** enregistre les deux booléens.

Accessibilité : le panneau expose `role="dialog"`, `aria-modal="true"` et un titre relié par `aria-labelledby`.

## Fichiers concernés

- [`src/services/cookieConsent.js`](../src/services/cookieConsent.js) — lecture / écriture / expiration
- [`src/services/cookiePreferencesUi.js`](../src/services/cookiePreferencesUi.js) — réouverture du bandeau depuis l’extérieur du composant (footer)
- [`src/services/googleAnalytics.js`](../src/services/googleAnalytics.js) — injection idempotente de gtag (GA4 + Ads)
- [`src/services/metaPixel.js`](../src/services/metaPixel.js) — injection idempotente du pixel Meta
- [`src/services/analytics/`](../packages/base/src/services/analytics/) — `initAnalytics`, `applyConsent`, Consent Mode, événements
- [`src/components/CookieBanner.vue`](../src/components/CookieBanner.vue)
- [`src/App.vue`](../src/App.vue) — montage du composant
- [`src/main.js`](../src/main.js) — `initAnalytics()` au boot ; `afterEach` pour les vues SPA
- [`index.html`](../index.html) — commentaire rappelant l’absence de snippet GA statique
