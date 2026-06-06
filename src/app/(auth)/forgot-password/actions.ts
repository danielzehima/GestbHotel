'use server';

import { createClient } from '@/lib/supabase/server';

export type ForgotState = { ok: true } | { ok: false; error: string } | null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gestb-hotel.vercel.app';

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Veuillez saisir une adresse email valide.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/auth/callback?next=/reset-password`
  });

  // On renvoie toujours OK pour ne pas révéler quels emails existent.
  if (error) console.error('[forgot-password]', error.message);
  return { ok: true };
}
