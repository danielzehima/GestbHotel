import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export type CurrentUser = {
  id: string;
  email: string;
  profile: {
    id: string;
    hotel_id: string | null;
    nom: string;
    prenom: string;
    role: UserRole;
    avatar_url: string | null;
  };
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, hotel_id, nom, prenom, role, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    profile: profile as CurrentUser['profile']
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(allowed: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!allowed.includes(user.profile.role)) {
    redirect('/dashboard');
  }
  return user;
}
