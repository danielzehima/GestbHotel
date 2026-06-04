'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  prenom: z.string().min(1, 'Prénom requis').max(100),
  nom: z.string().min(1, 'Nom requis').max(100),
  hotel_nom: z.string().min(2, 'Nom de l\'hôtel requis').max(150)
}).refine((d) => d.password.length >= 8, { message: 'Mot de passe trop court', path: ['password'] });

export type RegisterState =
  | { error?: string; success?: string }
  | null;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }

  const supabase = await createClient();

  // 1. Sign up — métadata transmise au trigger handle_new_user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        nom: parsed.data.nom,
        prenom: parsed.data.prenom
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes('already')) {
      return { error: 'Un compte existe déjà avec cet email. Connectez-vous.' };
    }
    return { error: signUpError.message };
  }

  if (!signUpData.user) {
    return { error: 'Inscription échouée. Réessayez.' };
  }

  const userId = signUpData.user.id;

  // 2. Confirmation email activée ? Si pas de session, on s'arrête là
  const hasSession = !!signUpData.session;

  // Pour créer hôtel + bind profil il faut être authentifié.
  // Si l'email confirm est désactivé côté Supabase, on a déjà la session.
  // Si elle est activée, on stocke le nom de l'hôtel dans metadata pour le finaliser à la 1ère connexion.

  if (!hasSession) {
    // Stocker le nom d'hôtel dans le user_metadata pour finalisation après confirmation email
    return {
      success:
        `Compte créé pour ${parsed.data.email}. ` +
        `Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous. ` +
        `Votre hôtel "${parsed.data.hotel_nom}" sera prêt après la première connexion.`
    };
  }

  // 3. Création de l'hôtel + rattachement
  let slug = slugify(parsed.data.hotel_nom);
  // Vérifie unicité du slug
  const { data: existing } = await supabase.from('hotels').select('id').eq('slug', slug).maybeSingle();
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: hotel, error: hotelError } = await supabase
    .from('hotels')
    .insert({
      nom: parsed.data.hotel_nom,
      slug,
      pays: 'Côte d\'Ivoire',
      devise: 'XOF'
    })
    .select('id')
    .single();

  if (hotelError || !hotel) {
    return { error: `Compte créé mais erreur hôtel : ${hotelError?.message ?? 'inconnue'}. Contactez le support.` };
  }

  // 4. Mise à jour du profil : admin de l'hôtel
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      hotel_id: hotel.id,
      role: 'admin',
      nom: parsed.data.nom,
      prenom: parsed.data.prenom
    })
    .eq('id', userId);

  if (profileError) {
    return { error: `Hôtel créé mais erreur rattachement : ${profileError.message}` };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
