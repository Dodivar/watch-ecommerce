# Dimensionnement migration catalogue — Place des Montres

Estimation et plan d'exécution pour migrer ~**3 000 références** depuis PrestaShop vers Supabase.

## Volume attendu

| Donnée | Estimation | Source |
|--------|------------|--------|
| Produits actifs | ~3 000 | Communication client + site actuel |
| Marques | ~30 | Page Qui sommes-nous |
| Images par produit | 1–4 (moyenne ~2) | Export PrestaShop typique |
| **Total images** | **~4 000–6 000** | À confirmer sur export réel |
| Mises à jour stock / jour | Plusieurs fois | FAQ PrestaShop — process à redéfinir post-migration |

## Outils existants dans le monorepo

| Ressource | Chemin |
|-----------|--------|
| CLI import | `npm run db:import-prestashop` (dry-run) / `npm run db:import-prestashop:apply` |
| Documentation pipeline | [`scripts/prestashop-import/README.md`](../../../scripts/prestashop-import/README.md) |
| Mapping client PdM | [`prestashop-import.mapping.json`](../prestashop-import.mapping.json) |
| Migration SQL idempotence | `scripts/prestashop-import/prestashop_product_id.sql.example` |
| Spike normalisation specs | `npm run db:prestashop-spike` |
| Redirections SEO 301 | `site.config.js` → `seo.legacyRedirects` |

## Mapping PrestaShop → plateforme

Le fichier [`prestashop-import.mapping.json`](../prestashop-import.mapping.json) mappe déjà :

- Colonnes CSV : ID, Référence, Nom, Fabricant, Prix TTC, Stock, Descriptions, Catégories, Features
- Features techniques : Modèle, Mouvement, Diamètre, Matière boîtier/bracelet, Cadran, Verre, Étanchéité, Fonctions…
- Audience : dérivée des catégories Homme / Femme / Enfant
- Défauts retail : condition Neuf, garantie 1 an (à harmoniser avec engagement commercial 2 ans en fiche)

## Déroulé migration recommandé

### Étape 0 — Préparation (1–2 jours)

1. Appliquer la migration SQL `prestashop_product_id` sur le projet Supabase **Place des Montres**
2. Obtenir du client :
   - Export CSV produits (colonnes complètes — voir README import)
   - Export CSV images **ou** URLs images publiques
   - Accès back-office PrestaShop en lecture (secours)
3. Vérifier encodage UTF-8 et séparateur `;` (mapping configuré)

### Étape 1 — Spike qualité données (0,5 jour)

```bash
npm run db:prestashop-spike -- \
  --csv ./exports/place-des-montres/products.csv \
  --mapping sites/place-des-montres/prestashop-import.mapping.json \
  --report ./exports/place-des-montres/spike-report.json
```

**Objectif** : taux de remplissage mouvement, diamètre, bracelet, étanchéité — identifier les valeurs à enrichir dans `normalizeWatchSpecs.js`.

### Étape 2 — Dry-run échantillon (0,5 jour)

```bash
npm run db:import-prestashop -- \
  --csv ./exports/place-des-montres/products.csv \
  --mapping sites/place-des-montres/prestashop-import.mapping.json \
  --images-csv ./exports/place-des-montres/images.csv \
  --limit 50
```

Validation manuelle : 50 fiches dans `/admin` + storefront `/collection`.

### Étape 3 — Import staging (1 jour)

```bash
npm run db:import-prestashop:apply -- \
  --csv ./exports/place-des-montres/products.csv \
  --mapping sites/place-des-montres/prestashop-import.mapping.json \
  --images-csv ./exports/place-des-montres/images.csv \
  --image-concurrency 5 \
  --report ./exports/place-des-montres/import-report.json
```

**Durée estimée import complet** :

| Phase | Durée indicative |
|-------|------------------|
| Transform CSV 3 000 lignes | < 5 min |
| Upsert Supabase (données) | 10–30 min |
| Téléchargement ~5 000 images (concurrence 3–5) | **2–6 h** selon bande passante et taille images |
| Contrôle qualité manuel (échantillon 5 %) | 2–4 h |

### Étape 4 — SEO et URLs (0,5 jour)

Redirections déjà configurées dans `site.config.js` :

| Ancienne URL PrestaShop | Nouvelle URL |
|-------------------------|--------------|
| `/:id-:rewrite.html` | `/montre/:rewrite` |
| `/:id-:rewrite` (catégorie) | `/collection/:rewrite` |
| `/content/6-mentions-legales` | `/mentions-legales` |
| `/content/3-conditions-utilisation` | `/conditions-generales-utilisation` |
| `/content/1-livraison` | `/faq` |
| `/contactez-nous` | `/contact` |
| `/magasins` | `/a-propos` |

**Actions complémentaires** :

- [ ] Exporter la liste des URL produits les plus visitées (Google Search Console) pour tester les 301
- [ ] Soumettre le nouveau `sitemap.xml` après bascule
- [ ] Surveiller erreurs 404 pendant 30 jours post-migration

### Étape 5 — Ré-import delta (récurrent)

Le pipeline supporte `--on-conflict update` : ré-importer un CSV PrestaShop met à jour prix, stock et descriptions sans dupliquer.

**Recommandation post-lancement** :

- Export quotidien ou hebdomadaire depuis PrestaShop **jusqu'à bascule DNS**
- Après bascule : saisie stock via **admin** ou synchro caisse magasin (offre Croissance)

## Données non migrées automatiquement

| Donnée | Traitement proposé |
|--------|-------------------|
| Comptes clients PrestaShop | Non migrables (mots de passe hashés) — phase 2 espace client |
| Historique commandes | Export PDF / archive PrestaShop consultable 12 mois |
| Avis produits | Absents sur plateforme — non migrés |
| Coups de cœur clients | Non migrés — nouvelle liste en phase 2 |
| Modules tiers (newsletter lists) | Export CSV depuis outil email actuel |

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Images 403/404 | URLs publiques PrestaShop requises ; test sur échantillon 50 |
| Features vides dans export | Activer colonne Features dans export back-office |
| Slugs différents → 404 SEO | Conserver `rewrite` PrestaShop dans slug montre ; tester redirections |
| Stock désynchronisé magasin / web | Process admin ou synchro phase Croissance |
| Garantie 1 an (import) vs 2 ans (commercial) | Script post-import ou règle mapping `details.guarantee` |

## Checklist go-live catalogue

- [ ] ≥ 95 % des produits actifs PrestaShop importés avec image principale
- [ ] Filtres marque / genre / prix cohérents sur `/collection`
- [ ] 20 URL produits les plus trafiquées testées en 301
- [ ] Stock à 0 masque ou badge « hors stock » selon règle retail
- [ ] Équipe client formée à l'admin montres (ajout, promo, stock)

## Effort global estimé

| Poste | Jours-homme |
|-------|-------------|
| Préparation exports + SQL | 1–2 |
| Spike + ajustement mapping | 1 |
| Import + images + QA | 2–3 |
| SEO + redirections | 0,5–1 |
| **Total migration catalogue** | **5–7 jours** |

Hors périmètre : formation client, synchro temps réel stock magasin, migration comptes clients.
