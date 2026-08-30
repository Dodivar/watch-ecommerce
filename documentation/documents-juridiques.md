# Documents juridiques du site

Ce dépôt contient les pages publiques suivantes :

- [Mentions légales](../src/components/MentionsLegales.vue) — route `/mentions-legales`
- [Conditions générales d’utilisation](../src/components/ConditionsGeneralesUtilisation.vue) — route `/conditions-generales-utilisation`
- [Politique de confidentialité](../src/components/PolitiqueConfidentialite.vue) — route `/politique-confidentialite`

## Quand mettre à jour ces documents

**Toute évolution du site ou du traitement des données qui modifie ce qui est décrit légalement doit être reflétée dans les textes concernés**, puis la date de « dernière mise à jour » en tête de page doit être ajustée.

Révisez au minimum les documents impactés dans les cas suivants :

| Changement | Documents typiquement concernés |
|------------|----------------------------------|
| Nouveau sous-traitant ou outil collectant des données (analytics, CRM, chat, etc.) | Politique de confidentialité ; éventuellement CGU si l’usage du site change |
| Modification du bandeau cookies ou des finalités de cookies/traceurs | Politique de confidentialité ; documentation [banniere-cookies.md](banniere-cookies.md) |
| Nouveaux formulaires, champs collectés, ou canal de contact | Politique de confidentialité |
| Changement de prestataire de paiement ou du parcours d’achat | Politique de confidentialité ; CGU (commande, paiement, responsabilité) |
| Changement d’hébergeur, de nom de domaine, ou d’éditeur (société, SIRET, siège) | Mentions légales ; variables `VITE_PUBLIC_*` dans [`src/config.js`](../src/config.js) |
| Nouvelles fonctionnalités utilisateur (compte client, newsletter, avis, etc.) | CGU ; Politique de confidentialité |
| Évolution du statut juridique (forme sociale, capital, TVA, RCS) | Mentions légales ; variables d’environnement |

## Processus de révision

Lorsqu’une modification du produit, d’un prestataire ou du cadre juridique **impacte** ce qui est décrit dans les pages légales :

1. **Identifier** les fichiers concernés dans le tableau ci-dessus (une même évolution peut toucher plusieurs pages).
2. **Mettre à jour** le ou les composants Vue correspondants sous `src/components/` (`MentionsLegales.vue`, `ConditionsGeneralesUtilisation.vue`, `PolitiqueConfidentialite.vue`).
3. **Ajuster** la ligne « Dernière mise à jour » en tête de **chaque** page modifiée (format texte français recommandé, cohérent avec [`ligne-editoriale.md`](ligne-editoriale.md)).
4. **Vérifier** les liens visibles par l’utilisateur : pied de page dans `App.vue`, renvois croisés entre documents (ex. politique de confidentialité), et documentation associée si le flux cookies ou la config change ([`banniere-cookies.md`](banniere-cookies.md), `src/config.js`).
5. **Tracer** la décision dans l’outil d’équipe habituel (message de commit, description de PR ou note interne) afin qu’une évolution juridique ne soit pas noyée dans un changement purement technique.

Si le changement ne modifie pas les engagements ou informations légaux affichés, aucune mise à jour des textes n’est requise.

## Variables d’environnement utiles

Plusieurs informations sont injectées via `import.meta.env` dans [`src/config.js`](../src/config.js). Après modification des valeurs en production, vérifier que les pages légales affichent correctement les données (notamment `VITE_PUBLIC_LEGAL_*`, hébergeur, directeur de publication).

## Ligne éditoriale

Les formulations visibles par les visiteurs doivent rester alignées avec [`ligne-editoriale.md`](ligne-editoriale.md) tout en conservant la précision requise pour les obligations légales.
