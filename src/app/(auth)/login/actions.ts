'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court')
});

export type LoginState = { error?: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: 'Email ou mot de passe incorrect' };
  }

  await supabase
    .from('profiles')
    .update({ derniere_connexion: new Date().toISOString() })
    .eq('id', (await supabase.auth.getUser()).data.user!.id);

  revalidatePath('/', 'layout');

  // Rediriger vers la page demandée (ex: /reservations?filter=en_attente) ou dashboard par défaut
  const redirectTo = formData.get('redirectTo')?.toString() || '/dashboard';
  // Sécurité : n'autoriser que les chemins relatifs (évite open redirect)
  const safePath = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
  redirect(safePath);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
