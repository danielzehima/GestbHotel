-- ============================================================================
-- Correction RLS contact_messages : autoriser anon ET authenticated
-- (sinon impossible d'envoyer un message quand on est déjà connecté)
-- ============================================================================

-- Supprime l'ancienne policy restrictive
drop policy if exists "contact insert public" on contact_messages;

-- Nouvelle policy : tout le monde peut insérer (formulaire public)
create policy "contact insert public"
  on contact_messages for insert
  to public
  with check (true);
