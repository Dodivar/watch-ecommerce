-- Demandes de prise en charge atelier (formulaire « devis réparation ») : nouveau type de lead.
--
-- Le formulaire de la page « Nos services » enregistre ses demandes dans `lead_submissions`
-- comme le contact ou l'estimation. Sans cette contrainte élargie, l'insertion échoue en
-- silence côté backend (persistLeadSubmission log l'erreur) : l'email part, la demande
-- n'apparaît jamais dans la boîte de réception admin.

ALTER TABLE lead_submissions DROP CONSTRAINT IF EXISTS lead_submissions_type_check;

ALTER TABLE lead_submissions
  ADD CONSTRAINT lead_submissions_type_check
  CHECK (type IN ('contact', 'appointment', 'estimation', 'search', 'repair'));
