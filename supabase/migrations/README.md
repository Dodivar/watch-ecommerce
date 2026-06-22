# Migrations Supabase

Appliquer chaque fichier SQL dans l’ordre chronologique via le SQL Editor du projet Supabase **de chaque client**.

## Admin Phase 1

`20260525120000_admin_phase1.sql` — requis pour :

- Boîte de réception leads (`lead_submissions`)
- Stock retail (`watches.stock_quantity`)
- Suivi commandes (`orders.fulfillment_status`)
- Sélections accueil (`home_featured_watches`)
- Policies RLS admin

Prérequis : tables checkout existantes (`orders`, `order_lines`, `promo_codes`, `admin_users`) — voir `backend/README.md`.

## Carrousel d'accueil

`20260608120000_home_carousel.sql` — requis pour les clients avec `features.homeCarousel` :

- Table `home_carousel_slides` (ordre, marque optionnelle, métadonnées)
- Bucket Storage public `home-carousel`

`20260608130000_home_carousel_watch_link.sql` — lien optionnel vers une fiche montre (`watch_id`) sur chaque slide.
- Policies RLS admin (lecture publique)

## Public / audience des montres

`20260614120000_watch_audiences.sql` — requis pour le champ « Public » du formulaire admin et le filtre collection par audience :

- Colonne `watches.audience` (slug, défaut `unisexe`)
- Table de référence `watch_audiences` (slugs `unisexe`, `homme`, `femme`, `enfant`) + lecture publique RLS
- Corrige l'erreur `Could not find the 'audience' column of 'watches' in the schema cache`

## Checkout — création commande optimisée

`20260618120000_create_draft_order_rpc.sql` — RPC `create_draft_order` (insert commande + réservation stock + lignes + quote initiale en une transaction). Requis pour le backend checkout actuel (`POST /api/orders`). Prérequis : `reserve_watches_for_order`, `release_order_reservation`.

## Reçus PDF commandes (Storage privé)

`20260621120000_order_receipts_storage.sql` — requis pour l'archivage des reçus PDF :

- Colonne `orders.receipt_storage_path`
- Bucket Storage privé `order-receipts` (PDF uniquement, accès backend service role)
- Téléchargement admin via `GET /api/admin/orders/:orderId/receipt`

## Promotions montres

`20260622120000_watch_promotions.sql` — prix promotionnels par montre :

- Colonnes `watches.promotion_price`, `watches.discount_percent`
- Fonction `watch_effective_price(price, promotion_price)`
- Mise à jour RPC `create_draft_order` pour facturer le prix effectif
- Prérequis : `20260618120000_create_draft_order_rpc.sql`

## Campagnes promotionnelles (admin)

`20260622140000_watch_promotion_campaigns.sql` — événements promo groupés :

- Tables `watch_promotion_campaigns`, `watch_promotion_campaign_items`
- Prérequis : `20260525120000_admin_phase1.sql` (`is_admin_user()`)

`20260622150000_watch_promotion_campaigns_rls.sql` — à appliquer si les tables existent déjà sans policies RLS (corrige `new row violates row-level security policy`).

`20260622160000_watch_promotion_menu_carousel.sql` — menu dynamique + filtre collection + carrousel :

- Colonnes `slug`, `show_in_menu`, `menu_label`, `menu_order` sur `watch_promotion_campaigns`
- Colonne `promotion_campaign_id` sur `home_carousel_slides`
- Policies RLS lecture publique campagnes et items (filtrage actif côté app)
- Prérequis : `20260622140000_watch_promotion_campaigns.sql`, `20260608120000_home_carousel.sql`
