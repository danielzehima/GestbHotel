import type { UserRole } from '@/types/database';

export type Permission = {
  label: string;
  desc: string;
};

export const ROLE_DEFINITIONS: Record<Exclude<UserRole, 'super_admin'>, {
  label: string;
  short: string;
  color: string;
  permissions: Permission[];
}> = {
  admin: {
    label: 'Administrateur',
    short: 'Accès total à l\'hôtel',
    color: 'bg-brand-100 text-brand-800 border-brand-300',
    permissions: [
      { label: 'Tous les modules', desc: 'Chambres, réservations, restaurant, facturation, RH, paramètres' },
      { label: 'Gestion équipe', desc: 'Inviter, modifier, supprimer les membres' },
      { label: 'Suppression données', desc: 'Peut supprimer hôtel, chambres, factures' },
      { label: 'Paramètres hôtel', desc: 'Nom, adresse, devise, logo' }
    ]
  },
  receptionniste: {
    label: 'Réceptionniste',
    short: 'Front office : réservations, clients, check-in',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    permissions: [
      { label: 'Chambres', desc: 'Voir, créer, modifier les chambres et leur statut' },
      { label: 'Réservations', desc: 'Créer et gérer les réservations, check-in/check-out' },
      { label: 'Clients', desc: 'Base CRM complète' },
      { label: 'Facturation', desc: 'Émettre factures et encaisser paiements' },
      { label: 'Commandes restaurant', desc: 'Prise de commande room service' }
    ]
  },
  menage: {
    label: 'Ménage',
    short: 'Personnel d\'entretien',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    permissions: [
      { label: 'Tâches ménage', desc: 'Voir ses tâches, les démarrer et les terminer' },
      { label: 'Statut chambres', desc: 'Changer le statut (occupée → nettoyage → disponible)' },
      { label: 'Plannings', desc: 'Consulter son propre planning' },
      { label: 'Pointage', desc: 'Pointer son entrée et sortie' }
    ]
  },
  serveur: {
    label: 'Serveur',
    short: 'Restaurant : prise de commande',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    permissions: [
      { label: 'Commandes', desc: 'Prendre les commandes à table ou en room service' },
      { label: 'Tables', desc: 'Consulter les tables et QR codes' },
      { label: 'Menus', desc: 'Consulter les cartes (lecture seule)' },
      { label: 'Pointage', desc: 'Pointer son entrée et sortie' }
    ]
  },
  cuisine: {
    label: 'Cuisine',
    short: 'Préparation des plats',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    permissions: [
      { label: 'Interface cuisine', desc: 'Tableau kanban des commandes en temps réel' },
      { label: 'Menus', desc: 'Créer et modifier les plats, gérer disponibilités' },
      { label: 'Statut commandes', desc: 'Passer commandes de "nouvelle" à "prête"' },
      { label: 'Pointage', desc: 'Pointer son entrée et sortie' }
    ]
  },
  comptable: {
    label: 'Comptable',
    short: 'Suivi financier',
    color: 'bg-slate-200 text-slate-800 border-slate-400',
    permissions: [
      { label: 'Factures', desc: 'Consulter et créer toutes les factures' },
      { label: 'Paiements', desc: 'Enregistrer les encaissements toutes méthodes' },
      { label: 'Rapports', desc: 'Voir les KPIs financiers et exports' },
      { label: 'Pointage', desc: 'Pointer son entrée et sortie' }
    ]
  }
};
