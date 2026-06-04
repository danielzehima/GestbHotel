# Schéma Base de Données — GESTION_HOTEL

## Vue d'ensemble

Architecture **multi-tenant** : chaque hôtel est isolé via `hotel_id` + RLS Postgres.

```
hotels (tenant racine)
  ├── profiles (users liés à auth.users Supabase)
  ├── room_types ──┐
  ├── rooms ───────┤
  ├── guests       │
  ├── reservations ┘
  ├── shifts / housekeeping_tasks / time_clock   (RH)
  ├── menus → menu_items                          (F&B)
  ├── restaurant_tables → orders → order_items
  └── invoices → invoice_lines → payments
```

## Modules & tables

### 1. Tenant & Auth
| Table | Rôle |
|---|---|
| `hotels` | Tenant racine (nom, slug, devise, paramètres JSON) |
| `profiles` | Étend `auth.users` Supabase, lié à un hôtel + rôle |

### 2. ENUMS principaux
- `user_role` : super_admin, admin, receptionniste, menage, serveur, cuisine, comptable
- `room_status` : disponible, occupee, nettoyage, maintenance, hors_service
- `reservation_status` : en_attente, confirmee, check_in, check_out, annulee, no_show
- `housekeeping_status` : a_faire, en_cours, terminee, verifiee
- `order_status` : nouvelle, en_preparation, prete, servie, annulee
- `payment_method` : especes, carte, wave, orange_money, mtn_money, cinetpay, virement
- `invoice_status` : brouillon, emise, partiellement_payee, payee, annulee

### 3. Chambres
- `room_types` : catégorie tarifaire (prix nuit, capacité, équipements JSON, photos JSON)
- `rooms` : chambre physique, lié à un type, statut en temps réel

### 4. Réservations
- `guests` : clients (CRM léger)
- `reservations` : référence unique, dates, statut, acompte, check-in/out timestamps

### 5. RH
- `shifts` : plannings (matin/après-midi/nuit/journée)
- `housekeeping_tasks` : assignation ménage avec validation (assignee → vérificateur)
- `time_clock` : pointage entrée/sortie employé

### 6. Restaurant (F&B)
- `menus` + `menu_items` (catégorie, prix, allergènes, photo)
- `restaurant_tables` (avec `qr_code` unique pour menus accessibles par QR)
- `orders` + `order_items` (total calculé automatiquement)
- Lien possible vers `reservation_id` / `room_id` pour facturation chambre

### 7. Facturation
- `invoices` : numéro, statut, sous-total/taxe/remise/total/payé
- `invoice_lines` : lignes typées (`reference_type` = reservation|order|service)
- `payments` : multi-méthodes, lien `cinetpay_transaction_id` pour intégration mobile money

## Sécurité (RLS)

### Fonctions helper
- `current_hotel_id()` → renvoie `hotel_id` du user connecté
- `current_user_role()` → renvoie son rôle

### Pattern global
Toutes les tables filtrées par `hotel_id = current_hotel_id()`.
Pas de fuite cross-tenant possible.

### Politiques par rôle (résumé)
| Action | Rôles autorisés |
|---|---|
| Gestion hôtel | admin, super_admin |
| CRUD chambres/types/réservations | admin, receptionniste |
| Mise à jour statut chambre | menage (en plus de admin/réception) |
| CRUD tâches ménage | admin/réception ; menage peut updater ses tâches |
| CRUD menus | admin, cuisine |
| CRUD commandes | admin, serveur, cuisine, receptionniste |
| Facturation/paiements | admin, receptionniste, comptable |
| Pointage self | chaque user sur ses propres lignes |

## Triggers
- `set_updated_at()` appliqué automatiquement à toute table ayant une colonne `updated_at`

## Index principaux
- `hotel_id` sur toutes les tables (perf multi-tenant)
- `reservations(date_arrivee, date_depart)` (recherche dispo)
- `rooms(statut)`, `orders(statut)`, `housekeeping(statut)` (filtres dashboard)

## Étapes suivantes
1. Créer le projet Next.js (App Router + Tailwind + supabase-js)
2. Exécuter la migration sur Supabase
3. Créer le 1er hotel + admin manuellement (cf. fin du fichier SQL)
4. Brancher l'auth Supabase dans Next.js
5. Construire les modules dans l'ordre : Auth → Dashboard → Chambres → Réservations → Restaurant → Facturation
