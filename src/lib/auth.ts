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

export type AuthState =
  | { kind: 'anonymous' }
  | { kind: 'no_profile'; authUserId: string; email: string }
  | { kind: 'ok'; user: CurrentUser };

/**
 * Récupère l'état d'auth complet. Différencie :
 * - anonymous : pas de session
 * - no_profile : session présente mais aucun profil en base (rare, dégradé)
 * - ok : session + profil OK
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { kind: 'anonymous' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, hotel_id, nom, prenom, role, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) {
    return { kind: 'no_profile', authUserId: user.id, email: user.email ?? '' };
  }

  return {
    kind: 'ok',
    user: {
      id: user.id,
      email: user.email ?? '',
      profile: profile as CurrentUser['profile']
    }
  };
});

/**
 * Variante legacy compatible — renvoie le user OU null.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const state = await getAuthState();
  return state.kind === 'ok' ? state.user : null;
});

/**
 * Bloque l'accès si pas authentifié. Si le profil est manquant,
 * laisse la page se rendre avec une information dégradée (évite les boucles).
 */
export async function requireUser(): Promise<CurrentUser> {
  const state = await getAuthState();
  if (state.kind === 'anonymous') redirect('/login');
  if (state.kind === 'no_profile') {
    // On ne redirige PAS pour éviter les boucles. On lance une erreur explicite
    // que le error boundary affichera.
    throw new Error(
      `Votre profil utilisateur est introuvable (auth_id: ${state.authUserId}, email: ${state.email}). ` +
      `Contactez l'administrateur ou tentez de vous réinscrire.`
    );
  }
  return state.user;
}

export async function requireRole(allowed: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!allowed.includes(user.profile.role)) {
    redirect('/dashboard');
  }
  return user;
}
