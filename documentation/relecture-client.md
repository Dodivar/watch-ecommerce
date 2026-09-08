# Relecture client — commenter le site directement dans la page

Objectif : qu'un relecteur (client, associé, graphiste) parcoure le site **tel qu'il est en
ligne**, clique sur un titre, une image ou une section, et laisse un commentaire épinglé à cet
endroit précis — sans capture d'écran, sans e-mail de recopie, sans jamais toucher au code.

Le site s'appuie pour cela sur la **barre Vercel** et ses commentaires de déploiement, déjà
inclus dans le plan Vercel du projet. Chaque fil retient la page, la position dans la mise en
page, le navigateur et la taille d'écran du relecteur.

## Ce que le dépôt ajoute

Vercel affiche cette barre d'office sur les *previews* de branche, mais pas en production :
c'est au site de l'injecter. C'est le rôle de
[`packages/base/src/services/review/vercelToolbar.js`](../packages/base/src/services/review/vercelToolbar.js),
appelé une fois au démarrage dans `packages/base/src/main.js`.

Le script n'est chargé que si **les deux conditions** sont réunies :

1. le projet Vercel est identifié par `VITE_VERCEL_TOOLBAR_OWNER_ID` et
   `VITE_VERCEL_TOOLBAR_PROJECT_ID` (un projet Vercel par client, donc des valeurs par
   déploiement) ;
2. le visiteur a demandé le mode relecture avec `?relecture=1`.

Le choix est mémorisé dans le navigateur : la barre suit le relecteur de page en page, et
`?relecture=0` en sort. Le script porte `data-explicit-opt-in`, ce qui veut dire qu'il ne
s'affiche que pour un compte Vercel ayant accès au projet : un visiteur qui tomberait sur le
paramètre ne voit rien et n'est jamais invité à se connecter.

**Aucun cookie de mesure n'est posé** : ce chargement ne relève pas du bandeau de consentement,
contrairement à `googleAnalytics.js` ou `metaPixel.js`.

## Mise en service, une fois par client

1. **Récupérer les deux identifiants** dans Vercel : `Project ID` sous *Project → Settings →
   General*, et `Team ID` (ou identifiant de compte) sous *Account/Team → Settings → General*.
   Ce ne sont pas des secrets : ils figurent dans la page servie au relecteur.
2. **Les déclarer dans le projet Vercel du client** (*Settings → Environment Variables*), pour
   les environnements Production et Preview :

   | Variable | Valeur |
   | --- | --- |
   | `VITE_VERCEL_TOOLBAR_OWNER_ID` | `team_…` |
   | `VITE_VERCEL_TOOLBAR_PROJECT_ID` | `prj_…` |
   | `VITE_VERCEL_TOOLBAR_BRANCH` | `main` (optionnel — range les fils sous une branche) |

3. **Redéployer** : les variables `VITE_*` sont lues au build, pas à l'exécution.
4. **Inviter le relecteur** depuis le tableau de bord Vercel (bouton *Share* du déploiement, ou
   le menu de la barre). Il devra créer un compte Vercel gratuit pour commenter.
5. **Lui envoyer le lien** `https://<domaine-du-client>/?relecture=1`.

## Côté relecteur

- Ouvrir le lien, se connecter à Vercel une fois.
- Cliquer l'icône de commentaire dans la barre en bas de page, puis cliquer l'élément à
  commenter — le fil reste accroché à cet endroit.
- Répondre, joindre une image, marquer un fil comme résolu.
- `?relecture=0` pour revenir à un affichage normal.

## Limites connues

- **Plan Hobby : un seul collaborateur invité à la fois.** Pour plusieurs relecteurs en
  parallèle, il faut passer le compte Vercel en Pro — ou construire un dispositif interne
  (commentaires stockés dans Supabase, listés dans l'admin), qui n'exige alors aucun compte.
- Le relecteur doit disposer d'un compte Vercel (gratuit) pour écrire.
- Si le site se dote un jour d'un en-tête `Content-Security-Policy`, il faudra y autoriser
  `vercel.live` (`script-src`, `connect-src`, `frame-src`, `style-src`, `img-src`, `font-src`) et
  `wss://ws-us3.pusher.com` en `connect-src`. Aucun en-tête de ce genre n'est défini
  aujourd'hui dans `vercel.json`.

## Relire les commentaires depuis Claude Code

Les fils sont lisibles par les outils Vercel de Claude Code (`list_toolbar_threads`,
`get_toolbar_thread`, `reply_to_toolbar_thread`, `change_toolbar_thread_resolve_status`). Une
session peut donc lire les retours du relecteur, appliquer les modifications, répondre dans le
fil et le marquer résolu — sans recopie manuelle.

## Alternative envisagée

Un widget de relecture maison (surcouche Vue, table Supabase `site_feedback`, écran dans
l'admin) lèverait les deux limites du plan Hobby : aucun compte à créer, autant de relecteurs
que voulu. Il n'a pas été retenu au premier tour, la barre Vercel couvrant le besoin sans code
à maintenir.
