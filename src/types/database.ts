// Types générés depuis Supabase.
// Pour régénérer après changement de schéma :
//   npx supabase gen types typescript --linked > src/types/database.ts
//
// En attendant la génération, on garde un type vide minimal pour ne pas bloquer le build.

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          hotel_id: string | null;
          nom: string;
          prenom: string;
          telephone: string | null;
          role: UserRole;
          avatar_url: string | null;
          actif: boolean;
          derniere_connexion: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          nom: string;
          prenom: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      // Les autres tables seront ajoutées par `supabase gen types`
      [k: string]: any;
    };
    Views: { [k: string]: any };
    Functions: {
      current_hotel_id: { Args: Record<string, never>; Returns: string | null };
      current_user_role: { Args: Record<string, never>; Returns: UserRole | null };
    };
    Enums: {
      user_role: UserRole;
      room_status: RoomStatus;
      reservation_status: ReservationStatus;
      order_status: OrderStatus;
    };
  };
};
