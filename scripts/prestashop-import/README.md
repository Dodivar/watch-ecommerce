# Import catalogue PrestaShop → Supabase

Pipeline ETL CLI pour migrer le catalogue produits d'une boutique PrestaShop vers la structure `watches` / `watch_details` / `watch_accessories` / `watch_images` du monorepo.

## Prérequis

1. **Variables d'environnement** (fichier `.env` à la racine du monorepo) :

   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. **Migration Supabase** (optionnelle, recommandée pour un ré-import idempotent) :

   Exécuter le contenu de [`prestashop_product_id.sql.example`](prestashop_product_id.sql.example) dans le SQL Editor du projet Supabase client :

   ```sql
   ALTER TABLE watches ADD COLUMN IF NOT EXISTS prestashop_product_id text;
   CREATE UNIQUE INDEX IF NOT EXISTS watches_prestashop_product_id_key
     ON watches (prestashop_product_id)
     WHERE prestashop_product_id IS NOT NULL;
   ```

   Sans cette colonne l'import fonctionne quand même : la clé PrestaShop n'est simplement
   pas stockée et la déduplication repose entièrement sur `ad_code`. Un ré-import ne
   retrouve donc les fiches existantes que si les références `ad_code` n'ont pas bougé
   côté PrestaShop — sinon il crée des doublons.

3. **Mapping client** : copier et adapter [`sites/_template/prestashop-import.mapping.json`](../../sites/_template/prestashop-import.mapping.json) vers `sites/<SITE_ID>/prestashop-import.mapping.json`.

## Export PrestaShop (back-office)

L'export natif **Catalogue → Produits → Exporter** n'inclut que les colonnes visibles dans la liste. Avant export, activer au minimum :

| Colonne | Usage |
|---------|-------|
| ID | Clé PrestaShop (`prestashop_product_id`) |
| Référence | `ad_code` / référence métier |
| Nom | Titre fiche |
| Fabricant | Marque |
| Prix TTC (ou HT) | Prix catalogue |
| Actif | Disponibilité |
| Quantité | Stock (optionnel) |
| Description / Description courte | Texte fiche |
| Catégories | Audience homme/femme/enfant |
| Feature (Name:Value:Position:Customized) | Specs techniques |

### Images

Souvent absentes de l'export produits minimal. Deux options :

1. **Colonne `Image URLs`** dans l'export (si disponible) — mapper dans `csv.columns.imageUrls`
2. **Fichier CSV images séparé** (`--images-csv`) avec colonnes `id_product`, `image_url`, `position`

Exemple SQL pour générer un CSV images (PrestaShop 1.7+, à adapter) :

```sql
SELECT
  i.id_product,
  CONCAT('https://www.example.com/', i.id, '-large_default/', i.id_product, '.jpg') AS image_url,
  i.position
FROM ps_image i
ORDER BY i.id_product, i.position;
```

## Usage

### Aperçu (dry-run, aucune écriture)

```bash
npm run db:import-prestashop -- \
  --csv ./exports/products.csv \
  --mapping sites/place-des-montres/prestashop-import.mapping.json \
  --images-csv ./exports/images.csv \
  --limit 10
```

### Import réel

```bash
npm run db:import-prestashop:apply -- \
  --csv ./exports/products.csv \
  --mapping sites/place-des-montres/prestashop-import.mapping.json \
  --images-csv ./exports/images.csv
```

### Options CLI

| Option | Description |
|--------|-------------|
| `--csv` | Fichier CSV produits (obligatoire) |
| `--mapping` | Fichier JSON de mapping client (obligatoire) |
| `--images-csv` | CSV images optionnel |
| `--apply` | Écrit en base (sans ce flag : dry-run) |
| `--limit N` | Traiter les N premières lignes |
| `--skip-images` | Importer les données sans images |
| `--on-conflict update\|skip` | Comportement si produit déjà importé (défaut : `update`) |
| `--report ./report.json` | Rapport JSON détaillé |
| `--image-concurrency N` | Téléchargements parallèles (défaut : 3) |

## Mapping client

Le fichier JSON mappe les en-têtes CSV PrestaShop vers les champs Supabase :

- `csv.columns` — noms d'en-têtes du CSV exporté
- `features` — nom feature PrestaShop → chemin cible (`model`, `details.movement`, …)
- `accessoryFeatures` — features booléennes → `watch_accessories`
- `audienceFromCategory` — mots-clés catégorie → slug audience
- `defaults` — valeurs par défaut (`condition`, `audience`, …)
- `adCode` — génération du code annonce

Ajuster les noms de colonnes après réception du premier export réel du client (PrestaShop 1.5 vs 8 peut varier).

## Comportement

- **Dry-run** : transforme le CSV et affiche un résumé sans connexion Supabase obligatoire
- **Images** : téléchargement avec retries ; échec image non bloquant (montre créée quand même)
- **Ré-import** : upsert sur `prestashop_product_id` (ou `ad_code`) ; images remplacées en mode update
- **Rapport** : compteurs créés / mis à jour / ignorés / erreurs + détail JSON optionnel

## Spike normalisation (avant migration schéma)

Mesure la couverture des parsers (mouvement, étanchéité, diamètre, fonctions, état) sur un export CSV réel **sans écrire en base** :

```bash
npm run db:prestashop-spike -- \
  --csv ./exports/products.csv \
  --mapping sites/place-des-montres/prestashop-import.mapping.json \
  --report ./reports/prestashop-spike.json
```

Le rapport console + JSON indique, par champ :
- taux de remplissage depuis les features PrestaShop ;
- taux de normalisation vers des valeurs filtrables ;
- top des valeurs non mappées (à enrichir dans `normalizeWatchSpecs.js`).

Fixture locale : `tests/fixtures/prestashop/products-sample.csv`.

## Déroulé recommandé (nouveau client)

1. Appliquer la migration SQL `prestashop_product_id` (optionnelle, mais elle seule rend le ré-import idempotent)
2. Exporter CSV produits + CSV images depuis PrestaShop
3. Adapter `prestashop-import.mapping.json`
4. Dry-run `--limit 10`
5. Import `--limit 10 --apply` sur Supabase **staging**
6. Valider dans `/admin` (fiches, images, filtres)
7. Import complet `--apply` en production

## Dépannage

| Problème | Piste |
|----------|-------|
| Encodage cassé | Ré-exporter en UTF-8 ; le parser gère le BOM |
| Prix invalides | Vérifier séparateur décimal (`,` → normalisé en `.`) |
| Features vides | Colonne Features absente de l'export — l'activer dans PrestaShop |
| Colonne `prestashop_product_id` absente | Non bloquant : l'import tourne, la clé PrestaShop n'est pas écrite. Appliquer la migration SQL pour un ré-import idempotent |
| Images 403/404 | URLs publiques requises ; vérifier le domaine PrestaShop |

## Structure

```
scripts/prestashop-import/
├── import-prestashop-catalog.mjs   # CLI
├── parsePrestashopCsv.js
├── parsePrestashopFeatures.js
├── parseImagesCsv.js
├── transformPrestashopRow.js
├── loadWatchBatch.js
├── importWatchImages.js
├── loadMapping.js
├── report.js
└── prestashop_product_id.sql.example
```

Tests unitaires : `tests/scripts/prestashop-import/`.
