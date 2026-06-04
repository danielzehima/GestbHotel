import type { RoomStatus } from './database';

export type RoomTypeKey = 'simple' | 'double' | 'twin' | 'suite' | 'familiale' | 'deluxe';

export type RoomType = {
  id: string;
  hotel_id: string;
  code: string;
  libelle: string;
  type: RoomTypeKey;
  capacite_adultes: number;
  capacite_enfants: number;
  prix_nuit: number;
  description: string | null;
  equipements: string[];
  photos: string[];
  created_at: string;
};

export type Room = {
  id: string;
  hotel_id: string;
  room_type_id: string | null;
  numero: string;
  etage: number | null;
  statut: RoomStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  room_type?: Pick<RoomType, 'id' | 'libelle' | 'type' | 'prix_nuit'> | null;
};

export const ROOM_TYPE_LABELS: Record<RoomTypeKey, string> = {
  simple: 'Simple',
  double: 'Double',
  twin: 'Twin (2 lits séparés)',
  suite: 'Suite',
  familiale: 'Familiale',
  deluxe: 'Deluxe'
};
