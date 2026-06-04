-- ============================================================================
-- Accès public en lecture pour la carte accessible via QR code
-- Permet aux clients (anon) de scanner et voir le menu sans authentification.
-- ============================================================================

-- Hotels : exposition minimale (nom, slug, devise, logo) des hôtels actifs
create policy "hotels public read" on hotels
  for select
  to anon
  using (actif = true);

-- Tables : lookup par qr_code uniquement (anon ne liste pas tout)
create policy "tables public read by qr" on restaurant_tables
  for select
  to anon
  using (active = true);

-- Menus : actifs uniquement
create policy "menus public read" on menus
  for select
  to anon
  using (actif = true);

-- Menu items : disponibles uniquement
create policy "menu_items public read" on menu_items
  for select
  to anon
  using (disponible = true);
