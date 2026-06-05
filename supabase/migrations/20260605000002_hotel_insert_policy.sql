-- ============================================================================
-- Permet à un utilisateur authentifié SANS hôtel rattaché de créer un hôtel
-- (utilisé au moment de l'inscription via /register).
-- Une fois rattaché, il ne peut plus en créer un autre via cette policy.
-- ============================================================================

drop policy if exists "hotel insert by new admin" on hotels;
create policy "hotel insert by new admin"
  on hotels for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.hotel_id is null
    )
  );
