Coûts de Stripe Checkout
Frais de transaction uniquement
Pas d’abonnement mensuel pour Stripe Checkout
Frais uniquement sur les ventes réussies
Tarifs en France :
Carte bancaire : 1,4% + 0,25€ par transaction
Exemple : montre à 5000€ = 70€ + 0,25€ = 70,25€ de frais
Ce qui est gratuit
Intégration de l’API
Interface de paiement
Gestion des remboursements
Tableau de bord
Webhooks pour les notifications
Gestion du stock dans Supabase
Stock géré dans Supabase (gratuit jusqu’à certaines limites)
Stripe ne gère pas le stock
Vous mettez à jour Supabase après un paiement réussi via webhook

## Remboursements (retours / rétractation)

Aucun remboursement n'est déclenché depuis le back-office : l'API Stripe n'est
appelée que pour l'encaissement. La procédure est manuelle et se trace dans
l'admin.

1. Ouvrir la commande dans `/admin/orders/:id`, section « Retour &
   remboursement ». Renseigner la date de réception par le client : le délai de
   rétractation de 14 jours (art. L221-18) en découle. Sans cette date, le délai
   affiché est calculé depuis le paiement, à titre indicatif.
2. Passer le statut à « Rétractation demandée » le jour où le client se
   manifeste : le vendeur a alors 14 jours pour rembourser (art. L221-24), et
   l'échéance est rappelée dans le panneau et sur le tableau de bord.
3. Cliquer sur « Ouvrir le paiement dans Stripe » (lien direct vers le
   `payment_intent`) et effectuer le remboursement depuis le dashboard. Le
   montant doit couvrir la commande et les frais de livraison standard.
4. Revenir dans l'admin, passer le statut à « Remboursée » et saisir le montant,
   l'identifiant `re_…` et la date. Le montant est obligatoire et borné par le
   total de la commande.

Les colonnes correspondantes sont ajoutées par la migration
`supabase/migrations/20260823130000_order_returns.sql`, à appliquer sur chaque
projet Supabase client.
