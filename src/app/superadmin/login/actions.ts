'use server';

import { redirect } from 'next/navigation';
import { checkPassword, setSuperadminCookie } from '@/lib/superadmin-auth';

export type LoginState = { error?: string } | null;

export async function superadminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');

  // Pause anti-bruteforce minimale
  await new Promise((r) => setTimeout(r, 600));

  if (!checkPassword(password)) {
    return { error: 'Mot de passe incorrect.' };
  }

  await setSuperadminCookie();
  redirect('/superadmin');
}
