'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole, requireUser } from '@/lib/auth';

export type ActionResult = { ok: true } | { ok: false; error: string };

// ----- HOTEL -----

const hotelSchema = z.object({
  nom: z.string().min(1).max(150),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  devise: z.string().min(3).max(5),
  logo_url: z.string().url().optional().or(z.literal(''))
});

export async function updateHotel(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = hotelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('hotels')
    .update({
      nom: parsed.data.nom,
      adresse: parsed.data.adresse || null,
      ville: parsed.data.ville || null,
      pays: parsed.data.pays || null,
      telephone: parsed.data.telephone || null,
      email: parsed.data.email || null,
      devise: parsed.data.devise,
      logo_url: parsed.data.logo_url || null
    })
    .eq('id', user.profile.hotel_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ----- EMAIL CUSTOMIZATION (Templates personnalisés par hôtel) -----

const emailSettingsSchema = z.object({
  email_logo_url: z.string().url().optional().or(z.literal('')),
  email_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  email_hotel_name: z.string().max(100).optional().or(z.literal('')),
  email_footer: z.string().max(200).optional().or(z.literal('')),
  email_reply_to: z.string().email().optional().or(z.literal(''))
});

export async function updateEmailSettings(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = emailSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();

  // Fusion dans parametres jsonb (préserve paiement et autres clés)
  const { data: hotel } = await supabase
    .from('hotels')
    .select('parametres')
    .eq('id', user.profile.hotel_id!)
    .single();

  const current = ((hotel as any)?.parametres ?? {}) as Record<string, any>;
  const next = {
    ...current,
    email: {
      logo_url: parsed.data.email_logo_url || null,
      primary_color: parsed.data.email_primary_color || null,
      hotel_name_header: parsed.data.email_hotel_name || null,
      footer_signature: parsed.data.email_footer || null,
      reply_to: parsed.data.email_reply_to || null
    }
  };

  const { error } = await supabase
    .from('hotels')
    .update({ parametres: next })
    .eq('id', user.profile.hotel_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings');
  return { ok: true };
}

// ----- PAIEMENT DES RÉSERVATIONS (Mobile Money de l'hôtel) -----

const paymentSchema = z.object({
  mm_numero: z.string().max(40).optional().or(z.literal('')),
  mm_nom: z.string().max(120).optional().or(z.literal('')),
  acompte_pct: z.coerce.number().int().min(0).max(100).default(0)
});

export async function updatePaymentSettings(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();

  // Fusion dans parametres jsonb (préserve les autres clés éventuelles)
  const { data: hotel } = await supabase
    .from('hotels')
    .select('parametres')
    .eq('id', user.profile.hotel_id!)
    .single();

  const current = ((hotel as any)?.parametres ?? {}) as Record<string, any>;
  const next = {
    ...current,
    paiement: {
      numero: parsed.data.mm_numero || null,
      nom: parsed.data.mm_nom || null,
      acompte_pct: parsed.data.acompte_pct ?? 0
    }
  };

  const { error } = await supabase
    .from('hotels')
    .update({ parametres: next })
    .eq('id', user.profile.hotel_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings');
  return { ok: true };
}

// ----- PROFIL UTILISATEUR -----

const profileSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  telephone: z.string().optional()
});

export async function updateMyProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      telephone: parsed.data.telephone || null
    })
    .eq('id', user.profile.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ----- MOT DE PASSE -----

const passwordSchema = z.object({
  password: z.string().min(8, '8 caractères minimum'),
  confirm: z.string()
}).refine((d) => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] });

export async function updateMyPassword(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
