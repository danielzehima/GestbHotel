-- ============================================================================
-- Auto-création du profil à l'inscription d'un utilisateur
-- ============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, nom, prenom, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', 'À renseigner'),
    coalesce(new.raw_user_meta_data->>'prenom', 'À renseigner'),
    'receptionniste'::user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
