# Modèle de données — Supabase

**Un projet Supabase par client.** Le schéma est identique d'un client à l'autre ; seules les
données diffèrent. Toutes les tables multi-clients portent une colonne `site_id`.

## Où se trouve la vérité

1. **`supabase/migrations/*.sql`** — la source de vérité du schéma (DDL + policies RLS).
   Ces fichiers sont désormais versionnés (`.gitignore` les ré-inclut explicitement) ; leur ordre
   d'application par client est décrit dans [supabase/migrations/README.md](../supabase/migrations/README.md).
2. **`packages/base/src/services/`** — l'usage réel : quelles colonnes sont lues, écrites,
   filtrées. Ce document en est la synthèse.

Ce fichier est une **carte de lecture dérivée du code**, pas un dump de schéma : les types, les
contraintes, les index et les policies RLS ne s'y trouvent pas. Pour un besoin exact, lire la
migration correspondante.

## Catalogue

| Table | Rôle | Colonnes clés observées |
| --- | --- | --- |
| `watches` | Fiche montre — table centrale | `id`, `watch_id`, `site_id`, `brand`, `name`, `reference`, `slug`, `price`, `year`, `condition`, `movement`, `audience`, `status`, `is_visible`, `is_available`, `is_sold`, `sale_date`, `stock_quantity`, `display_order`, `ad_code`, `prestashop_product_id`, `created_at`, `updated_at` |
| `watch_details` | Caractéristiques détaillées (paires nom/valeur ordonnées) | `id`, `watch_id`, `name`, `case_size`, `display_order` |
| `watch_images` | Visuels d'une montre (Supabase Storage) | `id`, `watch_id`, `image_path`, `image_url`, `display_order` |
| `watch_translations` | Traductions par langue | `watch_id`, `locale`, `description`, `display_order` |
| `watch_audiences` | Référentiel « public » (homme / femme / mixte…) et filtre collection | `slug`, `label_fr`, `sort_order`, `show_in_collection_filter` |
| `watch_accessories` | Accessoires livrés avec la montre | `id`, `watch_id`, `name`, `display_order` |

`watches.status` / `is_visible` / `is_available` / `is_sold` pilotent la visibilité publique et
l'archive `/ventes` (feature `soldArchive`). Le tri catalogue passe par `display_order`.

## Contenu éditorial

| Table | Rôle | Colonnes clés observées |
| --- | --- | --- |
| `articles` | Articles de blog | `id`, `article_id`, `categories`, `is_visible`, `view_count`, `created_at`, `updated_at` |
| `watch_articles` | Table de liaison montre ↔ article | `watch_id`, `article_id` |

## Accueil

| Table | Rôle | Colonnes clés observées |
| --- | --- | --- |
| `home_carousel_slides` | Carrousel pleine largeur (feature `homeCarousel`) | `id`, `site_id`, `image_path`, `image_url`, `alt_text`, `brand_name`, `display_order`, `watch_id`, `promotion_campaign_id` |
| `home_featured_watches` | Sélections d'accueil, groupées par `selection_key` | `id`, `site_id`, `selection_key`, `context`, `display_order` |

## Commandes et paiement

| Table | Rôle | Colonnes clés observées |
| --- | --- | --- |
| `orders` | Commande | `id`, `order_id`, `site_id`, `customer_email`, `status`, `fulfillment_status`, `currency`, `subtotal_cents`, `total_cents`, `stripe_payment_intent_id`, `paid_at`, `refunded_at`, `refund_amount_cents`, `return_requested_at`, `return_status`, `receipt_storage_path`, `recovery_email_sent_at` |
| `order_lines` | Lignes de commande | `id`, `order_id`, `site_id`, `watch_id`, `name`, `reference`, `image_url`, `quantity`, `unit_price_cents` |
| `order_shipping` | Mode de livraison retenu | `order_id`, `method_id`, `method_label`, `method_type`, `metadata` |
| `order_discounts` | Remises appliquées | `order_id`, `promo_code`, `discount_type`, `discount_cents`, `method_id`, `metadata` |
| `promo_codes` | Codes promo | `id`, `code`, `used_count`, `created_at` |
| `promo_redemptions` | Utilisations d'un code, par client | `id`, `promo_code_id`, `customer_email` |
| `stripe_processed_events` | Idempotence des webhooks Stripe | `event_id` |
| `watch_promotion_campaigns` | Campagnes promotionnelles groupées (feature `adminWatchPromotions`) | `id`, `campaign_id`, `site_id`, `name`, `slug`, `status`, `default_discount_percent`, `starts_at`, `ends_at`, `show_in_menu`, `menu_label`, `menu_order` |
| `watch_promotion_campaign_items` | Montres rattachées à une campagne | `id`, `campaign_id` |

Les montants sont stockés **en centimes** (`*_cents`) côté commande, alors que `watches.price` est
un montant nominal : ne pas mélanger les deux.

`stripe_processed_events` garantit qu'un webhook rejoué n'est pas traité deux fois — ne jamais
court-circuiter cette table dans le flux paiement.

## Relation client

| Table | Rôle | Colonnes clés observées |
| --- | --- | --- |
| `lead_submissions` | Boîte de réception des formulaires (estimation, contact, prise en charge atelier) | `id`, `site_id`, `type`, `status`, `created_at` |
| `newsletter_subscribers` | Abonnés | `id`, `site_id`, `email`, `status`, `consent_at`, `unsubscribe_token`, `created_at` |
| `newsletter_campaigns` | Campagnes email | `id`, `campaign_id`, `site_id`, `status`, `scheduled_at`, `sent_at` |
| `newsletter_campaign_recipients` | Destinataires et résultat d'envoi | `id`, `campaign_id`, `site_id`, `email`, `status`, `sent_at`, `error` |
| `newsletter_settings` | Réglages newsletter par site | `site_id` |

L'ensemble `newsletter_*` dépend de la feature `newsletter` et de Mailjet configuré.

## Administration

| Table | Rôle | Colonnes clés observées |
| --- | --- | --- |
| `admin_users` | Comptes admin et rôles | `email`, `role` |

Les droits par rôle sont appliqués côté front par
`packages/base/src/services/admin/adminPermissions.js`, et côté base par les policies RLS des
migrations. Les deux doivent rester cohérents.

## Storage

Buckets Supabase Storage utilisés : visuels de montres, `home-carousel`, reçus de commande
(`orders.receipt_storage_path`). Le ré-encodage des images passe par
`npm run images:reencode` (`scripts/reencode-storage-images.mjs`).

## Mettre ce document à jour

Il est dérivé des appels `.from('<table>')` dans `packages/base/src/services/`, `backend/`, `api/`
et `scripts/`. Après l'ajout d'une table ou d'une colonne exposée, compléter le tableau
correspondant et vérifier que la migration associée est bien présente dans `supabase/migrations/`.
