'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import { getHotelPlanLimits, checkLimit } from '@/lib/plan-limits';
import { sendTeamInviteEmail, sendPasswordResetEmail } from '@/lib/email';

const schema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  telephone: z.string().optional(),
  role: z.enum(['admin', 'receptionniste', 'menage', 'serveur', 'cuisine', 'comptable']),
  actif: z.coerce.boolean().optional()
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateStaff(id: string, formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();

  // Garde-fou : on ne modifie que les profils du même hôtel
  const { data: target } = await supabase
    .from('profiles')
    .select('hotel_id')
    .eq('id', id)
    .single();
  if (!target || target.hotel_id !== user.profile.hotel_id) {
    return { ok: false, error: 'Profil hors de votre hôtel' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      telephone: parsed.data.telephone || null,
      role: parsed.data.role,
      actif: parsed.data.actif ?? true
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/staff');
  return { ok: true };
}

export async function attachToHotel(profileId: string): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ hotel_id: user.profile.hotel_id, role: 'receptionniste' })
    .eq('id', profileId)
    .is('hotel_id', null);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/staff');
  return { ok: true };
}

// ---------- INVITATION D'UN MEMBRE ----------

const inviteSchema = z.object({
  email: z.string().email('Email invalide'),
  prenom: z.string().min(1, 'Prénom requis').max(100),
  nom: z.string().min(1, 'Nom requis').max(100),
  telephone: z.string().optional(),
  role: z.enum(['admin', 'receptionniste', 'menage', 'serveur', 'cuisine', 'comptable']),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum').optional()
});

export type InviteResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string };

function genPassword(): string {
  // mot de passe lisible, 12 caractères, mix lettres+chiffres
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

/**
 * Crée un compte Supabase Auth pour un nouveau membre + son profil rattaché à l'hôtel de l'admin.
 * Renvoie l'email et le mot de passe à partager (affichés une seule fois).
 */
export async function inviteTeamMember(formData: FormData): Promise<InviteResult> {
  const user = await requireRole(['admin']);
  if (!user.profile.hotel_id) {
    return { ok: false, error: 'Votre compte n\'est pas rattaché à un hôtel.' };
  }

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  // Vérif limite utilisateurs du forfait
  const { limits, isExpired } = await getHotelPlanLimits(user.profile.hotel_id);
  if (isExpired) return { ok: false, error: 'Votre forfait a expiré. Renouvelez-le pour ajouter des membres.' };

  const admin = createAdminClient();
  const { count: currentUsers } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('hotel_id', user.profile.hotel_id);

  const limitErr = checkLimit(currentUsers ?? 0, limits.maxUsers, 'utilisateur(s)');
  if (limitErr) return { ok: false, error: limitErr };

  const password = parsed.data.password?.trim() || genPassword();

  // 1. Création du user Supabase Auth (email_confirm: true pour zapper la vérification)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: true,
    user_metadata: { nom: parsed.data.nom, prenom: parsed.data.prenom }
  });

  if (createErr) {
    const msg = createErr.message.toLowerCase();
    if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
      return { ok: false, error: 'Un compte existe déjà avec cet email.' };
    }
    return { ok: false, error: createErr.message };
  }

  if (!created.user) return { ok: false, error: 'Création échouée.' };

  // 2. Le trigger handle_new_user a créé un profil basique. On le complète.
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({
      id: created.user.id,
      hotel_id: user.profile.hotel_id,
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      telephone: parsed.data.telephone || null,
      role: parsed.data.role,
      actif: true
    });

  if (profileErr) {
    // Rollback : supprime le user Auth
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: profileErr.message };
  }

  // Récupère le nom de l'hôtel + envoie l'email d'invitation (best-effort)
  const { data: hotelInfo } = await admin
    .from('hotels')
    .select('nom')
    .eq('id', user.profile.hotel_id)
    .single();

  sendTeamInviteEmail({
    email: parsed.data.email,
    prenom: parsed.data.prenom,
    nom: parsed.data.nom,
    role: parsed.data.role,
    password,
    hotelNom: (hotelInfo as any)?.nom ?? 'votre hôtel'
  }).catch(() => {});

  revalidatePath('/staff');
  return { ok: true, email: parsed.data.email, password };
}

/**
 * Réinitialise le mot de passe d'un membre. Renvoie le nouveau mot de passe.
 */
export async function resetMemberPassword(id: string): Promise<InviteResult> {
  const user = await requireRole(['admin']);
  const admin = createAdminClient();

  // Vérifier que le membre appartient bien à l'hôtel de l'admin
  const { data: target } = await admin
    .from('profiles')
    .select('hotel_id')
    .eq('id', id)
    .single();
  if (!target || target.hotel_id !== user.profile.hotel_id) {
    return { ok: false, error: 'Membre hors de votre hôtel.' };
  }

  const newPassword = genPassword();
  const { error } = await admin.auth.admin.updateUserById(id, { password: newPassword });
  if (error) return { ok: false, error: error.message };

  // Récup email + prénom pour mail
  const { data: userInfo } = await admin.auth.admin.getUserById(id);
  const { data: profileInfo } = await admin
    .from('profiles')
    .select('prenom')
    .eq('id', id)
    .single();

  const email = userInfo.user?.email ?? '—';
  if (email !== '—') {
    sendPasswordResetEmail({
      email,
      prenom: (profileInfo as any)?.prenom ?? '',
      newPassword
    }).catch(() => {});
  }

  return { ok: true, email, password: newPassword };
}

export async function deleteMember(id: string): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  if (id === user.profile.id) return { ok: false, error: 'Vous ne pouvez pas vous supprimer vous-même.' };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from('profiles')
    .select('hotel_id')
    .eq('id', id)
    .single();
  if (!target || target.hotel_id !== user.profile.hotel_id) {
    return { ok: false, error: 'Membre hors de votre hôtel.' };
  }

  // Suppression cascade : profile sera supprimé via FK
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/staff');
  return { ok: true };
}
