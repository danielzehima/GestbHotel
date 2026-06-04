// Types Supabase — version souple pour ne pas bloquer le build.
// Pour des types stricts (auto-complétion par table), générer plus tard :
//   npx supabase gen types typescript --linked > src/types/database.ts

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

// ENUMS exportés pour utilisation dans l'UI
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'receptionniste'
  | 'menage'
  | 'serveur'
  | 'cuisine'
  | 'comptable';

export type RoomStatus = 'disponible' | 'occupee' | 'nettoyage' | 'maintenance' | 'hors_service';

export type ReservationStatus =
  | 'en_attente'
  | 'confirmee'
  | 'check_in'
  | 'check_out'
  | 'annulee'
  | 'no_show';

export type OrderStatus = 'nouvelle' | 'en_preparation' | 'prete' | 'servie' | 'annulee';

// Type générique permissif pour toutes les tables (CRUD non-typé strictement)
type GenericTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: any[];
};

export type Database = {
  public: {
    Tables: Record<string, GenericTable>;
    Views: Record<string, GenericTable>;
    Functions: Record<string, { Args: Record<string, any>; Returns: any }>;
    Enums: {
      user_role: UserRole;
      room_status: RoomStatus;
      reservation_status: ReservationStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, any>;
  };
};
