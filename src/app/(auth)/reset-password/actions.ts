'use server';

import { createClient } from '@/lib/supabase/server';

export type ResetState = { ok: true } | { ok: false; error: string } | null;

export async function updatePassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 8) return { ok: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' };
  if (password !== confirm) return { ok: false, error: 'Les mots de passe ne correspondent pas.' };

  const supabase = await createClient();

  // La session de récupération doit être active (établie via le lien email → /auth/callback)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Lien invalide ou expiré. Refaites une demande de réinitialisation.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
