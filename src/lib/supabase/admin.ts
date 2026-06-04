import { createClient as createSupabase } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Client Supabase avec la clé SERVICE ROLE.
 * ⚠️ Bypass RLS — à utiliser UNIQUEMENT côté serveur, dans les zones super admin.
 * Ne jamais exposer cette clé au client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante. Ajoutez-la dans .env.local');
  }
  return createSupabase<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
