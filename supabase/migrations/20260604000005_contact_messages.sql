-- ============================================================================
-- Table contact_messages : stockage des demandes via formulaire public /contact
-- ============================================================================

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  telephone text,
  sujet text not null,
  message text not null,
  traite boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_contact_messages_created on contact_messages(created_at desc);
create index if not exists idx_contact_messages_traite on contact_messages(traite);

alter table contact_messages enable row level security;

-- Anon peut INSÉRER (formulaire public)
create policy "contact insert public"
  on contact_messages for insert
  to anon
  with check (true);

-- Seul super_admin peut lire
create policy "contact read super admin"
  on contact_messages for select
  using (current_user_role() = 'super_admin');

create policy "contact update super admin"
  on contact_messages for update
  using (current_user_role() = 'super_admin');
