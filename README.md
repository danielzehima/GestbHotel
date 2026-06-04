# GestHotel

SaaS multi-tenant de gestion hôtelière : chambres, réservations, RH, restaurant (QR code), facturation & mobile money.

## Stack
- **Next.js 15** App Router (Server Components par défaut)
- **Tailwind CSS** pour le design
- **Supabase** (PostgreSQL + Auth + RLS)
- **Vercel** pour l'hébergement
- **TypeScript** strict + **Zod** pour la validation

## Démarrage

### 1. Installation
```bash
npm install
```

### 2. Variables d'environnement
Copier `.env.local.example` en `.env.local` et remplir avec les clés Supabase (Project Settings > API).

### 3. Base de données
La migration SQL est dans `supabase/migrations/`. Elle a déjà été exécutée sur le projet Supabase.

### 4. Créer le premier hôtel + admin
1. Créer un utilisateur via Supabase Dashboard > Authentication
2. Dans le SQL Editor :
```sql
insert into hotels (nom, slug, ville) values ('Mon Hotel', 'mon-hotel', 'Abidjan')
returning id;

update profiles
set hotel_id = '<UUID retourné>', role = 'admin', nom = 'Nom', prenom = 'Prenom'
where id = '<UUID du user>';
```

### 5. Lancer
```bash
npm run dev
```

## Structure
```
src/
  app/
    (auth)/login/        → Page connexion + Server Actions
    (dashboard)/         → Layout protégé + modules
      dashboard/         → KPIs accueil
  components/            → UI partagée (sidebar, badges, stat-card…)
  lib/
    supabase/            → Clients SSR / browser / middleware
    utils/               → Helpers (cn, format)
    auth.ts              → requireUser / requireRole
  types/database.ts      → Types Supabase générés
supabase/migrations/     → Schéma SQL versionné
docs/SCHEMA.md           → Documentation du schéma
```

## Modules
- [x] Auth + rôles (7 rôles distincts)
- [x] Dashboard KPIs
- [ ] Chambres
- [ ] Réservations + calendrier
- [ ] RH (plannings, ménage, pointage)
- [ ] Restaurant (menus, QR, commandes)
- [ ] Facturation
- [ ] Paiements CinetPay (Wave / OM / MTN)
