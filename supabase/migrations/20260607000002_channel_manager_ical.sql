-- ============================================================================
-- #7 Channel Manager — synchronisation iCal (Booking.com / Airbnb / Expedia)
-- ============================================================================

-- Feeds iCal externes à importer (un par OTA et par type de chambre)
create table if not exists ical_feeds (
  id             uuid primary key default gen_random_uuid(),
  hotel_id       uuid not null references hotels(id) on delete cascade,
  room_type_id   uuid not null references room_types(id) on delete cascade,
  nom            text not null,                 -- "Booking.com", "Airbnb"...
  url            text not null,                 -- URL .ics externe à importer
  actif          boolean not null default true,
  derniere_sync  timestamptz,                   -- dernière synchro réussie
  derniere_erreur text,                         -- message d'erreur de la dernière tentative
  events_count   int not null default 0,        -- nb d'events importés au dernier passage
  created_at     timestamptz default now()
);

create index if not exists idx_ical_feeds_hotel on ical_feeds(hotel_id, actif);

-- Colonnes de déduplication sur reservations (pour les blocages importés via iCal)
alter table reservations add column if not exists ical_uid text;
alter table reservations add column if not exists ical_feed_id uuid references ical_feeds(id) on delete cascade;

-- Index unique pour idempotence : un même UID iCal ne crée qu'un seul blocage par hôtel
create unique index if not exists idx_reservations_ical_uid
  on reservations(hotel_id, ical_uid) where ical_uid is not null;

-- RLS
alter table ical_feeds enable row level security;

drop policy if exists "ical_feeds_read"  on ical_feeds;
drop policy if exists "ical_feeds_write" on ical_feeds;

create policy "ical_feeds_read"
  on ical_feeds for select
  using (
    hotel_id in (
      select hotel_id from profiles where id = auth.uid() and hotel_id is not null
    )
  );

create policy "ical_feeds_write"
  on ical_feeds for all
  using (
    hotel_id in (
      select hotel_id from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Le client service-role (export public + cron d'import) contourne la RLS.
